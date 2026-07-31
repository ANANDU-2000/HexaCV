import LegalPageLayout, { LegalPlaceholder } from "@/shared/layout/LegalPageLayout";

export default function Privacy() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">1. Resume content as personal data</h2>
        <LegalPlaceholder>
          Name, contact details, work history, and other resume fields are personal data and how HexaCv stores them.
        </LegalPlaceholder>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">2. Guest data retention</h2>
        <LegalPlaceholder>
          How long guest-session data is kept and what happens on signup conversion.
        </LegalPlaceholder>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">3. Sharing with AI providers</h2>
        <LegalPlaceholder>
          OpenRouter / Anthropic / Gemini / other configured providers may receive resume content to generate output — disclose plainly.
        </LegalPlaceholder>
      </section>
      <section id="evaluation-opt-out">
        <h2 className="text-lg font-bold text-[#dae2fd]">4. Evaluation-dataset opt-out</h2>
        <LegalPlaceholder>
          Users may opt out of contributing AI quality ratings (thumbs) to the evaluation dataset via Account Settings. When off, evaluations are not stored.
        </LegalPlaceholder>
      </section>
      <section id="cookies">
        <h2 className="text-lg font-bold text-[#dae2fd]">5. Cookies and session</h2>
        <LegalPlaceholder>
          Session cookies for authentication; see also the Cookie Policy page.
        </LegalPlaceholder>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#dae2fd]">6. Contact</h2>
        <LegalPlaceholder />
      </section>
    </LegalPageLayout>
  );
}
