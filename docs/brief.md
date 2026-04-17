# Product Brief

## Problem
Adults with ADHD need a way to start and complete important tasks in the moment, because overwhelm, task paralysis, and poor follow-through make traditional to-do apps ineffective. Static lists, alarms, and self-discipline don't intervene at the exact moment of paralysis — which is when help is actually needed.

## Primary user
Adults with ADHD (diagnosed or self-identified), especially:
- Knowledge workers
- Students
- Job seekers

They generally know *what* they need to do. The blocker is *initiating* and sustaining momentum.

## Core job
Turn moments of paralysis into immediate action by guiding the user into a focused first step and sustaining momentum until real progress starts.

## Why this is better than the alternative
Instead of relying on static task lists, alarms, or self-discipline, this product provides **real-time adaptive coaching (voice + AI + micro-steps)** *plus* lightweight task tracking and adaptive reminders, exactly when the user gets stuck. The intervention happens *in* the stuck moment — not before, not after.

## In scope (v1, post-pivot)
- **Tasks + subtasks**: lightweight task tracking with status (`not_started` → `in_progress` → `done`) and a subtask checklist underneath. Subtasks exist so progress feels rewarding and lightweight.
- **AI breakdown**: the assistant breaks any task into 2-minute subtasks (Phase 2). Pluggable provider — Lovable AI Gateway by default, optional local Ollama for dev.
- **Adaptive reminders + motivational nudges** (Phase 3, via n8n): gentle nudges when stuck, celebrations when subtasks are checked, restart nudges after long idle periods. Tone library uses templates (no AI cost per nudge).
- **Multi-channel delivery** (Phase 4): in-app toast (Realtime), email (Resend), Telegram (bot).
- **Accounts**: required so reminders and cross-device sync work.

## What success looks like
**North star: repeat use during stuck moments.** Users return to the app *in* paralysis — not just to plan their day. That's the signal it's actually breaking the stuck pattern.

Supporting signals:
- Sessions consistently end with a concrete first step taken.
- Subtask completion rate per task is high (lightweight, achievable steps).
- Re-engagement spikes during typical stuck windows (mornings, post-lunch, end-of-day).
- Users describe it in their own words as "the thing that gets me started."

Specific quantitative targets: _TBD._

## Still out of scope
- Calendar / meeting scheduling
- Team or social features
- Gamification (streaks, badges, points)
- Native mobile apps
- Analytics dashboards for the user
