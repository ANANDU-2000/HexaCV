import { Upload, Sparkles, PencilLine, Download } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload, paste, or LinkedIn',
    desc: 'Bring an existing PDF or DOCX, paste text, start blank, or pull from LinkedIn. No extra setup.',
  },
  {
    icon: Sparkles,
    title: 'AI tailors to your role and JD',
    desc: 'Pick a target role or paste a job description. The rewrite stays grounded in your source, invented claims get cut.',
  },
  {
    icon: PencilLine,
    title: 'Review and edit',
    desc: 'Every line stays editable. Accept, tweak, or reject each suggestion. Your words stay yours.',
  },
  {
    icon: Download,
    title: 'Download and apply',
    desc: 'Export an ATS-friendly PDF built for Gulf and India hiring formats when you are ready.',
  },
];

export default function HowItWorksStrip() {
  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      className="mx-auto px-4 sm:px-8"
      style={{ maxWidth: 1280, paddingTop: 72, paddingBottom: 72 }}
    >
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Four steps. No filler.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          This is how HexaCv actually works: bring what you have, tailor it, check it, export it.
        </p>
      </div>

      <ol className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-3">
              <span
                className="text-2xl font-extrabold tabular-nums text-primary"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <step.icon className="h-5 w-5 text-muted-foreground/70" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold leading-snug text-foreground">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {step.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
