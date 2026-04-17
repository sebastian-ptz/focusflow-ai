import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  as?: "h1" | "h2";
}

/**
 * Consistent screen/section heading block.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {eyebrow ? (
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <Tag
        className={cn(
          "font-display font-semibold leading-tight text-foreground",
          Tag === "h1" ? "text-4xl" : "text-2xl",
        )}
      >
        {title}
      </Tag>
      {subtitle ? <p className="text-base text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
