import * as React from "react";
import { Check, Circle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

type StepStatus = "pending" | "active" | "done";

interface StepItemProps extends React.HTMLAttributes<HTMLLIElement> {
  text: string;
  status?: StepStatus;
}

/**
 * One micro-step row in a coach-generated list.
 */
export function StepItem({ text, status = "pending", className, ...props }: StepItemProps) {
  const Icon = status === "done" ? Check : status === "active" ? CircleDot : Circle;

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-sm px-3 py-3",
        status === "active" && "bg-secondary",
        className,
      )}
      {...props}
    >
      <Icon
        aria-hidden
        className={cn(
          "mt-0.5 size-5 shrink-0",
          status === "done" && "text-success",
          status === "active" && "text-primary",
          status === "pending" && "text-muted-foreground",
        )}
      />
      <span
        className={cn(
          "text-base leading-relaxed",
          status === "done" && "text-muted-foreground line-through",
          status !== "done" && "text-foreground",
        )}
      >
        {text}
      </span>
    </li>
  );
}
