import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

// Light marketing tokens, kept in sync with Landing.tsx
const T = {
  surface: '#ffffff',
  primary: '#1e40af',
  accent: '#ea580c',
  text: '#0f172a',
  muted: '#475569',
  lightMuted: '#94a3b8',
  border: '#e2e8f0',
};

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
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: T.text }}>
          Simple pricing, start free
        </h2>
        <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: T.muted }}>
          Begin as a guest at no cost. Upgrade only if you need more.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className="rounded-2xl p-6 text-center"
            style={{
              backgroundColor: T.surface,
              border: `1px solid ${tier.highlight ? T.accent : T.border}`,
            }}
          >
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: T.lightMuted }}>
              {tier.name}
            </p>
            <p className="mt-2 text-3xl font-extrabold" style={{ color: T.text }}>
              {tier.price}
              {tier.period && (
                <span className="text-sm font-normal" style={{ color: T.muted }}>
                  {tier.period}
                </span>
              )}
            </p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: T.muted }}>
              {tier.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-sm font-bold no-underline min-h-11"
          style={{ color: T.primary }}
        >
          See full pricing
          <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
        </Link>
      </div>
    </section>
  );
}
