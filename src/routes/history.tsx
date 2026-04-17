import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { AppShell } from "@/components/focusflow/AppShell";
import { BottomNav } from "@/components/focusflow/BottomNav";
import { SectionHeading } from "@/components/focusflow/SectionHeading";
import { EmptyState } from "@/components/focusflow/EmptyState";

export const Route = createFileRoute("/history")({
  component: History,
  head: () => ({
    meta: [
      { title: "History — FocusFlow AI" },
      { name: "description", content: "Past moments you've moved through." },
    ],
  }),
});

function History() {
  return (
    <AppShell withBottomNav>
      <div className="flex flex-col gap-8">
        <SectionHeading
          as="h1"
          eyebrow="History"
          title="What you've moved through"
          subtitle="Stored only on this device. Nothing leaves."
        />
        <EmptyState
          icon={<Inbox />}
          title="Nothing here yet"
          description="Your past stuck moments and the steps that unstuck them will show up here."
        />
      </div>
      <BottomNav />
    </AppShell>
  );
}
