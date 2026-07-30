# HexaCV v4 — Master Build Plan (Ordered, Minimal-File, Validated)
Prepared for: Anandu / HexaStack Solutions
Reads together with: V2_ROADMAP.md (pipeline+quality), V3_ADMIN_LIMITS_AND_LONGTERM.md
(usage/budget safety). This file is the single ordered execution list —
work top to bottom, do not skip ahead.

Wireframes for the two new screens (signup, admin auth+usage panel)
are shown above in this conversation.

---

## Ground rules (apply to every task below)

1. **One file per concern, extend before creating.** Before adding a
   new file, check if an existing file (`aiSuggestions.ts`,
   `apiKeyManager.ts`, `contentValidation.ts`, `routers.ts`) already
   owns that concern. Only create a new file when a single existing
   file would exceed ~400 lines.
2. **No task is "done" without validation.** Each task below lists
   its own pass/fail check. If you can't check the box, the task
   isn't finished, regardless of what Cursor reports.
3. **Cursor agents silently fail to persist edits sometimes** — after
   every task, run `git diff` before committing. If the diff is
   empty and the task should have changed code, the agent didn't
   actually write anything.
4. **Scope lock per task.** Each task lists exact files in scope.
   Anything outside that list in the same PR is scope creep — split
   it into its own task.
5. **Secrets never touch the client.** All provider keys (Clerk,
   Google OAuth, Apple, AI providers, Razorpay when it comes) live
   server-side only, set via the admin panel or `.env`, never shipped
   to `client/`.

---

## Phase A — Foundation safety (do this before anything else)

### A1. Global AI kill switch
- Scope: `server/apiKeyManager.ts`, one new config flag
- Task: add `aiPaused: boolean` read from DB/config at request time;
  when true, every AI-calling route returns a clean 503 with
  "temporarily unavailable, try again shortly" instead of hitting
  any provider
- Validate: flip the flag manually, confirm all AI routes short-
  circuit with no provider call logged, confirm non-AI routes
  (auth, template rendering, PDF export) still work

### A2. Usage logging table
- Scope: one new table (`usage_logs`) in `drizzle/schema.ts`
  (Drizzle is the only ORM — do not introduce Prisma), one new file
  `server/usageTracker.ts`
- Task: log every AI call (stage, provider, model, tokens, cost,
  status, latency) — write from inside `aiSuggestions.ts`, not from
  a wrapper that duplicates logic
- Validate: trigger 5 test resume generations, confirm 5+ rows per
  stage appear in `usage_logs` with correct token counts

### A3. Per-minute/per-day counters + pre-emptive fallback
- Scope: `server/usageTracker.ts`, `server/apiKeyManager.ts`
- Task: before each call, check rolling counts against configured
  RPM/RPD limits at 80%/90% thresholds; switch to next model in the
  stage's fallback chain if exceeded
- Validate: set an artificially low RPM limit (e.g. 2) in dev, fire
  5 requests in a row, confirm requests 3+ route to the fallback
  model, not error out

### A4. Circuit breaker
- Scope: `server/usageTracker.ts`
- Task: 3 consecutive errors (not rate-limits — actual failures) on
  a model → mark `circuit_open` for 5 min, skip in fallback chain
- Validate: force 3 fake failures against a test model in dev,
  confirm 4th call skips it and goes straight to the next fallback

**Phase A exit criteria:** you can point traffic entirely at free-
tier models, hammer it past rate limits in a dev test, and the app
degrades gracefully (fallback → circuit skip → clean pause) with
zero unhandled errors reaching the user.

---

## Phase B — Model routing config (admin-editable)

### B1. `model_routing` table + fallback chains
- Scope: schema addition, `server/apiKeyManager.ts`
- Task: per-stage ordered list of {provider, model, rpmLimit,
  rpdLimit, priority}, seed with the Phase 0 free-tier defaults from
  the cost-strategy discussion (DeepSeek V4 Flash / Gemini 2.5
  Flash-Lite primary, paid Sonnet/Opus only referenced, not enabled)
- Validate: change a model in the DB directly, confirm next AI call
  uses the new model with no restart required (5-min cache max)

### B2. Admin screen — model routing + live usage
- Scope: one new admin page/component (your existing CRM panel
  already has an admin section — add a tab, don't spin up a new
  admin app), reads from B1 + A2 tables
- Task: build the panel shown in the wireframe above — live RPM/RPD
  per model, today's spend vs. cap, circuit breaker status, per-
  stage fallback chain editor, "Pause all AI" button wired to A1
- Validate: every number on screen matches what's actually in
  `usage_logs`/`model_routing` at that moment — no mocked/static
  values

### B3. Budget caps + per-user quotas
- Scope: `server/usageTracker.ts`, `shared/types.ts` (UserQuota type)
- Task: daily global spend ceiling (pause paid tiers, not the app,
  when hit); per-plan-tier quota (guest 3/day, free 5/day, paid per
  plan) enforced before Stage 1 even runs
- Validate: set guest quota to 1 in dev, confirm 2nd guest resume
  attempt is blocked with a clear message, not a silent failure

**Phase B exit criteria:** admin can change which model handles
which stage, see live cost/usage, and set spend limits — all without
a code deploy.

---

## Phase C — Pipeline quality (the 5-stage engine + evaluator)

Reference: V2_ROADMAP.md §1–§12 for full detail. Task list here is
the ordered execution slice.

### C1. Stage 3 rewrite — banned-word + structural rules
- Scope: `server/aiSuggestions.ts` only
- Task: embed the banned-word list and STAR/CAR bullet structure
  rule directly in the Stage 3 prompt; no new file
- Validate: run against 3 of the 10 test profiles (V2_ROADMAP §12),
  confirm zero banned words in output, confirm every experience
  bullet has action+result structure

### C2. Deterministic slop/fact checks
- Scope: `server/contentValidation.ts` only
- Task: regex-based checks — repeated sentence openers, duplicate
  bullets, placeholder text, fact-traceability diff against Stage 1
  JSON
- Validate: feed a deliberately bad draft (repeated openers, a fake
  metric not in source facts) through the checker, confirm it's
  flagged, not silently passed

### C3. Evaluator scoring (single combined call)
- Scope: `server/contentValidation.ts`, add function, no new file
- Task: one cheap-model call returns the full score JSON from
  V2_ROADMAP §3; `overall < 70` triggers exactly one Stage 3 retry
  with flags fed back into the prompt
- Validate: force a low-quality draft through, confirm exactly one
  retry happens (not zero, not a loop), confirm result is logged to
  `resume_evaluations` either way

### C4. Human editing loop + `userEdited` protection
- Scope: `shared/types.ts` (add `userEdited: boolean` per field),
  client editor component (extend existing, don't rebuild)
- Task: any field a user manually edits is flagged; subsequent
  "re-check with AI" calls only touch non-flagged fields
- Validate: edit one bullet manually, trigger re-check, confirm that
  exact bullet is untouched in the result while others may change

### C5. Prompt versioning table
- Scope: new `prompt_versions` table, `server/aiSuggestions.ts` reads
  active version instead of hardcoded prompt string
- Task: never edit an active prompt in place — insert new version,
  compare metrics, promote
- Validate: create v2 of the Stage 3 prompt, confirm v1 stays active
  until explicitly promoted, confirm metrics accumulate separately
  per version

**Phase C exit criteria:** a generated resume passes the evaluator
threshold, contains no banned words, has zero unfact-checked claims,
and manual edits survive a re-check pass.

---

## Phase D — Multi-provider auth (Clerk / Google / Apple / Email)

Current state: single "Manus OAuth" provider only
(`server/_core/oauth.ts`, 97 lines). This phase adds provider choice
without ripping that out — Manus OAuth can stay as one more option
in the same list, or be retired later once the others are proven.

### D1. Auth provider config table
- Scope: new `auth_providers` table, extend `shared/types.ts`
- Task:
```ts
interface AuthProviderConfig {
  provider: 'google' | 'apple' | 'email' | 'clerk';
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;   // server-side only, never returned to client
  updatedAt: Date;
  updatedBy: string;
}
```
- Validate: seed all 4 rows disabled by default, confirm no auth
  route errors when a provider is disabled (skip, don't crash)

### D2. Email/password (build first — no external dependency)
- Scope: `server/_core/oauth.ts` gets a sibling `server/_core/emailAuth.ts`
  only if email logic exceeds ~150 lines, otherwise add to the
  existing file
- Task: signup, login, password hash (bcrypt/argon2), session cookie
  reusing existing `getSessionCookieOptions`
- Validate: create account, log out, log back in, confirm session
  persists across a server restart (cookie + DB, not memory-only)

### D3. Google sign-in
- Scope: same auth file(s) as D2, extend — don't create a per-
  provider file for each one, that's the "many small files" trap
- Task: standard OAuth2 code flow, client ID/secret pulled from D1
  table (not `.env` — admin-settable), same `upsertUser` call
  pattern already in `oauth.ts`
- Validate: sign up via Google, confirm user row has correct email
  + `loginMethod: 'google'`, confirm re-login with same Google
  account maps to the same user, not a duplicate

### D4. Apple / iOS sign-in
- Scope: same file(s)
- Task: Sign in with Apple (required if you ever ship a native iOS
  app or want App Store approval for a wrapped PWA) — note Apple
  requires a paid Apple Developer account ($99/yr) and a registered
  Services ID; this has a real cost, confirm it's worth it before
  building vs. deferring until iOS app is actually planned
- Validate: same as D3, plus confirm Apple's private-relay email
  option doesn't break the `upsertUser` email-uniqueness logic

### D5. Clerk (optional all-in-one alternative)
- Scope: same file(s), or evaluate replacing D2–D4 entirely
- Task: Clerk bundles email/Google/Apple/etc. behind one SDK and
  hosted UI — **decide before building D2–D4 individually** whether
  Clerk's per-monthly-active-user pricing beats building/maintaining
  3 separate flows yourself. For a pre-revenue product, self-built
  email+Google (D2+D3) is $0 and covers most India/Gulf users; Clerk
  becomes worth it once auth maintenance time costs more than its
  subscription. Recommendation: build D2+D3 first, add Clerk or D4
  only if a specific need shows up (App Store submission, enterprise
  SSO request).
- Validate: n/a until decision is made — this is a build-vs-buy
  checkpoint, not a task to execute blindly

### D6. Admin screen — auth provider toggles
- Scope: same admin panel from B2, add a section (wireframe shown
  above)
- Task: enable/disable + set client ID/secret per provider, secrets
  masked in UI after saving, never re-displayed in plaintext
- Validate: disable Google in the panel, confirm the signup screen's
  Google button disappears without a deploy; re-enable, confirm it
  reappears

**Phase D exit criteria:** a new user can sign up with email or
Google (Apple/Clerk if built), admin can turn any provider on/off
live, and no secret ever appears in client-side code or network
responses.

---

## Phase E — Environment setup (single source of truth)

### E1. Consolidate env vars
- Scope: `.env.example` only
- Task: current file already has this mostly right (LLM providers
  section exists). Add: auth provider defaults (can be blank —
  real values come from admin panel per D1, `.env` is just the
  bootstrap/fallback path for first-run setup), `DAILY_BUDGET_CAP`,
  `AI_PAUSED` default flag
- Validate: fresh clone + `.env` from example + `pnpm install` +
  `pnpm run db:push` + `pnpm run dev` boots with zero missing-var
  errors, admin panel loads even with all AI/auth keys blank
  (everything shows "disabled" state, nothing crashes)

### E2. Document the two-tier config model clearly in README
- Scope: `README.md`, one section
- Task: explain `.env` = deploy-time bootstrap secrets (DB URL, JWT
  secret) vs. admin panel = runtime-configurable (which AI models,
  which auth providers, budget caps) — this distinction matters for
  whoever touches this next, including future-you
- Validate: a person who's never seen the project can read this
  section and correctly guess where to add a new API key

---

## Full ordered task list (copy-paste checklist)

```
[ ] A1  Global AI kill switch
[ ] A2  Usage logging table
[ ] A3  Per-minute/day counters + pre-emptive fallback
[ ] A4  Circuit breaker
[ ] B1  model_routing table + fallback chains
[ ] B2  Admin panel — routing + live usage
[ ] B3  Budget caps + per-user quotas
[ ] C1  Stage 3 banned-word + structure rules
[ ] C2  Deterministic slop/fact checks
[ ] C3  Evaluator scoring + single retry
[ ] C4  Human editing loop + userEdited flag
[ ] C5  Prompt versioning table
[ ] D1  auth_providers config table
[ ] D2  Email/password auth
[ ] D3  Google sign-in
[ ] D4  Apple sign-in (only if iOS app is actually planned)
[ ] D5  Clerk build-vs-buy decision (checkpoint, not auto-build)
[ ] D6  Admin panel — auth provider toggles
[ ] E1  Consolidate .env.example
[ ] E2  README config-model section
```

Each box only gets checked after its own Validate step passes —
not after Cursor says "done."

---

## What this plan deliberately does not include yet

- Razorpay / payments — no paying users yet, build after Phase D
  proves signup actually works and people stick around
- CRM expansion beyond what exists — extend, don't rebuild
- 4-template design system rollout — one flagship template first
  per V2_ROADMAP §8
- Self-hosting, fine-tuning, WhatsApp channel, B2B/white-label — all
  V2/V3 "long-term" items, explicitly gated on real usage data first

If a future request asks to add any of these before Phase A–E is
checked off and validated on real users, that's the same scope-creep
pattern that produced the original 25-agent plan — point back to
this file's ordering.
