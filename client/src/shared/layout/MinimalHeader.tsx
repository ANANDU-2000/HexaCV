import { SiteBrand } from "@/shared/layout/SiteHeader";

/** Logo-only bar for auth pages — no nav links, no auth CTAs. */
export default function MinimalHeader() {
  return (
    <header className="sticky top-0 left-0 right-0 z-50 border-b border-border bg-background/92 backdrop-blur-md">
      <div
        className="mx-auto flex h-16 items-center px-4 sm:px-8"
        style={{ maxWidth: 1280 }}
      >
        <SiteBrand />
      </div>
    </header>
  );
}
