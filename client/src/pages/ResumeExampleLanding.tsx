import { Link, useParams } from "wouter";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/shared/ui/button";
import NotFound from "@/pages/NotFound";
import { getResumeExample } from "@/lib/resumeExamples";
import SiteHeader from "@/shared/layout/SiteHeader";
import SiteFooter from "@/shared/layout/SiteFooter";

export default function ResumeExampleLanding() {
  const params = useParams<{ country: string; role: string }>();
  const example = getResumeExample(params.country ?? "", params.role ?? "");

  if (!example) {
    return <NotFound />;
  }

  const { job, countryName, atsNotes, exampleBullets, builderHref } = example;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full flex-1 px-4 py-12 sm:px-8" style={{ maxWidth: 860 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Resume example
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {job.title} resume for {countryName}
        </h1>
        <p className="mt-4 max-w-[640px] text-base leading-relaxed text-muted-foreground">
          What a grounded {job.title} resume looks like when it targets {countryName} hiring
          expectations. Clear wording, ATS-friendly structure, and no invented achievements.
          Everything below is illustrative and based on real experience patterns, not
          fabricated metrics.
        </p>

        <section aria-label="ATS and formatting notes" className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <FileText className="h-5 w-5 text-primary" strokeWidth={1.75} />
            ATS and format notes for {countryName}
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {atsNotes.map((note, i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground"
              >
                {note}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Example resume bullets" className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <CheckCircle2 className="h-5 w-5 text-[color:var(--success)]" strokeWidth={1.75} />
            Example bullets, grounded style
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Illustrative rewrites of real experience patterns. Your bullets stay tied to your
            own source, never invented numbers.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {exampleBullets.map((bullet, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4 text-sm leading-relaxed text-foreground"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                />
                {bullet}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Build this resume" className="mt-12 text-center">
          <div className="rounded-2xl bg-primary px-6 py-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-primary-foreground">
              Build your {job.title} resume for {countryName}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-primary-foreground/80">
              Start from your real experience. HexaCv improves clarity and ATS fit without
              adding anything you did not do.
            </p>
            <div className="mx-auto mt-6 max-w-xs">
              <Link href={builderHref} className="block w-full no-underline">
                <Button
                  size="lg"
                  className="min-h-11 w-full rounded-[18px] bg-accent-warm font-bold text-white hover:bg-accent-warm/90"
                >
                  Build this resume
                  <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.75} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
