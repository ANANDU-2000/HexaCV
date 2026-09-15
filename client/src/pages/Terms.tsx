import LegalPageShell from "@/shared/layout/LegalPageShell";
import { LegalPlaceholder } from "@/shared/layout/LegalPageLayout";

export default function Terms() {
  return (
    <LegalPageShell title="Terms of Service">
      <div className="mt-8 flex flex-col gap-8 text-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. What you are buying</h2>
          <LegalPlaceholder>
            Describe download access / subscription access to HexaCv tools — not a job, interview, or hiring outcome.
          </LegalPlaceholder>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">2. Account termination</h2>
          <LegalPlaceholder>
            Conditions under which HexaStack may suspend or terminate accounts; user right to close an account.
          </LegalPlaceholder>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">3. AI-output disclaimer</h2>
          <LegalPlaceholder>
            Resume content may be AI-assisted. The user is responsible for factual accuracy of source input and of any AI suggestions they accept or export.
          </LegalPlaceholder>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">4. Acceptable use</h2>
          <LegalPlaceholder />
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">5. Limitation of liability</h2>
          <LegalPlaceholder />
        </section>
      </div>
    </LegalPageShell>
  );
}
