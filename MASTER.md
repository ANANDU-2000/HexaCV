# HexaCV Master Implementation Guide

Welcome to the **HexaCV "Cursor Pro" Blueprint**. This guide consolidates all strategic, design, and technical documentation into a single source of truth. Use this as your starting point for any development task.

---

## 1. Documentation Index

| File | Purpose | Key Audience |
| --- | --- | --- |
| [**PLAN.md**](./PLAN.md) | Product strategy, monetization, entry flow, open decisions (§10). | Stakeholders / PMs |
| [**AGENT_TASKS.md**](./AGENT_TASKS.md) | Per-page logic flow, inputs flow, and step-by-step agent tasks. | Developers / AI |
| [**PROMPTS.md**](./PROMPTS.md) | Professional, grounded AI prompt library (phase prompts + anti-fabrication). | AI Engineers |
| [**DESIGN.md**](./DESIGN.md) | Visual philosophy, Ledger palette, typography, anti-slop checklist. | UI/UX Designers |
| [**DESIGN_DESKTOP.md**](./DESIGN_DESKTOP.md) | Desktop-specific UI/UX specifications (≥1024px). | Frontend Devs |
| [**DESIGN_MOBILE.md**](./DESIGN_MOBILE.md) | Mobile-specific UI/UX specifications (375–430px). | Frontend Devs |
| [**LOGIC.md**](./LOGIC.md) | Application workflow, credit/payment states, AI pipeline logic. | Backend Devs |
| [**ADMIN.md**](./ADMIN.md) | Super Admin dashboard and monitoring specs. | Fullstack Devs |
| [**RESTRICTIONS.md**](./RESTRICTIONS.md) | System rules, validations, and compliance. | QA / Devs |
| [**API-LIMITS.md**](./API-LIMITS.md) | API management, costs, retries, kill switch. | DevOps / Backend |
| [**SKILLS.md**](./SKILLS.md) | Rules for guiding AI development ("Cursor Rules"). | Developers / AI |
| [**docs/design/DESIGN_STRICT.md**](./docs/design/DESIGN_STRICT.md) | Scroll, breakpoint, tap-target, and icon hard rules (still enforced). | Frontend Devs |

---

## 2. Core Product Pillars

### A. Grounded Professionalism

HexaCV never invents data. We transform raw, honest experience into high-impact professional narratives. Our AI is tuned to remove "AI fluff" and focus on quantifiable achievements present in the source material. See `PROMPTS.md`, `server/ai/grounding.ts`, and `server/contentValidation.ts`.

### B. Regional Precision

We target three distinct markets with unique hiring norms (final list pending PLAN.md §10 confirmation):

1. **India**: Focus on structure, clarity, and ATS keywords.
2. **Gulf (UAE/KSA)**: Focus on detailed experience and relocation readiness (visa/nationality fields available).
3. **Ireland**: Focus on European standards and achievement-based CVs (no DOB/photo).

### C. Frictionless Monetization

A clean ₹99 pay-per-use model. No subscriptions. First build free per account. Users capture data before signup; they see value through a live preview before paying. Manual edits are always free. See PLAN.md §2 and §7.

---

## 3. How to Use This Blueprint

1. **Read PLAN.md** to understand the "Why" and the "Who" — and stop on every §10 open decision rather than guessing.
2. **Follow AGENT_TASKS.md** sequentially (or page-by-page) to build the product.
3. **Apply PROMPTS.md** to the AI backend to keep grounding rules intact.
4. **Reference DESIGN.md + DESIGN_DESKTOP.md / DESIGN_MOBILE.md** for all frontend implementation; obey DESIGN_STRICT.md for scroll/layout.
5. **Use SKILLS.md** as a system prompt for your AI coding assistant (Cursor) so it follows project rules.
6. **Consult LOGIC.md / ADMIN.md / RESTRICTIONS.md / API-LIMITS.md** when touching workflow, CRM, validation, or cost controls.

---

## 4. Current codebase anchors

| Area | Primary paths |
| --- | --- |
| Pages | `client/src/pages/*.tsx` |
| Pipeline | `server/ai/pipelineOrchestrator.ts`, `server/ai/grounding.ts` |
| Validation | `server/contentValidation.ts` |
| Prompts | `server/promptVersions.ts` |
| Usage / limits | `server/usageTracker.ts`, `server/apiKeyManager.ts` |
| Payments | `server/payments/razorpay.ts`, `server/razorpayWebhook.ts` |
| Admin UI | `client/src/components/AdminCRM.tsx` |
| Referral UI | `client/src/components/AffiliateSystem.tsx` (rename to Refer & Earn) |
