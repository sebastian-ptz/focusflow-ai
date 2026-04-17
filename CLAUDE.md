# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev        # Start dev server
bun run build      # Production build
bun run build:dev  # Dev-mode build
bun run preview    # Preview production build
bun run lint       # ESLint
bun run format     # Prettier (auto-fix)
```

There are no test scripts configured. Use `bun` as the package manager (not npm or yarn).

## Architecture

FocusFlow AI is an ADHD coaching app that breaks tasks into 2-minute micro-steps with adaptive AI-driven reminders.

**Stack:** React 19 + TanStack Router (file-based routing) + TanStack React Start (server functions) + Supabase (PostgreSQL + Auth) + Tailwind CSS + Cloudflare Workers deployment.

### Routing

Routes live in `src/routes/` using TanStack Router file-based conventions. `routeTree.gen.ts` is auto-generated — never edit it manually. The root layout (`__root.tsx`) wraps everything with `AuthProvider` and `Toaster`.

### Server Functions

`src/server/` contains TanStack React Start server functions:
- `ai.functions.ts` — `breakDownTask()`: calls AI provider (Lovable Gateway or Ollama), parses structured steps, persists subtasks to Supabase. Mode can be `"breakdown"` (full task) or `"shrink"` (replace one subtask).
- `events.functions.ts` — `emitSubtaskCompleted()`, `scanForNudges()`: dispatch n8n webhook events for reminders/celebrations.
- `n8n.ts` — webhook contract and `dispatchN8nEvent()` (no-op if `N8N_WEBHOOK_URL` not set).

Server functions requiring auth use `requireSupabaseAuth` from `src/integrations/supabase/auth-middleware.ts`. Client calls use `callAuthed()` from `src/lib/callAuthed.ts` to pass the Bearer token.

### AI Provider

Configured via env vars — defaults to Lovable AI Gateway (`google/gemini-3-flash-preview`). Set `AI_PROVIDER=ollama` to use local Ollama instead. The system prompt lives in `prompts/breakdown.md`. See `docs/ai-provider.md` for full setup.

### Database

Supabase client is a singleton in `src/integrations/supabase/client.ts`. TypeScript types are auto-generated in `src/integrations/supabase/types.ts`. All data is user-scoped via Row-Level Security (RLS). Schema migrations are in `supabase/migrations/`.

### UI Components

- `src/components/focusflow/` — domain-specific components (AppShell, TaskCard, PrimaryAction, BottomNav, etc.)
- `src/components/ui/` — shadcn/ui generated components (Radix UI-based); don't hand-edit these.

**Design tokens** are OKLCH CSS variables in `src/styles.css`. Key colors: `primary` (sage teal), `secondary` (warm sand), `accent` (soft peach). Never use red for non-destructive states. Typography: Fraunces (headings) + Inter (body), 17px base. All tap targets minimum 48–52px.

### Path Aliases

`@/*` maps to `src/*` — use this in all imports.

## Key Docs

- `docs/brief.md` — product vision, scope, north star metric
- `docs/build.md` — phased roadmap (Phase 1–4)
- `docs/design.md` — design system, color rationale, UX principles
- `docs/ai-provider.md` — AI provider configuration
- `prompts/breakdown.md` — AI system prompt (edit here to tune breakdown behavior)
