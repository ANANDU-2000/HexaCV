# HexaCV v3 â€” Super Admin Usage Control + Long-Term Plan
Prepared for: Anandu / HexaStack Solutions
Builds on: docs/product/roadmap/V2_ROADMAP.md (pipeline + quality layers) and the
Phase 0/1/2 cost strategy from chat (free â†’ cheap â†’ paid escalation)

---

## 1. Why this matters now

Free-tier models (20 req/min, 50â€“1000 req/day, no warning before
delisting) will silently break your app the moment real traffic
hits them, unless something is watching the meter and acting before
the limit, not after. This section is that watcher.

Three failure modes to design against:
1. **Rate-limit crash** â€” free model hits 20 RPM, requests start
   failing mid-user-session.
2. **Silent model removal** â€” a `:free` model disappears from
   OpenRouter overnight, your Stage 3 calls start erroring with no
   code change on your side.
3. **Runaway spend** â€” a bug, bot traffic, or one heavy user drains
   a paid tier's budget before you notice.

---

## 2. Usage tracking â€” the data layer

One table, written on every AI call (cheap to add, you already log
similar things in your CRM):

```ts
interface UsageLogEntry {
  id: string;
  timestamp: Date;
  stage: 'extract' | 'target' | 'rewrite' | 'validate' | 'polish';
  provider: string;
  model: string;
  tier: 'free' | 'cheap' | 'standard' | 'premium';
  userId: string | null;        // null for guest
  tokensIn: number;
  tokensOut: number;
  costUsd: number;               // 0 for free tier
  latencyMs: number;
  status: 'success' | 'error' | 'rate_limited' | 'fallback_used';
  errorDetail?: string;
}
```

Roll this up into two materialized views (or scheduled jobs, since
you're on MySQL/TiDB) refreshed every few minutes:

- `usage_per_minute` â€” count per model, for RPM threshold checks
- `usage_per_day_and_spend` â€” count + cost per model/tier, for RPD
  and budget checks

---

## 3. Pre-emptive throttling â€” the part that prevents the crash

Don't wait for the provider to reject a request. Check your own
counters **before** sending, and switch models at a safety margin:

```
if usage_per_minute[model] >= 0.8 * model.rpm_limit:
    switch to next fallback in the stage's model list
if usage_per_day[model] >= 0.9 * model.rpd_limit:
    switch to next fallback + notify admin
if fallback list exhausted:
    switch tier (free â†’ cheap paid) automatically
    OR queue the request with a "generating, this may take a
    moment" state if the stage tolerates delay (never do this for
    the user-facing Rewrite step, only background stages)
```

This means each stage's `model_routing` config (from v2 roadmap Â§2)
needs an **ordered fallback list**, not a single model:

```ts
interface ModelRoute {
  stage: string;
  tier: string;
  fallbackChain: {
    provider: string;
    model: string;
    rpmLimit: number;
    rpdLimit: number;
    priority: number;
  }[];
}
```

Admin screen shows current position in the chain live â€” "Extract
stage currently on fallback #2 (Gemini 2.5 Flash-Lite) since 14:32
because DeepSeek V4 Flash hit 80% RPM."

---

## 4. Budget caps â€” the part that prevents runaway spend

Two levels, both admin-configurable, both hard stops (not just
alerts):

**Daily spend ceiling** (global): e.g. â‚¹500/day while pre-revenue.
When hit: all paid-tier calls pause, everything routes to free tier
only until midnight UTC reset, admin gets an alert. The app keeps
working, just at lower quality â€” never a hard outage.

**Per-user quota**: prevents one guest session or one abusive user
from draining the day's budget alone.
- Guest: 3 resumes/day, free tier only, no paid-tier access at all.
- Free registered: 5 resumes/day, free tier only.
- Paid: N resumes/month per plan tier, standard+premium tiers
  unlocked, still capped so a compromised account can't run up an
  unbounded bill.

```ts
interface UserQuota {
  userId: string;
  planTier: 'guest' | 'free' | 'paid';
  resumesUsedToday: number;
  resumesUsedThisMonth: number;
  paidCallsThisMonth: number;
  quotaResetAt: Date;
}
```

---

## 5. Circuit breaker â€” the part that stops a bad provider fast

If a model returns errors (not rate-limits, actual failures â€” bad
JSON, timeouts, 500s) **3 times in a row**, mark it `circuit_open`
for 5 minutes and skip it entirely in the fallback chain, instead of
retrying a broken provider on every user's request:

```
state: closed (normal) â†’ open (skip this model) â†’ half_open
  (after cooldown, try one request; if it succeeds, close; if it
  fails, reopen for another cooldown period)
```

This is a standard pattern (same idea as circuit breakers in any
distributed system) and is maybe 50 lines of code on top of
`apiKeyManager.ts` â€” worth it because it turns "provider having a
bad day" from a user-visible outage into an invisible fallback.

---

## 6. Buying more capacity â€” manual and automatic

**Manual (default while pre-revenue):** admin dashboard button per
provider â€” "Add $10 credit" â€” deep-links to that provider's billing
page (OpenRouter, Anthropic Console, etc.) with your account
pre-filled where the API supports it. You approve every top-up by
hand. This is the right default until you have predictable revenue.

**Automatic (only after Phase 2, real paying users):** admin sets a
threshold + auto-topup amount per provider:
```ts
interface AutoTopup {
  provider: string;
  enabled: boolean;
  triggerBalanceUsd: number;   // e.g. top up when balance < $5
  topupAmountUsd: number;      // e.g. add $20
  monthlyCapUsd: number;       // hard ceiling even if auto-topup is on
}
```
Never enable auto-topup without a `monthlyCapUsd` â€” that field is
what turns "convenient" into "safe."

---

## 7. Super Admin dashboard â€” single screen layout

```
â”Œâ”€ Live Usage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Model          RPM used   RPD used  Status â”‚
â”‚ DeepSeek Flash  14/20      340/1000  OK     â”‚
â”‚ Gemini Flash    2/20       50/1000   OK     â”‚
â”‚ Claude Sonnet   -          -         OK     â”‚
â”‚ Claude Opus     -          -         OK     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”Œâ”€ Today's Spend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â‚¹127 / â‚¹500 daily cap        [====Â·Â·    ] â”‚
â”‚ Free tier calls: 890   Paid tier calls: 12 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”Œâ”€ Circuit Breakers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ All closed (healthy)                       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”Œâ”€ Fallback Chain Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ [Per-stage drag-to-reorder model list]     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”Œâ”€ Quotas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Guest: 3/day  Free: 5/day  Paid: per-plan  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
[Add Credit: OpenRouter] [Add Credit: Anthropic] [Pause All AI]
```

The `[Pause All AI]` button is your actual emergency stop â€” one
flag in config that makes every stage return "temporarily
unavailable, try again shortly" instead of hitting any provider.
Build this one first, before anything else in this document â€” it's
the cheapest insurance you can add.

---

## 8. Build order for this layer

1. `[Pause All AI]` global kill switch â€” 1 hour of work, highest
   safety-per-effort ratio
2. Usage logging table + per-minute/per-day counters â€” needed for
   everything else
3. Pre-emptive fallback chain (Â§3) â€” prevents the actual crash
4. Per-user quotas (Â§4) â€” prevents one user/bot from being the cause
5. Circuit breaker (Â§5) â€” handles provider-side failures gracefully
6. Daily budget cap with auto-pause to free tier (Â§4)
7. Admin dashboard UI (Â§7) pulling all of the above together
8. Manual "Add Credit" deep links (Â§6)
9. Auto-topup (Â§6) â€” only once you have real paying users

---

## 9. Long-term advanced plan (post-Phase 2, once there's revenue)

Everything below assumes: v2 pipeline is live, quality evaluator +
prompt versioning are producing real data, usage/budget controls
from this doc are in place, and you have paying users validating
the core product. Do not start any of this earlier â€” it's expansion,
not survival.

**9.1 Model self-hosting (cost floor, once volume justifies it)**
At sustained scale, self-hosting an open-weight model (DeepSeek,
Qwen, GLM) on rented GPUs can beat per-token API pricing for
output-heavy workloads. Only worth evaluating once monthly API
spend is consistently in the hundreds of dollars â€” below that, the
ops overhead isn't worth it.

**9.2 Fine-tuning on your own evaluation dataset**
Once Â§7 of the v2 roadmap (evaluation dataset) has a few thousand
real accept/edit/reject data points, you have something most
competitors don't: real signal on what your specific user base
(India/Gulf jobseekers) actually accepts vs. rewrites. That's a
legitimate fine-tuning or few-shot-example dataset for improving the
Rewrite stage prompt quality beyond what generic prompting achieves.

**9.3 Adjacent products (only after core resume flow retains users)**
- Cover letter generator reusing the same extracted-facts JSON
- LinkedIn "About" section rewriter (same Stage 3 pipeline, different
  formatter)
- Interview prep Q&A generated from the JD + resume match
- Simple job-application tracker (turns a one-time tool into a
  recurring-use product â€” this is your retention answer from the
  distribution problem discussed earlier)

**9.4 Gulf-market specific channel: WhatsApp**
Given your stated Gulf/Kerala target market, a WhatsApp-based flow
(upload resume photo/PDF â†’ get back a formatted, ATS-checked
version) may reach users who won't visit a web app first. Worth
testing as a acquisition channel once the core product is proven,
not before â€” it's a distribution experiment, not a rebuild.

**9.5 B2B / white-label angle (natural fit for HexaStack)**
Once the pipeline and quality layers are solid, the same engine can
be offered to recruitment agencies or training institutes in
Kerala/Gulf as a white-labeled bulk resume-review tool â€” this reuses
100% of the AI pipeline, just a different admin/billing wrapper.
Don't pursue this before individual users validate the core quality
bar; a B2B client will judge you by the same output quality as a
single job-seeker, just at volume.

**9.6 Multi-region / infra scaling**
Only relevant once you have real concurrent load. TiDB/MySQL,
Vercel/your current host, and OpenRouter's global routing already
cover early scale â€” don't architect for a scale you don't have yet.

**9.7 What stays constant through all of this**
The 5-stage pipeline, the evaluator scoring, prompt versioning, and
the model-routing/fallback/budget system in this document are the
foundation every one of the above builds on. Nothing in Â§9 should
require re-architecting Â§1â€“8 â€” if it does, that's a signal you're
adding scope prematurely.

---

## Cursor scope-lock notes

- New files/tables in scope: `usage_logs`, `user_quotas`,
  `circuit_breaker_state`, extension of `model_routing` to
  `fallbackChain`.
- Kill switch (Â§7) ships alone, first, in its own PR â€” it has no
  dependency on the rest of this document and is the single highest-
  value item here.
- Do not build Â§9 items until the v2 roadmap's evaluator + prompt
  versioning have at least a few weeks of real usage data â€” building
  adjacent products before the core loop is proven repeats the
  original "no one needed it" mistake at a bigger scale.
