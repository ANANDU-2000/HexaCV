import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/shared/ui/button";
import { ArrowRight } from "lucide-react";
import { loadEntryDraft, type EntryDraft } from "@/lib/entryDraft";
import SiteHeader from "@/shared/layout/SiteHeader";
import SiteFooter from "@/shared/layout/SiteFooter";

/**
 * Pre-targeting parsed-data review — PLAN.md §3 / DESIGN_DESKTOP.
 * Shows name + sections found so the user can catch parser mistakes.
 */
export default function ParseReview() {
  const [, setLocation] = useLocation();
  const [draft, setDraft] = useState<EntryDraft | null>(null);

  useEffect(() => {
    const d = loadEntryDraft();
    if (!d) {
      setLocation("/");
      return;
    }
    // Scratch/paste with no parse still goes through so user confirms intent
    setDraft(d);
  }, [setLocation]);

  if (!draft) {
    return (
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading your draft…</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const continueToTarget = () => {
    // Guests proceed too — sign-in is gated at the build step, not the review.
    setLocation("/builder/target");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Does this look right?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Check what we extracted before we match it to a role. You can fix anything later.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Name
              </dt>
              <dd className="mt-1 text-base font-medium text-foreground">
                {draft.name || "Not detected — you can add it in the editor"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Source
              </dt>
              <dd className="mt-1 text-base text-foreground">
                {draft.filename || (draft.source === "paste" ? "Pasted text" : draft.source)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sections found
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {(draft.sectionsFound || []).length === 0 ? (
                  <span className="text-sm text-muted-foreground">None yet — we will structure on build</span>
                ) : (
                  draft.sectionsFound!.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground"
                    >
                      {s}
                    </span>
                  ))
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="no-underline sm:flex-1">
            <Button variant="outline" className="min-h-11 w-full rounded-[18px]">
              Go back
            </Button>
          </Link>
          <Button
            className="min-h-11 flex-1 rounded-[18px] bg-accent-warm font-semibold text-white hover:bg-accent-warm/90"
            onClick={continueToTarget}
          >
            Looks good — continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
