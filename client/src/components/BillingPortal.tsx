import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CreditCard, Download, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
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

const INVOICES = [
  { id: 'inv-1', date: 'Jul 1, 2026', amount: '$29.00', status: 'Paid' },
  { id: 'inv-2', date: 'Jun 1, 2026', amount: '$29.00', status: 'Paid' },
  { id: 'inv-3', date: 'May 1, 2026', amount: '$19.00', status: 'Paid' },
  { id: 'inv-4', date: 'Apr 1, 2026', amount: '$0.00', status: 'Free' },
];

const PLANS = [
  { tier: 'free', name: 'Free', price: '$0', desc: '1 resume, basic export' },
  { tier: 'pro', name: 'Pro', price: '$29', desc: 'Unlimited resumes, AI tools' },
  { tier: 'enterprise', name: 'Enterprise', price: '$99', desc: 'Teams, branding, recruiter pipeline' },
];

export default function BillingPortal({ resumesCount }: BillingProps) {
  const getSubQuery = trpc.billing.getSubscription.useQuery();
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoicesOpen, setInvoicesOpen] = useState(true);
  const [invoiceSearch, setInvoiceSearch] = useState("");

  const sub = getSubQuery.data;
  const currentTier = sub?.tier || 'free';

  const handleUpgrade = async (tier: string) => {
    if (tier === currentTier) return;
    setIsProcessing(true);
    try {
      const { url } = await checkoutMutation.mutateAsync({ tier });
      if (url) window.location.href = url;
      else toast.error("Failed to create checkout");
    } catch { toast.error("Checkout failed"); }
    finally { setIsProcessing(false); }
  };

  const currentPlan = PLANS.find((p) => p.tier === currentTier) || PLANS[0];
  const filtered = INVOICES.filter((i) =>
    i.date.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    i.amount.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current plan card */}
        <div className="rounded-xl border p-4" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: T.elevated }}>
              <CreditCard className="h-5 w-5" style={{ color: T.primaryText }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>{currentPlan.name} Plan</p>
              <p className="text-xs" style={{ color: T.muted }}>{currentPlan.price}/mo · Renews Aug 15, 2026</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleUpgrade('pro')}
              className="flex-1 rounded-lg py-2 text-xs font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: T.primary }}>
              {currentTier === 'pro' ? 'Manage' : currentTier === 'enterprise' ? 'Manage' : 'Upgrade'}
            </button>
            {currentTier !== 'enterprise' && (
              <button onClick={() => handleUpgrade('enterprise')}
                className="flex-1 rounded-lg py-2 text-xs font-bold transition"
                style={{ backgroundColor: T.elevated, color: T.text }}>
                {currentTier === 'enterprise' ? 'Manage' : 'Enterprise'}
              </button>
            )}
          </div>
          {isProcessing && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: T.muted }}><RefreshCw className="h-3 w-3 animate-spin" /> Processing...</p>}
        </div>

        {/* Payment method card */}
        <div className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: T.elevated }}>
            <CreditCard className="h-5 w-5" style={{ color: T.primaryText }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: T.text }}>Visa ending in 4242</p>
            <p className="text-xs mt-0.5" style={{ color: T.muted }}>Expires 12/27</p>
            <button className="mt-2 text-xs font-bold" style={{ color: T.primaryText }}>Update</button>
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <button
          onClick={() => setInvoicesOpen(!invoicesOpen)}
          className="flex items-center justify-between w-full px-4 py-3"
        >
          <span className="text-sm font-bold" style={{ color: T.text }}>Compare Plans</span>
          {invoicesOpen ? <ChevronDown className="h-4 w-4" style={{ color: T.muted }} /> : <ChevronRight className="h-4 w-4" style={{ color: T.muted }} />}
        </button>
        {invoicesOpen && (
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
                    ) : (
                      <button onClick={() => handleUpgrade(plan.tier)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        style={{ backgroundColor: T.primary }}>Upgrade</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice history */}
      <div className="rounded-xl border" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: T.outlineVariant }}>
          <span className="flex-1 text-sm font-bold" style={{ color: T.text }}>Invoice History</span>
          <input value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} placeholder="Search invoices..."
            className="rounded-lg border px-3 py-1.5 text-xs outline-none w-40"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
        </div>
        <div className="divide-y" style={{ borderColor: T.outlineVariant }}>
          {filtered.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-bold" style={{ color: T.text }}>{inv.amount}</p>
                <p className="text-xs" style={{ color: T.muted }}>{inv.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: inv.status === 'Paid' ? `${T.success}20` : T.elevated, color: inv.status === 'Paid' ? T.success : T.muted }}>
                  {inv.status}
                </span>
                <button className="p-1 rounded" style={{ color: T.muted }}><Download className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-xs py-6" style={{ color: T.muted }}>No invoices found</p>}
        </div>
      </div>
    </div>
  );
}
