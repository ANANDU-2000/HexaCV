import { Link } from "wouter";
import { Layers, Check, ArrowLeft } from "lucide-react";

/** Align with server/payments/razorpay.ts RAZORPAY_PRICES_PAISE (39900 / 79900). */
const PLANS = [
  {
    tier: "free",
    name: "Free",
    price: "₹0",
    desc: "Start building — limited free AI and export.",
    features: ["1 resume workspace", "Basic templates", "Guest-friendly start"],
    cta: "Get started",
    href: "/builder",
    popular: false,
  },
  {
    tier: "pro",
    name: "Pro",
    price: "₹399",
    desc: "Unlimited resumes and AI rewrite tools.",
    features: ["Unlimited resumes", "AI summary & bullets", "ATS alignment tools"],
    cta: "Upgrade to Pro",
    href: "/dashboard/billing",
    popular: true,
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    price: "₹799",
    desc: "Teams, branding, and recruiter pipeline.",
    features: ["Everything in Pro", "Team collaboration", "Recruiter dashboard"],
    cta: "Upgrade to Enterprise",
    href: "/dashboard/billing",
    popular: false,
  },
] as const;

const T = {
  bg: "#0b1326",
  surface: "#171f33",
  elevated: "#222a3d",
  text: "#dae2fd",
  muted: "#94a3b8",
  primary: "#1e40af",
  accent: "#ea580c",
  border: "rgba(255,255,255,0.08)",
};

export default function Pricing() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: T.bg, fontFamily: "Inter, sans-serif" }}>
      <header
        className="border-b px-4 sm:px-8 h-16 flex items-center justify-between"
        style={{ borderColor: T.border, backgroundColor: T.surface }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #1e40af, #ea580c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Layers style={{ color: "#fff" }} className="w-4 h-4" />
          </div>
          <span className="text-lg font-extrabold tracking-tight" style={{ color: T.text }}>
            HexaCv
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium no-underline min-h-[44px]"
          style={{ color: T.muted }}
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
      </header>

      <main className="mx-auto px-4 sm:px-8 py-12" style={{ maxWidth: 1100 }}>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center" style={{ color: T.text }}>
          Pricing
        </h1>
        <p className="mt-3 text-center text-sm max-w-xl mx-auto" style={{ color: T.muted }}>
          Choose a plan that fits your search. Amounts match live Razorpay checkout (INR).
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.tier}
              className="rounded-2xl border p-6 flex flex-col"
              style={{
                borderColor: plan.popular ? T.accent : T.border,
                backgroundColor: T.surface,
              }}
            >
              {plan.popular && (
                <span
                  className="self-start text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md mb-3"
                  style={{ backgroundColor: `${T.accent}22`, color: T.accent }}
                >
                  Popular
                </span>
              )}
              <h2 className="text-xl font-bold" style={{ color: T.text }}>
                {plan.name}
              </h2>
              <p className="mt-1 text-3xl font-extrabold" style={{ color: T.text }}>
                {plan.price}
                {plan.tier !== "free" && (
                  <span className="text-sm font-normal" style={{ color: T.muted }}>
                    /mo
                  </span>
                )}
              </p>
              <p className="mt-2 text-sm" style={{ color: T.muted }}>
                {plan.desc}
              </p>
              <ul className="mt-5 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: T.text }}>
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: T.accent }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className="mt-6 block text-center rounded-[18px] py-3 text-sm font-bold no-underline min-h-[44px] leading-[20px]"
                style={{
                  backgroundColor: plan.popular ? T.accent : T.primary,
                  color: "#fff",
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs" style={{ color: T.muted }}>
          By upgrading you agree to our{" "}
          <Link href="/terms" className="no-underline" style={{ color: T.accent }}>
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/privacy" className="no-underline" style={{ color: T.accent }}>
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/refund" className="no-underline" style={{ color: T.accent }}>
            Refund Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
