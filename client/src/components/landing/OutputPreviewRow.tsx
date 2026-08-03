import ResumePreview from '@/components/ResumePreview';
import { PREVIEW_PAGE_WIDTH, SAMPLES } from '@/lib/sampleResumes';

/** Scale the real A4 preview down to fit the card frame. */
const FRAME_WIDTH = 280;
const FRAME_HEIGHT = 340;
const SCALE = FRAME_WIDTH / PREVIEW_PAGE_WIDTH;

export default function OutputPreviewRow() {
  return (
    <section
      aria-label="Real output previews"
      className="mx-auto px-4 sm:px-8"
      style={{ maxWidth: 1280, paddingTop: 72, paddingBottom: 72 }}
    >
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          The output you actually get
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          Rendered with the same templates and preview engine you export from. Sample content
          shown; your resume uses your real experience.
        </p>
      </div>

      <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SAMPLES.map(({ label, resume }) => (
          <figure key={resume.id} className="m-0 w-full" style={{ maxWidth: FRAME_WIDTH + 2 }}>
            <div
              className="relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
              style={{ height: FRAME_HEIGHT }}
            >
              <div
                className="pointer-events-none absolute left-1/2 top-0 origin-top"
                style={{
                  width: PREVIEW_PAGE_WIDTH,
                  transform: `translateX(-50%) scale(${SCALE})`,
                }}
                aria-hidden="true"
              >
                <ResumePreview resume={resume} templateId={resume.templateId} zoom={100} />
              </div>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
                style={{ background: 'linear-gradient(transparent, var(--muted))' }}
              />
            </div>
            <figcaption className="mt-3 text-center text-sm font-medium text-muted-foreground">
              {label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
