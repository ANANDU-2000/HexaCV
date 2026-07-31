import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { useAuth } from '@/_core/hooks/useAuth';
import { Link } from 'wouter';
import {
  Layers, Menu, X, ArrowRight, Linkedin, Upload, Sparkles,
} from 'lucide-react';
import HowItWorksStrip from '@/components/landing/HowItWorksStrip';
import GroundingProof from '@/components/landing/GroundingProof';
import OutputPreviewRow from '@/components/landing/OutputPreviewRow';
import PricingTeaser from '@/components/landing/PricingTeaser';
import LandingFaq from '@/components/landing/LandingFaq';
import MethodSelectorCard from '@/components/landing/MethodSelectorCard';

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

const METHOD_CARDS = [
  {
    icon: Upload,
    title: 'Upload your resume',
    bullets: ['PDF or DOCX supported', 'Auto-parsed into editable sections', 'Kept private to your session'],
    href: '/builder/upload',
  },
  {
    icon: Sparkles,
    title: 'Generate with AI',
    bullets: ['Target role and market first', 'Rewrites stay grounded in your source', 'Nothing invented'],
    href: '/builder/ai',
  },
  {
    icon: Linkedin,
    title: 'Import from LinkedIn',
    bullets: ['Paste your profile text', 'Structured into resume sections', 'Edit before you export'],
    href: '/builder/linkedin',
  },
];

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border bg-background/92 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-8" style={{ maxWidth: 1280 }}>
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
            aria-hidden="true"
          >
            <Layers className="h-4 w-4 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-foreground">HexaCv</span>
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
          {!isAuthenticated && (
            <Link href="/login" className="no-underline">
              <Button
                variant="outline"
                className="min-h-11 rounded-lg border-border text-foreground"
              >
                Sign in
              </Button>
            </Link>
          )}
          {isAuthenticated && (
            <>
              <Link href="/dashboard" className="no-underline">
                <Button
                  variant="outline"
                  className="min-h-11 rounded-lg border-border text-foreground"
                >
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="min-h-11 text-muted-foreground"
                onClick={() => logout()}
              >
                Sign out
              </Button>
            </>
          )}
          <Link href="/builder" className="no-underline">
            <Button className="min-h-11 rounded-lg bg-accent-warm font-bold text-white hover:bg-accent-warm/90">
              Build your resume
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-foreground md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );

  const mobileMenu = menuOpen && (
    <div className="fixed inset-x-0 top-16 z-40 border-b border-border bg-background p-4 md:hidden">
      <div className="flex flex-col gap-3">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="min-h-11 py-2 text-sm font-medium text-foreground no-underline"
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
        {!isAuthenticated && (
          <Link href="/login" className="no-underline" onClick={() => setMenuOpen(false)}>
            <Button variant="outline" className="w-full min-h-11 rounded-lg border-border text-foreground">
              Sign in
            </Button>
          </Link>
        )}
        {isAuthenticated && (
          <Link href="/dashboard" className="no-underline" onClick={() => setMenuOpen(false)}>
            <Button variant="outline" className="w-full min-h-11 rounded-lg border-border text-foreground">
              Dashboard
            </Button>
          </Link>
        )}
        <Link href="/builder" className="no-underline" onClick={() => setMenuOpen(false)}>
          <Button className="w-full min-h-11 rounded-lg bg-accent-warm font-bold text-white hover:bg-accent-warm/90">
            Build your resume
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-background text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
      {nav}
      {mobileMenu}

      <main style={{ paddingTop: 64 }}>
        {/* 1 — Hero with method-selector cards */}
        <section aria-label="Hero" className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--accent-warm) 14%, transparent) 0%, transparent 55%)',
            }}
          />

          <div
            className="relative mx-auto px-4 sm:px-8"
            style={{ maxWidth: 1280, paddingTop: 56, paddingBottom: 72 }}
          >
            <div className="mx-auto max-w-3xl text-center">
              <h1
                className="font-extrabold leading-tight text-foreground"
                style={{
                  fontSize: 'clamp(1.75rem, 5vw, 3rem)',
                  letterSpacing: '-0.02em',
                  fontWeight: 800,
                }}
              >
                Sent dozens of resumes. Still waiting.{' '}
                <span className="text-primary-dark">HexaCv shows what is real</span>
                {' '}for Gulf &amp; India job formats.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Rewritten from your real experience. Nothing invented.
              </p>
            </div>

            <div
              className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5"
              role="list"
              aria-label="Choose how to start"
            >
              {METHOD_CARDS.map((card) => (
                <div key={card.href} role="listitem">
                  <MethodSelectorCard
                    icon={card.icon}
                    title={card.title}
                    bullets={card.bullets}
                    href={card.href}
                  />
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isAuthenticated
                ? `Signed in as ${user?.name?.split(' ')[0] || 'you'}. Drafts sync when you save.`
                : 'Guest mode available. No sign-up required to start.'}
            </p>
          </div>
        </section>

        {/* 2 — How it works */}
        <HowItWorksStrip />

        {/* 3 — Grounding proof (before/after) */}
        <GroundingProof />

        {/* 4 — Real output previews */}
        <OutputPreviewRow />

        {/* 5 — Pricing teaser */}
        <PricingTeaser />

        {/* 6 — FAQ */}
        <LandingFaq />

        {/* 7 — Final CTA + footer */}
        <section aria-label="Call to action" className="relative bg-primary-dark">
          <div className="mx-auto px-4 py-16 text-center sm:px-8" style={{ maxWidth: 640 }}>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Start with what you already have
            </h2>
            <p className="mt-3 text-base text-white/80">
              Upload a resume or write from scratch. Improve clarity and ATS compatibility
              without inventing a career you do not have.
            </p>
            <div className="mx-auto mt-8 w-full max-w-sm">
              <Link href="/builder" className="block w-full no-underline">
                <Button
                  size="lg"
                  className="w-full min-h-11 rounded-[10px] bg-accent-warm px-7 py-4 font-bold text-white hover:bg-accent-warm/90"
                >
                  Build your resume
                  <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.75} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer aria-label="Site footer" className="bg-foreground">
          <div className="mx-auto px-4 py-12 sm:px-8" style={{ maxWidth: 1280 }}>
            <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-10 sm:grid-cols-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
                    aria-hidden="true"
                  >
                    <Layers className="h-4 w-4 text-primary-foreground" strokeWidth={1.75} />
                  </div>
                  <span className="text-lg font-bold text-white">HexaCv</span>
                </div>
                <p className="max-w-[280px] text-sm leading-relaxed text-slate-400">
                  Grounded resume AI for Gulf &amp; India job seekers. Built by{' '}
                  <a
                    href="https://www.hexastacksolutions.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent-warm"
                  >
                    HexaStack Solutions
                  </a>
                  .
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
                      className="text-sm font-medium text-slate-400 no-underline hover:opacity-80"
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
                      className="text-sm font-medium text-slate-400 no-underline hover:opacity-80"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-slate-500 sm:flex-row">
              <p>© {new Date().getFullYear()} HexaStack Solutions. All rights reserved.</p>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="HexaStack on LinkedIn"
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-slate-400"
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
