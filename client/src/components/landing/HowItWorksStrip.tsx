import { Upload, Sparkles, PencilLine, Download } from 'lucide-react';

// Light marketing tokens, kept in sync with Landing.tsx
const T = {
  surface: '#ffffff',
  primary: '#1e40af',
  text: '#0f172a',
  muted: '#475569',
  lightMuted: '#94a3b8',
  border: '#e2e8f0',
};

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
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: T.text }}>
          Four steps. No filler.
        </h2>
        <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: T.muted }}>
          This is how HexaCv actually works: bring what you have, tailor it, check it, export it.
        </p>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0 m-0">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="rounded-2xl p-6 flex flex-col gap-3"
            style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-2xl font-extrabold tabular-nums"
                style={{ color: T.primary }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <step.icon className="w-5 h-5" style={{ color: T.lightMuted }} strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold leading-snug" style={{ color: T.text }}>
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
              {step.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
