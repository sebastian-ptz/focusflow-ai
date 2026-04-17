import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconActionVariants = cva(
  "inline-flex items-center justify-center rounded-pill border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-border bg-surface text-foreground hover:bg-muted",
        primary:
          "border-transparent bg-primary text-primary-foreground shadow-lift hover:brightness-105",
        accent:
          "border-transparent bg-accent text-accent-foreground hover:brightness-105",
      },
      size: {
        md: "size-12",
        lg: "size-16 [&_svg]:size-7",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

interface IconActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconActionVariants> {
  "aria-label": string;
}

/**
 * Round icon button — mic, pause, "I'm stuck again".
 * Always require an aria-label.
 */
export const IconAction = React.forwardRef<HTMLButtonElement, IconActionProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(iconActionVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
IconAction.displayName = "IconAction";
