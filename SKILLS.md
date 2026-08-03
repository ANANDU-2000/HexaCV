# HexaCV — SKILLS.md (Cursor / AI Coding Rules)

Use this file as a system prompt or project rule for Cursor (and similar agents) working on HexaCV.  
Canonical product docs: `MASTER.md`, `PLAN.md`, `AGENT_TASKS.md`, `DESIGN.md`, `DESIGN_DESKTOP.md`, `DESIGN_MOBILE.md`, `LOGIC.md`, `RESTRICTIONS.md`, `API-LIMITS.md`, `PROMPTS.md`, `ADMIN.md`, `docs/design/DESIGN_STRICT.md`.

---

## Identity

You are building **HexaCV** — a pay-per-use, region-aware AI resume builder. It must feel calm, honest, and professional. It must **never** feel like generic AI SaaS (indigo gradients, sparkles, fake ATS scores, invented career facts).

---

## Absolute product rules

1. **₹99 per build**, not subscription. First build free once per account.
2. **Capture before auth** — drafts in `sessionStorage` must survive signup/login.
3. **Manual edits always free.** AI-assist edits after build are metered (ask on price — §10).
4. **No invented facts.** Empty > fabricated. Grounding strings live in `server/ai/grounding.ts`.
5. **Failed generation = no charge.** Auto-retry once, then release hold + plain error.
6. **Do not invent pricing, regions, template counts, LinkedIn scope, or referral rewards.** If PLAN.md §10 marks it open, **stop and ask**.

---

## BLOCKED (§10) — stop and ask

Before implementing any of these, ask the product owner:

1. Region list (India / Gulf / Ireland vs Kerala/Gulf focus)
2. AI-edit included free count + top-up price (placeholder ₹19 / 3)
3. LinkedIn import scope this cycle vs v2
4. Template count at launch
5. Referral reward value (assumed 1 free credit on referred user's first paid build)

---

## Codebase anchors (prefer editing these over inventing new systems)

| Concern | Path |
| --- | --- |
| Pages | `client/src/pages/*.tsx` |
| Tokens / CSS | `client/src/index.css` |
| Pipeline | `server/ai/pipelineOrchestrator.ts` |
| Grounding | `server/ai/grounding.ts` |
| Validation | `server/contentValidation.ts` |
| Prompt versions | `server/promptVersions.ts` |
| Parse | `server/fileParser.ts` |
| Usage / limits | `server/usageTracker.ts`, `server/apiKeyManager.ts` |
| Payments | `server/payments/razorpay.ts`, `server/razorpayWebhook.ts` |
| Admin | `client/src/components/AdminCRM.tsx` |
| Referral | `client/src/components/AffiliateSystem.tsx` + `DashboardLayout.tsx` (rename to Refer & Earn; already wired) |

Refine existing pipeline stages — do not rebuild a parallel AI stack.

---

## Design rules (must follow)

- Ledger palette + Fraunces / Public Sans — see `DESIGN.md`. Replace `#1e40af` / `#2563eb` / `#b8c4ff`.
- Anti-slop: no purple gradients, blobs, sparkle icons, fake ATS %.
- Icons: Tabler outline (`ti-*`) only.
- **One scroll container per page** (`DESIGN_STRICT.md`).
- Desktop split layouts only ≥1024px; mobile uses sequential/toggle patterns (`DESIGN_MOBILE.md`).
- Pipeline loader: five real phases with literal copy from PLAN §5 — no fake progress %.

---

## Backend rules

- Async/await; validate all inputs server-side.
- AI calls through `trackedInvokeLLM` so usage is logged.
- Respect `AI_PAUSED` on `ai.*`.
- Never mutate active prompt bodies — insert + promote versions.
- Razorpay: verify webhooks; fixed ₹99; idempotent unlocks.
- Ownership checks on every resume read/write/export.
- Plain-language errors to clients — no stack traces.

---

## Frontend rules

- Type explicitly; prefer existing tRPC client patterns.
- Loading / empty / error states for every data view.
- Dynamic CTA copy: "Build my resume — free" / "Build my resume — ₹99".
- Preview must match export template engine.
- Referral nav label: **Refer & Earn** (route may stay `/dashboard/affiliate`).

---

## How to take a task

1. Read `MASTER.md` index → open the relevant doc.
2. Find the page section in `AGENT_TASKS.md` (Logic → Inputs → Tasks).
3. Implement the smallest vertical slice that matches PLAN + DESIGN.
4. If you hit **BLOCKED (§10)** or ambiguous monetization — ask, do not guess.
5. Do not expand scope into HexaTrack / unrelated finance OS rules; this repo is HexaCV.

---

## Definition of done (feature slice)

- [ ] Matches PLAN logic (credits, gating, no invention)
- [ ] Matches DESIGN_DESKTOP or DESIGN_MOBILE for the viewport
- [ ] Passes DESIGN_STRICT scroll/tap checks
- [ ] Grounding/validation not weakened
- [ ] Failed AI path does not charge
- [ ] No new subscription UX introduced
