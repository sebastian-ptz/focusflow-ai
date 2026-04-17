import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Plus, Inbox, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { callAuthed } from "@/lib/callAuthed";
import { scanForNudges } from "@/server/events.functions";
import { AppShell } from "@/components/focusflow/AppShell";
import { BottomNav } from "@/components/focusflow/BottomNav";
import { SectionHeading } from "@/components/focusflow/SectionHeading";
import { PrimaryAction } from "@/components/focusflow/PrimaryAction";
import { EmptyState } from "@/components/focusflow/EmptyState";
import { TaskCard } from "@/components/focusflow/TaskCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TaskStatus = "not_started" | "in_progress" | "done";
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  created_at: string;
}

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "FocusFlow AI — Your tasks" },
      {
        name: "description",
        content: "Capture what's on your mind and let FocusFlow break it into 2-minute steps.",
      },
    ],
  }),
});

function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(true);
  const [newTitle, setNewTitle] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const loadTasks = React.useCallback(async () => {
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("id,title,status,created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setTasks((data ?? []) as Task[]);
    }
    setLoadingTasks(false);
  }, []);

  React.useEffect(() => {
    if (user) loadTasks();
  }, [user, loadTasks]);

  // On app open: scan for idle/stale tasks and dispatch n8n nudges.
  React.useEffect(() => {
    if (!user) return;
    callAuthed(scanForNudges, {}).catch(() => {});
  }, [user]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: newTitle.trim(), user_id: user.id })
      .select("id,title,status,created_at")
      .single();
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewTitle("");
    setTasks((prev) => [data as Task, ...prev]);
    toast.success("Captured.");
  };

  const advanceStatus = async (task: Task) => {
    const next: TaskStatus =
      task.status === "not_started"
        ? "in_progress"
        : task.status === "in_progress"
          ? "done"
          : "not_started";
    const { error } = await supabase
      .from("tasks")
      .update({ status: next, last_activity_at: new Date().toISOString() })
      .eq("id", task.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
  };

  if (loading || !user) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell withBottomNav>
      <div className="flex flex-col gap-8">
        <SectionHeading
          as="h1"
          eyebrow="Right now"
          title="What's on your mind?"
          subtitle="Capture one thing. We'll shrink it from there."
        />

        <form onSubmit={createTask} className="flex flex-col gap-3">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Reply to Anna's email"
            className="h-12 text-base"
            disabled={creating}
          />
          <PrimaryAction type="submit" fullWidth disabled={creating || !newTitle.trim()}>
            <Plus /> Capture task
          </PrimaryAction>
        </form>

        <div className="flex flex-col gap-3">
          {loadingTasks ? (
            <p className="text-sm text-muted-foreground">Loading your tasks…</p>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={<Inbox />}
              title="Nothing captured yet"
              description="Anything spinning in your head? Drop it in above. One thing at a time."
            />
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                meta={<StatusBadge status={task.status} />}
                action={
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => advanceStatus(task)}
                      className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      {nextLabel(task.status)}
                    </button>
                    <Link
                      to="/tasks/$taskId"
                      params={{ taskId: task.id }}
                      className="inline-flex items-center gap-1.5 rounded-pill bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-105"
                    >
                      Open
                    </Link>
                  </div>
                }
              />
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </AppShell>
  );
}

function nextLabel(status: TaskStatus) {
  if (status === "not_started") return "Start";
  if (status === "in_progress") return "Mark done";
  return "Reopen";
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const config = {
    not_started: { label: "Not started", icon: Circle, cls: "text-muted-foreground" },
    in_progress: { label: "In progress", icon: PlayCircle, cls: "text-primary" },
    done: { label: "Done", icon: CheckCircle2, cls: "text-success" },
  } as const;
  const { label, icon: Icon, cls } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", cls)}>
      <Icon className="size-4" /> {label}
    </span>
  );
}
