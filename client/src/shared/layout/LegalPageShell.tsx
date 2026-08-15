import type { ReactNode } from "react";
import SiteHeader from "@/shared/layout/SiteHeader";
import SiteFooter from "@/shared/layout/SiteFooter";

type Props = {
  title?: string;
  children: ReactNode;
};

/**
 * Chrome for legal pages and 404: site header (logo is the back-to-home path),
 * a centered prose column, and the shared footer.
 */
export default function LegalPageShell({ title, children }: Props) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full flex-1 px-4 py-10 sm:px-8" style={{ maxWidth: 720 }}>
        {title ? (
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        ) : null}
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
