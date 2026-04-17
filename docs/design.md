# FocusFlow AI — Design System

A calming, motivating, ADHD-friendly visual foundation. Inspired by Headspace,
Calm, Notion, and Duolingo. Every screen MUST source its values from this
document and the tokens in `src/styles.css`.

## Mood / visual style

Calm and supportive (Calm, Headspace) meets clean and focused (Notion) with a
touch of friendly motivation (Duolingo). Explicitly NOT Todoist's alarm-red
urgency. Generous whitespace, soft rounded corners, large tap targets, no
flashing, no shame UI.

The UI should feel like a steady voice in the room — never a control panel.

## Color palette

All colors live in `src/styles.css` as `oklch` tokens. Hex values shown for
reference only.

| Token | Light hex | Dark hex | Use |
|---|---|---|---|
| `background` | `#FAF8F5` warm cream | `#1A1F2E` deep navy | Page background |
| `surface` / `card` | `#FFFFFF` | `#242938` | Cards, elevated surfaces |
| `foreground` | `#2D3142` deep slate | `#F0EDE6` | Body text |
| `muted-foreground` | `#6B7280` | `#9CA3AF` | Captions, helper text |
| `primary` | `#7BA098` sage teal | `#8FB3AA` | "Start Focus Sprint" CTA |
| `secondary` | `#E8E4DC` warm sand | `#2F3548` | "Break into Steps" CTA |
| `accent` | `#E8A87C` soft peach | `#F0B891` | Highlights, momentum |
| `success` | `#84B59F` soft mint | `#9BC9B2` | "You started!" |
| `warning` | `#D4A574` muted amber | `#E0B584` | Gentle nudges (NEVER red) |
| `border` | `#EAE6DE` | white @ 10% | Hairlines |

**Accessibility**: every text/background pair meets WCAG AA (≥ 4.5:1 body,
≥ 3:1 large text). No alarm-reds for warnings — muted amber is intentional to
avoid shame triggers.

## Typography

- **Display headings**: Fraunces (humanist serif, weight 500–600). Warm,
  trustworthy, reserved for h1–h4.
- **Body & UI**: Inter (humanist sans, 400/500/600). Loaded via Google Fonts.
- **Base body size**: 17px / line-height 1.6 — larger than default for
  cognitive overload readability.

| Scale | Size | Line-height | Weight | Family |
|---|---|---|---|---|
| Display (h1) | 36px | 1.2 | 600 | Fraunces |
| Heading (h2) | 28px | 1.3 | 600 | Fraunces |
| Subheading (h3) | 20px | 1.4 | 500 | Fraunces |
| Body | 17px | 1.6 | 400 | Inter |
| Body-strong | 17px | 1.6 | 500 | Inter |
| Caption | 14px | 1.5 | 400 (muted) | Inter |

## Border radius scale

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 8px | Inputs, chips, small badges |
| `radius-md` | 16px | Cards, list items, secondary buttons |
| `radius-lg` | 24px | Large surfaces, sheets, modals |
| `radius-xl` | 32px | Hero panels |
| `radius-pill` | 9999px | Primary CTA, icon buttons |

## Buttons

### Primary — "Start Focus Sprint"
- Shape: pill (`radius-pill`)
- Background: `primary` (sage teal)
- Text: `primary-foreground` (white), 17px / 600
- Padding: `16px 32px`, min-height `52px` (large tap target)
- Shadow: `--shadow-lift` (soft sage glow)
- Hover: subtle lift, brightness +5%
- Disabled: 50% opacity, no shadow

### Secondary — "Break into Steps"
- Shape: rounded (`radius-md`, 16px)
- Background: `secondary` (warm sand)
- Text: `secondary-foreground`, 16px / 500
- Padding: `14px 24px`, min-height `48px`
- Border: `1px solid border`
- No shadow. Hover: background darkens slightly.

### Icon action — round
- Shape: circle (`radius-pill`), 48×48px
- Background: `surface` with `border`
- Use for mic, pause, "I'm stuck again"

## Card style (task / session)

- Background: `surface`
- Radius: `radius-md` (16px)
- Padding: `24px`
- Border: `1px solid border`
- Shadow: `--shadow-soft`
- Internal spacing: 16px between elements

## Spacing

Mobile-first. Tailwind scale (`p-4`, `p-6`, `gap-4`). Default screen padding:
`px-5` (20px). Default vertical rhythm between sections: `gap-6` (24px) or
`gap-8` (32px) on larger surfaces.

## Key UX principles

1. **One thing on screen at a time.** No backlog, no list, no badges during a focus moment.
2. **Lower the activation cost.** The first proposed action is always ≤ 2 minutes.
3. **Talk, don't manage.** Voice and conversational prompts beat forms and checkboxes.
4. **Adaptive, not prescriptive.** If the user stalls, the coach shrinks the step further.
5. **No shame loops.** Missed tasks and "stuck again" taps never trigger guilt UI.
6. **Momentum over completion.** Celebrate *starting*, not finishing.
7. **Fast in, fast out.** App open → concrete first step in under 10 seconds.

## Accessibility checklist

- WCAG AA contrast on all text
- Tap targets ≥ 48×48px
- 17px base body size
- No reliance on color alone (icons + text together)
- Visible focus ring (`--ring`, sage)
- Calming palette — never alarm-red for non-destructive states
- Mobile-first; designs validated at 320px width
