# Build Plan

The plan was pivoted from "stuck-moment coach only" to "stuck-moment coach + lightweight task tracking + adaptive reminders". See `brief.md`.

## Phases

### Phase 1 — Foundation (tasks + auth, no AI yet)
- Auth: email/password + Google, auto-confirm ON for dev
- Tables: `tasks`, `subtasks`, `reminders` (RLS, user-scoped)
- Task list screen with status flow (not_started → in_progress → done)
- Subtask checklist UI; manually add subtasks first to prove the schema

### Phase 2 — AI breakdown
- Edge function `break-down-task` using **Lovable AI Gateway** (default: `google/gemini-3-flash-preview`)
- System prompt loaded from `prompts/breakdown.md`
- "Break it down" button on a task → inserts 2–5 subtasks
- "Shrink this step" on a subtask → splits it further
- **Pluggable provider via env**: optional local Ollama escape hatch for dev — see `docs/ai-provider.md`

### Phase 3 — n8n automations (event-driven, mostly non-AI)
- App emits webhooks on: `task.created`, `subtask.completed`, `task.idle_15min`, `task.idle_1day`
- n8n workflows: gentle nudge / celebration / restart
- Tone library = templates (random pick, no AI cost per nudge)
- n8n writes back to `reminders` table; app shows in-app toasts via Realtime
- Idle detection via `pg_cron` → server route → n8n webhook
- See `docs/automation.md` for the n8n event contract

### Phase 4 — Delivery channels
- In-app toasts (Supabase Realtime on `reminders`)
- Email reminders (Resend connector)
- Telegram bot reminders (Telegram connector) — same nudge logic, different channel

## Primary user flows
- **Unstick**: capture task → AI breaks it down → check subtasks → done
- **Re-stuck**: tap "Shrink this step" → AI splits the current subtask further
- **Stay on track**: reminders nudge / celebrate / re-engage automatically

## Still out of scope
- Calendar integration
- Team / social features
- Gamification (streaks, badges, points)
- Native mobile apps
- Voice (ElevenLabs TTS/STT) — deferred until Phase 4 ships
