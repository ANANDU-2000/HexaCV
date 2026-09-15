import { useEffect, useState } from "react";
import {
  FileText,
  User,
  Briefcase,
  LayoutList,
  LayoutTemplate,
  Check,
  Loader2,
} from "lucide-react";

const STEPS = [
  { key: "read", label: "Reading your file…", Icon: FileText },
  { key: "contact", label: "Extracting contact details…", Icon: User },
  { key: "sections", label: "Finding experience, education & skills…", Icon: Briefcase },
  { key: "ats", label: "Mapping ATS sections…", Icon: LayoutList },
  { key: "structure", label: "Structuring your resume…", Icon: LayoutTemplate },
] as const;

/** Real work phases from Landing.handleFile — drives the loader floor. */
export type ParsePhase =
  | "idle"
  | "reading"
  | "encoding"
  | "uploading"
  | "extracting"
  | "done";

const PHASE_MIN_STEP: Record<ParsePhase, number> = {
  idle: 0,
  reading: 0,
  encoding: 0,
  uploading: 1,
  extracting: 2,
  done: STEPS.length - 1,
};

/**
 * Extraction process window shown while a PDF/DOCX is being parsed.
 * Step floor follows real `phase` from the parent; a slow timer only fills
 * remaining steps so the UI never claims "done" before the network returns.
 */
export default function ParseLoader({
  open,
  phase = "reading",
}: {
  open: boolean;
  phase?: ParsePhase;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const phaseFloor = PHASE_MIN_STEP[phase] ?? 0;

  useEffect(() => {
    if (!open) {
      setStepIdx(0);
      return;
    }
    setStepIdx((i) => Math.max(i, phaseFloor));
  }, [open, phaseFloor]);

  useEffect(() => {
    if (!open || phase === "done") return;
    // Slow fill only toward the last step — never past "structuring" until done.
    const id = setInterval(() => {
      setStepIdx((i) => {
        const floor = PHASE_MIN_STEP[phase] ?? 0;
        const cap = STEPS.length - 2; // hold on last active step until phase=done
        return Math.min(Math.max(i, floor) + 1, cap);
      });
    }, 900);
    return () => clearInterval(id);
  }, [open, phase]);

  useEffect(() => {
    if (phase === "done") {
      setStepIdx(STEPS.length - 1);
    }
  }, [phase]);

  if (!open) return null;

  const displayIdx = Math.max(stepIdx, phaseFloor);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4"
      style={{ fontFamily: "var(--font-sans)" }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-md">
        <h1 className="font-display text-center text-2xl font-semibold text-foreground">
          Extracting your resume
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Reading your file and structuring it for your target role.
        </p>

        <ol className="mt-10 space-y-4">
          {STEPS.map((step, idx) => {
            const done = idx < displayIdx || phase === "done";
            const active = idx === displayIdx && phase !== "done";
            const Icon = step.Icon;
            return (
              <li
                key={step.key}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  active
                    ? "border-primary bg-card"
                    : done
                      ? "border-border bg-card/60"
                      : "border-border bg-card/60 opacity-60"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? "bg-[color:var(--success)] text-white"
                      : active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="h-4 w-4" strokeWidth={1.75} />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                  ) : (
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </div>
                <p
                  className={`text-sm leading-snug ${
                    active || done ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
