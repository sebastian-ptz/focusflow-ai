import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Sparkles, Scissors, Trash2, LifeBuoy, X, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { breakDownTask } from "@/server/ai.functions";
import { coachUnstick } from "@/server/coach.functions";
import { emitSubtaskCompleted } from "@/server/events.functions";
import { callAuthed } from "@/lib/callAuthed";
import { AppShell } from "@/components/focusflow/AppShell";
import { SectionHeading } from "@/components/focusflow/SectionHeading";
import { PrimaryAction } from "@/components/focusflow/PrimaryAction";
import { SecondaryAction } from "@/components/focusflow/SecondaryAction";
import { CoachBubble } from "@/components/focusflow/CoachBubble";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { slotSteps, formatSlot } from "@/lib/slotting";

type TaskStatus = "not_started" | "in_progress" | "done";
type SubStatus = "todo" | "done";

interface Task {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  scheduled_for: string | null;
}
interface Subtask {
  id: string;
  title: string;
  position: number;
  status: SubStatus;
  scheduled_at: string | null;
}

// Re-slot all `todo` subtasks for a task across its scheduled date.
// Done subtasks keep their existing scheduled_at (or null).
async function reslotTaskSteps(taskId: string, dateYmd: string | null) {
  const { data, error } = await supabase
    .from("subtasks")
    .select("id,status,position")
    .eq("task_id", taskId)
    .order("position", { ascending: true });
  if (error || !data) return;
  if (!dateYmd) {
    // Clear all when task is unscheduled.
    await supabase.from("subtasks").update({ scheduled_at: null }).eq("task_id", taskId);
    return;
  }
  const todos = data.filter((s) => s.status === "todo");
  const slots = slotSteps(dateYmd, todos.length);
  await Promise.all(
    todos.map((s, i) => {
      const at = slots[i] ? slots[i].toISOString() : null;
      return supabase.from("subtasks").update({ scheduled_at: at }).eq("id", s.id);
    }),
  );
}

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskDetail,
  head: () => ({
    meta: [{ title: "Task — FocusFlow AI" }],
  }),
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [task, setTask] = React.useState<Task | null>(null);
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [newSub, setNewSub] = React.useState("");
  const [aiBusy, setAiBusy] = React.useState<null | "breakdown" | string>(null);
  const [coachMsg, setCoachMsg] = React.useState<string | null>(null);
  const [coachBusy, setCoachBusy] = React.useState(false);

  const askCoach = async () => {
    if (!task) return;
    setCoachBusy(true);
    try {
      const res = await callAuthed(coachUnstick, { taskId: task.id });
      setCoachMsg(res.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Coach is unavailable.");
    } finally {
      setCoachBusy(false);
    }
  };

  const reloadSubtasks = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("subtasks")
      .select("id,title,position,status,scheduled_at")
      .eq("task_id", taskId)
      .order("position", { ascending: true });
    if (error) toast.error(error.message);
    else setSubtasks((data ?? []) as Subtask[]);
  }, [taskId]);

  const runBreakdown = async () => {
    if (!task) return;
    setAiBusy("breakdown");
    try {
      const res = await callAuthed(breakDownTask, {
        taskId: task.id,
        mode: "breakdown" as const,
        title: task.title,
        notes: task.notes ?? undefined,
      });
      if (task.scheduled_for) await reslotTaskSteps(task.id, task.scheduled_for);
      await reloadSubtasks();
      toast.success(`Added ${res.steps.length} tiny steps.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not break it down.");
    } finally {
      setAiBusy(null);
    }
  };

  const shrinkStep = async (sub: Subtask) => {
    if (!task) return;
    setAiBusy(sub.id);
    try {
      const res = await callAuthed(breakDownTask, {
        taskId: task.id,
        mode: "shrink" as const,
        title: task.title,
        stepText: sub.title,
        stepId: sub.id,
      });
      if (task.scheduled_for) await reslotTaskSteps(task.id, task.scheduled_for);
      await reloadSubtasks();
      toast.success(`Shrunk into ${res.steps.length} smaller steps.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not shrink.");
    } finally {
      setAiBusy(null);
    }
  };

  React.useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      const [{ data: t, error: tErr }, { data: s, error: sErr }] = await Promise.all([
        supabase.from("tasks").select("id,title,notes,status,scheduled_for").eq("id", taskId).single(),
        supabase
          .from("subtasks")
          .select("id,title,position,status,scheduled_at")
          .eq("task_id", taskId)
          .order("position", { ascending: true }),
      ]);
      if (cancelled) return;
      if (tErr) {
        toast.error(tErr.message);
      } else {
        setTask(t as Task);
      }
      if (sErr) toast.error(sErr.message);
      else setSubtasks((s ?? []) as Subtask[]);
      setLoadingData(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId, user]);

  const addSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.trim() || !user) return;
    const position = subtasks.length;
    const { data, error } = await supabase
      .from("subtasks")
      .insert({ task_id: taskId, user_id: user.id, title: newSub.trim(), position })
      .select("id,title,position,status,scheduled_at")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubtasks((prev) => [...prev, data as Subtask]);
    setNewSub("");
    if (task?.scheduled_for) {
      await reslotTaskSteps(taskId, task.scheduled_for);
      await reloadSubtasks();
    }
  };

  const toggleSubtask = async (sub: Subtask) => {
    const next: SubStatus = sub.status === "done" ? "todo" : "done";
    const { error } = await supabase
      .from("subtasks")
      .update({ status: next, done_at: next === "done" ? new Date().toISOString() : null })
      .eq("id", sub.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubtasks((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status: next } : s)));
    if (next === "done") toast.success("Well done — keep it up.");
    // Bump task activity
    await supabase
      .from("tasks")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", taskId);
    // Fire n8n event (no-op if N8N_WEBHOOK_URL unset)
    if (next === "done") {
      callAuthed(emitSubtaskCompleted, { taskId, subtaskId: sub.id }).catch(() => {});
    }
  };

  const removeSubtask = async (id: string) => {
    const { error } = await supabase.from("subtasks").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteTask = async () => {
    if (!confirm("Delete this task and all its subtasks?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted.");
    navigate({ to: "/" });
  };

  if (loading || loadingData || !task) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  const done = subtasks.filter((s) => s.status === "done").length;
  const total = subtasks.length;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <SectionHeading
          as="h1"
          eyebrow={total > 0 ? `${done} of ${total} steps done` : "One task at a time"}
          title={task.title}
          subtitle="Break it into smaller steps. Each one should feel light."
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Scheduled for
          </span>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 flex-1 justify-start text-left font-normal",
                    !task.scheduled_for && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {task.scheduled_for
                    ? format(new Date(task.scheduled_for + "T00:00:00"), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    task.scheduled_for
                      ? new Date(task.scheduled_for + "T00:00:00")
                      : undefined
                  }
                  onSelect={async (d) => {
                    if (!d) return;
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    const next = `${y}-${m}-${day}`;
                    const { error } = await supabase
                      .from("tasks")
                      .update({ scheduled_for: next })
                      .eq("id", taskId);
                    if (error) toast.error(error.message);
                    else {
                      setTask((t) => (t ? { ...t, scheduled_for: next } : t));
                      await reslotTaskSteps(taskId, next);
                      await reloadSubtasks();
                      toast.success("Scheduled — steps timed across the day.");
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {task.scheduled_for && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear date"
                onClick={async () => {
                  const { error } = await supabase
                    .from("tasks")
                    .update({ scheduled_for: null })
                    .eq("id", taskId);
                  if (error) toast.error(error.message);
                  else {
                    setTask((t) => (t ? { ...t, scheduled_for: null } : t));
                    await reslotTaskSteps(taskId, null);
                    await reloadSubtasks();
                  }
                }}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {subtasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No subtasks yet. Add the smallest first thing you could do — under 2 minutes.
            </p>
          ) : (
            subtasks.map((sub) => (
              <div
                key={sub.id}
                className="flex items-start gap-3 rounded-md border border-border bg-surface p-4"
              >
                <Checkbox
                  checked={sub.status === "done"}
                  onCheckedChange={() => toggleSubtask(sub)}
                  className="mt-1"
                  aria-label={`Mark ${sub.title} as ${sub.status === "done" ? "todo" : "done"}`}
                />
                <span
                  className={cn(
                    "flex-1 text-base leading-relaxed",
                    sub.status === "done" && "text-muted-foreground line-through",
                  )}
                >
                  {sub.title}
                </span>
                {sub.scheduled_at && (
                  <span
                    className={cn(
                      "shrink-0 rounded bg-muted px-2 py-0.5 text-xs tabular-nums",
                      new Date(sub.scheduled_at) < new Date()
                        ? "text-muted-foreground/60"
                        : "text-foreground",
                    )}
                    title={new Date(sub.scheduled_at).toLocaleString()}
                  >
                    {formatSlot(new Date(sub.scheduled_at))}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => shrinkStep(sub)}
                  disabled={aiBusy === sub.id || sub.status === "done"}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                  aria-label="Shrink this step"
                  title="Shrink this step"
                >
                  <Scissors className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSubtask(sub.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove subtask"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={addSubtask} className="flex flex-col gap-3">
          <Input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            placeholder="A 2-minute step…"
            className="h-12 text-base"
          />
          <PrimaryAction type="submit" fullWidth disabled={!newSub.trim()}>
            <Plus /> Add step
          </PrimaryAction>
        </form>

        <SecondaryAction fullWidth onClick={runBreakdown} disabled={aiBusy === "breakdown"}>
          <Sparkles /> {aiBusy === "breakdown" ? "Thinking…" : "Break it down for me"}
        </SecondaryAction>

        <SecondaryAction fullWidth onClick={askCoach} disabled={coachBusy}>
          <LifeBuoy /> {coachBusy ? "Thinking…" : "I'm stuck — talk me through it"}
        </SecondaryAction>

        {coachMsg && (
          <div className="flex flex-col gap-2">
            <CoachBubble from="coach">{coachMsg}</CoachBubble>
            <button
              type="button"
              onClick={() => setCoachMsg(null)}
              className="inline-flex items-center gap-1 self-end text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" /> dismiss
            </button>
          </div>
        )}

        <SecondaryAction fullWidth onClick={deleteTask}>
          Delete task
        </SecondaryAction>
      </div>
    </AppShell>
  );
}
