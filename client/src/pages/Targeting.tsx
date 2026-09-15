import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/shared/ui/button";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { loadEntryDraft } from "@/lib/entryDraft";
import {
  loadTargetDraft,
  saveTargetDraft,
} from "@/lib/targetDraft";
import { FloatingLabelInput, FloatingLabelTextarea } from "@/shared/ui/floating-field";
import { toast } from "sonner";
import PipelineLoader from "@/components/PipelineLoader";
import SiteHeader from "@/shared/layout/SiteHeader";
import SiteFooter from "@/shared/layout/SiteFooter";
import { ALL_COUNTRIES } from "@shared/countriesData";
import { countryCodeToMarket } from "@/lib/resumeSections";

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
  // Phase 5 — target country code (ISO alpha-2) replaces the hardcoded India/Gulf toggle.
  // Empty string = "Skip for now" (backward-compatible; pipeline treats "" as global).
  const [targetCountryCode, setTargetCountryCode] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);
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
    const d = loadTargetDraft();
    if (!d) return;
    if (d.role) setRole(d.role);
    if (d.jobDescription) {
      setJd(d.jobDescription);
      setJdOpen(true);
    }
    // Restore a saved target country code (Phase 5); keep the legacy
    // market→code mapping so older drafts still prefill.
    setTargetCountryCode(d.targetCountryCode || marketToTargetCountryCode(d.market) || "");
  }, []);

  // Legacy market alias → target country code (Gulf → AE as primary).
  const marketToTargetCountryCode = (m?: string) =>
    m === "India" ? "IN" : m === "Gulf" ? "AE" : m === "US" ? "US" : "";

  // Backward-compat market string derived from the chosen target country.
  const effectiveMarket =
    (targetCountryCode && countryCodeToMarket(targetCountryCode)) || "Global";

  const flushTargetDraft = () => {
    saveTargetDraft({
      role,
      targetCountryCode: targetCountryCode || undefined,
      market: effectiveMarket,
      jobDescription: jd,
    });
  };

  const selectedCountry = ALL_COUNTRIES.find((c) => c.code === targetCountryCode);
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    return q
      ? ALL_COUNTRIES.filter(
          (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        ).slice(0, 40)
      : ALL_COUNTRIES.slice(0, 40);
  }, [countryQuery]);

  const continueAsGuest = () => {
    if (!role.trim()) {
      toast.error("Enter a target role");
      return;
    }
    flushTargetDraft();

    const draft = loadEntryDraft();
    const parsed = draft?.parsed as Record<string, unknown> | undefined;

    // Next stage after targeting is the editor — hand off like the AI pipeline does,
    // using the guest's on-device entry draft (no cloud AI / sign-in required yet).
    if (parsed && typeof parsed === "object") {
      const header =
        parsed.header && typeof parsed.header === "object"
          ? { ...(parsed.header as Record<string, unknown>) }
          : {};
      const result = {
        ...parsed,
        header: {
          ...header,
          jobTitle: role.trim(),
          targetRole: role.trim(),
        },
      };
      try {
        sessionStorage.setItem(
          "hexacv_pipeline_result",
          JSON.stringify({
            result,
            role,
            region: effectiveMarket,
            targetCountryCode: targetCountryCode || undefined,
            jd,
            buildId: null,
          })
        );
      } catch {
        toast.error("Could not open your draft. Try again.");
        return;
      }
      setLocation(
        `/builder/ai?fromPipeline=1&role=${encodeURIComponent(role.trim())}`
      );
      return;
    }

    if (draft?.rawText?.trim()) {
      // Pasted text without structured parse — continue in scratch with target prefilled.
      setLocation("/builder/scratch");
      return;
    }

    toast.message("Upload or paste your experience first, then continue.");
    setLocation("/");
  };

  useEffect(() => {
    const t = setTimeout(() => {
      flushTargetDraft();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flush reads latest role/country/jd
  }, [role, targetCountryCode, jd]);

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
        const build = await startBuild.mutateAsync({ role, region: effectiveMarket });
        id = build.id;
        setBuildId(id);
      }
      const result = await generate.mutateAsync({
        jobTitle: role.trim(),
        experienceDetails: experienceDetails(),
        market: effectiveMarket,
        targetCountryCode: targetCountryCode || undefined,
        jobDescription: jd.trim() || undefined,
        buildId: id,
      });
      await utils.credits.getBalance.invalidate();
      // Stash result for ResumeBuilder to pick up
      try {
        sessionStorage.setItem(
          "hexacv_pipeline_result",
          JSON.stringify({
            result,
            role,
            region: effectiveMarket,
            targetCountryCode: targetCountryCode || undefined,
            jd,
            buildId: id,
          })
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
      // Flush before navigate so a pending 300ms debounce does not drop role/JD.
      flushTargetDraft();
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
        region={effectiveMarket}
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
        region={effectiveMarket}
        localPhase="extract"
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <SiteHeader />
      <div className="mx-auto w-full max-w-[640px] flex-1 px-4 pb-40 pt-10 sm:pb-28">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Who are you applying to?
        </h1>
        <p className="mt-2 text-muted-foreground">
          One role, an optional job description, and a target country. That is all we need.
        </p>

        {/* Target country (Phase 5) — full master country list, optional */}
        <div className="mt-8">
          <p className="mb-2 text-sm font-medium text-foreground">
            Target country{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (optional — used for ATS formatting, not auto-filled)
            </span>
          </p>
          {targetCountryCode && selectedCountry ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span aria-hidden="true">{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {selectedCountry.code}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-muted"
                  onClick={() => setShowCountryList(true)}
                >
                  Change
                </button>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  onClick={() => {
                    setTargetCountryCode("");
                    setCountryQuery("");
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="min-h-11 flex-1 rounded-xl border border-border bg-card px-3 text-left text-sm text-muted-foreground hover:border-primary/40"
                onClick={() => setShowCountryList((v) => !v)}
              >
                {showCountryList
                  ? "Search countries…"
                  : "Pick a target country or search…"}
              </button>
              {!showCountryList && (
                <button
                  type="button"
                  className="min-h-11 shrink-0 rounded-xl border border-border bg-card px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setTargetCountryCode("")}
                >
                  Skip for now
                </button>
              )}
            </div>
          )}

          {showCountryList && (
            <div className="mt-2 rounded-xl border border-border bg-card p-2">
              <input
                autoFocus
                value={countryQuery}
                onChange={(e) => setCountryQuery(e.target.value)}
                placeholder="Search 250+ countries (e.g. UAE, Germany, Canada)…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <ul className="mt-2 max-h-56 overflow-y-auto">
                {filteredCountries.length === 0 && (
                  <li className="px-3 py-2 text-sm text-muted-foreground">
                    No country matches “{countryQuery}”.
                  </li>
                )}
                {filteredCountries.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      className="flex min-h-9 w-full items-center justify-between px-3 text-left text-sm hover:bg-muted"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setTargetCountryCode(c.code);
                        setCountryQuery("");
                        setShowCountryList(false);
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true">{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{c.code}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Your selection only tunes wording/formatting guidance — it never invents local
            experience, visas, salary, or certifications.
          </p>
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
        <div className="mt-10 hidden space-y-3 sm:block">
          <Button
            className="min-h-12 w-full rounded-[18px] bg-accent-warm text-base font-semibold text-white hover:bg-accent-warm/90"
            disabled={!role.trim() || paying || generate.isPending}
            onClick={() => void onCta()}
          >
            {paying ? "Opening payment…" : ctaLabel}
          </Button>
          {!isAuthenticated && (
            <Button
              type="button"
              variant="outline"
              className="min-h-12 w-full rounded-[18px] border-border bg-card font-semibold text-foreground"
              disabled={!role.trim() || paying || generate.isPending}
              onClick={continueAsGuest}
            >
              Continue as guest
            </Button>
          )}
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 space-y-2 border-t border-border bg-background/95 p-4 backdrop-blur sm:hidden">
        <Button
          className="min-h-12 w-full rounded-[18px] bg-accent-warm text-base font-semibold text-white hover:bg-accent-warm/90"
          disabled={!role.trim() || paying || generate.isPending}
          onClick={() => void onCta()}
        >
          {paying ? "Opening payment…" : ctaLabel}
        </Button>
        {!isAuthenticated && (
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full rounded-[18px] border-border bg-card font-semibold text-foreground"
            disabled={!role.trim() || paying || generate.isPending}
            onClick={continueAsGuest}
          >
            Continue as guest
          </Button>
        )}
      </div>

      {/* Confirm & Pay screen (Flow A step 7) */}
      {confirmPayOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background font-sans"
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
                {role.trim() || "Untitled role"} · {effectiveMarket}
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
      <div className="pb-20 sm:pb-0">
        <SiteFooter />
      </div>
    </div>
  );
}
