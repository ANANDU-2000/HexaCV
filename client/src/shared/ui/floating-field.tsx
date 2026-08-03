import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * Floating-label inputs per HexaCV component library:
 * "[ Text Input ]: Rounded, Bordered, Floating Label".
 *
 * The label rests inside the field and floats to a small caption on focus
 * or when a value is present (peer-placeholder-shown technique).
 */

const floatingFieldClasses = cn(
  "block w-full rounded-xl border border-border bg-card px-3.5 pb-2 pt-6",
  "text-base text-foreground outline-none transition",
  "focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/60",
  "peer"
);

function FloatingLabelShell({
  id,
  label,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-3.5 top-1.5 origin-left text-xs font-medium",
          "text-muted-foreground transition-all duration-200",
          "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2",
          "peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground",
          "peer-focus:top-1.5 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:font-medium",
          "peer-focus:text-primary"
        )}
      >
        {label}
      </label>
      {hint && (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    label: string;
    hint?: string;
    wrapClassName?: string;
  }
>(function FloatingLabelInput(
  { id, label, hint, className, wrapClassName, placeholder = " ", ...props },
  ref
) {
  const resolvedId = id || React.useId();
  return (
    <FloatingLabelShell
      id={resolvedId}
      label={label}
      hint={hint}
      className={wrapClassName}
    >
      <input
        ref={ref}
        id={resolvedId}
        placeholder={placeholder}
        className={cn(floatingFieldClasses, "h-14", className)}
        {...props}
      />
    </FloatingLabelShell>
  );
});

export const FloatingLabelTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea"> & {
    label: string;
    hint?: string;
    wrapClassName?: string;
  }
>(function FloatingLabelTextarea(
  { id, label, hint, className, wrapClassName, placeholder = " ", ...props },
  ref
) {
  const resolvedId = id || React.useId();
  return (
    <FloatingLabelShell
      id={resolvedId}
      label={label}
      hint={hint}
      className={wrapClassName}
    >
      <textarea
        ref={ref}
        id={resolvedId}
        placeholder={placeholder}
        className={cn(floatingFieldClasses, "min-h-[140px] resize-y", className)}
        {...props}
      />
    </FloatingLabelShell>
  );
});
