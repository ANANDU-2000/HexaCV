import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Layers, Menu, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
];

type SiteHeaderProps = {
  /** Landing overlay: transparent until the page scrolls, then blur. Inner pages pass false. */
  transparentOnScroll?: boolean;
  /** Log in / Dashboard / Sign out. Login and Register hide this to avoid duplicating their CTAs. */
  showAuth?: boolean;
};

export default function SiteHeader({
  transparentOnScroll = false,
  showAuth = true,
}: SiteHeaderProps) {
  const { isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparentOnScroll) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentOnScroll]);

  const overlayClear = transparentOnScroll && !scrolled;

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return location === href;
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`${
        transparentOnScroll ? "fixed" : "sticky"
      } top-0 left-0 right-0 z-50 transition-all duration-300 ${
        overlayClear
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border bg-background/92 backdrop-blur-md"
      }`}
    >
      <div
        className="mx-auto flex h-16 items-center justify-between px-4 sm:px-8"
        style={{ maxWidth: 1280 }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline" onClick={closeMenu}>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
            aria-hidden="true"
          >
            <Layers className="h-4 w-4 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-primary">
            HexaCv
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`text-sm font-medium no-underline transition-colors hover:text-foreground ${
                isActive(link.href) ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {showAuth ? (
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
                <Button
                  variant="ghost"
                  className="min-h-11 text-muted-foreground"
                  onClick={() => logout()}
                >
                  Sign out
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="hidden md:block" />
        )}

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-b border-border bg-background p-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`min-h-11 inline-flex items-center text-sm font-medium no-underline ${
                  isActive(link.href) ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </a>
            ))}
            {showAuth &&
              (!isAuthenticated ? (
                <Link href="/login" className="no-underline" onClick={closeMenu}>
                  <Button variant="outline" className="min-h-11 w-full">
                    Log in
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard" className="no-underline" onClick={closeMenu}>
                  <Button variant="outline" className="min-h-11 w-full">
                    Dashboard
                  </Button>
                </Link>
              ))}
          </div>
        </div>
      )}
    </header>
  );
}
