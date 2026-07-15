import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "./ui/dialog";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Check, Shield, CreditCard, Sparkles, RefreshCw, FileText,
  Download, ChevronLeft, ChevronRight, AlertTriangle, Building,
  ArrowUpRight, ArrowDownRight, Clock
} from "lucide-react";

interface BillingProps {
  resumesCount: number;
}

type PlanTier = "free" | "pro" | "team";

const PLANS: {
  tier: PlanTier;
  name: string;
  price: number;
  desc: string;
  popular?: boolean;
  features: string[];
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    tier: "free",
    name: "Free",
    price: 0,
    desc: "Get started with basic resume tools",
    features: [
      "1 Active Resume Draft",
      "Standard PDF Download",
      "Basic ATS Scoring",
      "Community Templates",
    ],
    color: "from-slate-500 to-slate-600",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    tier: "pro",
    name: "Pro",
    price: 19,
    desc: "Maximize your interview callbacks",
    popular: true,
    features: [
      "Up to 10 Resume Drafts",
      "Unlimited ATS Scanner",
      "Premium Templates",
      "AI Bullet Point Optimizer",
      "Priority Support",
    ],
    color: "from-indigo-500 to-blue-600",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    tier: "team",
    name: "Team",
    price: 99,
    desc: "Collaborate and scale your hiring",
    features: [
      "Unlimited Resumes & Teams",
      "Recruiter Pipeline Board",
      "White-Label Branding",
      "Custom Domain",
      "Dedicated Support",
      "API Access",
    ],
    color: "from-purple-500 to-indigo-600",
    icon: <Building className="w-5 h-5" />,
  },
];

const PLAN_MAP: Record<string, PlanTier> = {
  free: "free",
  pro: "pro",
  enterprise: "team",
};

function mapTier(tier: string): PlanTier {
  return PLAN_MAP[tier] || "free";
}

function getPlan(tier: PlanTier) {
  return PLANS.find(p => p.tier === tier)!;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const MOCK_INVOICES = [
  { id: "inv_001", date: new Date(Date.now() - 25 * 86400000), amount: 1900, plan: "Pro" },
  { id: "inv_002", date: new Date(Date.now() - 55 * 86400000), amount: 0, plan: "Free" },
];

const MOCK_CARD = {
  brand: "Visa",
  last4: "4242",
  expMonth: 12,
  expYear: 26,
};

export default function BillingPortal({ resumesCount }: BillingProps) {
  const isMobile = useIsMobile();
  const [isProcessing, setIsProcessing] = useState(false);

  // Confirmation dialog state
  const [confirmTier, setConfirmTier] = useState<PlanTier | null>(null);

  const getSubQuery = trpc.billing.getSubscription.useQuery();
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation();
  const upgradePlanMutation = trpc.billing.upgradePlan.useMutation();

  const currentTier = mapTier(getSubQuery.data?.tier || "free");
  const currentPlan = getPlan(currentTier);

  const maxResumes = currentTier === "free" ? 1 : currentTier === "pro" ? 10 : 999;
  const resumesPercent = Math.min(100, Math.round((resumesCount / maxResumes) * 100));

  // Simulated proration
  const daysRemaining = 18;
  const totalDays = 30;
  const prorationFactor = daysRemaining / totalDays;

  const computeProrated = useCallback(
    (newTier: PlanTier) => {
      const oldPrice = currentPlan.price;
      const newPrice = getPlan(newTier).price;
      const diff = newPrice - oldPrice;
      const prorated = Math.round(diff * prorationFactor * 100);
      return { diff, prorated, isUpgrade: diff > 0 };
    },
    [currentPlan.price, prorationFactor]
  );

  const handleUpgrade = async (tier: PlanTier) => {
    setIsProcessing(true);
    try {
      const { url } = await checkoutMutation.mutateAsync({ tier });
      if (url && url.startsWith("/")) {
        await upgradePlanMutation.mutateAsync({ tier });
        toast.success(`Upgraded to ${getPlan(tier).name} plan!`);
        getSubQuery.refetch();
      } else if (url) {
        window.location.href = url;
      } else {
        toast.error("Failed to generate checkout.");
      }
    } catch {
      toast.error("Failed to process upgrade");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!confirmTier) return;
    setConfirmTier(null);
    await handleUpgrade(confirmTier);
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const [scrollIndex, setScrollIndex] = useState(0);

  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const idx = Math.round(carouselRef.current.scrollLeft / carouselRef.current.clientWidth);
    setScrollIndex(idx);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollTo = (idx: number) => {
    carouselRef.current?.children[idx]?.scrollIntoView({ behavior: "smooth", inline: "center" });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
          <CreditCard className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Billing & Subscriptions</h2>
          <p className="text-[11px] text-slate-500">Manage your plan and payment methods</p>
        </div>
      </div>

      {/* Usage Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Resume Storage</span>
            </div>
            <span className="text-xs text-slate-500">
              {resumesCount} of {maxResumes === 999 ? "∞" : maxResumes} used
              <Badge className={cn("ml-1.5 text-[9px] px-1 py-0", currentTier === "pro" ? "bg-indigo-100 text-indigo-700" : currentTier === "team" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600")}>
                {getPlan(currentTier).name}
              </Badge>
            </span>
          </div>
          <Progress value={resumesPercent} className="h-1.5 bg-slate-100" />
        </CardContent>
      </Card>

      {/* Plan Cards */}
      {isMobile ? (
        <>
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden"
          >
            {PLANS.map((plan, idx) => {
              const isCurrent = plan.tier === currentTier;
              return (
                <div
                  key={plan.tier}
                  className="snap-center shrink-0 w-[85vw] first:ml-0 last:mr-0"
                >
                  <PlanCard
                    plan={plan}
                    isCurrent={isCurrent}
                    isProcessing={isProcessing}
                    onSelect={() => { if (!isCurrent) setConfirmTier(plan.tier); }}
                    currentTier={currentTier}
                  />
                </div>
              );
            })}
          </div>
          {/* Page Dots */}
          <div className="flex justify-center gap-1.5">
            {PLANS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === scrollIndex ? "bg-indigo-600 w-5" : "bg-slate-300"
                )}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.tier === currentTier;
            return (
              <PlanCard
                key={plan.tier}
                plan={plan}
                isCurrent={isCurrent}
                isProcessing={isProcessing}
                onSelect={() => { if (!isCurrent) setConfirmTier(plan.tier); }}
                currentTier={currentTier}
              />
            );
          })}
        </div>
      )}

      {/* Billing History + Payment Method */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Billing History */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="px-4 py-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isMobile ? (
              <div className="divide-y divide-slate-50">
                {MOCK_INVOICES.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-slate-800">{inv.plan} Plan</p>
                      <p className="text-[10px] text-slate-400">{formatDate(inv.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">{formatCurrency(inv.amount)}</span>
                      <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="text-right px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="text-right px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {MOCK_INVOICES.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 text-xs text-slate-600">{formatDate(inv.date)}</td>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{inv.plan}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-700 text-right font-medium">
                        {inv.amount === 0 ? (
                          <span className="text-slate-400">Free</span>
                        ) : (
                          formatCurrency(inv.amount)
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {MOCK_INVOICES.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-slate-400 italic">No billing history yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="px-4 py-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {currentTier === "free" ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <CreditCard className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-xs font-medium text-slate-600">No payment method on file</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Add one when you upgrade to a paid plan.</p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-800">
                    {MOCK_CARD.brand} ending in {MOCK_CARD.last4}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Expires {MOCK_CARD.expMonth}/{MOCK_CARD.expYear}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10px] border-slate-300 text-slate-600">
                  Update
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      {confirmTier && (
        <Dialog open={!!confirmTier} onOpenChange={() => setConfirmTier(null)}>
          <DialogContent className="max-w-sm bg-white">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <DialogTitle className="text-base">Confirm Plan Change</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {(() => {
                const target = getPlan(confirmTier);
                const { diff, prorated, isUpgrade } = computeProrated(confirmTier);
                return (
                  <>
                    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="text-xs text-slate-600">Current</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{getPlan(currentTier).name} — ${currentPlan.price}/mo</span>
                    </div>
                    <div className="flex justify-center">
                      {isUpgrade ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg border",
                      isUpgrade ? "bg-indigo-50 border-indigo-200" : "bg-amber-50 border-amber-200"
                    )}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center",
                          confirmTier === "pro" ? "bg-indigo-200" : "bg-purple-200"
                        )}>
                          {confirmTier === "pro" ? (
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <Building className="w-3.5 h-3.5 text-purple-600" />
                          )}
                        </div>
                        <span className="text-xs text-slate-600">New</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{target.name} — ${target.price}/mo</span>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Price difference</span>
                        <span className={diff >= 0 ? "text-slate-700" : "text-emerald-600"}>
                          {diff >= 0 ? "+" : ""}${diff}/mo
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Days remaining in cycle</span>
                        <span className="text-slate-600">{daysRemaining} of {totalDays}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold border-t border-slate-100 pt-1.5">
                        <span className="text-slate-700">Prorated today</span>
                        <span className={cn(isUpgrade ? "text-indigo-600" : "text-emerald-600")}>
                          {isUpgrade ? "+" : "-"}{formatCurrency(Math.abs(prorated))}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmTier(null)}>Cancel</Button>
              <Button
                size="sm"
                disabled={isProcessing}
                className={cn(
                  confirmTier === "team" ? "bg-purple-600 hover:bg-purple-700" : "bg-indigo-600 hover:bg-indigo-700",
                  "text-white"
                )}
                onClick={handleConfirmUpgrade}
              >
                {isProcessing ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> Processing</>
                ) : (
                  <>Confirm {getPlan(confirmTier).name}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  isProcessing,
  onSelect,
  currentTier,
}: {
  plan: typeof PLANS[0];
  isCurrent: boolean;
  isProcessing: boolean;
  onSelect: () => void;
  currentTier: PlanTier;
}) {
  const isUpgrade = plan.price > getPlan(currentTier).price;

  return (
    <Card
      className={cn(
        "flex flex-col border shadow-sm relative",
        isCurrent ? "ring-2 ring-indigo-500 border-indigo-300" : "border-slate-200",
        plan.popular && !isCurrent && "ring-1 ring-indigo-200"
      )}
    >
      {/* Popular badge */}
      {plan.popular && !isCurrent && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[9px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full shadow">
          Most Popular
        </span>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center", plan.color)}>
            {plan.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-800">{plan.name}</CardTitle>
              {isCurrent && (
                <span className="text-[9px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full border border-indigo-200">
                  Current Plan
                </span>
              )}
            </div>
            <CardDescription className="text-[11px]">{plan.desc}</CardDescription>
          </div>
        </div>
        <div className="flex items-baseline mt-3">
          <span className="text-3xl font-extrabold text-slate-900">${plan.price}</span>
          <span className="ml-1 text-xs font-semibold text-slate-500">/month</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2.5 px-4 pb-4">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2">
            <Check className={cn(
              "w-3.5 h-3.5 shrink-0 mt-0.5",
              isCurrent ? "text-indigo-500" : "text-slate-400"
            )} />
            <span className={cn("text-xs", isCurrent ? "text-slate-700" : "text-slate-500")}>{f}</span>
          </div>
        ))}
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        {isCurrent ? (
          <Button disabled className="w-full h-8 text-xs bg-slate-100 text-slate-500 border border-slate-200 cursor-default">
            Current Plan
          </Button>
        ) : (
          <Button
            disabled={isProcessing}
            onClick={onSelect}
            className={cn(
              "w-full h-8 text-xs font-medium shadow-sm",
              isUpgrade
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            )}
          >
            {isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
