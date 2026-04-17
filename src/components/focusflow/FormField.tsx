import * as React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Label + control + helper/error wrapper. Mobile tap-target friendly.
 */
export function FormField({ label, htmlFor, helper, error, children, className }: FormFieldProps) {
  const describedBy = error ? `${htmlFor}-error` : helper ? `${htmlFor}-helper` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-base font-medium text-foreground">
        {label}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id: htmlFor,
            "aria-describedby": describedBy,
            "aria-invalid": error ? true : undefined,
          })
        : children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : helper ? (
        <p id={`${htmlFor}-helper`} className="text-sm text-muted-foreground">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
