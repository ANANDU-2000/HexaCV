import { useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Check, Search, Crosshair, Pencil, ShieldCheck, LayoutTemplate, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

const PHASES = [
  { key: "extract", label: "Reading your experience…", Icon: Search },
  { key: "target", label: "Matching this to {role} roles in {region}…", Icon: Crosshair },
  { key: "rewrite", label: "Sharpening how you describe your work…", Icon: Pencil },
  { key: "validate", label: "Double-checking nothing got made up…", Icon: ShieldCheck },
  { key: "polish", label: "Fitting it to the page…", Icon: LayoutTemplate },
] as const;

type PhaseKey = (typeof PHASES)[number]["key"];

const ORDER: PhaseKey[] = ["extract", "target", "rewrite", "validate", "polish"];

function phaseIndex(stage: string | null | undefined): number {
  if (!stage || stage === "done") return ORDER.length;
  if (stage === "failed") return -1;
  const i = ORDER.indexOf(stage as PhaseKey);
  return i >= 0 ? i : 0;
}

type Props = {
  buildId: string | null;
  role: string;
  region: string;
  localPhase?: PhaseKey;
  failed?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

export default function PipelineLoader({
  buildId,
  role,
  region,
  localPhase,
  failed,
  errorMessage,
  onRetry,
}: Props) {
  const statusQuery = trpc.resume.buildStatus.useQuery(
    { buildId: buildId || "" },
    {
      enabled: !!buildId,
      refetchInterval: (q) => {
        const stage = q.state.data?.stage;
        if (stage === "done" || stage === "failed") return false;
        return 1000;
      },
    }
  );

  const stage = statusQuery.data?.stage || localPhase || "extract";
  const isFailed = failed || stage === "failed";
  const currentIdx = isFailed
    ? phaseIndex(statusQuery.data?.stage === "failed" ? "validate" : stage)
    : phaseIndex(stage);

  useEffect(() => {
    // Prevent body scroll during full-focus loader
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const interpolate = (template: string) =>
    template
      .replace("{role}", role || "your")
      .replace("{region}", region || "your region");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4"
      style={{ fontFamily: "var(--font-sans)" }}
      role="status"
      aria-live="polite"
      aria-busy={!isFailed}
    >
      <div className="w-full max-w-md">
        <h1 className="font-display text-center text-2xl font-semibold text-foreground">
          Building your resume
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Real steps — not a spinner with a slogan.
        </p>

        <ol className="mt-10 space-y-4">
          {PHASES.map((phase, idx) => {
            const done = !isFailed && currentIdx > idx;
            const active = !isFailed && currentIdx === idx;
            const failedHere =
              isFailed &&
              (statusQuery.data?.stage === phase.key ||
                (currentIdx === idx && isFailed));
            const Icon = phase.Icon;
            return (
              <li
                key={phase.key}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  active
                    ? "border-primary bg-card"
                    : failedHere
                      ? "border-[color:var(--destructive)] bg-card"
                      : "border-border bg-card/60"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? "bg-[color:var(--success)] text-white"
                      : failedHere
                        ? "bg-[color:var(--destructive)] text-white"
                        : active
                          ? "bg-primary text-primary-foreground animate-pulse"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : failedHere ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </div>
                <p
                  className={`text-sm leading-snug ${
                    active || done ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {interpolate(phase.label)}
                </p>
              </li>
            );
          })}
        </ol>

        {isFailed && (
          <div className="mt-8 rounded-xl border border-[color:var(--destructive)]/40 bg-card p-4 text-center">
            <p className="text-sm text-foreground">
              {errorMessage ||
                statusQuery.data?.errorMessage ||
                "We hit a snag — no credit used, try again."}
            </p>
            {onRetry && (
              <Button
                className="mt-4 min-h-11 rounded-[18px] bg-primary text-primary-foreground"
                onClick={onRetry}
              >
                Try again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
