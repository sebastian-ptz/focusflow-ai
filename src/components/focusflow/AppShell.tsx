import * as React from "react";
import { cn } from "@/lib/utils";

interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  withBottomNav?: boolean;
}

/**
 * Page wrapper. Mobile-first: full-bleed bg, max-width gate for larger screens,
 * generous side padding, safe-area aware. Adds bottom padding when a BottomNav
 * is present so content never hides behind it.
 */
export function AppShell({
  className,
  withBottomNav = false,
  children,
  ...props
}: AppShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full bg-background text-foreground",
        "px-5 pt-6",
        withBottomNav ? "pb-28" : "pb-8",
        className,
      )}
      {...props}
    >
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
