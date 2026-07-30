import LegalPageLayout, { LegalPlaceholder } from "@/components/LegalPageLayout";

export default function CookiePolicy() {
  return (
    <LegalPageLayout title="Cookie Policy">
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">1. Essential session cookies</h2>
        <LegalPlaceholder>
          Authentication / session cookies required to keep you signed in.
        </LegalPlaceholder>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">2. Analytics (if enabled)</h2>
        <LegalPlaceholder>
          Disclose any analytics cookies only after they are actually deployed.
        </LegalPlaceholder>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">3. Managing cookies</h2>
        <LegalPlaceholder />
      </section>
    </LegalPageLayout>
  );
}
