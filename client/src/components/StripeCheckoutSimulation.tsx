import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Check, ShieldCheck, Lock, CreditCard, ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function StripeCheckoutSimulation() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [cardName, setCardName] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Extract tier from query parameters
  const params = new URLSearchParams(window.location.search);
  const tier = params.get("tier") || "pro";

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.name) {
      setCardName(user.name);
    }
  }, [user]);

  const price = tier === "enterprise" ? 99 : tier === "pro" ? 19 : 0;
  const planName = tier === "enterprise" ? "Corporate Enterprise" : tier === "pro" ? "Premium Pro" : "Basic Free";

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCVC || !cardName || !zipCode) {
      toast.error("Please fill in all credit card details.");
      return;
    }

    setIsProcessing(true);
    // Simulated checkout must not write subscription tiers — that was a free-upgrade hole.
    // Real upgrades go through Stripe webhook; manual grants are admin-only.
    setTimeout(() => {
      setIsProcessing(false);
      toast.error(
        "Test checkout cannot change your plan. Configure Stripe for real payments, or ask an admin to grant a subscription."
      );
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Left Pane - Product Details */}
      <div className="flex-1 bg-slate-900 text-white p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
        <div>
          <button
            onClick={() => setLocation("/dashboard/billing")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-semibold mb-12 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to HexaCv
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">HexaCv</span>
          </div>

          <div className="space-y-2">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Subscribe to</span>
            <h1 className="text-4xl font-extrabold tracking-tight">{planName}</h1>
            <div className="flex items-baseline mt-4">
              <span className="text-5xl font-extrabold">${price}.00</span>
              <span className="text-slate-400 font-medium ml-2">/ month</span>
            </div>
          </div>

          <div className="mt-12 space-y-4 border-t border-slate-850 pt-8">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Included in this plan:</h3>
            <div className="space-y-3">
              {tier === "pro" ? (
                <>
                  <div className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-slate-300">Up to 10 resume drafts simultaneously</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-slate-300">Unlimited AI experience bullets optimizers</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-slate-300">Full ATS keyword matching scores</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">Unlimited resumes, templates and teams</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">White-labeled domain & subdomain configurations</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">Active Recruiter Pipeline vacancies listings</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 text-xs text-slate-500 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Guaranteed Secure Checkout
          </div>
          <p>Powered by Stripe checkout system integrations. Transactions are simulated.</p>
        </div>
      </div>

      {/* Right Pane - Checkout Payment Form */}
      <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-center">
        <form onSubmit={handlePay} className="max-w-md w-full mx-auto space-y-6 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Payment details</h2>
            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-amber-200">
              Test Mode
            </span>
          </div>

          {/* Email field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@example.com"
              required
            />
          </div>

          {/* Credit Card Container */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Card details</label>
              <div className="relative">
                <Input
                  type="text"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                  placeholder="4242 4242 4242 4242"
                  className="pr-10"
                  required
                />
                <CreditCard className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Expiry Date</label>
                <Input
                  type="text"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">CVC</label>
                <Input
                  type="password"
                  maxLength={3}
                  value={cardCVC}
                  onChange={(e) => setCardCVC(e.target.value)}
                  placeholder="123"
                  required
                />
              </div>
            </div>
          </div>

          {/* Cardholder name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Name on card</label>
            <Input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Cardholder full name"
              required
            />
          </div>

          {/* Zip/Postal */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">ZIP / Postal Code</label>
            <Input
              type="text"
              maxLength={10}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="94103"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-sm shadow-lg shadow-blue-600/10 cursor-pointer gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing authorization...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Subscribe to {planName}
              </>
            )}
          </Button>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            By subscribing, you authorize HexaCv to charge your test card. You may cancel at any time in your billing portal.
          </p>
        </form>
      </div>
    </div>
  );
}
