import { Link } from 'wouter';
import { ArrowRight, CheckCircle2, Download, Sparkles } from 'lucide-react';

// Matches the live ₹99-per-build model (Pricing.tsx / Razorpay build: 9900).
const TIERS = [
  {
    name: 'First build',
    price: '₹0',
    period: '',
    desc: 'Included with every new account. Sign up and build your first resume free.',
    badge: 'Free',
    highlight: false,
    icon: Sparkles,
  },
  {
    name: 'Each build',
    price: '₹99',
    period: ' / resume',
    desc: 'Pay only when you need another — or buy 3 builds for ₹249 and save.',
    badge: 'Most used',
    highlight: true,
    icon: CheckCircle2,
  },
  {
    name: 'PDF + Word',
    price: 'Included',
    period: '',
    desc: 'Every build exports an ATS-friendly PDF and a Word file for quick edits.',
    badge: '',
    highlight: false,
    icon: Download,
  },
];

export default function PricingTeaser() {
  return (
    <section
      aria-label="Pricing overview"
      className="mx-auto px-4 sm:px-8"
      style={{ maxWidth: 960, paddingTop: 72, paddingBottom: 72 }}
    >
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Simple pricing, no subscription
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          Your first build is free. After that, ₹99 per resume — pay only when you build.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl border bg-card p-6 text-center ${
              tier.highlight ? 'border-accent-warm' : 'border-border'
            }`}
          >
            {tier.badge && (
              <span
                className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                  tier.highlight
                    ? 'bg-accent-warm/10 text-accent-warm'
                    : 'bg-[color:var(--success)]/10 text-[color:var(--success)]'
                }`}
              >
                {tier.badge}
              </span>
            )}
            <tier.icon className="mx-auto h-5 w-5 text-muted-foreground/70" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
              {tier.name}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-foreground">
              {tier.price}
              {tier.period && (
                <span className="text-sm font-normal text-muted-foreground">
                  {tier.period}
                </span>
              )}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {tier.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/pricing"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary no-underline"
        >
          See full pricing
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
    </section>
  );
}
