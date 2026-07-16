import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Gift, Link2, Sparkles, DollarSign, Users, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AffiliateProps {
  userId: number;
}

export default function AffiliateSystem({ userId }: AffiliateProps) {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatsQuery = trpc.affiliate.getStats.useQuery();
  const trackClickMutation = trpc.affiliate.trackClick.useMutation();

  const referralLink = `https://hexacv.com/?ref=${userId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsSubmitting(true);
    try {
      // Simulate registering click/referral
      await trackClickMutation.mutateAsync({
        referrerId: userId,
        email: inviteEmail,
      });
      toast.success(`Referral invite recorded for ${inviteEmail}!`);
      getStatsQuery.refetch();
      setInviteEmail("");
    } catch (e: any) {
      toast.error("Failed to register invite");
    } finally {
      setIsSubmitting(false);
    }
  };

  const referrals = getStatsQuery.data || [];
  const totalClicks = referrals.reduce((acc, curr) => acc + curr.clicks, 0);
  const conversions = referrals.filter((r) => r.status === "converted").length;
  const earnings = referrals.reduce((acc, curr) => acc + curr.commissionEarned, 0);

  const handleRequestPayout = () => {
    if (earnings === 0) {
      toast.error("You do not have any earnings to cash out yet.");
      return;
    }
    toast.success(`Payout request for $${(earnings / 100).toFixed(2)} submitted to administration!`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Affiliate & Referral Network
        </h2>
        <p className="text-slate-600 mt-1">
          Share your custom referral URL, invite peers to optimize their resumes, and earn 20% commission on Pro upgrades.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Total Link Clicks
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-800">{totalClicks}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Successful Conversions
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-slate-800">{conversions}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-emerald-800 tracking-wider">
              Commissions Earned
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-emerald-950">
              ${(earnings / 100).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Share Box & Invite Form */}
      <div className="grid md:grid-cols-5 gap-8">
        <Card className="md:col-span-3 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Your Shareable Assets</CardTitle>
            <CardDescription>Copy your referral link or send direct email invitations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Your Referral URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Link2 className="w-4 h-4" />
                  </span>
                  <Input value={referralLink} readOnly className="pl-9 bg-slate-50 border-slate-200 font-mono text-xs select-all" />
                </div>
                <Button onClick={handleCopyLink} className="bg-slate-900 text-white shrink-0">
                  {copied ? "Copied" : "Copy Link"}
                </Button>
              </div>
            </div>

            <form onSubmit={handleInvite} className="flex items-end gap-2 border-t pt-6">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-slate-600">Send Direct Invite (Email)</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@company.com"
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-medium">
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Send Invitation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payout controls */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-500" />
              Cash Out Center
            </CardTitle>
            <CardDescription>Withdraw your affiliate earnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600 leading-relaxed">
              Payouts are processed weekly to your configured PayPal, Stripe, or local bank routing coordinates. Minimum checkout threshold is $50.00.
            </div>
            <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>Payout threshold progress:</span>
              <span>{Math.min(100, Math.round((earnings / 5000) * 100))}%</span>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <Button
              onClick={handleRequestPayout}
              disabled={earnings < 5000}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium shadow"
            >
              Request Payout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Referrals ledger */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-slate-500" />
            Referrals Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referred User</TableHead>
                <TableHead>Total Clicks</TableHead>
                <TableHead>Commission Earned</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((ref) => (
                <TableRow key={ref.id}>
                  <TableCell className="font-semibold text-slate-800">{ref.email || "Guest Visited"}</TableCell>
                  <TableCell>{ref.clicks}</TableCell>
                  <TableCell>${(ref.commissionEarned / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={
                      ref.status === "converted" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-100 text-slate-700"
                    }>
                      {ref.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {referrals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-xs text-slate-500 italic">
                    No referrals tracked yet. Share your link to start earning commissions.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
