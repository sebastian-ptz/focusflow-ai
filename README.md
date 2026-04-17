# FocusFlow AI

An ADHD coaching app that breaks tasks into 2-minute micro-steps with adaptive AI-driven reminders. When you're stuck, it gets you moving — not by nagging, but by lowering the activation cost of the next tiny action.

**North star:** repeat use during stuck moments. Users return to the app *in* paralysis, not just to plan their day.

---

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  FocusFlow app      │────▶│  Supabase        │◀───▶│  n8n workflows  │
│  (TanStack Start)   │     │  - DB (tasks,    │     │  - reminder loop│
│  - capture task     │     │    subtasks,     │     │  - motivational │
│  - see subtasks     │     │    reminders)    │     │    nudges       │
│  - mark done        │     │  - Auth (JWT)    │     │  - email/push   │
│  - get nudges       │     └──────────────────┘     │    delivery     │
└─────────────────────┘              │                └─────────────────┘
        ▲                            │                        │
        └────── realtime toast ──────┘                        │
                                     ▲                        │
                   Lovable AI Gateway└─── webhook on events ──┘
                   (gemini-3-flash)
                   ▲ AI breakdown
                   ▲ nudge messages
```

**Stack:** React 19 + TanStack Router (file-based) + TanStack React Start (server functions) + Supabase (PostgreSQL + Auth) + Tailwind CSS + Cloudflare Workers deployment.

---

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Copy env and fill in keys (see Environment Variables below)
cp .env.example .env

# 3. Start local Supabase (Docker must be running)
supabase start
# → prints API URL + keys — paste into .env

# 4. Apply database schema
supabase migration up

# 5. Start the dev server
bun run dev
# → http://localhost:8080

# 6. (optional) Start n8n for webhook events
npx n8n
# → http://localhost:5678
```

See `localsetup.md` for the full setup guide including n8n workflow configuration.

---

## Commands

```bash
bun run dev        # Start dev server (http://localhost:8080)
bun run build      # Production build
bun run build:dev  # Dev-mode build
bun run preview    # Preview production build
bun run lint       # ESLint
bun run format     # Prettier (auto-fix)
```

Use `bun` as the package manager — not npm or yarn.

---

## Routes

| Path | Screen |
|------|--------|
| `/` | Home — task list + quick capture |
| `/auth` | Sign in / sign up |
| `/capture` | Dedicated task capture |
| `/tasks/$taskId` | Task detail — subtasks, AI breakdown, coach, scheduling |
| `/calendar` | Monthly calendar view of scheduled tasks |
| `/history` | Completed tasks |
| `/settings` | User settings, sign out |
| `/style-guide` | Design system reference |

---

## Features

### Phase 1 — Tasks + subtasks
Lightweight task tracking with status (`not_started → in_progress → done`) and a subtask checklist. Manual add/delete. Auth via email/password.

### Phase 2 — AI breakdown
`breakDownTask()` server function calls the AI provider and breaks any task into 3–6 subtasks of ~2 minutes each. "Shrink this step" replaces one subtask with 2–4 smaller ones. System prompt in `prompts/breakdown.md`.

### Phase 3 — Nudges + events
- `emitSubtaskCompleted()` — fires on subtask check-off, auto-completes task when all done, persists to `reminders` table
- `scanForNudges()` — runs on app open, detects tasks idle >3 h or >24 h and surfaces toasts
- `dispatchEvent()` — persists every event to `reminders`, optionally POSTs to n8n webhook

### Phase 3 — "I'm stuck" coach
`coachUnstick()` server function sends the current task + next incomplete steps to the AI and returns a short, warm ADHD-aware nudge (40–70 words). Prompt in `prompts/unstick.md`.

### Phase 3 — Auto time-slotting
When a task is assigned a date, its `todo` subtasks are automatically spread across a 9 am–5 pm window. Time badges appear on each subtask row. Slots re-calculate whenever subtasks are added, broken down, or shrunk.

### Phase 4 — Delivery channels (not started)
In-app Realtime toast, email via Resend, Telegram bot — all via n8n.

---

## Server Functions

| Function | File | Purpose |
|----------|------|---------|
| `breakDownTask` | `server/ai.functions.ts` | AI task → subtasks (breakdown or shrink) |
| `coachUnstick` | `server/coach.functions.ts` | "I'm stuck" ADHD nudge |
| `emitSubtaskCompleted` | `server/events.functions.ts` | Fire celebration + auto-complete task |
| `scanForNudges` | `server/events.functions.ts` | Detect idle tasks, fire nudge events |

All server functions use Bearer token auth middleware (`requireSupabaseAuth`). Client calls use `callAuthed()` to attach the session token.

---

## Data Model

### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | RLS-enforced |
| title | TEXT | |
| notes | TEXT | optional |
| status | TEXT | `not_started` \| `in_progress` \| `done` |
| scheduled_for | DATE | optional; triggers auto time-slotting |
| last_activity_at | TIMESTAMPTZ | updated on subtask completion, AI breakdown |
| created_at / updated_at | TIMESTAMPTZ | |

### `subtasks`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| task_id | UUID FK | cascade delete |
| user_id | UUID FK | RLS-enforced |
| title | TEXT | |
| position | INTEGER | manual ordering |
| status | TEXT | `todo` \| `done` |
| scheduled_at | TIMESTAMPTZ | set by auto time-slotting |
| done_at | TIMESTAMPTZ | set on completion |

### `reminders`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id / task_id / subtask_id | UUID FKs | |
| kind | TEXT | `task.idle_nudge` \| `task.stale_restart` \| `subtask.completed` \| `task.completed` |
| channel | TEXT | `web` \| `email` \| `telegram` |
| message | TEXT | AI-generated or template fallback |
| sent_at | TIMESTAMPTZ | null until delivered |

---

## AI Provider

Configured via env vars. Defaults to Lovable AI Gateway (`google/gemini-3-flash-preview`). Switch to local Ollama for dev:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e4b   # or any model you have pulled
```

Ollama only works locally — it cannot be reached from a deployed Cloudflare Worker.

See `docs/ai-provider.md` for full setup details.

---

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | yes | from `supabase start` output |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes | from `supabase start` output |
| `SUPABASE_URL` | yes | same as above |
| `SUPABASE_PUBLISHABLE_KEY` | yes | same as above |
| `LOVABLE_API_KEY` | AI features | leave blank to use Ollama locally |
| `N8N_WEBHOOK_URL` | optional | e.g. `http://localhost:5678/webhook/focusflow` |
| `AI_PROVIDER` | optional | `lovable` (default) or `ollama` |
| `OLLAMA_BASE_URL` | optional | default `http://localhost:11434` |
| `OLLAMA_MODEL` | optional | e.g. `gemma4:e4b` |

Run `supabase status` at any time to reprint local keys without restarting containers.

---

## Project Structure

```
src/
  routes/           # File-based routes (TanStack Router)
  server/           # Server functions (ai, events, coach, n8n)
  components/
    focusflow/      # Domain components (AppShell, TaskCard, BottomNav…)
    ui/             # shadcn/ui components — don't hand-edit
  integrations/
    supabase/       # Client singleton + auto-generated types
  hooks/            # useAuth, etc.
  lib/              # callAuthed, slotting, utils
  styles.css        # OKLCH design tokens + Tailwind config
prompts/            # AI system prompts (breakdown.md, unstick.md)
supabase/
  migrations/       # SQL migrations
docs/               # Product brief, build plan, design system, AI provider guide
```

`routeTree.gen.ts` is auto-generated by TanStack Router — never edit it manually.

---

## Design System

Colors are OKLCH CSS variables in `src/styles.css`:
- `primary` — sage teal (main CTAs)
- `secondary` — warm sand (alternate actions, coach bubbles)
- `accent` — soft peach (momentum / highlights)
- Never use red for non-destructive states

Typography: **Fraunces 600** (headings) + **Inter 400** (body, 17 px base for ADHD readability).
Tap targets: minimum 48–52 px. App shell max-width: 448 px (mobile-first).

UX principles: one thing on screen · lower activation cost · talk, don't manage · no shame loops · momentum over completion.