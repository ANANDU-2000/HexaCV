import { Link } from "wouter";
import { Linkedin } from "lucide-react";

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

export default function SiteFooter() {
  return (
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
  );
}
