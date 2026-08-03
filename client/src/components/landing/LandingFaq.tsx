import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';

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
    q: 'Can I use it as a guest, and what does it cost?',
    a: 'You can start as a guest with no sign-up, and guest drafts stay on your device. Your first build is free on every new account. After that, each resume build is ₹99 — no subscription and no recurring charges.',
  },
  {
    q: 'What export formats do I get?',
    a: 'You export an ATS-friendly PDF and a Word file, both rendered from the same templates you see in the editor preview — so what you download matches what you reviewed.',
  },
];

export default function LandingFaq() {
  return (
    <section
      aria-label="Frequently asked questions"
      className="border-y border-border bg-card"
    >
      <div className="mx-auto px-4 sm:px-8" style={{ maxWidth: 760, paddingTop: 72, paddingBottom: 72 }}>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Common questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`} className="border-border">
              <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
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
