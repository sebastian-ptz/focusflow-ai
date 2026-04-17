// Server-side AI calls for FocusFlow.
// Pluggable provider — defaults to Lovable AI Gateway, can switch to local Ollama.
// See docs/ai-provider.md for setup.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import breakdownPrompt from "../../prompts/breakdown.md?raw";

const StepsSchema = z.object({
  steps: z.array(z.string().min(1).max(140)).min(1).max(8),
});

const breakdownTool = {
  type: "function" as const,
  function: {
    name: "emit_steps",
    description: "Emit the broken-down steps.",
    parameters: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 8,
        },
      },
      required: ["steps"],
      additionalProperties: false,
    },
  },
};

async function callAI(userPrompt: string): Promise<string[]> {
  const provider = (process.env.AI_PROVIDER ?? "lovable").toLowerCase();

  const body = {
    messages: [
      { role: "system", content: breakdownPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: [breakdownTool],
    tool_choice: { type: "function", function: { name: "emit_steps" } },
  };

  let url: string;
  let headers: Record<string, string> = { "Content-Type": "application/json" };
  let payload: Record<string, unknown> = body;

  if (provider === "ollama") {
    const base = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    const model = process.env.OLLAMA_MODEL ?? "gemma2:2b";
    url = `${base}/v1/chat/completions`;
    payload = { ...body, model };
  } else {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    url = "https://ai.gateway.lovable.dev/v1/chat/completions";
    headers.Authorization = `Bearer ${key}`;
    payload = { ...body, model: "google/gemini-3-flash-preview" };
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted — add funds in Settings.");
    const t = await res.text().catch(() => "");
    console.error("AI provider error", res.status, t);
    throw new Error(`AI provider error (${res.status})`);
  }

  const json = (await res.json()) as {
    choices?: Array<{
      message?: {
        tool_calls?: Array<{ function?: { arguments?: string } }>;
        content?: string;
      };
    }>;
  };

  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) {
    // Some local models won't honour tool_choice — fall back to parsing content.
    const content = json.choices?.[0]?.message?.content ?? "";
    const lines = content
      .split("\n")
      .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean);
    const parsed = StepsSchema.safeParse({ steps: lines.slice(0, 6) });
    if (!parsed.success) throw new Error("Could not parse AI response.");
    return parsed.data.steps;
  }

  const parsed = StepsSchema.safeParse(JSON.parse(args));
  if (!parsed.success) throw new Error("AI returned malformed steps.");
  return parsed.data.steps;
}

export const breakDownTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      taskId: z.string().uuid(),
      mode: z.enum(["breakdown", "shrink"]),
      title: z.string().min(1).max(200),
      notes: z.string().max(2000).optional(),
      stepText: z.string().min(1).max(200).optional(),
      stepId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify task ownership via RLS (will error if not owner).
    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", data.taskId)
      .single();
    if (taskErr || !task) throw new Error("Task not found.");

    const userPrompt =
      data.mode === "shrink"
        ? `Shrink this step into 2–4 even tinier steps: "${data.stepText}". Parent task: "${data.title}".`
        : `Break down this task into 3–6 tiny steps:\nTitle: ${data.title}${data.notes ? `\nNotes: ${data.notes}` : ""}`;

    const steps = await callAI(userPrompt);

    // Persist subtasks. For shrink: replace stepId; for breakdown: append.
    if (data.mode === "shrink" && data.stepId) {
      const { data: existing } = await supabase
        .from("subtasks")
        .select("position")
        .eq("id", data.stepId)
        .single();
      const basePos = existing?.position ?? 0;

      // Bump downstream positions out of the way.
      const { data: after } = await supabase
        .from("subtasks")
        .select("id,position")
        .eq("task_id", data.taskId)
        .gt("position", basePos)
        .order("position", { ascending: true });

      const shift = steps.length;
      if (after && after.length) {
        for (const row of after) {
          await supabase
            .from("subtasks")
            .update({ position: row.position + shift })
            .eq("id", row.id);
        }
      }

      await supabase.from("subtasks").delete().eq("id", data.stepId);

      const rows = steps.map((title, i) => ({
        task_id: data.taskId,
        user_id: userId,
        title,
        position: basePos + i,
      }));
      const { error } = await supabase.from("subtasks").insert(rows);
      if (error) throw new Error(error.message);
    } else {
      const { data: existing } = await supabase
        .from("subtasks")
        .select("position")
        .eq("task_id", data.taskId)
        .order("position", { ascending: false })
        .limit(1);
      const start = (existing?.[0]?.position ?? -1) + 1;

      const rows = steps.map((title, i) => ({
        task_id: data.taskId,
        user_id: userId,
        title,
        position: start + i,
      }));
      const { error } = await supabase.from("subtasks").insert(rows);
      if (error) throw new Error(error.message);
    }

    await supabase
      .from("tasks")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", data.taskId);

    return { steps };
  });
