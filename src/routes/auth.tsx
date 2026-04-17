import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/focusflow/AppShell";
import { SectionHeading } from "@/components/focusflow/SectionHeading";
import { PrimaryAction } from "@/components/focusflow/PrimaryAction";
import { SecondaryAction } from "@/components/focusflow/SecondaryAction";
import { FormField } from "@/components/focusflow/FormField";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — FocusFlow AI" },
      { name: "description", content: "Sign in to FocusFlow AI to track your tasks and progress." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created — you're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed.");
        setSubmitting(false);
        return;
      }
      if (result.redirected) return;
      // Session set — onAuthStateChange will redirect us.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <SectionHeading
          as="h1"
          eyebrow="FocusFlow AI"
          title={mode === "signin" ? "Welcome back" : "Create your space"}
          subtitle="One quiet place to start the things that feel too big."
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Email" htmlFor="email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-12 text-base"
            />
          </FormField>
          <FormField
            label="Password"
            htmlFor="password"
            helper={mode === "signup" ? "At least 6 characters." : undefined}
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="h-12 text-base"
            />
          </FormField>
          <PrimaryAction type="submit" fullWidth disabled={submitting}>
            {mode === "signup" ? "Create account" : "Sign in"}
          </PrimaryAction>
        </form>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <SecondaryAction fullWidth onClick={handleGoogle} disabled={submitting}>
          Continue with Google
        </SecondaryAction>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {mode === "signin"
            ? "No account yet? Create one."
            : "Already have an account? Sign in."}
        </button>

        <Link
          to="/style-guide"
          className="text-center text-xs text-muted-foreground/70 hover:text-muted-foreground"
        >
          Style guide
        </Link>
      </div>
    </AppShell>
  );
}
