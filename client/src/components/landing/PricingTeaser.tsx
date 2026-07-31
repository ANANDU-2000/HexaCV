import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

// Amounts match live Pricing.tsx / Razorpay checkout (INR)
const TIERS = [
  {
    name: 'Free',
    price: '₹0',
    period: '',
    desc: 'Start building with limited free AI and export.',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹399',
    period: '/mo',
    desc: 'Unlimited resumes and AI rewrite tools.',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '₹799',
    period: '/mo',
    desc: 'Teams, branding, and recruiter pipeline.',
    highlight: false,
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
          Simple pricing, start free
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          Begin as a guest at no cost. Upgrade only if you need more.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border bg-card p-6 text-center ${
              tier.highlight ? 'border-accent-warm' : 'border-border'
            }`}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
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
