import * as React from "react";
import { cn } from "@/lib/utils";

interface CoachBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "coach" | "user";
}

/**
 * Conversational message bubble. Coach = warm sand, left-aligned.
 * User = sage primary, right-aligned.
 */
export function CoachBubble({ from, className, children, ...props }: CoachBubbleProps) {
  const isCoach = from === "coach";
  return (
    <div className={cn("flex w-full", isCoach ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-4 py-3 text-base leading-relaxed",
          isCoach
            ? "rounded-tl-sm bg-secondary text-secondary-foreground"
            : "rounded-tr-sm bg-primary text-primary-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}
