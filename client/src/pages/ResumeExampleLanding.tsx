import { Link, useParams } from 'wouter';
import { Layers, ArrowRight, ArrowLeft, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import NotFound from '@/pages/NotFound';
import { getResumeExample } from '@/lib/resumeExamples';

// Light marketing tokens, kept in sync with Landing.tsx
const T = {
  bg: '#f8fafc',
  surface: '#ffffff',
  elevated: '#f1f5f9',
  primary: '#1e40af',
  primaryDark: '#1e3a8a',
  accent: '#ea580c',
  text: '#0f172a',
  muted: '#475569',
  lightMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
};

export default function ResumeExampleLanding() {
  const params = useParams<{ country: string; role: string }>();
  const example = getResumeExample(params.country ?? '', params.role ?? '');

  if (!example) {
    return <NotFound />;
  }

  const { job, countryName, atsNotes, exampleBullets, builderHref } = example;

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: T.bg, color: T.text, fontFamily: 'Inter, sans-serif' }}
    >
      <header
        className="px-4 sm:px-8 h-16 flex items-center justify-between"
        style={{ backgroundColor: T.surface, borderBottom: `1px solid ${T.border}` }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: T.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            <Layers style={{ color: '#fff' }} className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <span className="text-lg font-extrabold tracking-tight" style={{ color: T.text }}>
            HexaCv
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium no-underline min-h-11"
          style={{ color: T.muted }}
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} /> Home
        </Link>
      </header>

      <main className="mx-auto px-4 sm:px-8 py-12" style={{ maxWidth: 860 }}>
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: T.lightMuted }}
        >
          Resume example
        </p>
        <h1
          className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight"
          style={{ color: T.text }}
        >
          {job.title} resume for {countryName}
        </h1>
        <p className="mt-4 text-base leading-relaxed" style={{ color: T.muted, maxWidth: 640 }}>
          What a grounded {job.title} resume looks like when it targets {countryName} hiring
          expectations. Clear wording, ATS-friendly structure, and no invented achievements.
          Everything below is illustrative and based on real experience patterns, not
          fabricated metrics.
        </p>

        {/* ATS notes */}
        <section aria-label="ATS and formatting notes" className="mt-10">
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: T.text }}>
            <FileText className="w-5 h-5" style={{ color: T.primary }} strokeWidth={1.75} />
            ATS and format notes for {countryName}
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {atsNotes.map((note, i) => (
              <li
                key={i}
                className="rounded-xl p-4 text-sm leading-relaxed"
                style={{
                  backgroundColor: T.surface,
                  border: `1px solid ${T.border}`,
                  color: T.muted,
                }}
              >
                {note}
              </li>
            ))}
          </ul>
        </section>

        {/* Example bullets */}
        <section aria-label="Example resume bullets" className="mt-10">
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: T.text }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: T.success }} strokeWidth={1.75} />
            Example bullets, grounded style
          </h2>
          <p className="mt-2 text-sm" style={{ color: T.lightMuted }}>
            Illustrative rewrites of real experience patterns. Your bullets stay tied to your
            own source, never invented numbers.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {exampleBullets.map((bullet, i) => (
              <li
                key={i}
                className="rounded-xl p-4 text-sm leading-relaxed flex items-start gap-3"
                style={{
                  backgroundColor: T.elevated,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                }}
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 shrink-0"
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    backgroundColor: T.primary,
                  }}
                />
                {bullet}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section aria-label="Build this resume" className="mt-12 text-center">
          <div
            className="rounded-2xl px-6 py-10"
            style={{ backgroundColor: T.primaryDark }}
          >
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Build your {job.title} resume for {countryName}
            </h2>
            <p className="mt-2 text-sm text-white/80 max-w-md mx-auto">
              Start from your real experience. HexaCv improves clarity and ATS fit without
              adding anything you did not do.
            </p>
            <div className="mt-6 max-w-xs mx-auto">
              <Link href={builderHref} className="block w-full no-underline">
                <Button
                  size="lg"
                  className="w-full font-bold min-h-11"
                  style={{ backgroundColor: T.accent, color: '#fff', borderRadius: 10 }}
                >
                  Build this resume
                  <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.75} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
