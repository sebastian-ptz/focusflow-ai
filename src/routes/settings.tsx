import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/focusflow/AppShell";
import { BottomNav } from "@/components/focusflow/BottomNav";
import { SectionHeading } from "@/components/focusflow/SectionHeading";
import { SecondaryAction } from "@/components/focusflow/SecondaryAction";

export const Route = createFileRoute("/settings")({
  component: Settings,
  head: () => ({
    meta: [
      { title: "Settings — FocusFlow AI" },
      { name: "description", content: "Adjust how FocusFlow supports you." },
    ],
  }),
});

function Settings() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out.");
    navigate({ to: "/auth" });
  };

  return (
    <AppShell withBottomNav>
      <div className="flex flex-col gap-8">
        <SectionHeading
          as="h1"
          eyebrow="Settings"
          title="Make it yours"
          subtitle="More options will land as we build the AI breakdown and reminder layers."
        />
        {user ? (
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
        ) : null}
        <SecondaryAction asChild fullWidth>
          <Link to="/style-guide">Open Style Guide</Link>
        </SecondaryAction>
        <SecondaryAction fullWidth onClick={handleSignOut}>
          Sign out
        </SecondaryAction>
      </div>
      <BottomNav />
    </AppShell>
  );
}
