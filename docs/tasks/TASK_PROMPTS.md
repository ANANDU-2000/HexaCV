# HexaCV â€” TASK_PROMPTS.md (Ready-to-Paste, One Task at a Time)
Prepared for: Anandu / HexaStack Solutions
Per docs/tasks/MASTER_TASKS.md Part 4: open a fresh Cursor
chat per task, paste only that task's prompt below â€” not this whole
file. Order matters; do not skip ahead. Every prompt assumes
`AGENT.md` (V6_AGENT_AND_MASTER_TASKS.md Part 1) is already pinned
as a project rule.

---

## P1 â€” Lock down the fake-payment gap (do this FIRST, before anything else in this file)

```
Context: server/routers.ts has a `billing.upgradePlan` mutation that
calls db.updateSubscription(ctx.user.id, input.tier) directly, with
no Stripe verification. Any logged-in user can currently call this
procedure to grant themselves any subscription tier for free.

Task: change `upgradePlan` so it can only be called by an admin
(reuse the existing `adminProcedure` pattern already used in the
`admin` router namespace), and require an input field `reason:
string` that gets logged. Rename it `admin.manualGrantSubscription`
if that fits the existing admin namespace better than leaving it
under `billing`. The only other way `subscriptions.tier` should
change is through the existing `server/stripeWebhook.ts` handler â€”
do not add any other write path to that column.

Scope: server/routers.ts, server/db.ts (if a new admin_audit_log
write is needed â€” check if that table exists yet; if not, this task
does NOT include creating it, just log to console for now and note
that admin_audit_log is a separate future task).

Validate: confirm a non-admin user calling the old `upgradePlan`
path (or its renamed equivalent) gets a permission error, confirm an
admin calling the new procedure with a reason succeeds and the
subscription updates, confirm the Stripe webhook path is untouched
and still works end to end via a test checkout session.
```

---

## Phase A â€” Foundation safety (V4 A1â€“A4)

### A1
```
Context: server/apiKeyManager.ts manages provider/model keys today
but has no global pause capability. server/routers.ts has an `ai`
router namespace with multiple AI-calling procedures.

Task: add an `aiPaused: boolean` config flag (read from env or a
simple config table â€” check if a config table already exists before
creating one) checked at the start of every procedure in the `ai`
namespace. When true, return a clean error ("temporarily
unavailable, try again shortly") instead of calling any provider.

Scope: server/apiKeyManager.ts, server/routers.ts (ai namespace only).

Validate: flip the flag, call any `ai.*` procedure, confirm it
short-circuits with no provider call in the logs; confirm `resume`,
`auth`, `billing` procedures are unaffected.
```

### A2
```
Context: no usage logging exists yet for AI calls in
server/aiSuggestions.ts.

Task: create server/usageTracker.ts and a new `usage_logs` table
(stage, provider, model, userId, tokensIn, tokensOut, costUsd,
latencyMs, status, timestamp). Call it from inside
server/aiSuggestions.ts after each provider call completes (success
or failure) â€” do not wrap this in a separate middleware that
duplicates the call logic.

Scope: new file server/usageTracker.ts, drizzle/schema.ts (new
table), server/aiSuggestions.ts (call site only).

Validate: trigger 5 resume generations, confirm 5+ rows appear in
usage_logs with correct token counts and non-null costUsd for paid
models.
```

### A3
```
Context: usage_logs (from A2) now exists but nothing checks it
before making a call.

Task: in server/usageTracker.ts, add rolling per-minute/per-day
counters per model, checked before each call in
server/aiSuggestions.ts. At 80% of a configured RPM limit or 90% of
RPD, switch to the next model in that stage's fallback list (a
simple ordered array in config for now â€” the full model_routing
table is Phase B, don't build it here).

Scope: server/usageTracker.ts, server/aiSuggestions.ts (call site).

Validate: set an artificially low RPM limit in a dev config, fire 5
requests in a row, confirm requests past the threshold route to the
fallback model instead of erroring.
```

### A4
```
Context: no circuit breaker exists yet for provider failures.

Task: in server/usageTracker.ts, track consecutive real errors
(timeouts, 500s, malformed JSON â€” not rate-limit responses) per
model. After 3 in a row, mark that model `circuit_open` for 5
minutes and skip it in the fallback chain from A3.

Scope: server/usageTracker.ts only.

Validate: force 3 fake failures against a test model config, confirm
the 4th call skips straight to the next fallback without attempting
the broken one.
```

---

## Phase B â€” Model routing config (V4 B1â€“B3)

### B1
```
Context: model choice is currently hardcoded (or minimally
configured) in server/aiSuggestions.ts / server/apiKeyManager.ts.

Task: add a `model_routing` table (stage, tier, provider, model,
rpmLimit, rpdLimit, priority, updatedAt, updatedBy) in
drizzle/schema.ts. server/apiKeyManager.ts reads the current route
per stage at call time, cached 5 minutes, instead of using a
hardcoded value.

Scope: drizzle/schema.ts, server/apiKeyManager.ts.

Validate: change a model directly in the DB, confirm the next AI
call (within 5 min cache window, or after a forced cache clear)
uses the new model with no restart.
```

### B2
```
Context: the admin dashboard (client/src/pages/Dashboard.tsx) has an
existing admin section but no model-routing/live-usage view.

Task: add a "Model routing & usage" tab reading from A2's
usage_logs and B1's model_routing tables â€” live RPM/RPD per model,
today's spend, circuit breaker status (from A4), a "Pause all AI"
button wired to A1's flag. Add a corresponding admin.getUsageStats
and admin.setModelRoute procedure to routers.ts's admin namespace.

Scope: client/src/pages/Dashboard.tsx (new tab component), 
server/routers.ts (admin namespace additions).

Validate: every number shown matches a live query against
usage_logs/model_routing â€” no mocked/static values in the component.
```

### B3
```
Context: no per-user or global spend caps exist yet.

Task: add a daily global spend ceiling (config value) that pauses
paid-tier calls (falls back to free/cheap tier automatically) when
hit, and per-plan-tier quotas (guest/free/paid â€” reuse
`subscriptions.tier` for paid, add a simple counter for guest/free)
enforced in server/usageTracker.ts before Stage 1 runs.

Scope: server/usageTracker.ts, shared/types.ts (quota type).

Validate: set guest quota to 1 in dev, confirm a 2nd guest resume
generation attempt is blocked with a clear message, not a silent
failure.
```

---

## Phase F/G â€” Payments & Legal (V6_PAYMENTS_LEGAL_REFERRAL.md)

### F-decide (do this before F2 â€” a decision, not code)
```
Not a coding task: confirm explicitly whether HexaCV keeps Stripe
(already integrated and working per server/stripeWebhook.ts) or
migrates to Razorpay (per the original V3 roadmap, likely for
India/Gulf UPI support). Do not start building a second payment
provider in parallel with Stripe "just in case" â€” pick one. If
keeping Stripe, treat V6_PAYMENTS_LEGAL_REFERRAL.md Â§F2's "Razorpay
Order/webhook" instructions as already satisfied by the existing
stripeWebhook.ts pattern (signature verify, idempotent status
check) â€” just harden that file per F3 below instead of building new.
```

### F3 (hardening existing Stripe webhook for idempotency)
```
Context: server/stripeWebhook.ts handles subscription events but
does not yet check whether an event was already processed (Stripe
retries webhooks, so a handler must be idempotent).

Task: add a check â€” before applying a webhook event's effect, look
up whether that Stripe event ID has already been processed (a
simple processedStripeEvents table keyed on event.id is enough; 
Stripe events include a unique `id` field). Skip if already
processed, log a no-op.

Scope: server/stripeWebhook.ts, drizzle/schema.ts (new small table).

Validate: manually re-POST the same webhook payload twice to
/api/webhooks/stripe, confirm the subscription only updates once
and the second call logs as a skipped duplicate.
```

### G1â€“G3 (legal pages â€” content, not logic)
```
Context: no Terms/Privacy/Refund pages exist yet in
client/src/pages/.

Task: create client/src/pages/Terms.tsx, Privacy.tsx, Refund.tsx as
static content pages (routing only, no tRPC calls). Use placeholder
section headers matching docs/payments/PAYMENTS_LEGAL_REFERRAL.md Â§G1-G3
â€” do NOT have the agent write the actual legal language; leave
clearly marked placeholder paragraphs for a human/lawyer pass. Link
all three from the app footer and from the new Pricing page.

Scope: client/src/pages/Terms.tsx, Privacy.tsx, Refund.tsx, footer
component, Pricing.tsx (link only).

Validate: all three routes load with no 404, footer links work from
every page, no legal copy was fabricated by the agent â€” only
placeholder structure.
```

---

## Phase R â€” Referral rework (V6_PAYMENTS Â§H, docs/product/USER_FLOW.md Flow D)

### R1 (decision, before R2)
```
Not a coding task: decide which referral model HexaCV actually
wants â€” (a) reward on friend's SIGNUP (top-of-funnel, current V6
design) or (b) reward on friend's PAYMENT (current code's actual
behavior via rewardReferralConversion at upgrade/invoice time). Pick
one. This determines what R2 below actually builds.
```

### R2 (build the chosen gate)
```
Context: server/db.ts has rewardReferralConversion and
trackReferralClick already. Current logic rewards on
email-match-at-payment-time with no anti-abuse gate.

Task: [if signup-model chosen] add a gate check â€” credit only fires
once the referred user's account is >24h old (compare
users.createdAt) AND has at least one resume row in `resumes`. Flag
(don't block) same-IP/same-device signups for admin review â€” add a
simple `flaggedForReview: boolean` column on affiliateReferrals
rather than building fraud detection.
[if payment-model chosen] keep current trigger point, just add the
24h+one-resume gate as an additional condition before the reward
fires, and add the same same-IP flagging.

Scope: server/db.ts, drizzle/schema.ts (add flaggedForReview column).

Validate: create a referred account, attempt to trigger the reward
immediately â€” confirm it does NOT fire before the 24h/action
condition, confirm it does fire once the condition is met.
```

---

## Phase I â€” Marketing/Blog (V6_MARKETING_ADMIN.md)

### I3
```
Context: no blog exists yet â€” no blog_posts table, no public routes.

Task: add a `blog_posts` table (id, slug, title, body, excerpt,
coverImageUrl, status, publishedAt, authorId, seoTitle,
seoDescription). Add a `blog` router namespace to server/routers.ts
with public `list`/`getBySlug` (published only) and admin-only
`create`/`update`/`publish` procedures. Add
client/src/pages/BlogList.tsx and BlogPost.tsx as public routes.

Scope: drizzle/schema.ts, server/routers.ts (new blog namespace),
client/src/pages/BlogList.tsx, BlogPost.tsx.

Validate: create a draft post via the admin procedure, confirm it
does NOT appear on the public list or resolve at its slug URL;
publish it, confirm it appears in both places immediately.
```

---

## Phase J/K â€” Design gate + QA (apply per-PR, not a one-time task)
```
For every PR from this file: run the checklist in
docs/design/DESIGN_STRICT.md Â§7 (breakpoints, scroll containers, aria-
labels) if it touches UI, and docs/ai/PROMPT_AND_FEEDBACK_RULES.md
Â§5 if it touches any AI prompt text or user-facing copy, before
marking the task done.
```

---

## Cursor scope-lock notes
- Do P1 before anything else in this file â€” it's a live gap, not a
  planned feature.
- Each block above is meant to be pasted verbatim as the start of a
  fresh Cursor chat/composer session â€” resist combining two blocks
  into one session even when they touch the same file.
