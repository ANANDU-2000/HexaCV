import LegalPageShell from "@/shared/layout/LegalPageShell";
import { LegalPlaceholder } from "@/shared/layout/LegalPageLayout";
import { Link } from "wouter";

export default function Refund() {
  return (
    <LegalPageShell title="Refund Policy">
      <div className="mt-8 flex flex-col gap-8 text-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. Refund window</h2>
          <LegalPlaceholder>
            Example framing for lawyer: refund within 24 hours if the paid deliverable (download / paid access) has not been used — exact window is a business decision.
          </LegalPlaceholder>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">2. Non-refundable after delivery</h2>
          <LegalPlaceholder>
            Downloads or paid access already delivered may be non-refundable once the deliverable was received.
          </LegalPlaceholder>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">3. How to request a refund</h2>
          <LegalPlaceholder>
            Request via in-app Support (not an instant self-serve auto-refund). Admins process refunds through the Razorpay refund path (F5).
          </LegalPlaceholder>
          <p className="mt-3 text-sm text-muted-foreground">
            Open a ticket from{" "}
            <Link href="/dashboard/settings" className="text-accent-warm no-underline hover:underline">
              Settings / Support
            </Link>{" "}
            after signing in.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">4. Chargebacks</h2>
          <LegalPlaceholder />
        </section>
      </div>
    </LegalPageShell>
  );
}
