import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { CreditCard, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const T = {
  surface: '#131b33',
  elevated: '#1c2747',
  primary: '#1e40af',
  primaryText: '#b8c4ff',
  accent: '#ea580c',
  text: '#e2e8f0',
  muted: '#94a3b8',
  outlineVariant: '#2a3a5c',
  success: '#16a34a',
};

interface BillingProps {
  resumesCount: number;
}

/** Align with Razorpay amounts in server/payments/razorpay.ts (₹399 / ₹799). */
const PLANS = [
  { tier: 'free', name: 'Free', price: '₹0', desc: '1 resume, basic export' },
  { tier: 'pro', name: 'Pro', price: '₹399', desc: 'Unlimited resumes, AI tools' },
  { tier: 'enterprise', name: 'Enterprise', price: '₹799', desc: 'Teams, branding, recruiter pipeline' },
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
          toast.success(`Upgraded to ${tier} (sandbox Razorpay)`);
          await utils.billing.getSubscription.invalidate();
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
              toast.success(`Payment verified — ${tier} plan active`);
              await utils.billing.getSubscription.invalidate();
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

  const currentPlan = PLANS.find((p) => p.tier === currentTier) || PLANS[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: T.text }}>
          Billing
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>
          Manage your subscription, payment method, and invoices.
        </p>
      </div>

      {inGrace && (
        <div
          className="rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ borderColor: T.accent, backgroundColor: `${T.accent}18` }}
          role="status"
        >
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: T.text }}>
              Payment issue — grace period active
            </p>
            <p className="text-xs mt-0.5" style={{ color: T.muted }}>
              Your {currentPlan.name} access continues
              {graceUntilLabel ? ` until ${graceUntilLabel}` : ''}. Renew to keep your plan without interruption.
            </p>
          </div>
          {currentTier !== 'free' && (
            <button
              type="button"
              onClick={() => handleUpgrade(currentTier)}
              className="shrink-0 rounded-lg px-4 py-2 text-xs font-bold text-white min-h-[44px]"
              style={{ backgroundColor: T.accent }}
              aria-label={`Renew ${currentPlan.name} plan`}
            >
              Renew now
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: T.elevated }}>
              <CreditCard className="h-5 w-5" style={{ color: T.primaryText }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>{currentPlan.name} Plan</p>
              <p className="text-xs" style={{ color: T.muted }}>
                {currentPlan.price}/mo
                {sub?.status ? ` · ${sub.status}` : ''}
                {sub?.provider ? ` · ${sub.provider}` : ''}
                {resumesCount >= 0 ? ` · ${resumesCount} resume${resumesCount === 1 ? '' : 's'}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleUpgrade('pro')}
              className="flex-1 rounded-lg py-2 text-xs font-bold text-white transition hover:opacity-90 min-h-[44px]"
              style={{ backgroundColor: T.primary }}>
              {currentTier === 'pro' ? 'Manage' : currentTier === 'enterprise' ? 'Manage' : 'Upgrade'}
            </button>
            {currentTier !== 'enterprise' && (
              <button onClick={() => handleUpgrade('enterprise')}
                className="flex-1 rounded-lg py-2 text-xs font-bold transition min-h-[44px]"
                style={{ backgroundColor: T.elevated, color: T.text }}>
                {currentTier === 'enterprise' ? 'Manage' : 'Enterprise'}
              </button>
            )}
          </div>
          {isProcessing && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: T.muted }}><RefreshCw className="h-3 w-3 animate-spin" /> Processing...</p>}
        </div>

        <div className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: T.elevated }}>
            <CreditCard className="h-5 w-5" style={{ color: T.primaryText }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: T.text }}>Payment method</p>
            <p className="text-xs mt-0.5" style={{ color: T.muted }}>
              Paid via Razorpay Checkout when you upgrade. Card details stay on Razorpay — HexaCV never stores raw card data.
            </p>
          </div>
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
          <span className="text-sm font-bold" style={{ color: T.text }}>Compare Plans</span>
          {plansOpen ? <ChevronDown className="h-4 w-4" style={{ color: T.muted }} /> : <ChevronRight className="h-4 w-4" style={{ color: T.muted }} />}
        </button>
        {plansOpen && (
          <div className="px-4 pb-4 space-y-2">
            {PLANS.map((plan) => {
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
                    ) : plan.tier !== 'free' ? (
                      <button type="button" onClick={() => handleUpgrade(plan.tier)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-white min-h-[44px]"
                        style={{ backgroundColor: T.primary }}>Upgrade</button>
                    ) : null}
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
