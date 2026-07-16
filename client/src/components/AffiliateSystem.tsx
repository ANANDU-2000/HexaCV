import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Gift, Link2, DollarSign, Users, MousePointerClick, Copy, Check, Send, History } from "lucide-react";
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

interface AffiliateProps {
  userId: number;
}

export default function AffiliateSystem({ userId }: AffiliateProps) {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const getStatsQuery = trpc.affiliate.getStats.useQuery();
  const trackClickMutation = trpc.affiliate.trackClick.useMutation();

  const referralLink = `https://hexacv.com/?ref=${userId}`;
  const referrals = getStatsQuery.data || [];
  const totalClicks = referrals.reduce((acc: number, curr: any) => acc + curr.clicks, 0);
  const conversions = referrals.filter((r: any) => r.status === "converted").length;
  const earnings = referrals.reduce((acc: number, curr: any) => acc + curr.commissionEarned, 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await trackClickMutation.mutateAsync({ referrerId: userId, email: inviteEmail });
      toast.success(`Invite sent to ${inviteEmail}`);
      getStatsQuery.refetch();
      setInviteEmail("");
    } catch { toast.error("Failed"); }
  };

  const payoutHistory = [
    { date: 'Jul 1, 2026', amount: 25.00, status: 'Paid' },
    { date: 'Jun 15, 2026', amount: 12.50, status: 'Paid' },
    { date: 'Jun 1, 2026', amount: 30.00, status: 'Pending' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: T.text }}>
          Affiliate Program
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>
          Share your referral link and earn 20% commission on Pro upgrades.
        </p>
      </div>

      {/* Referral link card */}
      <div className="rounded-xl border p-4" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: T.elevated }}>
            <Link2 className="h-5 w-5" style={{ color: T.primaryText }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: T.text }}>Your Referral Link</p>
            <p className="text-xs" style={{ color: T.muted }}>Share this link to earn commissions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input value={referralLink} readOnly
            className="flex-1 rounded-lg border px-3 py-2.5 text-xs font-mono outline-none select-all"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.muted }} />
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: T.primary }}>
            {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: MousePointerClick, label: 'Clicks', value: totalClicks },
          { icon: Users, label: 'Signups', value: conversions },
          { icon: DollarSign, label: 'Earnings', value: `$${(earnings / 100).toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4" style={{ color: T.primaryText }} />
              <span className="text-xs" style={{ color: T.muted }}>{s.label}</span>
            </div>
            <p className="text-xl font-extrabold mt-1" style={{ color: T.text }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="flex gap-2">
        <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="friend@email.com" type="email" required
          className="flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
        <button type="submit"
          className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          style={{ backgroundColor: T.accent }}>
          <Send className="h-4 w-4" /> Invite
        </button>
      </form>

      {/* Payout history */}
      <div>
        <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: T.text }}>
          <History className="h-4 w-4" /> Payout History
        </p>
        <div className="space-y-2">
          {payoutHistory.map((p, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
              <div>
                <p className="text-sm font-bold" style={{ color: T.text }}>${p.amount.toFixed(2)}</p>
                <p className="text-xs" style={{ color: T.muted }}>{p.date}</p>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: p.status === 'Paid' ? `${T.success}20` : `${T.accent}20`,
                  color: p.status === 'Paid' ? T.success : T.accent,
                }}>
                {p.status}
              </span>
            </div>
          ))}
          {payoutHistory.length === 0 && <p className="text-center text-xs py-6" style={{ color: T.muted }}>No payouts yet</p>}
        </div>
      </div>
    </div>
  );
}
