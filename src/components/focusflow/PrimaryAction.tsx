import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface PrimaryActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  fullWidth?: boolean;
}

/**
 * The big calming pill CTA. e.g. "Start Focus Sprint".
 */
export const PrimaryAction = React.forwardRef<HTMLButtonElement, PrimaryActionProps>(
  ({ className, asChild, fullWidth, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex min-h-[52px] items-center justify-center gap-2",
          "rounded-pill bg-primary px-8 py-4 text-[17px] font-semibold text-primary-foreground",
          "shadow-lift transition-[transform,filter] duration-200",
          "hover:brightness-105 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
          "[&_svg]:size-5 [&_svg]:shrink-0",
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);
PrimaryAction.displayName = "PrimaryAction";
