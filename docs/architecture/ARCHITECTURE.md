# HexaCV — ARCHITECTURE.md (Grounded in Current Codebase)
Prepared for: Anandu / HexaStack Solutions
This is the accurate as-built architecture, read directly from the
uploaded repo (`HexaCv-main.zip`), not the aspirational stack named
in earlier planning docs. Where a V2–V6 doc assumed a different
detail (e.g. Razorpay, Next.js), this file corrects it — **treat
this file as the source of truth for "what's actually there,"** and
the V2–V6 docs as the plan for what to build on top of it.

---

## 1. Stack (as-built, verified from package.json / config files)

| Layer | Actual | Note vs. earlier docs |
|---|---|---|
| Frontend | React (Vite build), Wouter/React Router-style pages in `client/src/pages/` | Earlier memory note said "Next.js" — incorrect, this is Vite + Express, not Next |
| UI kit | Radix UI primitives + Tailwind (shadcn-style components) | matches frontend-design conventions |
| Data fetching | tRPC client (`@trpc/client`, `@trpc/react-query`) + TanStack Query | typed end-to-end, no separate REST layer for app data |
| Backend | Express (`server/_core/index.ts`), tRPC router (`server/routers.ts`) | single Node process, not serverless functions |
| ORM / DB | Drizzle ORM, **MySQL** dialect (`drizzle.config.ts` → `dialect: "mysql"`) | V2/V3 docs said "MySQL/TiDB" — MySQL confirmed, TiDB unconfirmed (likely the hosting choice, compatible either way) |
| Auth | **Manus OAuth** (`server/_core/oauth.ts`), `openId` unique column on `users` | not Clerk/Google/Apple yet — V4 Phase D (multi-provider auth) is still a real gap, not yet built |
| File storage | AWS S3 (`@aws-sdk/client-s3`, `storageProxy.ts`) | for uploaded resumes/exports |
| Payments | **Razorpay primary** (`server/payments/razorpay.ts`, `POST /api/webhooks/razorpay`, `billing.createCheckoutSession` + `verifyRazorpayPayment`, `payment_orders`). **Stripe legacy** (`stripeWebhook.ts` + `processed_stripe_events`) for existing Stripe customers only — no dual-live Checkout UI when `PAYMENT_PROVIDER=razorpay`. | F-decide flipped: Razorpay is sole new checkout path. |
| PDF export | `html2canvas` (+ likely jsPDF, check `package.json` PDF deps before building Page 8 changes) | client-side render-to-PDF, matches V5 Page 8 spec |
| Testing | Vitest (`*.test.ts` files already exist: `contentValidation.test.ts`, `guest.test.ts`, `country.test.ts`, `auth.logout.test.ts`) | V2_ROADMAP §12's "test suite" instinct already has a real home — extend these files, don't create a parallel test system |

## 2. Backend module map (what owns what today)

```
server/
├── routers.ts          ← single tRPC appRouter, all procedures
│                          (auth, resume, jobDescription, ai,
│                           organization, marketplace, affiliate,
│                           recruiter, billing, support, backup, admin)
├── ai/
│   ├── pipelineOrchestrator.ts ← C1 Extract→Target→Rewrite (+ C2/C3)
│   └── grounding.ts            ← shared no-fabrication rules
├── aiSuggestions.ts     ← feature LLM helpers (cover letter, ATS, etc.)
├── promptVersions.ts    ← C5 prompt_versions + resume_evaluations
├── apiKeyManager.ts     ← provider/model key handling + AI_PAUSED
├── usageTracker.ts      ← usage_logs, quotas, spend ceiling
├── contentValidation.ts ← C3 deterministic evaluator
├── countryRoutes.ts     ← country-rule engine (V2_ROADMAP §8)
├── fileParser.ts        ← resume upload parsing (Page 4)
├── payments/razorpay.ts ← Razorpay orders, verify, fulfill, refund
├── razorpayWebhook.ts   ← POST /api/webhooks/razorpay
├── subscriptionGrace.ts ← F4 grace period
├── stripeWebhook.ts     ← legacy Stripe webhook only
├── db.ts                ← query layer over Drizzle (mockDb fallback)
└── _core/
    ├── oauth.ts         ← Manus OAuth flow
    ├── trpc.ts          ← procedure builders (publicProcedure,
    │                       protectedProcedure, adminProcedure)
    ├── context.ts       ← per-request ctx (user, etc.)
    ├── env.ts           ← env var loading/validation
    ├── llm.ts           ← LLM provider call wrapper
    └── ...
```

**Router namespaces that already exist** (from `routers.ts`):
`auth`, `resume`, `jobDescription`, `ai`, `organization`,
`marketplace`, `affiliate`, `recruiter`, `billing`, `support`,
`backup`, `admin`. Several of these (`organization`, `marketplace`,
`recruiter`) are broader SaaS surface than the V2–V6 docs discuss —
worth an explicit decision on whether they're active product
surface or early scaffolding to prune, before adding more scope on
top of them.

## 3. Database schema (as-built tables, `drizzle/schema.ts`)

| Table | Purpose | Notes for V6 work |
|---|---|---|
| `users` | Core account, `openId`, `role` (user/admin), `loginMethod` | `role` enum already supports admin-gating (`adminProcedure` in trpc.ts) |
| `resumes` | id (uuid), userId, title, templateId, jobDescriptionId, `content` (JSON) | one JSON blob per resume — the whole resume tree lives here, not normalized per-section |
| `jobDescriptions` | JD text + extracted keywords JSON | Stage 2 TARGET output lands here |
| `subscriptions` | userId, tier, status, **provider** (generic string — already supports Stripe today, Razorpay later without a schema change), referenceId, start/end | good — this table is provider-agnostic already |
| `supportTickets` | support router backing | |
| `organizations`, `organizationMembers` | multi-user/org accounts | scope question above |
| `marketplaceItems` | marketplace router backing | scope question above |
| `affiliateReferrals` | referral tracking — **current schema/logic reward on click+email match, not signup+24h+action gate** (see §5 below) | needs the anti-abuse rework from V6_PAYMENTS §H2 |
| `recruiterJobs`, `jobApplications` | recruiter-facing job/application flow | separate product surface, not part of the resume-builder flow in V5 |
| `countries`, `states`, `districts`, `cities`, `countrySettings`, `countryPhoneCodes`, `countryAtsRules` | country-rule engine backing (V2_ROADMAP §8) | already fairly built out — more complete than the roadmap doc implied |
| `guestSessions` | guest-mode tracking | backs the guest→signup migration in V5 Page 2 |
| `resumeHistory` | version history per resume | could back the "resume re-check preserves userEdited fields" flow (V4 C4) if not already |
| `cloudBackups` | backup router backing | |

**Present in schema (shipped):** `usage_logs`, `model_routing`,
`prompt_versions`, `resume_evaluations`, `payment_orders`,
`processed_stripe_events`, `subscriptions.graceUntil`.

**Still missing (later waves):** `blog_posts`, `admin_audit_log`,
referral anti-abuse columns (`flaggedForReview`) until H/R2.

## 4. AI pipeline — actual vs. planned

**Read [`docs/ai/PIPELINE.md`](../ai/PIPELINE.md) and [`docs/ai/MODELS_AND_KEYS.md`](../ai/MODELS_AND_KEYS.md)** — those are the live source of truth.

As-built: **C1–C5** via `server/ai/pipelineOrchestrator.ts` +
`contentValidation.ts` + `promptVersions.ts`; feature helpers in
`aiSuggestions.ts`; usage via `usageTracker.ts` → `usage_logs`;
failover in `_core/llm.ts` / `apiKeyManager` (`model_routing`).
Polish / full self-improving loop is **not** built. `AI_PAUSED`
gates `ai.*` only (`resume.parse` bypasses by design).

## 5. Known real gap — billing (mitigated)

**P1 done:** `billing.upgradePlan` was removed; tier changes go through
verified Razorpay fulfill (`payment_orders` → `verified`), legacy
Stripe webhook, or `admin.manualGrantSubscription` with a logged reason.

Razorpay webhook accepts unsigned payloads only when
`RAZORPAY_WEBHOOK_SECRET` is unset (sandbox). Production must set
key id, key secret, and webhook secret before live charges.
Stripe webhook remains for legacy subscribers (`STRIPE_WEBHOOK_SECRET`
required in prod for that path).

## 6. Deployment shape (inferred, confirm before relying on this)
- Single Node process serves both the built Vite client (static)
  and the Express/tRPC API (`vite.ts` in `server/_core/` suggests
  Vite is used in middleware mode for dev, static-serve in prod)
- `.github/workflows/` exists — check what CI currently runs
  (likely `tsc --noEmit` + `vitest run` per `package.json` scripts)
  before adding new CI steps for V6 work, extend the existing
  workflow file rather than adding a parallel one

---

## Cursor scope-lock notes
- This file should be re-verified (not re-guessed) any time a major
  V6+ phase starts — grep the actual files named here rather than
  assuming this snapshot stays accurate as the codebase changes.
- The F-decide is **Razorpay primary**; Stripe is legacy. F2 orders +
  F4 grace shipped. Next waves: legal pages (G1–G3), F5 refund —
  follow [`docs/tasks/NEXT.md`](../tasks/NEXT.md).
