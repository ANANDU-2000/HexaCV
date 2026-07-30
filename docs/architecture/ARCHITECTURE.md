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
| Payments | **Stripe** (`stripe` package, `server/stripeWebhook.ts`, `billing` tRPC router) | V3's roadmap named Razorpay as the plan — **Stripe is what's actually integrated today.** Decide explicitly: keep Stripe (it's live and working) or migrate to Razorpay for India/Gulf-market card/UPI support. Don't build both. |
| PDF export | `html2canvas` (+ likely jsPDF, check `package.json` PDF deps before building Page 8 changes) | client-side render-to-PDF, matches V5 Page 8 spec |
| Testing | Vitest (`*.test.ts` files already exist: `contentValidation.test.ts`, `guest.test.ts`, `country.test.ts`, `auth.logout.test.ts`) | V2_ROADMAP §12's "test suite" instinct already has a real home — extend these files, don't create a parallel test system |

## 2. Backend module map (what owns what today)

```
server/
├── routers.ts          ← single tRPC appRouter, all procedures
│                          (auth, resume, jobDescription, ai,
│                           organization, marketplace, affiliate,
│                           recruiter, billing, support, backup, admin)
├── aiSuggestions.ts     ← the AI pipeline (extract/target/rewrite/
│                           validate/polish logic lives here — this
│                           IS the file V2_ROADMAP §1-§9 refers to)
├── apiKeyManager.ts     ← provider/model key handling
├── contentValidation.ts ← Stage 4 validation logic home
├── countryRoutes.ts     ← country-rule engine (V2_ROADMAP §8)
├── fileParser.ts        ← resume upload parsing (Page 4)
├── resumeSections.ts    ← section schema/helpers
├── storage.ts           ← S3 storage helpers
├── stripeWebhook.ts     ← payment webhook handler (raw body + sig verify)
├── db.ts                ← query layer over Drizzle (mockDb fallback
│                           present too — check if still used in prod paths)
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

**Missing tables** (needed for V6 work, not yet in schema):
`payment_orders` (if adding a second provider) or reuse `subscriptions.referenceId` for Stripe session/customer IDs, `blog_posts`, `admin_audit_log`, `usage_logs`, `model_routing`, `prompt_versions`, `resume_evaluations` — all of Phase A–C from V4 and Phase I from V6_MARKETING_ADMIN are still schema gaps, not yet built.

## 4. AI pipeline — actual vs. planned

`server/aiSuggestions.ts` is confirmed as the real home of the
extract/rewrite logic (function `extractResumeText` found there).
The 5-stage structure from V2_ROADMAP §1 (Extract → Target →
Rewrite → Validate → Polish) is the **target design**, not yet
confirmed as the literal code structure — before starting Phase C
tasks (V4), read through `aiSuggestions.ts` fully and confirm which
stages already exist as distinct functions vs. which are still
combined into fewer calls, and adjust task scope accordingly rather
than assuming the file already matches the roadmap's stage diagram.

## 5. Known real gap — not hypothetical (confirmed in code)

`billing.upgradePlan` (a `protectedProcedure` mutation) calls
`db.updateSubscription(ctx.user.id, input.tier)` directly with **no
Stripe verification in that code path at all.** Any logged-in user
can currently call this procedure directly (e.g. via browser
devtools or a direct tRPC client call) and grant themselves any
paid tier for free. This is the live version of
V6_EDGE_CASES_QA.md row #3 ("fake payment claimed without a real
transaction") — it is not a future risk, it is exploitable in the
current codebase today. Fix priority: highest, before any real
marketing/traffic push. See docs/tasks/TASK_PROMPTS.md task P1.

Separately, `stripeWebhook.ts` has a **dev-mode fallback** that
parses unsigned webhook payloads directly when
`STRIPE_WEBHOOK_SECRET` is unset — correct for local dev, but means
production must have that env var set or the same unsigned-payload
acceptance applies live. Confirm this env var is actually set in
the production deploy before going live with real payments.

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
- The Stripe-vs-Razorpay decision (§1) blocks V6_PAYMENTS_LEGAL_
  REFERRAL.md's Phase F as written (it assumes Razorpay) — resolve
  this first, since it changes which of that file's F2 is "build
  new" vs. "hardening existing."
