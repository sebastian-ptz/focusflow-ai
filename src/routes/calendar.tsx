import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/focusflow/AppShell";
import { BottomNav } from "@/components/focusflow/BottomNav";
import { SectionHeading } from "@/components/focusflow/SectionHeading";
import { SecondaryAction } from "@/components/focusflow/SecondaryAction";
import { IconAction } from "@/components/focusflow/IconAction";
import { EmptyState } from "@/components/focusflow/EmptyState";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatSlot } from "@/lib/slotting";

type TaskStatus = "not_started" | "in_progress" | "done";
interface ScheduledTask {
  id: string;
  title: string;
  status: TaskStatus;
  scheduled_for: string; // YYYY-MM-DD
  subtasks?: { id: string; title: string; status: string; scheduled_at: string | null }[];
}

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
  head: () => ({
    meta: [
      { title: "Calendar — FocusFlow AI" },
      { name: "description", content: "See when your tasks land — a calm month view." },
    ],
  }),
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function CalendarPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [cursor, setCursor] = React.useState(() => startOfMonth(new Date()));
  const [tasks, setTasks] = React.useState<ScheduledTask[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [openDay, setOpenDay] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      const from = ymd(startOfMonth(cursor));
      const to = ymd(endOfMonth(cursor));
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,status,scheduled_for,subtasks(id,title,status,scheduled_at)")
        .gte("scheduled_for", from)
        .lte("scheduled_for", to)
        .order("scheduled_for", { ascending: true });
      if (cancelled) return;
      if (error) toast.error(error.message);
      else setTasks((data ?? []) as ScheduledTask[]);
      setLoadingData(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, cursor]);

  const tasksByDay = React.useMemo(() => {
    const m = new Map<string, ScheduledTask[]>();
    for (const t of tasks) {
      const arr = m.get(t.scheduled_for) ?? [];
      arr.push(t);
      m.set(t.scheduled_for, arr);
    }
    return m;
  }, [tasks]);

  // Build a 6-row grid starting Sunday
  const cells = React.useMemo(() => {
    const first = startOfMonth(cursor);
    const startWeekday = first.getDay(); // 0=Sun
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startWeekday);
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push(d);
    }
    return out;
  }, [cursor]);

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  const todayKey = ymd(new Date());

  const openDayTasks = openDay ? (tasksByDay.get(openDay) ?? []) : [];

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 pb-24">
        <SectionHeading
          as="h1"
          eyebrow="Calendar"
          title={monthLabel}
          subtitle="A calm view of when your tasks land. Tap a day to see what's there."
        />

        <div className="flex items-center justify-between">
          <IconAction
            aria-label="Previous month"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            <ChevronLeft />
          </IconAction>
          <SecondaryAction onClick={() => setCursor(startOfMonth(new Date()))}>
            Today
          </SecondaryAction>
          <IconAction
            aria-label="Next month"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            <ChevronRight />
          </IconAction>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 font-medium">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const key = ymd(d);
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = key === todayKey;
            const dayTasks = tasksByDay.get(key) ?? [];
            const visible = dayTasks.slice(0, 3);
            const more = dayTasks.length - visible.length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setOpenDay(key)}
                className={cn(
                  "flex min-h-20 flex-col items-stretch gap-1 rounded-md border p-1 text-left transition-colors",
                  inMonth
                    ? "border-border bg-surface"
                    : "border-transparent bg-transparent text-muted-foreground/60",
                  isToday && "ring-1 ring-primary",
                  "hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium",
                    isToday ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
                <div className="flex flex-col gap-0.5">
                  {visible.map((t) => (
                    <span
                      key={t.id}
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-[10px] leading-tight",
                        t.status === "done"
                          ? "bg-muted text-muted-foreground line-through"
                          : "bg-primary/10 text-foreground",
                      )}
                    >
                      {t.title}
                    </span>
                  ))}
                  {more > 0 && (
                    <span className="text-[10px] text-muted-foreground">+{more} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!loadingData && tasks.length === 0 && (
          <EmptyState
            icon={<CalendarDays />}
            title="Nothing scheduled this month"
            description="Open a task and pick a date to place it here."
          />
        )}
      </div>

      <Sheet open={openDay !== null} onOpenChange={(o) => !o && setOpenDay(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>
              {openDay
                ? new Date(openDay + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-2">
            {openDayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks scheduled. Open a task and pick this date to place it here.
              </p>
            ) : (
              openDayTasks.map((t) => {
                const steps = (t.subtasks ?? [])
                  .filter((s) => s.scheduled_at)
                  .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!));
                return (
                  <Link
                    key={t.id}
                    to="/tasks/$taskId"
                    params={{ taskId: t.id }}
                    onClick={() => setOpenDay(null)}
                    className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3 text-sm hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          t.status === "done" && "text-muted-foreground line-through",
                        )}
                      >
                        {t.title}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                    {steps.length > 0 && (
                      <ul className="flex flex-col gap-1 pl-2">
                        {steps.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <span className="tabular-nums">
                              {formatSlot(new Date(s.scheduled_at!))}
                            </span>
                            <span
                              className={cn(
                                "truncate",
                                s.status === "done" && "line-through",
                              )}
                            >
                              {s.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </AppShell>
  );
}
