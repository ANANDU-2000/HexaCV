import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { nanoid } from "nanoid";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  FileDown,
  Layout,
  Layers,
  LogIn,
  Menu,
  Play,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Upload,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const features = [
  {
    icon: Upload,
    title: "Smart Upload",
    desc: "Drag-and-drop your existing resume. Extracts every field instantly — no server uploads, no data leaks.",
  },
  {
    icon: Sparkles,
    title: "AI Tailoring",
    desc: "Match your resume to any job description. AI suggests keywords and rephrases bullets in real time.",
  },
  {
    icon: Target,
    title: "Job Targeting",
    desc: "Scan against live job posts. See exactly where you score high and what to improve for each role.",
  },
  {
    icon: Layout,
    title: "Template Library",
    desc: "ATS-optimized layouts — classic, modern, or minimalist. 98% parser-test pass rate.",
  },
  {
    icon: FileDown,
    title: "Instant PDF Export",
    desc: "Print-ready PDF in one click. Preserves fonts, spacing, and ATS compatibility.",
  },
  {
    icon: Smartphone,
    title: "Mobile-Ready",
    desc: "Full-featured on any screen. Build, edit, and export from your phone.",
  },
];

const templates = [
  { name: "Classic", desc: "Traditional two-column", color: "from-blue-500/20 to-indigo-500/10" },
  { name: "Modern", desc: "Clean single-column", color: "from-emerald-500/20 to-teal-500/10" },
  { name: "Minimal", desc: "Typography-first", color: "from-violet-500/20 to-purple-500/10" },
  { name: "Executive", desc: "Metric-heavy", color: "from-amber-500/20 to-orange-500/10" },
];

const testimonials = [
  {
    name: "Alex Mercer",
    role: "Senior Frontend Engineer",
    initials: "AM",
    color: "from-blue-500 to-blue-600",
    text: "I was struggling to get callbacks for senior React roles. HexaCv's ATS scan showed I was missing key framework terms. After adding them, my response rate tripled.",
  },
  {
    name: "David Chen",
    role: "Cybersecurity Consultant",
    initials: "DC",
    color: "from-violet-500 to-violet-600",
    text: "Finding a builder that runs completely client-side is fantastic. All parsing happens in memory on my machine. My private data never touches a server.",
  },
  {
    name: "Sophia Reynolds",
    role: "Product Manager",
    initials: "SR",
    color: "from-emerald-500 to-emerald-600",
    text: "The keyword targeting feature is an eye-opener. It highlighted gaps I missed across multiple job descriptions. I exported a PDF that parses flawlessly.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    desc: "Perfect for getting started",
    features: ["1 resume", "ATS score check", "PDF export", "Basic templates"],
    popular: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    desc: "For serious job seekers",
    features: ["Unlimited resumes", "AI tailoring", "Job targeting scans", "All templates", "Priority support"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$29",
    period: "/mo",
    desc: "For teams & agencies",
    features: ["Everything in Pro", "Team collaboration", "API access", "Custom branding", "Dedicated support"],
    cta: "Contact Sales",
    popular: false,
  },
];

function useScrollPast(ref: React.RefObject<HTMLElement | null>) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return past;
}

function useActiveDot(containerRef: React.RefObject<HTMLDivElement | null>, itemCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const children = Array.from(el.children) as HTMLElement[];
      let closest = 0;
      let closestDist = Infinity;

      children.forEach((child, i) => {
        const rect = child.getBoundingClientRect();
        const dist = Math.abs(rect.left - el.getBoundingClientRect().left);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });

      setActiveIndex(closest);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef, itemCount]);

  return activeIndex;
}

function ensureGuestSession() {
  if (!localStorage.getItem("guest_session_id")) {
    localStorage.setItem("guest_session_id", nanoid());
  }
}

export default function Landing() {
  const { installPrompt, installApp } = usePWA();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const featuresRowRef = useRef<HTMLDivElement>(null);
  const heroPast = useScrollPast(heroRef);
  const featureDotIndex = useActiveDot(featuresRowRef, features.length);

  const handleGetStarted = () => {
    ensureGuestSession();
    setLocation("/builder");
  };

  const handleBuildFromScratch = () => {
    ensureGuestSession();
    setLocation("/builder?mode=scratch");
  };

  const navLinks = [
    { label: "Templates", href: "#templates" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-20 pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-[400px] h-[400px] bg-[#0566d9]/5 rounded-full blur-3xl -z-20 pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-20 pointer-events-none" />

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[#1e40af] flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">HexaCv</span>
          </Link>

          <div className="flex items-center gap-3">
            {installPrompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={installApp}
                className="hidden md:inline-flex gap-2 text-muted-foreground"
              >
                <Download className="w-4 h-4" strokeWidth={1.5} />
                Install
              </Button>
            )}

            {isAuthenticated ? (
              <Link href="/builder">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hidden md:inline-flex">
                  Log In
                </Button>
              </Link>
            )}

            <button
              onClick={() => setMenuOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-elevated transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen hamburger menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="max-w-7xl mx-auto px-6 h-full flex flex-col">
            <div className="flex items-center justify-between h-16 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[#1e40af] flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" strokeWidth={1.5} />
                </div>
                <span className="font-semibold text-lg text-foreground">HexaCv</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-elevated transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-foreground" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex-1 flex flex-col justify-center gap-2 max-w-sm mx-auto w-full">
              {navLinks.map((link, i) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-2xl font-semibold text-foreground py-4 hover:text-primary transition-colors border-b border-border/50"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="pb-12 space-y-3 max-w-sm mx-auto w-full">
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <Button className="w-full h-12 bg-surface-elevated hover:bg-border text-foreground border border-border font-semibold rounded-xl">
                  <LogIn className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Log In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.25)]">
                  <UserPlus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Create Account
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Start building instantly — no account needed.
              </p>
            </div>
          </div>
        </div>
      )}

      <main>
        {/* ===== HERO ===== */}
        <section ref={heroRef} className="max-w-7xl mx-auto px-6 pt-28 pb-16 md:pt-36 md:pb-24">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-medium text-primary">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              AI-Powered Resume Builder
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground">
              Build a Resume That{" "}
              <span className="bg-gradient-to-r from-primary to-[#0566d9] bg-clip-text text-transparent">
                Actually Gets You Interviews
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Upload your existing resume or build from scratch. Our AI tailors every section to the job you want —
              matching keywords, beating ATS filters, and landing you more callbacks.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" strokeWidth={1.5} />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" strokeWidth={1.5} />
                Works offline
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-primary" strokeWidth={1.5} />
                Export in seconds
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-2">
              <Button
                onClick={handleGetStarted}
                className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-primary to-[#1e40af] hover:from-primary/90 hover:to-[#1e40af]/90 text-primary-foreground font-semibold rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)] transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
              </Button>
              <Button
                onClick={handleBuildFromScratch}
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 border-border text-foreground hover:bg-surface-elevated font-semibold rounded-xl"
              >
                <Play className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Build from Scratch
              </Button>
            </div>
          </div>

          {/* Resume preview card — below the headline */}
          <div className="relative max-w-md mx-auto mt-16">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl -z-10" />

            <div className="relative transform-gpu hover:rotate-0 transition-transform duration-500">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl blur-2xl" />

              <div className="relative bg-white dark:bg-[#f8fafc] rounded-xl shadow-[0_20px_60px_rgba(59,130,246,0.25)] p-7 border border-border/30">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                  <div>
                    <div className="h-3 w-36 rounded-full bg-gray-800" />
                    <div className="h-2 w-24 rounded-full bg-gray-400 mt-2" />
                  </div>
                  <div className="h-2 w-16 rounded-full bg-primary/20" />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="h-2 w-20 rounded-full bg-gray-500" />
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-gray-300" />
                    <div className="h-2 w-3/4 rounded-full bg-gray-300" />
                    <div className="h-2 w-5/6 rounded-full bg-gray-300" />
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="h-2 w-full rounded-full bg-gray-300" />
                    <div className="h-2 w-2/3 rounded-full bg-gray-300" />
                  </div>
                </div>

                <div>
                  <div className="h-2 w-16 rounded-full bg-gray-500 mb-3" />
                  <div className="flex flex-wrap gap-2">
                    {["React", "TypeScript", "Node.js", "AWS", "Docker"].map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-primary/10 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                  <Zap className="w-3 h-3" strokeWidth={2} />
                  ATS 96%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURES — horizontal scroll with dot indicator ===== */}
        <section className="border-t border-border py-16">
          <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              Everything You Need
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Built to Get You Hired
            </h2>
          </div>

          <div
            ref={featuresRowRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none px-6 pb-4"
            style={{ scrollbarWidth: "none" }}
          >
            {features.map((f) => (
              <div
                key={f.title}
                className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-card border border-border rounded-xl p-6 hover:bg-surface-elevated transition-colors duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Dot indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  featuresRowRef.current?.children[i]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
                }}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === featureDotIndex
                    ? "w-6 h-2 bg-primary"
                    : "w-2 h-2 bg-border hover:bg-muted-foreground"
                )}
                aria-label={`Go to feature ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ===== TEMPLATES ===== */}
        <section id="templates" className="border-t border-border">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center mb-12 space-y-4">
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest">
                Professional Designs
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Choose Your Template
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Every layout is tested against real ATS engines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {templates.map((t) => (
                <div
                  key={t.name}
                  className="group relative bg-card rounded-xl border border-border overflow-hidden cursor-pointer"
                >
                  <div className="aspect-[3/4] p-4 flex flex-col">
                    <div className="flex-1 rounded-lg p-4 flex flex-col gap-2" style={{ backgroundImage: `linear-gradient(to bottom right, ${t.color})` }}>
                      <div className="h-2 w-3/4 rounded bg-foreground/20" />
                      <div className="h-2 w-1/2 rounded bg-foreground/20" />
                      <div className="flex-1 flex flex-col gap-1.5 mt-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-1.5 w-full rounded bg-foreground/10" />
                        ))}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <div className="h-3 w-12 rounded-full bg-primary/20" />
                        <div className="h-3 w-14 rounded-full bg-primary/20" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      onClick={handleGetStarted}
                      variant="outline"
                      size="sm"
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      <Play className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
                      Preview
                    </Button>
                  </div>

                  <div className="px-5 py-4 border-t border-border">
                    <h4 className="font-semibold text-sm text-foreground">{t.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="border-t border-border bg-surface-elevated/30">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center mb-12 space-y-4">
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest">
                Trusted by Professionals
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                What Our Users Say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-card rounded-xl border border-border p-6 flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary/40 text-primary/40" strokeWidth={1.5} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold",
                        t.color
                      )}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section id="pricing" className="border-t border-border">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center mb-12 space-y-4">
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest">
                Simple Pricing
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Start Free, Upgrade When You're Ready
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                All plans include a 14-day free trial.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "relative bg-card rounded-xl border p-8 flex flex-col",
                    plan.popular ? "border-primary shadow-[0_4px_20px_rgba(59,130,246,0.15)]" : "border-border"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.desc}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={handleGetStarted}
                    className={cn(
                      "w-full h-11 font-semibold rounded-xl",
                      plan.popular
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_12px_rgba(59,130,246,0.25)]"
                        : "bg-surface-elevated hover:bg-border text-foreground border border-border"
                    )}
                  >
                    {plan.cta || "Get Started"}
                    <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CLOSING CTA ===== */}
        <section className="relative overflow-hidden border-t border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-6 py-20 text-center space-y-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Ready to Land Your Next Interview?
            </h2>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Join thousands of professionals who've transformed their job search. No credit card needed.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-2">
              <Button
                onClick={handleGetStarted}
                className="h-13 px-10 bg-gradient-to-r from-primary to-[#1e40af] hover:from-primary/90 hover:to-[#1e40af]/90 text-primary-foreground font-semibold rounded-xl text-base shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)] transition-all duration-300"
              >
                Build Your Resume Free
                <ArrowRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
              </Button>
              {installPrompt && (
                <Button
                  variant="outline"
                  className="h-13 px-8 border-border text-foreground hover:bg-surface-elevated font-semibold rounded-xl text-base"
                  onClick={installApp}
                >
                  <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Install Offline App
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ===== STICKY BOTTOM CTA ===== */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border transition-transform duration-300 pb-[env(safe-area-inset-bottom)]",
          heroPast ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          <Button
            onClick={handleGetStarted}
            className="w-full h-12 bg-gradient-to-r from-primary to-[#1e40af] hover:from-primary/90 hover:to-[#1e40af]/90 text-primary-foreground font-semibold rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.3)] text-base"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="bg-surface-lowest border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[#1e40af] flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" strokeWidth={1.5} />
                </div>
                <span className="font-semibold text-lg text-foreground">HexaCv</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                AI-powered resume builder that runs entirely in your browser. Build, tailor, and export — no data ever leaves your machine.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-5">Product</h4>
              <ul className="space-y-3">
                {[
                  { label: "Templates", href: "#templates" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Changelog", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-5">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: "HexaStack Solutions", href: "https://www.hexastacksolutions.com/" },
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Service", href: "#" },
                  { label: "Contact", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} HexaStack Solutions. Crafted by Surag & Anandu Krishna.</p>
            <a
              href="https://www.hexastacksolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors font-medium"
            >
              www.hexastacksolutions.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
