import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/focusflow/AppShell";
import { SectionHeading } from "@/components/focusflow/SectionHeading";
import { FormField } from "@/components/focusflow/FormField";
import { PrimaryAction } from "@/components/focusflow/PrimaryAction";
import { SecondaryAction } from "@/components/focusflow/SecondaryAction";

export const Route = createFileRoute("/capture")({
  component: Capture,
  head: () => ({
    meta: [
      { title: "Capture — FocusFlow AI" },
      { name: "description", content: "Say what's stuck. One sentence is enough." },
    ],
  }),
});

function Capture() {
  const navigate = useNavigate();
  const [value, setValue] = React.useState("");
  const canSubmit = value.trim().length > 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Coach screen comes in step 3 of build.md (AI edge function).
    // For now we hand off the task via search params.
    navigate({ to: "/", search: { task: value.trim() } as never });
  };

  return (
    <AppShell>
      <form onSubmit={onSubmit} className="flex min-h-[80vh] flex-col gap-8">
        <SecondaryAction asChild className="self-start">
          <Link to="/">
            <ArrowLeft /> Back
          </Link>
        </SecondaryAction>

        <SectionHeading
          as="h1"
          eyebrow="Capture"
          title="What are you avoiding?"
          subtitle="One sentence. No pressure to be precise."
        />

        <FormField label="The thing" htmlFor="capture-task" helper="e.g. Reply to landlord email">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={5}
            placeholder="The thing on your mind…"
            autoFocus
            className="text-[17px] leading-relaxed"
          />
        </FormField>

        <div className="mt-auto flex flex-col gap-3">
          <PrimaryAction type="submit" fullWidth disabled={!canSubmit}>
            Break it down <ArrowRight />
          </PrimaryAction>
          <p className="text-center text-sm text-muted-foreground">
            Voice input is coming soon.
          </p>
        </div>
      </form>
    </AppShell>
  );
}
