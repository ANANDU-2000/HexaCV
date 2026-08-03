# 1. Landing Page

> First impression + primary conversion funnel. Two-column hero (desktop) with the
> resume preview as the hero visual, entry cards, and proof sections below.

**Status:** Implemented · **NEW:** pain-point headline, trust strip, real rendered preview.

## Purpose
Convert a visiting job seeker into a resume-build within one screen: state the pain,
show the output, and let them start with what they already have (upload / paste / LinkedIn).

## User flow
1. Visitor lands → reads pain-point headline → sees the real resume output.
2. Chooses an entry:
   - **Upload Existing (PDF/Word)** — primary card, drag-drop or click. Opens the
     extraction window ([upload-and-extraction.md](upload-and-extraction.md)).
   - **Start from scratch / Paste text** — expandable textarea (floating label) → draft card.
   - **Import from LinkedIn** — routes to `/builder/linkedin`.
3. Scrolls through proof sections, then the bottom CTA scrolls back to the top.

## Implementation (`client/src/pages/Landing.tsx` + `client/src/components/landing/`)
| Section | Component / detail |
|---------|--------------------|
| Header/nav | Sticky, transparent→blur on scroll; login/dashboard/sign-out |
| Hero left | Eyebrow ("ATS-friendly resumes for Gulf & India"), H1 **"Stop being ghosted."**, outcome subhead, ₹99 pricing strip, 3 entry cards, draft card, **NEW** honest trust strip (grounded · Gulf & India · PDF+Word · guest drafts on-device) |
| Hero right | **NEW** real `ResumePreview` of the Civil Engineer (Abu Dhabi) sample, scaled from the A4 engine, with matched-keyword chips |
| How it works | `HowItWorksStrip` — 4 steps (Upload/paste/LinkedIn → AI tailor → Review & edit → Download) |
| Grounding proof | `GroundingProof` — before/after rewrite comparison (XCircle vs CheckCircle2) |
| Output gallery | `OutputPreviewRow` — 4 real rendered samples (Abu Dhabi, UAE, India, Saudi), shared from `lib/sampleResumes.ts` |
| Pricing teaser | `PricingTeaser` — first build ₹0 / each build ₹99 (3 for ₹249) / PDF+Word |
| FAQ | `LandingFaq` — accordion (data safety, grounding, Gulf/India, cost, formats) |
| Footer | Product/legal links, LinkedIn |

## Key details
- Sample resumes are built once in `client/src/lib/sampleResumes.ts` and rendered
  with the **real** `ResumePreview` engine, so the hero/gallery show exactly what's exported.
- Trust strip uses only **verifiable** claims — no fabricated ratings/counts
  (product rule: "honesty over spectacle").
- Mobile: cards stack full-width, preview hidden; pricing strip sits above the cards.

## New additions (this cycle)
- Pain-point headline ("Stop being ghosted.") per category research (Enhancv/Rezi/Resume.io).
- Honest trust strip + upload card "Most used" badge.
- Real rendered resume as hero visual (replaces the hand-built static card).
- Output gallery expanded to 4 samples; PricingTeaser + FAQ aligned to the ₹99/build model.

## Edge cases
- Parse failure → inline error under the card (not a toast).
- Empty paste → CTA disabled, helper text shown.
- No account needed to upload/paste; sign-in only at the build step.
