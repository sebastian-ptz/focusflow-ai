import * as React from "react";
import { cn } from "@/lib/utils";

interface TaskCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Card for a stuck task or a past session. Title + meta + optional action slot.
 * Shared between Home and History.
 */
export const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(
  ({ className, title, meta, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border border-border bg-surface p-6 shadow-soft",
        "flex flex-col gap-4",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-xl font-medium leading-snug text-foreground">
          {title}
        </h3>
        {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
      </div>
      {children}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  ),
);
TaskCard.displayName = "TaskCard";
