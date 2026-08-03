import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import {
  Layers, Menu, X, ArrowRight, Linkedin, Upload, Pencil, FileText,
} from "lucide-react";
import HowItWorksStrip from "@/components/landing/HowItWorksStrip";
import GroundingProof from "@/components/landing/GroundingProof";
import OutputPreviewRow from "@/components/landing/OutputPreviewRow";
import PricingTeaser from "@/components/landing/PricingTeaser";
import LandingFaq from "@/components/landing/LandingFaq";
import { trpc } from "@/lib/trpc";
import {
  createDraftId,
  saveEntryDraft,
  summarizeParsed,
  type EntryDraft,
} from "@/lib/entryDraft";

const footerLinks = {
  product: [
    { label: "Resume Builder", href: "/builder/target" },
    { label: "Pricing", href: "/pricing" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Refund Policy", href: "/refund" },
  ],
};

export default function Landing() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mode, setMode] = useState<"idle" | "upload" | "scratch">("idle");
  const [pasteText, setPasteText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EntryDraft | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseMutation = trpc.resume.parse.useMutation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const persistDraft = useCallback((next: EntryDraft) => {
    saveEntryDraft(next);
    setDraft(next);
  }, []);

  const handleFile = async (file: File) => {
    setParseError(null);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx") && !lower.endsWith(".doc")) {
      setParseError("Please upload a PDF or DOCX file.");
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      const parsed = await parseMutation.mutateAsync({
        filename: file.name,
        base64,
      });
      const summary = summarizeParsed(parsed);
      const next: EntryDraft = {
        id: createDraftId(),
        source: "upload",
        filename: file.name,
        parsed,
        name: summary.name,
        sectionsFound: summary.sectionsFound,
        createdAt: new Date().toISOString(),
      };
      persistDraft(next);
    } catch {
      setParseError(
        "We couldn't read text from this PDF — try 'Start fresh' and paste it instead."
      );
    }
  };

  const handlePasteContinue = () => {
    const text = pasteText.trim();
    if (!text) return;
    setParseError(null);
    const next: EntryDraft = {
      id: createDraftId(),
      source: "paste",
      rawText: text,
      sectionsFound: ["Pasted text"],
      createdAt: new Date().toISOString(),
    };
    persistDraft(next);
  };

  const handleContinue = () => {
    if (!draft) return;
    if (isAuthenticated) {
      setLocation("/builder/review-draft");
    } else {
      setLocation("/login?redirect=/builder/review-draft&convert=true");
    }
  };

  const navLinks = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "/pricing" },
  ];

  const nav = (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/92 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-8" style={{ maxWidth: 1280 }}>
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary" aria-hidden="true">
            <Layers className="h-4 w-4 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-primary">
            HexaCv
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!isAuthenticated ? (
            <Link href="/login" className="no-underline">
              <Button variant="ghost" className="min-h-11 text-foreground">
                Log in
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/dashboard" className="no-underline">
                <Button variant="outline" className="min-h-11 rounded-lg border-border">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" className="min-h-11 text-muted-foreground" onClick={() => logout()}>
                Sign out
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center md:hidden"
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );

  return (
    <div className="bg-background text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
      {nav}

      {menuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-border bg-background p-4 md:hidden">
          <div className="flex flex-col gap-3">
            {!isAuthenticated ? (
              <Link href="/login" className="no-underline" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full min-h-11">Log in</Button>
              </Link>
            ) : (
              <Link href="/dashboard" className="no-underline" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full min-h-11">Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <main style={{ paddingTop: 64 }}>
        <section aria-label="Hero" className="relative overflow-hidden">
          <div
            className="relative mx-auto px-4 sm:px-8"
            style={{ maxWidth: 1280, paddingTop: 48, paddingBottom: 64 }}
          >
            <div className="grid items-start gap-10 lg:grid-cols-[55%_45%]">
              <div>
                <h1
                  className="font-display font-semibold leading-tight text-foreground"
                  style={{
                    fontSize: "clamp(1.75rem, 4.5vw, 3rem)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Built for the job you actually applied to
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Rewritten from your real experience. Nothing invented. First resume free —
                  then ₹99 per build. No subscription.
                </p>

                {/* Pricing strip — above cards on mobile priority */}
                <p className="mt-5 inline-flex rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground">
                  ₹99 per resume, first one free — no subscription
                </p>

                <div className="mt-6 flex flex-col gap-4">
                  {/* Card A — Upload */}
                  <div
                    className={`rounded-2xl border bg-card p-5 transition-colors ${
                      dragging ? "border-primary" : "border-border"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) void handleFile(file);
                    }}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start gap-4 text-left"
                      onClick={() => {
                        setMode("upload");
                        fileInputRef.current?.click();
                      }}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Upload className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-semibold text-foreground">
                          Upload your resume
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          PDF or DOCX — drag and drop or click to browse
                        </p>
                      </div>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFile(file);
                      }}
                    />
                    {parseMutation.isPending && mode === "upload" && (
                      <p className="mt-3 text-sm text-muted-foreground">Reading your file…</p>
                    )}
                    {parseError && (
                      <p className="mt-3 text-sm text-[color:var(--destructive)]" role="alert">
                        {parseError}
                      </p>
                    )}
                  </div>

                  {/* Card B — Start fresh */}
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <button
                      type="button"
                      className="flex w-full items-start gap-4 text-left"
                      onClick={() => setMode((m) => (m === "scratch" ? "idle" : "scratch"))}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Pencil className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-semibold text-foreground">
                          Start from scratch
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Paste your experience text and we will structure it
                        </p>
                      </div>
                    </button>

                    {mode === "scratch" && (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={pasteText}
                          onChange={(e) => setPasteText(e.target.value)}
                          placeholder="Paste your experience, education, and skills…"
                          className="min-h-[160px] w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                          style={{ fontFamily: "var(--font-sans)" }}
                        />
                        <Button
                          type="button"
                          disabled={!pasteText.trim()}
                          className="min-h-11 w-full rounded-[18px] bg-primary text-primary-foreground"
                          onClick={handlePasteContinue}
                        >
                          Use this text
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {draft && (
                  <div className="mt-6 rounded-2xl border border-[color:var(--success)]/30 bg-card p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-5 w-5 text-[color:var(--success)]" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {draft.name
                            ? `We found: ${draft.name}`
                            : draft.filename
                              ? `Ready: ${draft.filename}`
                              : "Your draft is ready"}
                        </p>
                        {draft.sectionsFound && draft.sectionsFound.length > 0 && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Sections: {draft.sectionsFound.join(", ")}
                          </p>
                        )}
                        <Button
                          type="button"
                          className="mt-3 min-h-11 rounded-[18px] bg-accent-warm font-semibold text-white hover:bg-accent-warm/90"
                          onClick={handleContinue}
                        >
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="mt-5 text-sm text-muted-foreground">
                  {isAuthenticated
                    ? `Signed in as ${user?.name?.split(" ")[0] || "you"}.`
                    : "No account needed to upload or paste — sign in only when you build."}
                </p>
              </div>

              {/* Desktop hero preview */}
              <div className="hidden lg:block">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sample resume preview
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-foreground">
                    <p className="font-display text-xl font-semibold">Priya Nair</p>
                    <p className="text-muted-foreground">Site Engineer · Dubai / Kochi</p>
                    <ul className="mt-4 space-y-2 text-muted-foreground">
                      <li className="rounded-lg border border-border bg-background px-3 py-2">
                        Led site coordination for a 120-unit residential project
                        <span className="mt-1 block text-xs text-primary">
                          rewritten for: Site Engineer, Dubai
                        </span>
                      </li>
                      <li className="rounded-lg border border-border bg-background px-3 py-2">
                        Managed contractor schedules and material tracking
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <HowItWorksStrip />
        <GroundingProof />
        <OutputPreviewRow />
        <PricingTeaser />
        <LandingFaq />

        <section aria-label="Call to action" className="relative bg-primary">
          <div className="mx-auto px-4 py-16 text-center sm:px-8" style={{ maxWidth: 640 }}>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Start with what you already have
            </h2>
            <p className="mt-3 text-base text-white/80">
              Upload a resume or paste your experience. First build free — then ₹99. No subscription.
            </p>
            <div className="mx-auto mt-8 w-full max-w-sm">
              <Button
                size="lg"
                className="w-full min-h-11 rounded-[18px] bg-accent-warm px-7 py-4 font-bold text-white hover:bg-accent-warm/90"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Build your resume
                <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.75} />
              </Button>
            </div>
          </div>
        </section>

        <footer aria-label="Site footer" className="bg-[color:var(--ink)]">
          <div className="mx-auto px-4 py-12 sm:px-8" style={{ maxWidth: 1280 }}>
            <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-10 sm:grid-cols-3">
              <div className="flex flex-col gap-3">
                <span className="font-display text-lg font-semibold text-white">HexaCv</span>
                <p className="max-w-[280px] text-sm leading-relaxed text-white/60">
                  Grounded resume AI for Gulf &amp; India job seekers. Built by HexaStack Solutions.
                </p>
              </div>
              <div>
                <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-accent-warm">
                  Product
                </h4>
                <div className="flex flex-col gap-3">
                  {footerLinks.product.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-sm font-medium text-white/60 no-underline hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-accent-warm">
                  Legal
                </h4>
                <div className="flex flex-col gap-3">
                  {footerLinks.legal.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-sm font-medium text-white/60 no-underline hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-white/40 sm:flex-row">
              <p>© {new Date().getFullYear()} HexaStack Solutions. All rights reserved.</p>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="HexaStack on LinkedIn"
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-white/50"
              >
                <Linkedin className="h-4 w-4" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
