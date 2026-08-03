import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/shared/ui/button";
import {
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { loadEntryDraft } from "@/lib/entryDraft";
import { FloatingLabelInput, FloatingLabelTextarea } from "@/shared/ui/floating-field";
import { toast } from "sonner";
import PipelineLoader from "@/components/PipelineLoader";

const TARGET_DRAFT_KEY = "hexacv_target_panel_draft";

const STATIC_ROLES = [
  "Site Engineer",
  "Civil Engineer",
  "Accounts Manager",
  "Senior Accountant",
  "Sales Executive",
  "HR Executive",
  "Software Engineer",
  "Full Stack Developer",
  "Project Manager",
  "Quantity Surveyor",
  "Electrical Engineer",
  "Nurse",
  "Teacher",
  "Digital Marketing Executive",
  "Business Analyst",
];

type Region = "India" | "Gulf";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Targeting() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [region, setRegion] = useState<Region>("India");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [jdOpen, setJdOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [building, setBuilding] = useState(false);
  const [buildId, setBuildId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);

  const balanceQuery = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const startBuild = trpc.resume.startBuild.useMutation();
  const generate = trpc.ai.generateFullResume.useMutation();
  const createCheckout = trpc.billing.createCheckoutSession.useMutation();
  const verifyPayment = trpc.billing.verifyRazorpayPayment.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TARGET_DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as {
        role?: string;
        market?: string;
        jobDescription?: string;
      };
      if (d.role) setRole(d.role);
      if (d.jobDescription) {
        setJd(d.jobDescription);
        setJdOpen(true);
      }
      if (d.market === "Gulf" || d.market === "India") setRegion(d.market);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          TARGET_DRAFT_KEY,
          JSON.stringify({
            role,
            market: region,
            jobDescription: jd,
          })
        );
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [role, region, jd]);

  const suggestions = useMemo(() => {
    const q = role.trim().toLowerCase();
    if (q.length < 3) return [];
    const draft = loadEntryDraft();
    const experienceHint = JSON.stringify(draft?.parsed || draft?.rawText || "").toLowerCase();
    const ranked = STATIC_ROLES.filter((r) => r.toLowerCase().includes(q)).map((r) => {
      const basedOnExperience =
        experienceHint.length > 20 &&
        r
          .toLowerCase()
          .split(" ")
          .some((w) => w.length > 3 && experienceHint.includes(w));
      return { role: r, basedOnExperience };
    });
    ranked.sort((a, b) => Number(b.basedOnExperience) - Number(a.basedOnExperience));
    return ranked.slice(0, 6);
  }, [role]);

  const balance = balanceQuery.data?.balance ?? 0;
  const ctaLabel = !isAuthenticated
    ? "Sign in to build your resume"
    : balanceQuery.data?.ctaLabel ||
      (balance > 0 ? "Build my resume — free" : "Build my resume — ₹99");

  const experienceDetails = (): string => {
    const draft = loadEntryDraft();
    if (draft?.rawText) return draft.rawText;
    if (draft?.parsed) return JSON.stringify(draft.parsed);
    return role;
  };

  const runPipeline = async (existingBuildId?: string) => {
    setBuilding(true);
    try {
      let id = existingBuildId;
      if (!id) {
        const build = await startBuild.mutateAsync({ role, region });
        id = build.id;
        setBuildId(id);
      }
      const result = await generate.mutateAsync({
        jobTitle: role.trim(),
        experienceDetails: experienceDetails(),
        market: region,
        jobDescription: jd.trim() || undefined,
        buildId: id,
      });
      await utils.credits.getBalance.invalidate();
      // Stash result for ResumeBuilder to pick up
      try {
        sessionStorage.setItem(
          "hexacv_pipeline_result",
          JSON.stringify({ result, role, region, jd, buildId: id })
        );
      } catch {
        /* ignore */
      }
      setLocation(`/builder/ai?fromPipeline=1&role=${encodeURIComponent(role)}`);
    } catch (e: any) {
      const msg = e?.message || "Generation failed";
      if (String(msg).includes("PAYMENT_REQUIRED") || String(msg).includes("₹99")) {
        toast.error("No credits left — complete payment to continue.");
        setBuilding(false);
        setBuildId(null);
        await payForBuild();
        return;
      }
      toast.error(msg);
      setBuilding(false);
      setBuildId(null);
    }
  };

  const payForBuild = async () => {
    setConfirmPayOpen(false);
    setPaying(true);
    try {
      const order = await createCheckout.mutateAsync({ tier: "build" });
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        // Sandbox auto-verify when script missing
        if (order.sandbox) {
          await verifyPayment.mutateAsync({
            orderId: order.orderId,
            paymentId: `pay_mock_${Date.now()}`,
            signature: "sandbox",
          });
          await utils.credits.getBalance.invalidate();
          toast.success("Payment recorded — 1 build credit added.");
          setPaying(false);
          await runPipeline();
          return;
        }
        toast.error("Could not load Razorpay. Try again.");
        setPaying(false);
        return;
      }
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "HexaCv",
        description: "1 resume build — ₹99",
        order_id: order.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment.mutateAsync({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            await utils.credits.getBalance.invalidate();
            toast.success("Payment successful — building your resume.");
            setPaying(false);
            await runPipeline();
          } catch (err: any) {
            toast.error(err?.message || "Payment verification failed");
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.message("Payment closed — your draft is saved.");
          },
        },
        prefill: { name: user?.name || "", email: user?.email || "" },
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e?.message || "Could not start payment");
      setPaying(false);
    }
  };

  const onCta = async () => {
    if (!role.trim()) {
      toast.error("Enter a target role");
      return;
    }
    // "Sign in only when you build" — guests can fill the form but must sign in to build.
    if (!isAuthenticated) {
      setLocation("/login?redirect=/builder/target&convert=true");
      return;
    }
    if (balance > 0) {
      await runPipeline();
    } else {
      setConfirmPayOpen(true);
    }
  };

  if (building && buildId) {
    return (
      <PipelineLoader
        buildId={buildId}
        role={role}
        region={region}
        onRetry={() => runPipeline(buildId)}
        failed={generate.isError}
        errorMessage={generate.error?.message}
      />
    );
  }

  if (building) {
    return (
      <PipelineLoader
        buildId={null}
        role={role}
        region={region}
        localPhase="extract"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-28 pt-10" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="mx-auto w-full max-w-[640px]">
        <Link href="/" className="mb-8 flex items-center gap-2 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold text-primary">HexaCv</span>
        </Link>

        <h1 className="font-display text-3xl font-semibold text-foreground">
          Who are you applying to?
        </h1>
        <p className="mt-2 text-muted-foreground">
          One role, optional job description, and your region. That is all we need.
        </p>

        {/* Region segmented control */}
        <div className="mt-8">
          <p className="mb-2 text-sm font-medium text-foreground">Region</p>
          <div className="flex rounded-xl border border-border bg-card p-1">
            {(["India", "Gulf"] as Region[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`min-h-11 flex-1 rounded-lg text-sm font-semibold transition-colors ${
                  region === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setRegion(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Role */}
        <div className="relative mt-6">
          <FloatingLabelInput
            id="target-role"
            label="Target role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="bg-card"
            wrapClassName="w-full"
            style={{ fontFamily: "var(--font-sans)" }}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-sm">
              {suggestions.map((s) => (
                <li key={s.role}>
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between px-3 text-left text-sm hover:bg-muted"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setRole(s.role);
                      setShowSuggestions(false);
                    }}
                  >
                    <span>{s.role}</span>
                    {s.basedOnExperience && (
                      <span className="text-xs text-muted-foreground">based on your experience</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* JD expander */}
        <div className="mt-6">
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
            onClick={() => setJdOpen((v) => !v)}
          >
            {jdOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            + Paste job description (recommended)
          </button>
          {jdOpen && (
            <>
              <FloatingLabelTextarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                label="Paste the job description"
                wrapClassName="mt-2 w-full"
                className="bg-card text-sm"
                style={{ fontFamily: "var(--font-sans)" }}
              />
              {!jd.trim() && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Adding a JD usually improves keyword match — you can skip this.
                </p>
              )}
            </>
          )}
        </div>

        {/* Desktop CTA */}
        <div className="mt-10 hidden sm:block">
          <Button
            className="min-h-12 w-full rounded-[18px] bg-accent-warm text-base font-semibold text-white hover:bg-accent-warm/90"
            disabled={!role.trim() || paying || generate.isPending}
            onClick={() => void onCta()}
          >
            {paying ? "Opening payment…" : ctaLabel}
          </Button>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur sm:hidden">
        <Button
          className="min-h-12 w-full rounded-[18px] bg-accent-warm text-base font-semibold text-white hover:bg-accent-warm/90"
          disabled={!role.trim() || paying || generate.isPending}
          onClick={() => void onCta()}
        >
          {paying ? "Opening payment…" : ctaLabel}
        </Button>
      </div>

      {/* Confirm & Pay screen (Flow A step 7) */}
      {confirmPayOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background"
          style={{ fontFamily: "var(--font-sans)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm payment"
        >
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <button
              type="button"
              onClick={() => setConfirmPayOpen(false)}
              aria-label="Go back"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-muted-foreground">
              {user?.name?.split(" ")[0] || "Guest"}
            </span>
          </header>

          <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Confirm &amp; Pay
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              One build credit for a resume tailored to this role.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resume
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {role.trim() || "Untitled role"} · {region}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="font-display text-lg font-semibold text-foreground">
                  ₹99{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (Inclusive of taxes)
                  </span>
                </span>
              </div>
            </div>

            <Button
              type="button"
              className="mt-6 min-h-12 w-full rounded-[18px] bg-accent-warm text-base font-semibold text-white hover:bg-accent-warm/90"
              disabled={paying}
              onClick={() => void payForBuild()}
            >
              {paying ? "Opening payment…" : "Pay Securely with Razorpay"}
            </Button>

            <div className="mt-6 space-y-2.5">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                Encrypted checkout · UPI, cards, net banking
              </p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                No credit used if the build fails
              </p>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
