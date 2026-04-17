import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Calm illustration + message + single CTA. No shame, no exclamation marks.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-16 items-center justify-center rounded-pill bg-secondary text-primary [&_svg]:size-7">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-xl font-medium text-foreground">{title}</h3>
      {description ? (
        <p className="max-w-xs text-base text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
