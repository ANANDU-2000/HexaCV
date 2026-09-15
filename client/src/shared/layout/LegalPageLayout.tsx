import { Link } from "wouter";
import type { ReactNode } from "react";
import LegalPageShell from "@/shared/layout/LegalPageShell";

type Props = {
  title: string;
  children: ReactNode;
};

export function LegalPlaceholder({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-2 rounded-[var(--radius)] border border-[color:var(--warning)]/35 bg-[color:var(--warning)]/10 px-3 py-2.5 text-sm leading-relaxed text-[color:var(--warning)]">
      [PLACEHOLDER — lawyer review required]
      {children ? <> {children}</> : null}
    </p>
  );
}

export default function LegalPageLayout({ title, children }: Props) {
  return (
    <LegalPageShell title={title}>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        HexaStack Solutions · Structure only — final legal copy pending human/lawyer review.
      </p>
      <div className="flex flex-col gap-8">{children}</div>

      <nav
        className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-sm"
        aria-label="Legal pages"
      >
        <Link href="/terms" className="text-accent-warm no-underline hover:underline">
          Terms
        </Link>
        <Link href="/privacy" className="text-accent-warm no-underline hover:underline">
          Privacy
        </Link>
        <Link href="/refund" className="text-accent-warm no-underline hover:underline">
          Refund
        </Link>
        <Link href="/cookies" className="text-accent-warm no-underline hover:underline">
          Cookies
        </Link>
        <Link href="/pricing" className="text-accent-warm no-underline hover:underline">
          Pricing
        </Link>
      </nav>
    </LegalPageShell>
  );
}
