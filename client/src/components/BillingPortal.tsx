import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Check, ShieldAlert, CreditCard, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface BillingProps {
  resumesCount: number;
}

export default function BillingPortal({ resumesCount }: BillingProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const getSubQuery = trpc.billing.getSubscription.useQuery();
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation();

  const currentTier = getSubQuery.data?.tier || "free";

  const handleCheckoutTrigger = async (tier: string) => {
    if (tier === currentTier) {
      toast.info(`You are already subscribed to the ${tier} tier.`);
      return;
    }

    setIsProcessing(true);
    toast.info("Connecting to Stripe payments gateway...");
    try {
      const { url } = await checkoutMutation.mutateAsync({ tier });
      if (url) {
        toast.success("Redirecting to secure payment checkout...");
        window.location.href = url;
      } else {
        toast.error("Failed to generate checkout URL.");
      }
    } catch (err: any) {
      toast.error("Failed to generate checkout session: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Usage statistics limits calculation
  const maxResumes = currentTier === "free" ? 1 : currentTier === "pro" ? 10 : 999;
  const resumesPercent = Math.min(100, Math.round((resumesCount / maxResumes) * 100));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Subscription Billing & Usage
        </h2>
        <p className="text-slate-600 mt-1">
          Review usage limits, manage payment plans, and upgrade features for collaborators and recruiters.
        </p>
      </div>

      {/* Usage Analytics Limits */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800">Current Plan Usage Limits</CardTitle>
          <CardDescription>
            You are on the <strong className="uppercase text-blue-600 font-bold">{currentTier} Plan</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Resume Documents ({resumesCount} / {maxResumes === 999 ? "∞" : maxResumes})</span>
              <span>{resumesPercent}%</span>
            </div>
            <Progress value={resumesPercent} className="h-2 bg-slate-100" />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <Card className={`flex flex-col border border-slate-200 shadow-sm relative ${currentTier === "free" ? "ring-2 ring-blue-600" : ""}`}>
          {currentTier === "free" && (
            <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow">
              Active Tier
            </span>
          )}
          <CardHeader>
            <CardTitle className="text-xl font-extrabold text-slate-800">Basic Free</CardTitle>
            <CardDescription>Perfect for trial drafts</CardDescription>
            <div className="mt-4 flex items-baseline text-slate-900">
              <span className="text-4xl font-extrabold tracking-tight">$0</span>
              <span className="ml-1 text-sm font-semibold text-slate-500">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">1 Active Resume Draft</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">Standard PDF Download</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">Basic ATS Scoring</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              disabled={currentTier === "free"}
              onClick={() => handleCheckoutTrigger("free")}
              className="w-full bg-slate-100 text-slate-800 border hover:bg-slate-200"
            >
              Current Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className={`flex flex-col border border-slate-200 shadow-sm relative ${currentTier === "pro" ? "ring-2 ring-blue-600" : ""}`}>
          {currentTier === "pro" && (
            <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow">
              Active Tier
            </span>
          )}
          <CardHeader>
            <CardTitle className="text-xl font-extrabold text-slate-800 flex items-center justify-between">
              Premium Pro
              <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-200" />
            </CardTitle>
            <CardDescription>Maximize applicant callbacks</CardDescription>
            <div className="mt-4 flex items-baseline text-slate-900">
              <span className="text-4xl font-extrabold tracking-tight">$19</span>
              <span className="ml-1 text-sm font-semibold text-slate-500">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">Up to 10 Resume Drafts</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">Unlimited ATS Scanner compliance</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">Premium layout template presets</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">AI Bullet point optimizer</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              disabled={isProcessing}
              onClick={() => handleCheckoutTrigger("pro")}
              className={`w-full ${
                currentTier === "pro"
                  ? "bg-slate-100 text-slate-800 border"
                  : "bg-blue-600 hover:bg-blue-700 text-white font-medium"
              }`}
            >
              {isProcessing && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              {currentTier === "pro" ? "Current Plan" : "Upgrade to Pro"}
            </Button>
          </CardFooter>
        </Card>

        {/* Enterprise/Organization Plan */}
        <Card className={`flex flex-col border border-slate-200 shadow-sm relative ${currentTier === "enterprise" ? "ring-2 ring-blue-600" : ""}`}>
          {currentTier === "enterprise" && (
            <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow">
              Active Tier
            </span>
          )}
          <CardHeader>
            <CardTitle className="text-xl font-extrabold text-slate-800">Corporate Enterprise</CardTitle>
            <CardDescription>Collaborative hiring and branding</CardDescription>
            <div className="mt-4 flex items-baseline text-slate-900">
              <span className="text-4xl font-extrabold tracking-tight">$99</span>
              <span className="ml-1 text-sm font-semibold text-slate-500">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">Unlimited Resumes & Teams</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">Recruiter candidate pipeline</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">White-label branding & custom domain</span>
              </div>
              <div className="flex items-center text-sm gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-600">Dedicated VIP technical assistance</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              disabled={isProcessing}
              onClick={() => handleCheckoutTrigger("enterprise")}
              className={`w-full ${
                currentTier === "enterprise"
                  ? "bg-slate-100 text-slate-800 border"
                  : "bg-slate-900 hover:bg-slate-850 text-white font-medium"
              }`}
            >
              {isProcessing && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              {currentTier === "enterprise" ? "Current Plan" : "Upgrade to Enterprise"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
