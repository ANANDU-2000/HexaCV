import { useMemo } from "react";

/** Factual JD keyword found / not-found list — PLAN.md §6 (no fake ATS %). */

function extractKeywords(jd: string): string[] {
  const stop = new Set([
    "the", "and", "for", "with", "you", "your", "our", "are", "will", "this",
    "that", "from", "have", "has", "been", "was", "were", "their", "they",
    "a", "an", "of", "to", "in", "on", "at", "as", "by", "or", "be", "is",
    "we", "us", "it", "its", "job", "role", "work", "team", "years", "year",
    "experience", "required", "requirements", "preferred", "skills", "ability",
  ]);
  const words = (jd || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stop.has(w));
  return Array.from(new Set(words)).slice(0, 24);
}

type Props = {
  jobDescription?: string | null;
  resumeText: string;
  regionTips?: string | null;
};

export default function JdKeywordMatch({
  jobDescription,
  resumeText,
  regionTips,
}: Props) {
  const { found, missing } = useMemo(() => {
    const keys = extractKeywords(jobDescription || "");
    const hay = (resumeText || "").toLowerCase();
    const foundList: string[] = [];
    const missingList: string[] = [];
    for (const k of keys) {
      if (hay.includes(k)) foundList.push(k);
      else missingList.push(k);
    }
    return { found: foundList, missing: missingList };
  }, [jobDescription, resumeText]);

  if (!jobDescription?.trim()) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Paste a job description on the targeting screen to see keyword match here.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <h3 className="font-display text-sm font-semibold text-foreground">
        JD keyword match
      </h3>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--success)]">
          Found in your resume
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {found.length === 0 ? (
            <span className="text-sm text-muted-foreground">None yet</span>
          ) : (
            found.map((k) => (
              <span
                key={k}
                className="rounded-full bg-[color:var(--success)]/15 px-2.5 py-0.5 text-xs font-medium text-[color:var(--success)]"
              >
                {k}
              </span>
            ))
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Not found
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {missing.length === 0 ? (
            <span className="text-sm text-muted-foreground">All listed keywords present</span>
          ) : (
            missing.map((k) => (
              <span
                key={k}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {k}
              </span>
            ))
          )}
        </div>
      </div>
      {regionTips && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {regionTips}
        </p>
      )}
    </div>
  );
}
