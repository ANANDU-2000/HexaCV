# HexaCV Feature Documentation

This folder is the **complete feature blueprint** for building HexaCV — a grounded,
pay-per-build AI resume builder for Gulf & India job seekers.

Each file documents one feature area: purpose, user flow, implementation (files),
key decisions, and edge cases. Items marked **NEW** were added in the current
development cycle (guest-flow fix, landing redesign, build bundles, extraction
window, contextual editor, floating labels, 44px tap targets).

## Feature index

| # | Feature | File | Status |
|---|---------|------|--------|
| — | **End-to-end workflows** | [workflows.md](workflows.md) | Flow A · Flow B · guest · billing · pipeline |
| — | **Page-by-page map** | [pages.md](pages.md) | All 15 routes |
| 1 | Landing page | [landing.md](landing.md) | Implemented + **NEW** hero |
| 2 | PDF/DOCX upload & extraction | [upload-and-extraction.md](upload-and-extraction.md) | Implemented + **NEW** extraction window |
| 3 | Target role, region & JD | [targeting.md](targeting.md) | Implemented + **NEW** guest access / Confirm & Pay |
| 4 | AI resume pipeline | [ai-pipeline.md](ai-pipeline.md) | Implemented |
| 5 | Grounding & validation | [grounding-validation.md](grounding-validation.md) | Implemented |
| 6 | Resume editor | [resume-editor.md](resume-editor.md) | Implemented + **NEW** 44px targets |
| 7 | Contextual editor | [contextual-editor.md](contextual-editor.md) | **NEW** |
| 8 | Export (PDF / Word) | [export.md](export.md) | Implemented |
| 9 | Billing & credits | [billing-credits.md](billing-credits.md) | Implemented + **NEW** build bundles |
| 10 | Auth & guest mode | [auth-and-guest.md](auth-and-guest.md) | Implemented + **NEW** guest flow fix |
| 11 | Dashboard | [dashboard.md](dashboard.md) | Implemented |
| 12 | Pricing | [pricing.md](pricing.md) | Implemented + **NEW** packs grid |
| 13 | Regional ATS formatting | [regional-ats.md](regional-ats.md) | Implemented |
| 14 | Design system | [design-system.md](design-system.md) | Implemented + **NEW** floating labels |

## Product summary

- **Who it's for:** Gulf (UAE, KSA, Qatar…) and India job seekers getting ghosted by ATS.
- **Value prop:** rewrites a resume for the exact job applied to, grounded in the
  user's real experience — nothing invented — formatted for the target market.
- **Business model:** pay-per-build. First build free, then ₹99 per resume
  (bundles: 3 for ₹249, 5 for ₹399, 10 for ₹699). No subscription.
- **Stack:** React + Vite + Tailwind v4 (Ledger design tokens), tRPC, drizzle/Postgres
  (mock fallback), Razorpay payments, lucide-react icons, sonner toasts.
