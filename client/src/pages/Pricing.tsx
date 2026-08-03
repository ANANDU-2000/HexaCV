import { Link } from "wouter";
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  FileText,
  Download,
} from "lucide-react";

/**
 * Align with the live product: pay-per-build credits (₹99), first build free at
 * signup. Legacy monthly plans (pro ₹399 / enterprise ₹799) remain available only
 * for accounts on legacy billing — see BillingPortal.
 *
 * Amounts match server/payments/razorpay.ts RAZORPAY_PRICES_PAISE (build: 9900).
 */

const BUILD_FEATURES = [
  "One role + job description optimized resume",
  "AI rewrite grounded in your real experience — nothing invented",
  "ATS keyword alignment for your target role & region",
  "PDF and Word export",
  "No credit used if the build fails",
];

const FIRST_FREE_FEATURES = [
  "Upload PDF/Word or paste your experience",
  "Live resume preview and in-page editor",
  "Every new account starts with 1 free build",
];

export default function Pricing() {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <header className="flex h-16 items-center justify-between border-b border-border bg-background/92 px-4 backdrop-blur-md sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-primary">
            HexaCv
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground no-underline hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </header>

      <main className="mx-auto px-4 pb-16 pt-12 sm:px-8" style={{ maxWidth: 960 }}>
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            ₹99 per resume build. No subscription.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Pay only when you actually build a resume. Your first build is free
            on every new account.
          </p>
          <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-accent-warm" strokeWidth={1.75} />
            First build free — then ₹99. No recurring charges.
          </p>
        </div>

        {/* Primary pay-per-build card */}
        <section aria-label="Build pricing" className="mt-10">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="grid md:grid-cols-2">
              <div className="border-b border-border p-6 sm:p-8 md:border-b-0 md:border-r">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent-warm/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-warm">
                    Per build
                  </span>
                  <span className="rounded-full bg-[color:var(--success)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[color:var(--success)]">
                    Most used
                  </span>
                </div>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl font-semibold text-foreground">₹99</span>
                  <span className="text-sm text-muted-foreground">/ resume build, incl. taxes</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {BUILD_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]"
                        strokeWidth={1.75}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col justify-center gap-5 p-6 sm:p-8">
                <Link href="/dashboard/billing" className="no-underline">
                  <span className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-accent-warm px-7 py-4 text-base font-semibold text-white hover:bg-accent-warm/90">
                    Buy a build — ₹99
                  </span>
                </Link>
                <Link href="/builder" className="no-underline">
                  <span className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-border px-7 py-4 text-base font-semibold text-foreground hover:bg-muted/60">
                    Start your free build
                  </span>
                </Link>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    Secured checkout via Razorpay (UPI, cards, net banking).
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    If the build fails, your credit is released — no charge.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Free vs paid summary */}
        <section aria-label="How billing works" className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
              </span>
              First build — free
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every new account includes one free build. Sign up, target your
              role, and export before you pay anything.
            </p>
            <ul className="mt-4 space-y-2">
              {FIRST_FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]" strokeWidth={1.75} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-warm/10 text-accent-warm">
                <Download className="h-4 w-4" strokeWidth={1.75} />
              </span>
              PDF &amp; Word export
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every build includes both formats — a clean PDF for applications
              and a Word file for quick edits.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start gap-2 text-sm text-foreground">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                ATS-friendly single-column layout
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                Regional formatting for Gulf &amp; India
              </li>
            </ul>
          </div>
        </section>

        {/* Legacy note + legal */}
        <section className="mt-10 space-y-6 text-center">
          <p className="mx-auto max-w-lg text-xs leading-relaxed text-muted-foreground">
            Legacy monthly plans (Pro ₹399 / Enterprise ₹799) remain available
            only for accounts already on those plans —{" "}
            <Link href="/dashboard/billing" className="no-underline text-primary hover:underline">
              view billing
            </Link>
            .
          </p>
          <p className="text-xs text-muted-foreground">
            By purchasing you agree to our{" "}
            <Link href="/terms" className="no-underline text-primary hover:underline">
              Terms of Service
            </Link>
            ,{" "}
            <Link href="/privacy" className="no-underline text-primary hover:underline">
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/refund" className="no-underline text-primary hover:underline">
              Refund Policy
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
