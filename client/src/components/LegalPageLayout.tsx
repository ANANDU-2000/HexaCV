import { Link } from "wouter";
import { Layers, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

const T = {
  bg: "#0b1326",
  surface: "#171f33",
  text: "#dae2fd",
  muted: "#94a3b8",
  accent: "#ea580c",
  border: "rgba(255,255,255,0.08)",
  placeholder: "#fbbf24",
};

type Props = {
  title: string;
  children: ReactNode;
};

export function LegalPlaceholder({ children }: { children?: ReactNode }) {
  return (
    <p
      className="text-sm leading-relaxed rounded-lg border px-3 py-2.5 mt-2"
      style={{
        color: T.placeholder,
        borderColor: "rgba(251,191,36,0.35)",
        backgroundColor: "rgba(251,191,36,0.08)",
      }}
    >
      [PLACEHOLDER — lawyer review required]
      {children ? <> {children}</> : null}
    </p>
  );
}

export default function LegalPageLayout({ title, children }: Props) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: T.bg, fontFamily: "Inter, sans-serif" }}
    >
      <header
        className="border-b px-4 sm:px-8 h-16 flex items-center justify-between"
        style={{ borderColor: T.border, backgroundColor: T.surface }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #1e40af, #ea580c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Layers style={{ color: "#fff" }} className="w-4 h-4" />
          </div>
          <span className="text-lg font-extrabold tracking-tight" style={{ color: T.text }}>
            HexaCv
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium no-underline min-h-[44px]"
          style={{ color: T.muted }}
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
      </header>

      <main className="mx-auto px-4 sm:px-8 py-10" style={{ maxWidth: 720 }}>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: T.text }}>
          {title}
        </h1>
        <p className="text-sm mb-8" style={{ color: T.muted }}>
          HexaStack Solutions · Structure only — final legal copy pending human/lawyer review.
        </p>
        <div className="flex flex-col gap-8">{children}</div>

        <nav className="mt-12 pt-6 border-t flex flex-wrap gap-4 text-sm" style={{ borderColor: T.border }}>
          <Link href="/terms" className="no-underline" style={{ color: T.accent }}>
            Terms
          </Link>
          <Link href="/privacy" className="no-underline" style={{ color: T.accent }}>
            Privacy
          </Link>
          <Link href="/refund" className="no-underline" style={{ color: T.accent }}>
            Refund
          </Link>
          <Link href="/cookies" className="no-underline" style={{ color: T.accent }}>
            Cookies
          </Link>
          <Link href="/pricing" className="no-underline" style={{ color: T.accent }}>
            Pricing
          </Link>
        </nav>
      </main>
    </div>
  );
}
