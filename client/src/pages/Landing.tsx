import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useAuth } from '@/_core/hooks/useAuth';
import { Link } from 'wouter';
import {
  FileText, Upload, Sparkles, Layers, Zap, Shield, Target, Star,
  Menu, X, ChevronRight, ArrowRight, Check, Download,
  Github, Linkedin, Twitter, Mail
} from 'lucide-react';

const T = {
  bg: '#f8fafc',
  surface: '#ffffff',
  elevated: '#f1f5f9',
  primary: '#1e40af',
  primaryText: '#1e3a8a',
  accent: '#ea580c',
  text: '#0f172a',
  muted: '#475569',
  border: '#cbd5e1',
  success: '#16a34a',
  error: '#dc2626',
  radius: 8,
};

const featureList = [
  { icon: Upload, title: 'Smart Resume Parser', desc: 'Upload PDF, DOCX, or TXT — our engine extracts every section client-side.' },
  { icon: Target, title: 'ATS Keyword Alignment', desc: 'Score your resume against any job description and close keyword gaps.' },
  { icon: Sparkles, title: 'AI Rewrite Assistant', desc: 'Rephrase bullets to be clearer and more impactful — without inventing facts.' },
  { icon: Layers, title: 'Professional Templates', desc: 'Choose from multiple ATS-friendly designs crafted for real hiring systems.' },
  { icon: Zap, title: 'Instant PDF Export', desc: 'Export pixel-perfect PDFs directly from your browser, no server round-trip.' },
  { icon: Shield, title: '100% Private & Offline', desc: 'All processing stays on your device. Works offline as a PWA.' },
];

const footerLinks = {
  product: ['Resume Builder', 'ATS Scanner', 'Pricing'],
  company: ['About Us', 'Blog', 'Careers', 'Contact'],
  legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
};

export default function Landing() {
  const { installPrompt, installApp } = usePWA();
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: '/docs' },
  ];

  return (
    <div style={{ backgroundColor: T.bg, color: T.text, fontFamily: 'Inter, sans-serif' }}>
      {/* Sticky Top Nav */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: 'rgba(248,250,252,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.border}`
      }}>
        <div className="mx-auto flex items-center justify-between px-4 sm:px-8 h-16" style={{ maxWidth: 1440 }}>
          <div className="flex items-center gap-2">
            <Layers style={{ color: T.primaryText }} className="w-6 h-6" />
            <span className="text-lg font-bold tracking-tight" style={{ color: T.text }}>HexaCv</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a key={link.label} href={link.href}
                style={{ color: T.muted, fontSize: 14 }}
                className="hover:opacity-80 transition-opacity font-medium"
              >{link.label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" style={{ color: T.muted, fontSize: 13 }} className="font-medium">Log in</Button>
            </Link>
            <Link href="/builder">
              <Button size="sm" style={{
                backgroundColor: T.accent, color: '#fff', borderRadius: T.radius,
                fontSize: 13, fontWeight: 600
              }} className="hover:opacity-90 transition-opacity px-4">
                Get Started
              </Button>
            </Link>
            {installPrompt && (
              <Button variant="outline" size="sm" onClick={installApp}
                style={{ borderRadius: T.radius, borderColor: T.border, color: T.text, fontSize: 13, gap: 6 }}>
                <Download className="w-3.5 h-3.5" /> Install
              </Button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2" aria-label="Menu">
            {menuOpen ? <X style={{ color: T.text }} className="w-6 h-6" /> : <Menu style={{ color: T.text }} className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile menu sheet */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, zIndex: 49,
          backgroundColor: T.surface, padding: 24,
        }}>
          <div className="flex flex-col gap-2">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
                style={{ color: T.text, fontSize: 16, padding: '12px 0', borderBottom: `1px solid ${T.border}` }}
                className="font-medium"
              >{link.label}</a>
            ))}
            <div className="flex flex-col gap-3 mt-6">
              <Link href="/login">
                <Button variant="outline" className="w-full" style={{ borderRadius: T.radius, borderColor: T.border, color: T.text }}>Log in</Button>
              </Link>
              <Link href="/builder">
                <Button className="w-full" style={{ backgroundColor: T.accent, color: '#fff', borderRadius: T.radius }}>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <main style={{ paddingTop: 64 }}>

        {/* ───── HERO ───── */}
        <section className="mx-auto px-4 sm:px-8" style={{ maxWidth: 1280, paddingTop: 80, paddingBottom: 80 }}>
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left content */}
            <div className="w-full lg:w-[45%] text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-tight tracking-tight" style={{ color: T.text }}>
                Build Your Perfect<br />
                <span style={{ color: T.primaryText }}>Resume in Minutes</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: T.muted, maxWidth: 480 }}>
                Upload your existing resume or start from scratch. Tailor it to any job with AI-powered suggestions, then export an ATS-friendly PDF — all in your browser.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-8" style={{ maxWidth: 480 }}>
                <Link href="/builder" className="w-full sm:flex-1">
                  <Button size="lg" className="w-full font-semibold text-base" style={{
                    backgroundColor: T.accent, color: '#fff', borderRadius: T.radius, padding: '14px 24px'
                  }}>
                    <Upload className="w-4 h-4 mr-2" /> Upload Resume
                  </Button>
                </Link>
                <Link href="/builder/scratch" className="w-full sm:flex-1">
                  <Button size="lg" variant="outline" className="w-full font-semibold text-base" style={{
                    borderColor: T.border, color: T.text, borderRadius: T.radius, padding: '14px 24px'
                  }}>
                    <FileText className="w-4 h-4 mr-2" /> Build from Scratch
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm font-medium" style={{ color: T.muted }}>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4" style={{ color: T.success }} /> No account needed</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4" style={{ color: T.success }} /> 100% private</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4" style={{ color: T.success }} /> Free PDF export</span>
              </div>
            </div>

            {/* Right mockup */}
            <div className="w-full lg:w-[55%] relative">
              <div style={{
                position: 'absolute', inset: -40,
                background: 'radial-gradient(ellipse at center, rgba(30,64,175,0.15) 0%, transparent 70%)',
                pointerEvents: 'none', borderRadius: '50%',
              }} />
              <div style={{
                backgroundColor: T.elevated, borderRadius: 16,
                border: `1px solid ${T.border}`, overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}>
                {/* Mockup header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#ff5f56', '#ffbd2e', '#27c93f'].map((c, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: T.muted }}>resume_preview.pdf</div>
                </div>
                {/* Mockup body */}
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 280 }}>
                  <div style={{ width: '60%', height: 20, backgroundColor: T.primaryText, borderRadius: 4, opacity: 0.8 }} />
                  <div style={{ width: '40%', height: 14, backgroundColor: T.muted, borderRadius: 4, opacity: 0.4 }} />
                  <div style={{ width: '100%', height: 1, backgroundColor: T.border, margin: '8px 0' }} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ width: 80, height: 12, backgroundColor: T.primary, borderRadius: 4, opacity: 0.6 }} />
                      <div style={{ width: '100%', height: 8, backgroundColor: T.border, borderRadius: 4 }} />
                      <div style={{ width: '90%', height: 8, backgroundColor: T.border, borderRadius: 4 }} />
                      <div style={{ width: '70%', height: 8, backgroundColor: T.border, borderRadius: 4 }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ width: 60, height: 12, backgroundColor: T.primary, borderRadius: 4, opacity: 0.6 }} />
                      <div style={{ width: '100%', height: 8, backgroundColor: T.border, borderRadius: 4 }} />
                      <div style={{ width: '85%', height: 8, backgroundColor: T.border, borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {['React', 'TypeScript', 'Node.js', 'AWS'].map(s => (
                      <span key={s} style={{ padding: '4px 10px', backgroundColor: T.surface, borderRadius: 6, fontSize: 11, color: T.primaryText, border: `1px solid ${T.border}` }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── TRUST BAR ───── */}
        <section style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '32px 0' }}>
          <div className="mx-auto px-4 sm:px-8" style={{ maxWidth: 1280 }}>
            <p className="text-center text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: T.muted }}>Trusted by professionals at</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
              {['Google', 'Microsoft', 'Meta', 'Stripe', 'Airbnb', 'Amazon'].map(c => (
                <span key={c} className="text-sm font-bold tracking-wider" style={{ color: T.border, opacity: 0.6 }}>{c}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ───── FEATURES ───── */}
        <section id="features" className="mx-auto px-4 sm:px-8" style={{ maxWidth: 1280, paddingTop: 80, paddingBottom: 80 }}>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: T.text }}>Everything You Need</h2>
            <p className="mt-3 text-base" style={{ color: T.muted }}>AI-powered tools to build, tailor, and export your best resume.</p>
          </div>

          {/* Mobile: vertical stack */}
          <div className="flex flex-col sm:hidden gap-4">
            {featureList.map((f, i) => (
              <div key={i} style={{
                backgroundColor: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`,
                padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, backgroundColor: T.primary, opacity: 0.2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <f.icon className="w-5 h-5" style={{ color: T.primaryText }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: T.text }}>{f.title}</h3>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: T.muted }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: 3x2 grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureList.map((f, i) => (
              <div key={i} className="group" style={{
                backgroundColor: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`,
                padding: 28, transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 30px rgba(0,0,0,0.3)`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10, backgroundColor: T.primary, opacity: 0.15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <f.icon className="w-5 h-5" style={{ color: T.primaryText }} />
                </div>
                <h3 className="font-semibold" style={{ color: T.text, fontSize: 16 }}>{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: T.muted }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───── CTA BAND ───── */}
        <section style={{ backgroundColor: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div className="mx-auto px-4 sm:px-8 py-20 text-center" style={{ maxWidth: 800 }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: T.text }}>
              Ready to Land Your Next Role?
            </h2>
            <p className="mt-4 text-base" style={{ color: T.muted }}>
              Build a resume that passes ATS filters and impresses hiring managers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Link href="/builder">
                <Button size="lg" style={{
                  backgroundColor: T.accent, color: '#fff', borderRadius: T.radius,
                  padding: '14px 32px', fontSize: 15, fontWeight: 600, gap: 8
                }}>
                  Build Your Resume <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              {installPrompt && (
                <Button variant="outline" size="lg" onClick={installApp} style={{
                  borderColor: T.border, color: T.text, borderRadius: T.radius,
                  padding: '14px 32px', fontSize: 15, fontWeight: 500, gap: 8
                }}>
                  <Download className="w-4 h-4" /> Install App
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ───── FOOTER ───── */}
        <footer style={{ 
          background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)', 
          borderTop: '1px solid rgba(30, 64, 175, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(30,64,175,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 1
          }} />

          <div className="mx-auto px-6 sm:px-12 py-16 relative" style={{ maxWidth: 1280, zIndex: 2 }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12" style={{ borderBottom: '1px solid rgba(15,23,42,0.15)' }}>
              
              {/* Brand Column (takes 4 cols on desktop) */}
              <div className="md:col-span-4 flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'linear-gradient(135deg, #1e40af, #ea580c)' }}>
                    <Layers style={{ color: '#fff' }} className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xl tracking-tight" style={{ color: T.text }}>HexaCv</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: T.muted, maxWidth: 300 }}>
                  Build standard, print-safe professional resumes with zero AI hallucinations. Secure your dream job with HexaStack Solutions.
                </p>
                {/* Social Badges */}
                <div className="flex items-center gap-3 mt-2">
                  {[
                    { icon: Github, href: 'https://github.com/suragms/HexaCv' },
                    { icon: Linkedin, href: 'https://linkedin.com' },
                    { icon: Twitter, href: 'https://twitter.com' },
                    { icon: Mail, href: 'mailto:info@hexastacksolutions.com' }
                  ].map((soc, idx) => (
                    <a key={idx} href={soc.href} target="_blank" rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36, height: 36, borderRadius: '50%',
                        backgroundColor: 'rgba(15,23,42,0.05)',
                        border: '1px solid rgba(15,23,42,0.1)',
                        color: T.muted,
                        transition: 'all 200ms ease'
                      }}
                      className="hover:scale-110 hover:border-orange-500 hover:text-orange-600 transition-all"
                    >
                      <soc.icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Link Columns (take 2 cols each on desktop = 6 total) */}
              <div className="grid grid-cols-2 md:col-span-5 gap-8">
                {/* Product Links */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.primaryText }}>Product</h4>
                  <div className="flex flex-col gap-3">
                    {footerLinks.product.map(link => (
                      <Link key={link} href={link === 'Resume Builder' ? '/builder' : link === 'Pricing' ? '#pricing' : '#'}
                        style={{ color: T.text, opacity: 0.75 }}
                        className="text-sm hover:opacity-100 hover:text-orange-500 transition-all font-medium"
                      >{link}</Link>
                    ))}
                  </div>
                </div>

                {/* Company & Info */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: T.primaryText }}>Company</h4>
                  <div className="flex flex-col gap-3">
                    {footerLinks.company.map(link => (
                      <a key={link} href="https://www.hexastacksolutions.com/" target="_blank" rel="noopener noreferrer"
                        style={{ color: T.text, opacity: 0.75 }}
                        className="text-sm hover:opacity-100 hover:text-orange-500 transition-all font-medium"
                      >{link}</a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Newsletter / CTA Column (takes 3 cols on desktop) */}
              <div className="md:col-span-3 flex flex-col gap-4">
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: T.primaryText }}>Stay Updated</h4>
                <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
                  Subscribe to get the latest resume templates and career growth tips.
                </p>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="relative flex items-center">
                    <input type="email" placeholder="Enter your email" 
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: 13,
                        borderRadius: T.radius,
                        backgroundColor: '#fff',
                        border: '1px solid rgba(15,23,42,0.15)',
                        color: T.text,
                        outline: 'none',
                        transition: 'border-color 200ms ease'
                      }}
                      className="focus:border-orange-500 transition-all placeholder:opacity-50"
                    />
                  </div>
                  <Button size="sm" style={{
                    backgroundColor: T.accent,
                    color: '#fff',
                    borderRadius: T.radius,
                    fontWeight: 600,
                    fontSize: 13,
                    padding: '10px 16px',
                    transition: 'all 200ms ease'
                  }} className="hover:opacity-95 hover:shadow-lg active:scale-95 transition-all w-full">
                    Subscribe
                  </Button>
                </div>
              </div>

            </div>

            {/* Bottom Credits Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4 text-xs" style={{ color: T.muted }}>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <span>© 2026 HexaStack Solutions. All rights reserved.</span>
                <span style={{ color: 'rgba(68,70,83,0.3)' }}>|</span>
                <span className="font-semibold" style={{ color: T.text }}>Designed by Surag & Anandu Krishna</span>
              </div>
              <div className="flex gap-6">
                {footerLinks.legal.map(link => (
                  <a key={link} href="#" className="hover:text-orange-500 transition-colors">{link}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
