import LegalPageShell from "@/shared/layout/LegalPageShell";
import { LegalPlaceholder } from "@/shared/layout/LegalPageLayout";

export default function CookiePolicy() {
  return (
    <LegalPageShell title="Cookie Policy">
      <div className="mt-8 flex flex-col gap-8 text-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. Essential session cookies</h2>
          <LegalPlaceholder>
            Authentication / session cookies required to keep you signed in.
          </LegalPlaceholder>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">2. Analytics (if enabled)</h2>
          <LegalPlaceholder>
            Disclose any analytics cookies only after they are actually deployed.
          </LegalPlaceholder>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">3. Managing cookies</h2>
          <LegalPlaceholder />
        </section>
      </div>
    </LegalPageShell>
  );
}
