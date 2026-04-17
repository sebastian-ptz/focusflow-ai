// "I'm stuck" coach — short, warm, ADHD-aware nudge for the current task.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import unstickPrompt from "../../prompts/unstick.md?raw";

async function callCoach(userPrompt: string): Promise<string> {
  const provider = (process.env.AI_PROVIDER ?? "lovable").toLowerCase();

  const body = {
    messages: [
      { role: "system", content: unstickPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  let url: string;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
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
    console.error("Coach AI error", res.status, t);
    throw new Error(`AI provider error (${res.status})`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Coach gave an empty reply.");
  return content;
}

export const coachUnstick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ taskId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .select("id,title,notes")
      .eq("id", data.taskId)
      .single();
    if (taskErr || !task) throw new Error("Task not found.");

    const { data: subs } = await supabase
      .from("subtasks")
      .select("title,status,position")
      .eq("task_id", data.taskId)
      .eq("status", "todo")
      .order("position", { ascending: true })
      .limit(5);

    const remaining = (subs ?? []).map((s) => `- ${s.title}`).join("\n");
    const userPrompt = [
      `Task: ${task.title}`,
      task.notes ? `Notes: ${task.notes}` : null,
      remaining ? `Next incomplete steps:\n${remaining}` : `No subtasks yet.`,
      `The user just tapped "I'm stuck". Give them your nudge.`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const message = await callCoach(userPrompt);
    return { message };
  });
