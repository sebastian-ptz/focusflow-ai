// Phase 3 — server functions that generate AI nudges/celebrations and
// dispatch them to n8n. Triggered when the user opens the app or checks
// off a subtask. Idle/stale scans run on app open (no cron yet).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { dispatchN8nEvent, type N8nEventKind } from "./n8n";

const IDLE_HOURS = 3;
const STALE_HOURS = 24;

async function generateMessage(kind: N8nEventKind, taskTitle: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return fallbackMessage(kind, taskTitle);

  const tonePrompt: Record<N8nEventKind, string> = {
    "task.idle_nudge":
      `Write ONE short, warm sentence (≤120 chars) gently nudging an ADHD user back to their task "${taskTitle}". No pressure, no exclamation marks.`,
    "task.stale_restart":
      `Write ONE short, kind sentence (≤120 chars) inviting an ADHD user to take just one tiny step on stalled task "${taskTitle}". Compassionate, no guilt.`,
    "subtask.completed":
      `Write ONE short celebratory sentence (≤100 chars) for completing a step in "${taskTitle}". Genuine, not over-the-top.`,
    "task.completed":
      `Write ONE short celebratory sentence (≤120 chars) for finishing the whole task "${taskTitle}". Warm and proud, not cheesy.`,
  };

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You write supportive micro-copy for ADHD users. Output only the sentence, no quotes." },
          { role: "user", content: tonePrompt[kind] },
        ],
      }),
    });
    if (!res.ok) return fallbackMessage(kind, taskTitle);
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text || fallbackMessage(kind, taskTitle);
  } catch {
    return fallbackMessage(kind, taskTitle);
  }
}

function fallbackMessage(kind: N8nEventKind, taskTitle: string): string {
  switch (kind) {
    case "task.idle_nudge":
      return `Still here when you're ready to pick "${taskTitle}" back up.`;
    case "task.stale_restart":
      return `One tiny step on "${taskTitle}" — that's all today needs.`;
    case "subtask.completed":
      return `Nice — one more step done on "${taskTitle}".`;
    case "task.completed":
      return `You finished "${taskTitle}". That counts.`;
  }
}

/** Fires when a subtask is checked off. */
export const emitSubtaskCompleted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ taskId: z.string().uuid(), subtaskId: z.string().uuid() }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: task } = await supabase
      .from("tasks")
      .select("id,title")
      .eq("id", data.taskId)
      .single();
    if (!task) return { ok: false };

    const message = await generateMessage("subtask.completed", task.title);
    await dispatchN8nEvent({
      kind: "subtask.completed",
      userId,
      taskId: task.id,
      subtaskId: data.subtaskId,
      message,
    });

    // Check if all subtasks are done → also fire task.completed.
    const { data: remaining } = await supabase
      .from("subtasks")
      .select("id")
      .eq("task_id", task.id)
      .neq("status", "done");
    if (remaining && remaining.length === 0) {
      const doneMsg = await generateMessage("task.completed", task.title);
      await dispatchN8nEvent({
        kind: "task.completed",
        userId,
        taskId: task.id,
        message: doneMsg,
      });
      await supabase.from("tasks").update({ status: "done" }).eq("id", task.id);
    }
    return { ok: true };
  });

/** Scans on app open: returns nudges for idle/stale in_progress tasks. */
export const scanForNudges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({}).optional())
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const now = Date.now();
    const idleCutoff = new Date(now - IDLE_HOURS * 3600_000).toISOString();
    const staleCutoff = new Date(now - STALE_HOURS * 3600_000).toISOString();

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id,title,last_activity_at,status")
      .eq("status", "in_progress")
      .lt("last_activity_at", idleCutoff);

    const fired: Array<{ taskId: string; kind: N8nEventKind; message: string }> = [];
    for (const t of tasks ?? []) {
      const kind: N8nEventKind =
        t.last_activity_at < staleCutoff ? "task.stale_restart" : "task.idle_nudge";
      const message = await generateMessage(kind, t.title);
      await dispatchN8nEvent({ kind, userId, taskId: t.id, message });
      fired.push({ taskId: t.id, kind, message });
    }
    return { fired };
  });
