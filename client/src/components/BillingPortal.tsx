import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { CreditCard, ChevronDown, ChevronRight } from "lucide-react";
import { BUILD_PACKS } from "@/lib/buildPacks";
import { toast } from "sonner";

const T = {
  surface: '#FFFFFF',
  elevated: '#FBF8F3',
  primary: '#123832',
  primaryText: '#123832',
  accent: '#C5622A',
  text: '#1C1B18',
  muted: '#635F55',
  outlineVariant: '#E4DFD3',
  success: '#3F7A54',
};

interface BillingProps {
  resumesCount: number;
}

/** V6: primary product is pay-per-build ₹99, with build bundles. Legacy tiers kept collapsed. */
const LEGACY_PLANS = [
  { tier: 'pro', name: 'Pro (legacy)', price: '₹399', desc: 'Legacy monthly plan' },
  { tier: 'enterprise', name: 'Enterprise (legacy)', price: '₹799', desc: 'Legacy monthly plan' },
];

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-hexacv-razorpay]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.hexacvRazorpay = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

export default function BillingPortal({ resumesCount }: BillingProps) {
  const getSubQuery = trpc.billing.getSubscription.useQuery();
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation();
  const verifyMutation = trpc.billing.verifyRazorpayPayment.useMutation();
  const utils = trpc.useUtils();
  const [isProcessing, setIsProcessing] = useState(false);
  const [plansOpen, setPlansOpen] = useState(true);
  const [agreedLegal, setAgreedLegal] = useState(false);

  const sub = getSubQuery.data;
  const currentTier = sub?.tier || 'free';
  const inGrace =
    !!(sub as { inGrace?: boolean } | undefined)?.inGrace ||
    sub?.status === "grace";
  const graceUntilRaw = (sub as { graceUntil?: string | Date | null } | undefined)?.graceUntil;
  const graceUntilLabel = graceUntilRaw
    ? new Date(graceUntilRaw).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const handleUpgrade = async (tier: string) => {
    // Allow same-tier renew while in grace
    if (tier === currentTier && !inGrace) return;
    if (!agreedLegal) {
      toast.error("Please agree to the Terms of Service and Refund Policy");
      return;
    }
    setIsProcessing(true);
    try {
      const session = await checkoutMutation.mutateAsync({ tier });

      if (session.provider === "razorpay" && session.orderId && session.keyId) {
        if (session.sandbox) {
          // Local/dev without live keys: verify with mock payment ids (server allows mock path)
          await verifyMutation.mutateAsync({
            orderId: session.orderId,
            paymentId: `pay_mock_${Date.now()}`,
            signature: "sandbox",
          });
          toast.success(`Payment recorded — ${tier} (sandbox Razorpay)`);
          await utils.billing.getSubscription.invalidate();
          await utils.credits.getBalance.invalidate();
          return;
        }

        await loadRazorpayScript();
        if (!window.Razorpay) {
          toast.error("Razorpay Checkout failed to load");
          return;
        }

        const rzp = new window.Razorpay({
          key: session.keyId,
          amount: session.amount,
          currency: session.currency || "INR",
          name: "HexaCV",
          description: `${tier} plan`,
          order_id: session.orderId,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await verifyMutation.mutateAsync({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              toast.success(`Payment verified — credits added`);
              await utils.billing.getSubscription.invalidate();
              await utils.credits.getBalance.invalidate();
            } catch {
              toast.error("Payment received but server verification failed");
            }
          },
          modal: {
            ondismiss: () => toast.message("Checkout closed"),
          },
        });
        rzp.open();
        return;
      }

      if (session.url) {
        window.location.href = session.url;
        return;
      }
      toast.error("Failed to create checkout");
    } catch {
      toast.error("Checkout failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const creditsQuery = trpc.credits.getBalance.useQuery();
  const balance = creditsQuery.data?.balance ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: T.text }}>
          Buy credits
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>
          Pay per resume build — ₹99 each, or buy in bulk and save. First build free at signup. No subscription required.
        </p>
      </div>

      <div className="rounded-xl border p-5" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <p className="text-sm font-bold" style={{ color: T.text }}>
          Credit balance: {balance}
        </p>
        <p className="mt-1 text-xs" style={{ color: T.muted }}>
          {balance > 0
            ? `${balance} build${balance === 1 ? "" : "s"} ready`
            : "0 credits — buy one below to continue"}
        </p>
      </div>

      <div className="rounded-xl border p-5" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <p className="text-sm font-bold" style={{ color: T.text }}>Buy build packs</p>
        <p className="mt-1 text-xs" style={{ color: T.muted }}>
          1 build ₹99 — or buy a bundle and save. Credits apply to any future build.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {BUILD_PACKS.map((pack) => (
            <div
              key={pack.tier}
              className="relative rounded-lg border p-3"
              style={{
                borderColor: pack.popular ? T.accent : T.outlineVariant,
                backgroundColor: T.surface,
              }}
            >
              {pack.popular && (
                <span
                  className="absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${T.accent}22`, color: T.accent }}
                >
                  Popular
                </span>
              )}
              <p className="text-sm font-bold" style={{ color: T.text }}>
                {pack.count} build{pack.count > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-xl font-extrabold" style={{ color: T.text }}>
                {pack.priceLabel}
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: T.muted }}>
                {pack.perBuild}
                {pack.saveLabel ? ` · ${pack.saveLabel}` : ""}
              </p>
              <button
                onClick={() => handleUpgrade(pack.tier)}
                className="mt-3 w-full rounded-lg py-2 text-xs font-bold text-white transition hover:opacity-90 min-h-[44px]"
                style={{ backgroundColor: pack.popular ? T.accent : T.primary }}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing…" : `Buy ${pack.count}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: T.elevated }}>
          <CreditCard className="h-5 w-5" style={{ color: T.primaryText }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: T.text }}>Payment method</p>
          <p className="text-xs mt-0.5" style={{ color: T.muted }}>
            Paid via Razorpay Checkout when you buy. Card details stay on Razorpay — HexaCV never stores raw card data.
          </p>
        </div>
      </div>

      <label
        htmlFor="billing-legal-agree"
        className="flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer"
        style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}
      >
        <input
          id="billing-legal-agree"
          type="checkbox"
          checked={agreedLegal}
          onChange={(e) => setAgreedLegal(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
          style={{ accentColor: T.primary }}
        />
        <span className="text-xs leading-relaxed" style={{ color: T.muted }}>
          I agree to the{" "}
          <Link href="/terms" className="font-semibold no-underline hover:underline" style={{ color: T.primaryText }}>
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link href="/refund" className="font-semibold no-underline hover:underline" style={{ color: T.primaryText }}>
            Refund Policy
          </Link>
          .
        </span>
      </label>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <button
          onClick={() => setPlansOpen(!plansOpen)}
          className="flex items-center justify-between w-full px-4 py-3 min-h-[44px]"
          type="button"
          aria-label={plansOpen ? "Collapse plan comparison" : "Expand plan comparison"}
        >
          <span className="text-sm font-bold" style={{ color: T.text }}>Legacy subscription plans</span>
          {plansOpen ? <ChevronDown className="h-4 w-4" style={{ color: T.muted }} /> : <ChevronRight className="h-4 w-4" style={{ color: T.muted }} />}
        </button>
        {plansOpen && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs" style={{ color: T.muted }}>
              Prefer pay-per-build above. Legacy monthly plans remain available for existing accounts.
            </p>
            {LEGACY_PLANS.map((plan) => {
              const active = plan.tier === currentTier;
              return (
                <div key={plan.tier} className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                  style={{ borderColor: active ? T.primary : T.outlineVariant, backgroundColor: active ? `${T.primary}10` : T.elevated }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: T.text }}>{plan.name}</p>
                    <p className="text-xs" style={{ color: T.muted }}>{plan.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: T.text }}>{plan.price}<span className="text-xs font-normal" style={{ color: T.muted }}>/mo</span></span>
                    {active ? (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${T.success}20`, color: T.success }}>Active</span>
                    ) : (
                      <button type="button" onClick={() => handleUpgrade(plan.tier)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-white min-h-[44px]"
                        style={{ backgroundColor: T.primary }}>Upgrade</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: T.muted }}>
        See also{" "}
        <Link href="/pricing" className="no-underline hover:underline" style={{ color: T.primaryText }}>Pricing</Link>
        {" · "}
        <Link href="/privacy" className="no-underline hover:underline" style={{ color: T.primaryText }}>Privacy</Link>
      </p>

      <div className="rounded-xl border" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: T.outlineVariant }}>
          <span className="flex-1 text-sm font-bold" style={{ color: T.text }}>Invoice History</span>
        </div>
        <p className="text-center text-xs py-8 px-4" style={{ color: T.muted }}>
          No invoices yet. Verified Razorpay payments will appear here once invoice storage is connected.
        </p>
      </div>
    </div>
  );
}
