import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mic, Pause, RotateCcw, Sparkles, Inbox, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/focusflow/AppShell";
import { SectionHeading } from "@/components/focusflow/SectionHeading";
import { PrimaryAction } from "@/components/focusflow/PrimaryAction";
import { SecondaryAction } from "@/components/focusflow/SecondaryAction";
import { IconAction } from "@/components/focusflow/IconAction";
import { TaskCard } from "@/components/focusflow/TaskCard";
import { SessionCard } from "@/components/focusflow/SessionCard";
import { StepItem } from "@/components/focusflow/StepItem";
import { CoachBubble } from "@/components/focusflow/CoachBubble";
import { FormField } from "@/components/focusflow/FormField";
import { EmptyState } from "@/components/focusflow/EmptyState";

export const Route = createFileRoute("/style-guide")({
  component: StyleGuide,
  head: () => ({
    meta: [
      { title: "FocusFlow AI — Style Guide" },
      {
        name: "description",
        content: "Design tokens and reusable components for FocusFlow AI.",
      },
    ],
  }),
});

const swatches = [
  { name: "background", hex: "#FAF8F5", className: "bg-background border" },
  { name: "surface / card", hex: "#FFFFFF", className: "bg-surface border" },
  { name: "foreground", hex: "#2D3142", className: "bg-foreground" },
  { name: "muted", hex: "—", className: "bg-muted border" },
  { name: "primary", hex: "#7BA098", className: "bg-primary" },
  { name: "secondary", hex: "#E8E4DC", className: "bg-secondary" },
  { name: "accent", hex: "#E8A87C", className: "bg-accent" },
  { name: "success", hex: "#84B59F", className: "bg-success" },
  { name: "warning", hex: "#D4A574", className: "bg-warning" },
  { name: "border", hex: "#EAE6DE", className: "bg-border" },
];

const radii = [
  { name: "sm · 8px", className: "rounded-sm" },
  { name: "md · 16px", className: "rounded-md" },
  { name: "lg · 24px", className: "rounded-lg" },
  { name: "pill", className: "rounded-pill" },
];

function StyleGuide() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <AppShell>
      <div className="flex flex-col gap-10">
        <header className="flex items-start justify-between gap-4">
          <SectionHeading
            as="h1"
            eyebrow="FocusFlow AI"
            title="Style Guide"
            subtitle="Visual foundation. Review before any screens are built."
          />
          <button
            onClick={() => setDark((d) => !d)}
            className="rounded-pill border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </header>

        {/* Colors */}
        <section className="flex flex-col gap-4">
          <SectionHeading title="Colors" subtitle="oklch tokens, hex shown for reference." />
          <ul className="grid grid-cols-2 gap-3">
            {swatches.map((s) => (
              <li key={s.name} className="flex flex-col gap-2">
                <div className={`h-16 w-full rounded-md ${s.className}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.hex}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Typography */}
        <section className="flex flex-col gap-4">
          <SectionHeading title="Typography" subtitle="Fraunces display + Inter body." />
          <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-6">
            <div>
              <h1 className="font-display text-4xl font-semibold leading-tight">Display 36</h1>
              <p className="text-xs text-muted-foreground">h1 · Fraunces 600 · 1.2</p>
            </div>
            <div>
              <h2 className="font-display text-[28px] font-semibold leading-tight">Heading 28</h2>
              <p className="text-xs text-muted-foreground">h2 · Fraunces 600 · 1.3</p>
            </div>
            <div>
              <h3 className="font-display text-xl font-medium">Subheading 20</h3>
              <p className="text-xs text-muted-foreground">h3 · Fraunces 500 · 1.4</p>
            </div>
            <div>
              <p className="text-[17px] leading-relaxed">
                Body 17 — the steady voice in the room. Larger than default for easier reading
                during cognitive overload.
              </p>
              <p className="text-xs text-muted-foreground">Inter 400 · 1.6</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Caption 14 — helper text and meta.</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="flex flex-col gap-4">
          <SectionHeading title="Buttons" />
          <div className="flex flex-col gap-3">
            <PrimaryAction fullWidth>
              <Sparkles /> Start Focus Sprint
            </PrimaryAction>
            <PrimaryAction fullWidth disabled>
              Disabled
            </PrimaryAction>
            <SecondaryAction fullWidth>Break into Steps</SecondaryAction>
            <SecondaryAction fullWidth disabled>
              Disabled
            </SecondaryAction>
          </div>
          <div className="flex items-center gap-3">
            <IconAction aria-label="Record" variant="primary">
              <Mic />
            </IconAction>
            <IconAction aria-label="Pause">
              <Pause />
            </IconAction>
            <IconAction aria-label="I'm stuck again" variant="accent">
              <RotateCcw />
            </IconAction>
          </div>
        </section>

        {/* Radius */}
        <section className="flex flex-col gap-4">
          <SectionHeading title="Border radius" />
          <ul className="grid grid-cols-2 gap-3">
            {radii.map((r) => (
              <li key={r.name} className="flex flex-col items-center gap-2">
                <div className={`h-16 w-16 border border-border bg-secondary ${r.className}`} />
                <p className="text-xs text-muted-foreground">{r.name}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Components */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            title="Components"
            subtitle="Reusable building blocks used across every screen."
          />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">TaskCard</p>
            <TaskCard
              title="Reply to landlord email"
              meta="Stuck since yesterday"
              action={<SecondaryAction fullWidth>Break into Steps</SecondaryAction>}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">SessionCard</p>
            <SessionCard
              task="Open the email and read it once"
              timer="04:32"
              controls={
                <>
                  <IconAction aria-label="Pause">
                    <Pause />
                  </IconAction>
                  <IconAction aria-label="I'm stuck again" variant="accent">
                    <RotateCcw />
                  </IconAction>
                </>
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">StepItem list</p>
            <ul className="flex flex-col gap-1 rounded-md border border-border bg-surface p-3">
              <StepItem text="Open your inbox" status="done" />
              <StepItem text="Find the landlord email" status="active" />
              <StepItem text="Read it once, no reply yet" />
              <StepItem text="Type one sentence back" />
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">CoachBubble</p>
            <div className="flex flex-col gap-2 rounded-md border border-border bg-background p-4">
              <CoachBubble from="coach">
                What's the one thing you're avoiding right now?
              </CoachBubble>
              <CoachBubble from="user">The landlord email.</CoachBubble>
              <CoachBubble from="coach">
                Got it. Let's just open the inbox — that's the whole step.
              </CoachBubble>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">FormField</p>
            <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
              <FormField
                label="What's on your mind?"
                htmlFor="capture-input"
                helper="One sentence is enough."
              >
                <Input placeholder="Reply to landlord…" />
              </FormField>
              <FormField label="Notes" htmlFor="notes-input">
                <Textarea rows={3} placeholder="Optional context for the coach" />
              </FormField>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">EmptyState</p>
            <EmptyState
              icon={<Inbox />}
              title="Nothing here yet"
              description="Your past focus moments will show up here. No pressure."
              action={
                <PrimaryAction>
                  <Play /> Start now
                </PrimaryAction>
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">SectionHeading</p>
            <div className="rounded-md border border-border bg-surface p-6">
              <SectionHeading
                eyebrow="Right now"
                title="One thing at a time"
                subtitle="Pick the smallest possible next step."
              />
            </div>
          </div>
        </section>

        <p className="pt-4 text-center text-xs text-muted-foreground">
          AppShell + BottomNav are wrappers — visible on real screens.
        </p>
      </div>
    </AppShell>
  );
}
