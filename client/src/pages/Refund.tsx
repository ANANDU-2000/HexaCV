import LegalPageLayout, { LegalPlaceholder } from "@/components/LegalPageLayout";
import { Link } from "wouter";

export default function Refund() {
  return (
    <LegalPageLayout title="Refund Policy">
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">1. Refund window</h2>
        <LegalPlaceholder>
          Example framing for lawyer: refund within 24 hours if the paid deliverable (download / paid access) has not been used — exact window is a business decision.
        </LegalPlaceholder>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">2. Non-refundable after delivery</h2>
        <LegalPlaceholder>
          Downloads or paid access already delivered may be non-refundable once the deliverable was received.
        </LegalPlaceholder>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">3. How to request a refund</h2>
        <LegalPlaceholder>
          Request via in-app Support (not an instant self-serve auto-refund). Admins process refunds through the Razorpay refund path (F5).
        </LegalPlaceholder>
        <p className="text-sm mt-3 text-[#94a3b8]">
          Open a ticket from{" "}
          <Link href="/dashboard/settings" className="text-[#ea580c] no-underline hover:underline">
            Settings / Support
          </Link>{" "}
          after signing in.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">4. Chargebacks</h2>
        <LegalPlaceholder />
      </section>
    </LegalPageLayout>
  );
}
