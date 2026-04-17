// Phase 3 — event dispatch.
// Persists every event to the `reminders` table (audit trail / in-app surface)
// and optionally POSTs to an n8n webhook if N8N_WEBHOOK_URL is set.
//
// To enable n8n: add `N8N_WEBHOOK_URL` in Lovable Cloud → Settings → Secrets
// pointing at your self-hosted n8n webhook (e.g. https://n8n.example.com/webhook/focusflow).

import type { SupabaseClient } from "@supabase/supabase-js";

export type N8nEventKind =
  | "task.idle_nudge"
  | "task.stale_restart"
  | "subtask.completed"
  | "task.completed";

export interface N8nEvent {
  kind: N8nEventKind;
  userId: string;
  taskId: string;
  subtaskId?: string;
  message: string; // AI-generated copy
  meta?: Record<string, unknown>;
}

export async function dispatchEvent(
  supabase: SupabaseClient,
  event: N8nEvent,
): Promise<void> {
  // 1. Persist to reminders (RLS-safe via authed client).
  const { error } = await supabase.from("reminders").insert({
    user_id: event.userId,
    task_id: event.taskId,
    subtask_id: event.subtaskId ?? null,
    kind: event.kind,
    message: event.message,
    channel: "web",
    sent_at: new Date().toISOString(),
  });
  if (error) {
    console.error("[events] reminders insert failed:", error.message);
  }

  // 2. Optional n8n webhook.
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    console.info("[n8n] skipped (N8N_WEBHOOK_URL not set):", event.kind);
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, sentAt: new Date().toISOString() }),
    });
    if (!res.ok) {
      console.error(`[n8n] dispatch failed ${res.status}:`, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[n8n] dispatch error:", err);
  }
}

// Back-compat alias.
export const dispatchN8nEvent = dispatchEvent;
