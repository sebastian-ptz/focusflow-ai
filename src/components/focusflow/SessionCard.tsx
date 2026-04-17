import * as React from "react";
import { cn } from "@/lib/utils";

interface SessionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  task: string;
  timer: React.ReactNode;
  controls?: React.ReactNode;
}

/**
 * Card for an active focus session — large timer + current task + controls slot.
 */
export const SessionCard = React.forwardRef<HTMLDivElement, SessionCardProps>(
  ({ className, task, timer, controls, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-surface p-8 shadow-soft",
        "flex flex-col items-center gap-6 text-center",
        className,
      )}
      {...props}
    >
      <div className="font-display text-5xl font-semibold tabular-nums text-primary">
        {timer}
      </div>
      <p className="text-base text-muted-foreground">Right now</p>
      <p className="text-lg font-medium leading-snug text-foreground">{task}</p>
      {controls ? <div className="flex w-full justify-center gap-3">{controls}</div> : null}
    </div>
  ),
);
SessionCard.displayName = "SessionCard";
