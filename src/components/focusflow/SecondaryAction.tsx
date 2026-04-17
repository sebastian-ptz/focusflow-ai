import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface SecondaryActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  fullWidth?: boolean;
}

/**
 * Soft secondary CTA. e.g. "Break into Steps".
 */
export const SecondaryAction = React.forwardRef<HTMLButtonElement, SecondaryActionProps>(
  ({ className, asChild, fullWidth, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex min-h-12 items-center justify-center gap-2",
          "rounded-md border border-border bg-secondary px-6 py-3 text-base font-medium text-secondary-foreground",
          "transition-colors duration-200",
          "hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&_svg]:size-5 [&_svg]:shrink-0",
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);
SecondaryAction.displayName = "SecondaryAction";
