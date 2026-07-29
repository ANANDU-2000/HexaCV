import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useAuth } from '@/_core/hooks/useAuth';
import { Link } from 'wouter';
import {
  FileText, Upload, Sparkles, Layers, Zap, Shield, Target, Star,
  Menu, X, ChevronRight, ArrowRight, Check, Download, CheckCircle2,
  BarChart3, Users, Clock, Globe, Quote, Brain, Search, BookOpen,
  Linkedin, Github, Twitter, Mail, Bot,
} from 'lucide-react';

// ──────────────────────────── Color Palette ────────────────────────────
const T = {
  bg: '#f8fafc',
  surface: '#ffffff',
  elevated: '#f1f5f9',
  primary: '#1e40af',
  primaryLight: '#3b82f6',
  primaryDark: '#1e3a8a',
  accent: '#ea580c',
  accentLight: '#f97316',
  text: '#0f172a',
  muted: '#475569',
  lightMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
  error: '#dc2626',
};

// ──────────────────────────── Data ────────────────────────────
const features = [
  {
    icon: Upload,
    title: 'Smart Resume Parser',
    desc: 'Upload PDF, DOCX, or TXT — our engine extracts every section accurately. No more retyping your old resume.',
    benefit: 'Save hours of manual data entry',
  },
  {
    icon: Target,
    title: 'ATS Keyword Alignment',
    desc: 'Score your resume against any job description. See exactly which keywords match and what you\'re missing.',
    benefit: 'Pass automated filters with confidence',
  },
  {
    icon: Sparkles,
    title: 'AI Rewrite Assistant',
    desc: 'Rephrase bullet points to be clearer and more impactful — without inventing facts or hallucinating.',
    benefit: 'Professional language, zero fabrication',
  },
  {
    icon: Layers,
    title: 'Professional Templates',
    desc: 'Multiple ATS-friendly designs crafted for real hiring systems. Each template tested for machine readability.',
    benefit: 'Look great to both humans and bots',
  },
  {
    icon: Zap,
    title: 'Instant PDF Export',
    desc: 'Export pixel-perfect PDFs directly from your browser. No server round-trip, no waiting.',
    benefit: 'Download in one click',
  },
  {
    icon: Shield,
    title: '100% Private & Offline',
    desc: 'All processing stays on your device. Works offline as a PWA. Your data never leaves your computer.',
    benefit: 'Complete privacy guarantee',
  },
];

const steps = [
  { number: '01', icon: Upload, title: 'Upload or Start Fresh', desc: 'Drag-and-drop your existing PDF/DOCX resume, or build one from scratch with our guided step builder.' },
  { number: '02', icon: Bot, title: 'Let AI Optimize It', desc: 'Our engine parses your content, scores it against your target job, and suggests improvements — no hallucinations, no filler.' },
  { number: '03', icon: Download, title: 'Export & Apply', desc: 'Download an ATS-friendly PDF, share a link, or keep editing. Your resume, your control.' },
];

const stats = [
  { icon: BarChart3, value: '10,000+', label: 'Resumes Built' },
  { icon: Star, value: '4.8/5', label: 'User Rating' },
  { icon: Clock, value: '< 5 min', label: 'Time to First Resume' },
  { icon: Globe, value: '95%', label: 'ATS Pass Rate' },
];

const testimonials = [
  {
    quote: 'HexaCv helped me identify exactly what keywords I was missing for my target roles. I got an interview call within a week of optimizing my resume.',
    name: 'Priya Sharma',
    role: 'Software Engineer at Google',
    rating: 5,
  },
  {
    quote: 'The AI rewrite assistant is incredible — it improves your phrasing without making up fake achievements. Finally, a resume tool I can trust.',
    name: 'Rahul Verma',
    role: 'Product Manager at Microsoft',
    rating: 5,
  },
  {
    quote: 'I applied to 30+ jobs with my old resume and heard nothing. After using HexaCv\'s ATS alignment, I got 5 callbacks in 2 weeks.',
    name: 'Ananya Patel',
    role: 'Data Scientist at Amazon',
    rating: 5,
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Resume upload & parsing',
      '3 saved drafts',
      'ATS keyword scoring',
      'PDF export',
      'Basic templates',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    features: [
      'Everything in Free',
      'Unlimited saved resumes',
      'AI rewrite assistant',
      'Advanced ATS audit',
      'Premium templates',
      'Cover letter generator',
      'LinkedIn optimization',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Recruiter dashboard',
      'API access',
      'Custom templates',
      'Priority support',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const footerLinks = {
  product: ['Resume Builder', 'ATS Scanner', 'Pricing', 'Templates'],
  company: ['About Us', 'Blog', 'Careers', 'Contact'],
  legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
};

// ──────────────────────────── Component ────────────────────────────
export default function Landing() {
  const { installPrompt, installApp } = usePWA();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSubscribed, setEmailSubscribed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Pricing', href: '#pricing' },
  ];

  const handleSubscribe = () => {
    if (emailInput.trim()) {
      setEmailSubscribed(true);
      setEmailInput('');
      setTimeout(() => setEmailSubscribed(false), 3000);
    }
  };

  // ─── NAV ───────────────────────────────────────────────────────
  const nav = (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: scrolled ? 'rgba(248,250,252,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${T.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div className="mx-auto flex items-center justify-between px-4 sm:px-8 h-16" style={{ maxWidth: 1280 }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #1e40af, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Layers style={{ color: '#fff' }} className="w-4 h-4" />
          </div>
          <span className="text-lg font-extrabold tracking-tight" style={{ color: T.text }}>HexaCv</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navLinks.map(link => (
            <a key={link.label} href={link.href}
              style={{ color: T.muted, fontSize: 14 }}
              className="hover:text-orange-500 transition-colors font-medium no-underline"
            >{link.label}</a>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: T.text }}>
                {user?.name || user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => logout()}
                style={{ borderRadius: 8, borderColor: T.border, color: T.text, fontSize: 13 }}
                className="font-medium"
              >Log out</Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm"
                style={{ color: T.muted, fontSize: 13 }}
                className="font-medium no-underline"
              >Log in</Button>
            </Link>
          )}
          <Link href="/builder">
            <Button size="sm"
              style={{ backgroundColor: T.accent, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600 }}
              className="hover:bg-orange-600 transition-all px-4 no-underline"
            >
              Build Your Resume
            </Button>
          </Link>
          {installPrompt && (
            <Button variant="outline" size="sm" onClick={installApp}
              style={{ borderRadius: 8, borderColor: T.border, color: T.text, fontSize: 13, gap: 6 }}>
              <Download className="w-3.5 h-3.5" /> Install
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2" aria-label="Toggle navigation menu">
          {menuOpen ? <X style={{ color: T.text }} className="w-6 h-6" /> : <Menu style={{ color: T.text }} className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );

  // ─── MOBILE MENU ─────────────────────────────────────────────────
  const mobileMenu = menuOpen && (
    <div style={{
      position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, zIndex: 49,
      backgroundColor: T.surface, padding: 24,
    }}>
      <div className="flex flex-col gap-1">
        {navLinks.map(link => (
          <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
            style={{ color: T.text, fontSize: 16, padding: '14px 0', borderBottom: `1px solid ${T.border}` }}
            className="font-medium no-underline"
          >{link.label}</a>
        ))}
        <div className="flex flex-col gap-3 mt-8">
          {isAuthenticated ? (
            <>
              <span className="text-sm font-medium text-center py-1" style={{ color: T.text }}>
                {user?.name || user?.email}
              </span>
              <Button variant="outline" className="w-full" onClick={() => logout()}
                style={{ borderRadius: 8, borderColor: T.border, color: T.text }}>Log out</Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="w-full"
                style={{ borderRadius: 8, borderColor: T.border, color: T.text }}>Log in</Button>
            </Link>
          )}
          <Link href="/builder">
            <Button className="w-full"
              style={{ backgroundColor: T.accent, color: '#fff', borderRadius: 8 }}>Build Your Resume</Button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: T.bg, color: T.text, fontFamily: 'Inter, sans-serif' }}>

      {nav}
      {mobileMenu}

      <main style={{ paddingTop: 64 }}>

        {/* ══════════════════════ HERO ══════════════════════ */}
        <section aria-label="Hero" className="relative overflow-hidden">
          {/* Background gradient */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(30,64,175,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(234,88,12,0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          <div className="mx-auto px-4 sm:px-8 relative" style={{ maxWidth: 1280, paddingTop: 80, paddingBottom: 80 }}>

            {/* Top badge */}
            <div className="flex justify-center mb-6">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 16px', borderRadius: 100,
                background: 'linear-gradient(135deg, rgba(30,64,175,0.1), rgba(234,88,12,0.1))',
                border: '1px solid rgba(30,64,175,0.15)',
                fontSize: 13, fontWeight: 600, color: T.primaryDark,
              }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: T.accent }} />
                AI-Powered Resume Optimization
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left content */}
              <div className="w-full lg:w-[48%] text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-tight tracking-tight" style={{ color: T.text }}>
                  Land Your Dream Job{' '}
                  <span className="bg-gradient-to-r from-blue-700 to-orange-500 bg-clip-text text-transparent">Faster</span>
                </h1>
                <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: T.muted, maxWidth: 500 }}>
                  <strong className="font-semibold" style={{ color: T.text }}>HexaCv</strong> is the <strong className="font-semibold" style={{ color: T.text }}>free AI resume builder</strong> that parses your existing resume, aligns it with any job description, and exports ATS-friendly PDFs — all in your browser with complete privacy.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start" style={{ maxWidth: 500 }}>
                  <Link href="/builder" className="w-full sm:flex-1 no-underline">
                    <Button size="lg" className="w-full font-bold text-base shadow-lg shadow-orange-500/20" style={{
                      backgroundColor: T.accent, color: '#fff', borderRadius: 10, padding: '16px 24px',
                    }}>
                      <Upload className="w-4 h-4 mr-2" /> Upload Your Resume
                    </Button>
                  </Link>
                  <Link href="/builder/scratch" className="w-full sm:flex-1 no-underline">
                    <Button size="lg" variant="outline" className="w-full font-semibold text-base" style={{
                      borderColor: T.border, color: T.text, borderRadius: 10, padding: '16px 24px',
                    }}>
                      <FileText className="w-4 h-4 mr-2" /> Start From Scratch
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 mt-8 text-sm font-medium" style={{ color: T.muted }}>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" style={{ color: T.success }} /> No sign-up needed</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" style={{ color: T.success }} /> 100% private</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" style={{ color: T.success }} /> Free PDF export</span>
                </div>
              </div>

              {/* Right: Hero visual */}
              <div className="w-full lg:w-[52%] relative" aria-label="Resume preview demonstration">
                {/* Glow */}
                <div aria-hidden="true" style={{
                  position: 'absolute', inset: -40,
                  background: 'radial-gradient(ellipse at center, rgba(30,64,175,0.12) 0%, transparent 70%)',
                  pointerEvents: 'none', borderRadius: '50%',
                }} />

                <div style={{
                  backgroundColor: T.elevated, borderRadius: 16,
                  border: `1px solid ${T.border}`, overflow: 'hidden',
                  boxShadow: '0 25px 80px rgba(0,0,0,0.08), 0 8px 30px rgba(30,64,175,0.06)',
                }}>
                  {/* Mockup header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.surface }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['#ff5f56', '#ffbd2e', '#27c93f'].map((c, i) => (
                        <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c }} />
                      ))}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 500, color: T.lightMuted }}>resume_preview.pdf</div>
                  </div>
                  {/* Mockup body */}
                  <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 300 }}>
                    {/* Name & title */}
                    <div style={{ width: '55%', height: 22, backgroundColor: T.primaryDark, borderRadius: 4, opacity: 0.85 }} />
                    <div style={{ width: '38%', height: 14, backgroundColor: T.accent, borderRadius: 4, opacity: 0.5 }} />
                    <div style={{ width: '100%', height: 1, backgroundColor: T.border, margin: '6px 0' }} />

                    {/* Summary bar */}
                    <div style={{ width: '100%', height: 10, backgroundColor: T.border, borderRadius: 4, opacity: 0.6 }} />
                    <div style={{ width: '85%', height: 10, backgroundColor: T.border, borderRadius: 4, opacity: 0.6 }} />

                    {/* Two-column layout */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ width: '40%', height: 12, backgroundColor: T.primary, borderRadius: 4, opacity: 0.5 }} />
                        <div style={{ width: '100%', height: 8, backgroundColor: T.border, borderRadius: 4, opacity: 0.5 }} />
                        <div style={{ width: '90%', height: 8, backgroundColor: T.border, borderRadius: 4, opacity: 0.5 }} />
                        <div style={{ width: '75%', height: 8, backgroundColor: T.border, borderRadius: 4, opacity: 0.5 }} />
                        <div style={{ width: '100%', height: 8, backgroundColor: T.border, borderRadius: 4, opacity: 0.5 }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ width: '35%', height: 12, backgroundColor: T.primary, borderRadius: 4, opacity: 0.5 }} />
                        <div style={{ width: '100%', height: 8, backgroundColor: T.border, borderRadius: 4, opacity: 0.5 }} />
                        <div style={{ width: '80%', height: 8, backgroundColor: T.border, borderRadius: 4, opacity: 0.5 }} />
                      </div>
                    </div>

                    {/* Skill badges */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {['React', 'TypeScript', 'Node.js', 'AWS', 'Python', 'Docker'].map((s, i) => (
                        <span key={s} style={{
                          padding: '5px 12px', backgroundColor: T.surface, borderRadius: 6, fontSize: 11,
                          color: T.primaryDark, border: `1px solid ${T.border}`, fontWeight: 500,
                        }}>{s}</span>
                      ))}
                    </div>

                    {/* ATS score badge */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 100, marginTop: 4,
                      background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(22,163,74,0.05))',
                      border: '1px solid rgba(22,163,74,0.2)',
                      alignSelf: 'flex-start',
                    }}>
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: T.success }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.success }}>ATS Score: 92%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════ STATS BAND ══════════════════════ */}
        <section aria-label="Platform statistics" style={{
          borderTop: `1px solid ${T.border}`,
          borderBottom: `1px solid ${T.border}`,
          background: 'linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%)',
        }}>
          <div className="mx-auto px-4 sm:px-8 py-12" style={{ maxWidth: 1280 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(30,64,175,0.1), rgba(234,88,12,0.1))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <s.icon className="w-5 h-5" style={{ color: T.accent }} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: T.text }}>{s.value}</p>
                  <p className="text-sm mt-1 font-medium" style={{ color: T.muted }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
        <section id="how-it-works" aria-label="How it works" className="mx-auto px-4 sm:px-8" style={{ maxWidth: 1280, paddingTop: 80, paddingBottom: 80 }}>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: T.text }}>
              Build Your Resume in <span style={{ color: T.accent }}>3 Simple Steps</span>
            </h2>
            <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: T.muted }}>
              From upload to export in under 5 minutes. No account, no learning curve, no hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center md:text-left">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div aria-hidden="true" className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5"
                    style={{ background: `linear-gradient(90deg, ${T.accent}44, ${T.accent}11)` }}
                  />
                )}
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(30,64,175,0.2)',
                  }}>
                    <step.icon className="w-6 h-6" style={{ color: '#fff' }} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: T.lightMuted }}>Step {step.number}</span>
                  <h3 className="text-lg font-bold" style={{ color: T.text }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════ FEATURES ══════════════════════ */}
        <section id="features" aria-label="Features" style={{
          backgroundColor: T.surface,
          borderTop: `1px solid ${T.border}`,
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div className="mx-auto px-4 sm:px-8" style={{ maxWidth: 1280, paddingTop: 80, paddingBottom: 80 }}>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: T.text }}>
                Everything You Need to <span style={{ color: T.primaryDark }}>Succeed</span>
              </h2>
              <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: T.muted }}>
                Built for job seekers who need a resume that passes ATS filters and impresses hiring managers.
              </p>
            </div>

            {/* Mobile: vertical stack */}
            <div className="flex flex-col sm:hidden gap-4">
              {features.map((f, i) => (
                <div key={i} style={{
                  backgroundColor: T.bg, borderRadius: 10, border: `1px solid ${T.border}`,
                  padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(30,64,175,0.12), rgba(30,64,175,0.05))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <f.icon className="w-5 h-5" style={{ color: T.primary }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: T.text }}>{f.title}</h3>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: T.muted }}>{f.desc}</p>
                    <span className="inline-block text-xs font-semibold mt-1.5" style={{ color: T.primary }}>{f.benefit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: 3x2 grid with hover effects */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={i} className="group"
                  style={{
                    backgroundColor: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
                    padding: 28, transition: 'all 0.3s ease', cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.06)';
                    e.currentTarget.style.borderColor = T.accent + '44';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.borderColor = T.border;
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(30,64,175,0.1), rgba(234,88,12,0.05))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 18, transition: 'all 0.3s ease',
                  }} className="group-hover:scale-110">
                    <f.icon className="w-5 h-5" style={{ color: T.accent }} />
                  </div>
                  <h3 className="font-bold" style={{ color: T.text, fontSize: 16 }}>{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: T.muted }}>{f.desc}</p>
                  <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold" style={{ color: T.primary }}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {f.benefit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════ TESTIMONIALS ══════════════════════ */}
        <section id="testimonials" aria-label="Testimonials" className="mx-auto px-4 sm:px-8" style={{ maxWidth: 1280, paddingTop: 80, paddingBottom: 80 }}>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: T.text }}>
              Loved by <span style={{ color: T.accent }}>Job Seekers</span>
            </h2>
            <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: T.muted }}>
              See how HexaCv helped professionals like you land interviews at top companies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} style={{
                backgroundColor: T.surface, borderRadius: 14, border: `1px solid ${T.border}`,
                padding: 28, position: 'relative',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              }}>
                <Quote className="w-8 h-8 mb-3" style={{ color: T.primary, opacity: 0.2 }} />
                <p className="text-sm leading-relaxed italic" style={{ color: T.muted }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-1 mt-4">
                  {Array.from({ length: t.rating }).map((_, ri) => (
                    <Star key={ri} className="w-3.5 h-3.5 fill-current" style={{ color: '#f59e0b' }} />
                  ))}
                </div>
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                  <p className="text-sm font-bold" style={{ color: T.text }}>{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.muted }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════ PRICING ══════════════════════ */}
        <section id="pricing" aria-label="Pricing" style={{
          backgroundColor: T.surface,
          borderTop: `1px solid ${T.border}`,
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div className="mx-auto px-4 sm:px-8" style={{ maxWidth: 1280, paddingTop: 80, paddingBottom: 80 }}>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: T.text }}>
                Simple, Transparent <span style={{ color: T.accent }}>Pricing</span>
              </h2>
              <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: T.muted }}>
                Start for free. Upgrade when you need more power.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, i) => (
                <div key={i} style={{
                  backgroundColor: T.bg, borderRadius: 16, border: plan.popular ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                  padding: 32, position: 'relative',
                  transform: plan.popular ? 'scale(1.02)' : undefined,
                  boxShadow: plan.popular ? '0 12px 40px rgba(234,88,12,0.12)' : undefined,
                }}>
                  {plan.popular && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      padding: '4px 16px', borderRadius: 100,
                      background: 'linear-gradient(135deg, #ea580c, #f97316)',
                      color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                    }}>
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-bold" style={{ color: T.text }}>{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold" style={{ color: T.text }}>{plan.price}</span>
                    <span className="text-sm" style={{ color: T.muted }}>{plan.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3.5">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: T.success }} />
                        <span style={{ color: T.muted }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.name === 'Enterprise' ? 'mailto:sales@hexastacksolutions.com' : '/builder'} className="no-underline">
                    <Button className="w-full mt-8 font-semibold" size="lg"
                      style={{
                        backgroundColor: plan.popular ? T.accent : T.surface,
                        color: plan.popular ? '#fff' : T.text,
                        border: plan.popular ? 'none' : `1px solid ${T.border}`,
                        borderRadius: 10,
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════ CTA BAND ══════════════════════ */}
        <section aria-label="Call to action" style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #ea580c 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '600px', height: '600px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="mx-auto px-4 sm:px-8 py-20 text-center relative" style={{ maxWidth: 800 }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Ready to Land Your Next Role?
            </h2>
            <p className="mt-4 text-base text-white/80 max-w-xl mx-auto">
              Join thousands of professionals who have built better resumes with HexaCv.
              It&apos;s free, private, and takes less than 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Link href="/builder" className="no-underline">
                <Button size="lg" style={{
                  backgroundColor: '#fff', color: T.primaryDark, borderRadius: 10,
                  padding: '16px 36px', fontSize: 15, fontWeight: 700, gap: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
                  className="hover:bg-white/90 transition-all"
                >
                  Build Your Resume Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              {installPrompt && (
                <Button variant="outline" size="lg" onClick={installApp} style={{
                  borderColor: 'rgba(255,255,255,0.3)', color: '#fff', borderRadius: 10,
                  padding: '16px 36px', fontSize: 15, fontWeight: 500, gap: 8,
                }}
                  className="hover:bg-white/10 transition-all"
                >
                  <Download className="w-4 h-4" /> Install App
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════ FOOTER ══════════════════════ */}
        <footer aria-label="Site footer" style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div className="mx-auto px-6 sm:px-12 py-16 relative" style={{ maxWidth: 1280, zIndex: 2 }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

              {/* Brand Column */}
              <div className="md:col-span-4 flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'linear-gradient(135deg, #1e40af, #ea580c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Layers style={{ color: '#fff' }} className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-white">HexaCv</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8', maxWidth: 300 }}>
                  The free AI resume builder that helps you create ATS-friendly, professional resumes — fast. Built by{' '}
                  <a href="https://www.hexastacksolutions.com" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#f97316' }} className="hover:text-orange-400 transition-colors font-medium"
                  >HexaStack Solutions</a>.
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {[
                    { icon: Github, href: 'https://github.com/suragms/HexaCv', label: 'GitHub' },
                    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
                    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
                    { icon: Mail, href: 'mailto:info@hexastacksolutions.com', label: 'Email' },
                  ].map((soc, idx) => (
                    <a key={idx} href={soc.href} target="_blank" rel="noopener noreferrer" aria-label={soc.label}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36, borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', transition: 'all 200ms ease',
                      }}
                      className="hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
                    >
                      <soc.icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Link Columns */}
              <div className="grid grid-cols-2 md:col-span-5 gap-8">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#f97316' }}>Product</h4>
                  <div className="flex flex-col gap-3">
                    {footerLinks.product.map(link => (
                      <Link key={link} href={link === 'Resume Builder' ? '/builder' : link === 'Pricing' ? '#pricing' : '#'}
                        style={{ color: '#94a3b8' }}
                        className="text-sm hover:text-orange-400 transition-all font-medium no-underline"
                      >{link}</Link>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#f97316' }}>Company</h4>
                  <div className="flex flex-col gap-3">
                    {footerLinks.company.map(link => (
                      <a key={link} href="https://www.hexastacksolutions.com/" target="_blank" rel="noopener noreferrer"
                        style={{ color: '#94a3b8' }}
                        className="text-sm hover:text-orange-400 transition-all font-medium no-underline"
                      >{link}</a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Newsletter */}
              <div className="md:col-span-3 flex flex-col gap-4">
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#f97316' }}>Stay Updated</h4>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                  Get resume tips, template updates, and career advice — no spam, ever.
                </p>
                <div className="flex flex-col gap-2 mt-1">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                    style={{
                      width: '100%', padding: '10px 14px', fontSize: 13,
                      borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', outline: 'none',
                    }}
                    className="focus:border-orange-500 transition-all placeholder:text-slate-500"
                    aria-label="Email for newsletter"
                  />
                  <Button size="sm" onClick={handleSubscribe}
                    style={{
                      backgroundColor: T.accent, color: '#fff', borderRadius: 8,
                      fontWeight: 600, fontSize: 13,
                    }}
                    className="hover:bg-orange-600 transition-all w-full"
                  >
                    {emailSubscribed ? 'Subscribed! ✓' : 'Subscribe'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4 text-xs" style={{ color: '#64748b' }}>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <span>© 2026 HexaStack Solutions. All rights reserved.</span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span className="font-semibold" style={{ color: '#94a3b8' }}>Built by Surag &amp; Anandu Krishna</span>
              </div>
              <div className="flex gap-6">
                {footerLinks.legal.map(link => (
                  <a key={link} href="#"
                    className="hover:text-orange-400 transition-colors no-underline"
                    style={{ color: '#64748b' }}
                  >{link}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
