import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/_core/hooks/useAuth';
import { Link } from 'wouter';
import {
  Upload, Layers, Menu, X, ArrowRight, Download, CheckCircle2,
  Linkedin, FileText, Shield,
} from 'lucide-react';

// Tokens aligned with stitch-assets/design_system.json (light marketing surface)
const T = {
  bg: '#f8fafc',
  surface: '#ffffff',
  elevated: '#f1f5f9',
  primary: '#1e40af',
  primaryDark: '#1e3a8a',
  accent: '#ea580c',
  text: '#0f172a',
  muted: '#475569',
  lightMuted: '#94a3b8',
  border: '#e2e8f0',
  success: '#16a34a',
};

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload, paste, or LinkedIn',
    desc: 'Bring an existing PDF/DOCX, start blank, or pull from LinkedIn. Three ways in — no extra setup.',
  },
  {
    number: '02',
    icon: Shield,
    title: 'AI shows what is grounded',
    desc: 'We rewrite for clarity and your target role, then check claims against your source. Invented metrics get cut.',
  },
  {
    number: '03',
    icon: Download,
    title: 'Download and apply',
    desc: 'Export an ATS-friendly PDF when you are ready. Edit anything yourself — your words stay yours.',
  },
];

const footerLinks = {
  product: [
    { label: 'Resume Builder', href: '/builder' },
    { label: 'Pricing', href: '/pricing' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Refund Policy', href: '/refund' },
  ],
};

export default function Landing() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '/pricing' },
  ];

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
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: T.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            <Layers style={{ color: '#fff' }} className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <span className="text-lg font-extrabold tracking-tight" style={{ color: T.text }}>HexaCv</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navLinks.map((link) =>
            link.href.startsWith('/') ? (
              <Link
                key={link.label}
                href={link.href}
                style={{ color: T.muted, fontSize: 14 }}
                className="font-medium hover:opacity-80 no-underline"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                style={{ color: T.muted, fontSize: 14 }}
                className="font-medium hover:opacity-80 no-underline"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="no-underline">
                <Button
                  variant="outline"
                  className="min-h-11 font-semibold"
                  style={{ borderColor: T.border, color: T.text, borderRadius: 8 }}
                >
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="min-h-11"
                style={{ color: T.muted }}
                onClick={() => logout()}
              >
                Log out
              </Button>
            </>
          ) : (
            <Link href="/login" className="no-underline">
              <Button
                variant="outline"
                className="min-h-11 font-semibold"
                style={{ borderColor: T.border, color: T.text, borderRadius: 8 }}
              >
                Sign in
              </Button>
            </Link>
          )}
          <Link href="/builder" className="no-underline">
            <Button
              className="min-h-11 font-bold"
              style={{ backgroundColor: T.accent, color: '#fff', borderRadius: 8 }}
            >
              Build your resume
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden flex items-center justify-center min-h-11 min-w-11"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
          style={{ color: T.text }}
        >
          {menuOpen ? <X className="w-6 h-6" strokeWidth={1.75} /> : <Menu className="w-6 h-6" strokeWidth={1.75} />}
        </button>
      </div>
    </header>
  );

  const mobileMenu = menuOpen && (
    <div
      className="md:hidden fixed inset-x-0 top-16 z-40 px-4 pb-6 pt-2"
      style={{ backgroundColor: T.surface, borderBottom: `1px solid ${T.border}` }}
    >
      <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
        {navLinks.map((link) =>
          link.href.startsWith('/') ? (
            <Link
              key={link.label}
              href={link.href}
              className="min-h-11 flex items-center px-3 font-medium no-underline"
              style={{ color: T.text }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ) : (
            <a
              key={link.label}
              href={link.href}
              className="min-h-11 flex items-center px-3 font-medium no-underline"
              style={{ color: T.text }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          )
        )}
      </nav>
      <div className="flex flex-col gap-2 mt-4">
        {!isAuthenticated && (
          <Link href="/login" className="no-underline" onClick={() => setMenuOpen(false)}>
            <Button
              variant="outline"
              className="w-full min-h-11"
              style={{ borderColor: T.border, color: T.text, borderRadius: 8 }}
            >
              Sign in
            </Button>
          </Link>
        )}
        {isAuthenticated && (
          <Link href="/dashboard" className="no-underline" onClick={() => setMenuOpen(false)}>
            <Button
              variant="outline"
              className="w-full min-h-11"
              style={{ borderColor: T.border, color: T.text, borderRadius: 8 }}
            >
              Dashboard
            </Button>
          </Link>
        )}
        <Link href="/builder" className="no-underline" onClick={() => setMenuOpen(false)}>
          <Button
            className="w-full min-h-11 font-bold"
            style={{ backgroundColor: T.accent, color: '#fff', borderRadius: 8 }}
          >
            Build your resume
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: T.bg, color: T.text, fontFamily: 'Inter, sans-serif' }}>
      {nav}
      {mobileMenu}

      <main style={{ paddingTop: 64 }}>
        {/* 1 — Hero */}
        <section aria-label="Hero" className="relative overflow-hidden">
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${T.primary}14 0%, transparent 55%)`,
              pointerEvents: 'none',
            }}
          />

          <div className="mx-auto px-4 sm:px-8 relative" style={{ maxWidth: 1280, paddingTop: 64, paddingBottom: 72 }}>
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="w-full lg:w-[52%] text-center lg:text-left">
                <h1
                  className="text-[1.75rem] sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight"
                  style={{ color: T.text }}
                >
                  Sent dozens of resumes. Still waiting.{' '}
                  <span style={{ color: T.primaryDark }}>HexaCv shows what is real</span>
                  {' '}— for Gulf &amp; India job formats.
                </h1>
                <p
                  className="mt-5 text-base sm:text-lg leading-relaxed mx-auto lg:mx-0"
                  style={{ color: T.muted, maxWidth: 520 }}
                >
                  Grounded resume AI: clearer wording and ATS-friendly layout without inventing
                  achievements. Built for UAE, Saudi, and India hiring norms — not generic hype.
                </p>

                <div className="mt-8 max-w-md mx-auto lg:mx-0 w-full">
                  <Link href="/builder" className="block w-full no-underline">
                    <Button
                      size="lg"
                      className="w-full font-bold text-base min-h-11"
                      style={{
                        backgroundColor: T.accent,
                        color: '#fff',
                        borderRadius: 10,
                        padding: '16px 24px',
                        boxShadow: '0 10px 28px rgba(234,88,12,0.28)',
                      }}
                    >
                      Build your resume
                      <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.75} />
                    </Button>
                  </Link>
                  <p className="mt-3 text-sm" style={{ color: T.lightMuted }}>
                    {isAuthenticated
                      ? `Signed in as ${user?.name?.split(' ')[0] || 'you'} — drafts sync when you save.`
                      : 'Guest mode available. No sign-up required to start.'}
                  </p>
                </div>
              </div>

              <div
                className="w-full lg:w-[48%] relative"
                aria-label="Decorative resume layout preview"
                role="img"
              >
                <div
                  style={{
                    backgroundColor: T.elevated,
                    borderRadius: 16,
                    border: `1px solid ${T.border}`,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(15,23,42,0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
                      backgroundColor: T.surface,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6 }} aria-hidden="true">
                      {['#ff5f56', '#ffbd2e', '#27c93f'].map((c) => (
                        <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c }} />
                      ))}
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 500, color: T.lightMuted }}>
                      resume_preview.pdf
                    </div>
                  </div>
                  <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 260 }} aria-hidden="true">
                    <div style={{ width: '55%', height: 22, backgroundColor: T.primaryDark, borderRadius: 4, opacity: 0.85 }} />
                    <div style={{ width: '38%', height: 14, backgroundColor: T.accent, borderRadius: 4, opacity: 0.45 }} />
                    <div style={{ width: '100%', height: 1, backgroundColor: T.border, margin: '6px 0' }} />
                    <div style={{ width: '100%', height: 10, backgroundColor: T.border, borderRadius: 4, opacity: 0.6 }} />
                    <div style={{ width: '85%', height: 10, backgroundColor: T.border, borderRadius: 4, opacity: 0.6 }} />
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ width: '40%', height: 12, backgroundColor: T.primary, borderRadius: 4, opacity: 0.5 }} />
                        <div style={{ width: '100%', height: 8, backgroundColor: T.border, borderRadius: 4, opacity: 0.5 }} />
                        <div style={{ width: '90%', height: 8, backgroundColor: T.border, borderRadius: 4, opacity: 0.5 }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ width: '35%', height: 12, backgroundColor: T.primary, borderRadius: 4, opacity: 0.5 }} />
                        <div style={{ width: '100%', height: 8, backgroundColor: T.border, borderRadius: 4, opacity: 0.5 }} />
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 100, marginTop: 8,
                        backgroundColor: 'rgba(22,163,74,0.08)',
                        border: '1px solid rgba(22,163,74,0.2)',
                        alignSelf: 'flex-start',
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: T.success }} strokeWidth={1.75} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.success }}>Grounded against your source</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2 — How it works */}
        <section
          id="how-it-works"
          aria-label="How it works"
          className="mx-auto px-4 sm:px-8"
          style={{ maxWidth: 1280, paddingTop: 72, paddingBottom: 72 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: T.text }}>
              Three steps. No filler.
            </h2>
            <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: T.muted }}>
              Matches how HexaCv actually works — upload or write, ground the rewrite, export.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center md:text-left">
                {i < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden md:block absolute top-7 left-[58%] w-[84%] h-px"
                    style={{ backgroundColor: T.border }}
                  />
                )}
                <div className="flex flex-col items-center md:items-start gap-3">
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: 14,
                      backgroundColor: T.primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <step.icon className="w-6 h-6" style={{ color: '#fff' }} strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: T.lightMuted }}>
                    Step {step.number}
                  </span>
                  <h3 className="text-lg font-bold" style={{ color: T.text }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3 — Proof (one honest point) */}
        <section
          aria-label="What makes HexaCv different"
          style={{
            backgroundColor: T.surface,
            borderTop: `1px solid ${T.border}`,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div className="mx-auto px-4 sm:px-8" style={{ maxWidth: 720, paddingTop: 72, paddingBottom: 72 }}>
            <div className="flex flex-col items-center text-center gap-4">
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: `${T.primary}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <FileText className="w-6 h-6" style={{ color: T.primary }} strokeWidth={1.75} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: T.text }}>
                If it is not in your source, it does not stay
              </h2>
              <p className="text-base leading-relaxed" style={{ color: T.muted }}>
                After a rewrite, HexaCv runs grounding checks: filler phrases and claims that
                cannot be traced to your upload or notes are stripped or blocked. That is the
                product — clearer ATS-friendly wording without fabricated experience.
              </p>
            </div>
          </div>
        </section>

        {/* 4 — Final CTA + footer */}
        <section
          aria-label="Call to action"
          style={{ backgroundColor: T.primaryDark, position: 'relative' }}
        >
          <div className="mx-auto px-4 sm:px-8 py-16 text-center" style={{ maxWidth: 640 }}>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Start with what you already have
            </h2>
            <p className="mt-3 text-base text-white/80">
              Upload a resume or write from scratch. Improve clarity and ATS compatibility —
              without inventing a career you do not have.
            </p>
            <div className="mt-8 max-w-sm mx-auto w-full">
              <Link href="/builder" className="block w-full no-underline">
                <Button
                  size="lg"
                  className="w-full font-bold min-h-11"
                  style={{
                    backgroundColor: T.accent,
                    color: '#fff',
                    borderRadius: 10,
                    padding: '16px 28px',
                  }}
                >
                  Build your resume
                  <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.75} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer
          aria-label="Site footer"
          style={{ backgroundColor: '#0f172a' }}
        >
          <div className="mx-auto px-4 sm:px-8 py-12" style={{ maxWidth: 1280 }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pb-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      backgroundColor: T.primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    aria-hidden="true"
                  >
                    <Layers style={{ color: '#fff' }} className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <span className="font-bold text-lg text-white">HexaCv</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8', maxWidth: 280 }}>
                  Grounded resume AI for Gulf &amp; India job seekers. Built by{' '}
                  <a
                    href="https://www.hexastacksolutions.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: T.accent }}
                    className="font-medium"
                  >
                    HexaStack Solutions
                  </a>
                  .
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.accent }}>
                  Product
                </h4>
                <div className="flex flex-col gap-3">
                  {footerLinks.product.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      style={{ color: '#94a3b8' }}
                      className="text-sm font-medium no-underline hover:opacity-80"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.accent }}>
                  Legal
                </h4>
                <div className="flex flex-col gap-3">
                  {footerLinks.legal.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      style={{ color: '#94a3b8' }}
                      className="text-sm font-medium no-underline hover:opacity-80"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4 text-xs"
              style={{ color: '#64748b' }}
            >
              <p>© {new Date().getFullYear()} HexaStack Solutions. All rights reserved.</p>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="HexaStack on LinkedIn"
                className="inline-flex items-center justify-center min-h-11 min-w-11"
                style={{ color: '#94a3b8' }}
              >
                <Linkedin className="w-4 h-4" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
