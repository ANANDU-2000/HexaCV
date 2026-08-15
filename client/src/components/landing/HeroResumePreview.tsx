import ResumePreview from "@/components/ResumePreview";
import { PREVIEW_PAGE_WIDTH, SAMPLES } from "@/lib/sampleResumes";

const HERO_KEYWORDS = ["Site coordination", "Structural", "Primavera", "QA/QC"];

/**
 * Landing hero visual: the real A4 page fills the column (Enhancv/Rezi pattern),
 * cropped with a fade so the name and first sections stay readable.
 */
export default function HeroResumePreview() {
  const sample = SAMPLES[0];

  return (
    <figure className="m-0 hidden lg:sticky lg:top-24 lg:block">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-card [container-type:inline-size]"
        style={{
          height: "min(640px, calc(100cqi * 1.22))",
          boxShadow: "0 28px 56px color-mix(in srgb, var(--ink) 12%, transparent)",
        }}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 origin-top-left"
          style={{
            width: PREVIEW_PAGE_WIDTH,
            transform: `scale(calc(100cqi / ${PREVIEW_PAGE_WIDTH}px))`,
          }}
          aria-hidden="true"
        >
          <ResumePreview
            resume={sample.resume}
            templateId={sample.resume.templateId}
            zoom={100}
            pageOnly
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-4 pt-20"
          style={{
            background:
              "linear-gradient(transparent, color-mix(in srgb, var(--card) 92%, transparent) 42%, var(--card))",
          }}
        >
          <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sample — rewritten for Civil Engineer, Abu Dhabi
          </figcaption>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {HERO_KEYWORDS.map((kw) => (
              <span
                key={kw}
                className="rounded-md border border-[color:var(--success)]/30 bg-[color:var(--success)]/10 px-2 py-0.5 text-xs font-medium text-[color:var(--success)]"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
