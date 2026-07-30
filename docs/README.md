# HexaCV — Docs Index (START HERE)

Prepared for: Anandu / HexaStack Solutions  
Read this file first. It tells you what every other doc is for and
how to start work in Cursor.

---

## 1. What every doc is, in reading order

| # | File | What it's for | Status |
|---|---|---|---|
| 1 | [`architecture/ARCHITECTURE.md`](./architecture/ARCHITECTURE.md) | What's actually built today (stack, DB, gaps) | **Read first, always current** |
| 2 | [`product/roadmap/REPO_CLEANUP.md`](./product/roadmap/REPO_CLEANUP.md) | Folder/file cleanup | **Done** — historical |
| 3 | [`.cursor/rules/project.md`](../.cursor/rules/project.md) | Always-on Cursor project rules | Always active |
| 4 | [`ops/CI_CD.md`](./ops/CI_CD.md) | Pipeline review + gaps | Reference when touching `.github/workflows` |
| 5 | [`product/roadmap/V2_ROADMAP_v1.md`](./product/roadmap/V2_ROADMAP_v1.md) | Original reality-check | Historical, still true in spirit |
| 6 | [`product/roadmap/V2_ROADMAP.md`](./product/roadmap/V2_ROADMAP.md) | Pipeline + quality layers | Check ARCHITECTURE §1 before trusting code-location claims |
| 7 | [`product/roadmap/V3_ADMIN_LIMITS_AND_LONGTERM.md`](./product/roadmap/V3_ADMIN_LIMITS_AND_LONGTERM.md) | Usage/budget safety plan | Still the plan, not yet built |
| 8 | [`product/roadmap/V4_MASTER_BUILD_PLAN.md`](./product/roadmap/V4_MASTER_BUILD_PLAN.md) | Ordered Phase A–E task list | Still the plan |
| 9–10 | [`design/WIREFRAMES.md`](./design/WIREFRAMES.md) | Part A = existing pages; Part B = planned pages | Part A matches `client/src/pages/*` |
| 11 | [`payments/PAYMENTS_LEGAL_REFERRAL.md`](./payments/PAYMENTS_LEGAL_REFERRAL.md) | Payment/legal/referral design | **Assumes Razorpay — resolve Stripe-vs-Razorpay (ARCHITECTURE §1) before treating F2 as literal** |
| 12 | [`product/roadmap/V6_MARKETING_ADMIN.md`](./product/roadmap/V6_MARKETING_ADMIN.md) | SEO/GA/GSC/blog CRM plan | Plan, not built |
| 13 | [`design/DESIGN_STRICT.md`](./design/DESIGN_STRICT.md) | UI/UX enforceable rules | Always active (also in project rules §4) |
| 14 | [`ai/PROMPT_AND_FEEDBACK_RULES.md`](./ai/PROMPT_AND_FEEDBACK_RULES.md) | Honest-copy rules + feedback loop | Always active (also in project rules §5) |
| 15 | [`qa/EDGE_CASES_QA.md`](./qa/EDGE_CASES_QA.md) | Test scenarios | Reference before/after Phase F |
| 16 | [`tasks/MASTER_TASKS.md`](./tasks/MASTER_TASKS.md) | Agent behavior + F–K task list | Rules superseded by project.md — task list still current |
| 17 | [`product/USER_FLOW.md`](./product/USER_FLOW.md) | End-to-end journeys | **Read before Phase F/R** |
| 18 | [`design/PAGE_TECH_SYNOPSIS.md`](./design/PAGE_TECH_SYNOPSIS.md) | Per-page frontend/API/DB map | Reference while coding any page |
| 19 | [`tasks/TASK_PROMPTS.md`](./tasks/TASK_PROMPTS.md) | Ready-to-paste task prompts | **Use this to work — starts with P1** |

**Also useful:**

| File | Purpose |
|---|---|
| [`architecture/DATA_MODEL.md`](./architecture/DATA_MODEL.md) | App-level shapes + illustrative SQL (live schema = `drizzle/schema.ts`) |
| [`ops/BUILD_AND_DEPLOYMENT.md`](./ops/BUILD_AND_DEPLOYMENT.md) | Build + deploy |
| [`ops/VERCEL_ENV.md`](./ops/VERCEL_ENV.md) | Vercel env key checklist (Clerk / Razorpay / AI) |
| [`ops/PRODUCTION_CHECKLIST.md`](./ops/PRODUCTION_CHECKLIST.md) | Production checklist |
| [`ai/AI_PROMPT_GUIDE.md`](./ai/AI_PROMPT_GUIDE.md) | AI prompt guide |
| [`user/USER_GUIDE.md`](./user/USER_GUIDE.md) | End-user guide |
| [`design/DESIGN_AND_PROMPTS.md`](./design/DESIGN_AND_PROMPTS.md) | Design values & prompts |
| [`design/TEMPLATE_REFERENCE.md`](./design/TEMPLATE_REFERENCE.md) | Template reference |
| [`design/DOCUMENTATION_LEGACY.md`](./design/DOCUMENTATION_LEGACY.md) | Historical mega-doc — superseded |

**The short version:** #1 and #3 you read now. #19 is what you paste
into Cursor, one block at a time, starting with P1. Everything else
is reference you open when the task prompt tells you to.

---

## 2. How to start Cursor Pro

1. Open the repo in Cursor (`HexaCv-main/`).
2. Repo cleanup is done — docs live under `docs/`, `prisma/` is gone,
   stitch assets are under `stitch-assets/` only.
3. Confirm `.cursor/rules/project.md` is active in Cursor settings.
4. Branch for the first real task: `fix/upgrade-plan-lockdown` (P1).
5. Fresh chat: paste only the P1 block from
   [`tasks/TASK_PROMPTS.md`](./tasks/TASK_PROMPTS.md).
6. Continue one block per chat in TASK_PROMPTS order
   (P1 → Phase A → B → F/G → R → I → J/K).
7. Before Phase F: resolve Stripe-vs-Razorpay (`F-decide`) and
   referral model (`R1`) yourself — not Cursor's call.

---

## 3. First Cursor message (P1 — after cleanup)

```
I'm starting work on HexaCV. Before any feature work, I need one
fix done first — a real security gap, not a hypothetical one.

Context: server/routers.ts has a `billing.upgradePlan` mutation
that calls db.updateSubscription(ctx.user.id, input.tier) directly,
with no Stripe verification. Any logged-in user can currently call
this procedure to grant themselves any subscription tier for free.

Task: change `upgradePlan` so it can only be called by an admin
(reuse the existing `adminProcedure` pattern already used in the
`admin` router namespace), and require an input field `reason:
string` that gets logged. The only other way `subscriptions.tier`
should change is through the existing `server/stripeWebhook.ts`
handler — do not add any other write path to that column.

Scope: server/routers.ts only, plus a console.log of the reason for
now (don't build a full audit-log table in this task).

Validate: confirm a non-admin user calling the old path gets a
permission error, confirm an admin call with a reason succeeds,
confirm the Stripe webhook path is completely untouched and still
works via a test checkout.

Follow the rules in .cursor/rules/project.md for everything else —
scope lock, git diff before committing, no new files unless this
one would exceed ~400 lines.
```

---

## 4. If you only remember one thing

Fix the `upgradePlan` gap before anything else — payments, referrals,
and growth assume money/tier state only changes through a verified
path.
