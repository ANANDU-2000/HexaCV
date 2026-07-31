import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';

// Light marketing tokens, kept in sync with Landing.tsx
const T = {
  surface: '#ffffff',
  text: '#0f172a',
  muted: '#475569',
  border: '#e2e8f0',
};

const FAQ_ITEMS = [
  {
    q: 'Is my resume data safe?',
    a: 'Your resume content is used only to build and improve your resume. It is not sold or shared with recruiters or third parties. Guest drafts stay in your browser until you choose to sign in and save, and you can delete saved resumes at any time.',
  },
  {
    q: 'Will the AI invent achievements or metrics for me?',
    a: 'No. That is the core of HexaCv. After a rewrite, grounding checks compare every claim against your uploaded resume or notes. Numbers, titles, or achievements that cannot be traced to your source are stripped or blocked, not padded in.',
  },
  {
    q: 'Does HexaCv support Gulf and India resume formats?',
    a: 'Yes. Formatting and wording guidance is tuned for UAE, Saudi Arabia, and India hiring norms, including regional terminology, layout expectations, and ATS-friendly structure for those markets.',
  },
  {
    q: 'Can I use it as a guest, and what does the free plan include?',
    a: 'You can start as a guest with no sign-up. The free plan includes one resume workspace with limited AI usage and export. Signing in lets you save drafts, and upgrading removes the limits.',
  },
  {
    q: 'What export formats do I get?',
    a: 'You export an ATS-friendly PDF rendered from the same templates you see in the editor preview, so what you download matches what you reviewed.',
  },
];

export default function LandingFaq() {
  return (
    <section
      aria-label="Frequently asked questions"
      style={{
        backgroundColor: T.surface,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div className="mx-auto px-4 sm:px-8" style={{ maxWidth: 760, paddingTop: 72, paddingBottom: 72 }}>
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: T.text }}>
            Common questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`} style={{ borderColor: T.border }}>
              <AccordionTrigger
                className="text-base font-semibold hover:no-underline"
                style={{ color: T.text }}
              >
                {item.q}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
                  {item.a}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
