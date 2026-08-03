import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { CheckCircle2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Region = "India" | "Gulf";

const REGIONS: Array<{
  value: Region;
  title: string;
  hint: string;
}> = [
  {
    value: "India",
    title: "India",
    hint: "Clear structure, ATS keywords grounded in your experience.",
  },
  {
    value: "Gulf",
    title: "Gulf (UAE, KSA, Qatar…)",
    hint: "Regional formatting — visa status only if you supply it.",
  },
];

/**
 * "Where are you applying?" — Flow A step 3.
 * Bottom drawer on mobile, centered modal on desktop.
 * Saves the market into the targeting draft before the user continues.
 */
export default function RegionSelectSheet({
  open,
  onConfirm,
  onSkip,
}: {
  open: boolean;
  onConfirm: (region: Region) => void;
  onSkip: () => void;
}) {
  const [selected, setSelected] = useState<Region | null>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Where are you applying?"
    >
      <div className="w-full max-w-md animate-fade-slide-up rounded-t-3xl border border-border bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-warm/10 text-accent-warm">
            <MapPin className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <button
            type="button"
            onClick={onSkip}
            aria-label="Close region selection"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
          Where are you applying?
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We tailor ATS keywords and formatting to this market.
        </p>

        <div className="mt-5 space-y-3">
          {REGIONS.map((r) => {
            const active = selected === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelected(r.value)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/40"
                )}
              >
                <CheckCircle2
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-primary" : "text-muted-foreground/40"
                  )}
                  strokeWidth={1.75}
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {r.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {r.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-2">
          <Button
            type="button"
            disabled={!selected}
            className="min-h-12 w-full rounded-[18px] bg-accent-warm font-semibold text-white hover:bg-accent-warm/90"
            onClick={() => selected && onConfirm(selected)}
          >
            Continue with {selected ?? "your region"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full rounded-[18px] text-muted-foreground"
            onClick={onSkip}
          >
            Skip — I’ll choose later
          </Button>
        </div>
      </div>
    </div>
  );
}
