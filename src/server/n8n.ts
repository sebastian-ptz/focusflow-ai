// Phase 3 — n8n event dispatch.
// If N8N_WEBHOOK_URL is unset, we no-op (log only). Set it later to enable.
//
// To configure: open Lovable Cloud → Settings → Secrets and add
// `N8N_WEBHOOK_URL` pointing at your self-hosted n8n webhook
// (e.g. https://n8n.example.com/webhook/focusflow).

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

export async function dispatchN8nEvent(event: N8nEvent): Promise<void> {
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
