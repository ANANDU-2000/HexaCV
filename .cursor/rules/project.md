# HexaCV — Cursor Project Rules

Prepared for: Anandu / HexaStack Solutions  
Pinned at `.cursor/rules/project.md` so every Cursor chat/composer
session in this repo loads it automatically. Consolidates rules
across V2–V6 and grounded docs into one enforceable list.

---

## 1. File and folder discipline

- **No new top-level `.md` file at repo root.** Every doc goes in
  the matching `docs/` subfolder (`docs/product/roadmap/`,
  `docs/design/`, `docs/ops/`, etc. — see
  `docs/product/roadmap/REPO_CLEANUP.md`).
- **Extend before creating.** Before adding a new file, check
  whether `server/aiSuggestions.ts`, `server/apiKeyManager.ts`,
  `server/contentValidation.ts`, `server/usageTracker.ts`, or
  `server/routers.ts` already owns the concern. New file only when
  an existing one would exceed ~400 lines.
- **Drizzle is the only ORM.** Never import or reference Prisma —
  `prisma/` has been removed. If you see a Prisma import anywhere,
  that's a bug to flag, not a pattern to follow.
- **One asset folder for design/mockup files:** `stitch-assets/`
  (hyphen). Never create or write to `stitch_assets/` (underscore).

## 2. Code quality bar

- **Less code beats clever code.** A boring, obvious 10-line
  solution beats an abstracted 40-line one, even if the abstraction
  "might be needed later." No new framework/library for something
  the existing stack (Express, tRPC, Drizzle, React) already does.
- **No task is done without its own Validate step passing.** A
  Cursor "done" message is not evidence — run the validate step
  yourself.
- **`git diff` after every task, before committing.** Cursor agents
  occasionally report success without persisting an edit.
- **Scope lock is absolute.** Touching a file outside a task's
  stated scope — even a "quick related fix" — is scope creep. Stop,
  note it, make it a separate task.
- **Never bundle unrelated changes in one PR:** template rendering,
  PDF export, and auth flow changes never ship in the same PR as
  pipeline, payment, or referral logic changes.

## 3. Money and trust — non-negotiable

- **Never trust client-reported state for anything money- or
  quota-related.** Payment status, subscription tier, download
  count — all re-checked server-side, always. This is not a
  style preference; `billing.upgradePlan`'s original client-callable
  design was a real, exploitable gap (see
  `docs/architecture/ARCHITECTURE.md` §5) — do not reintroduce that
  pattern anywhere else in the app (referral credits, quota resets,
  plan upgrades of any kind).
- **Subscription tier changes only through: (a) a verified Stripe
  webhook, or (b) an admin-only procedure with a required, logged
  reason.** No other write path to `subscriptions.tier`, ever.
- **Every webhook handler must be idempotent.** Retries happen;
  a handler that isn't safe to run twice is a billing bug waiting
  to happen.
- **No payment prompt outside the three defined triggers**
  (download-limit hit, paid-model attempt, direct Pricing nav) —
  never as a side effect of a failed call or a quota check on page
  load.

## 4. UI/UX — non-negotiable

- **No `overflow: auto/scroll` div nested inside another
  `overflow: auto/scroll` div.** One scroll container per page.
- **Every icon-only button** has an `aria-label` and a minimum
  44x44px tap target.
- **No button is ever hidden-but-clickable** (opacity trick) —
  fully rendered+enabled, not rendered at all, or rendered-disabled-
  with-tooltip.
- **Test every UI change at 5 breakpoints** (375, 390, 768, 1280,
  1920) before calling it done — no "looks fine on my monitor."
- **Every destructive action requires a confirmation step.**
- **Loading state lives on the button itself**, never a full-screen
  overlay except initial page load.

## 5. AI prompt and copy — non-negotiable

- **Never generate or display outcome guarantees**: no "guaranteed
  interview," "job-winning," "will get you hired." "ATS-optimized"/
  "ATS-friendly" are fine (formatting claims); outcome promises are
  not.
- **Never fabricate statistics or authority claims** ("recruiters
  always...", "99% of...") anywhere — prompt text, marketing copy,
  or dashboard copy — unless it's a real number pulled live from
  your own logged data.
- **Never let the model insert a fact, number, or claim not
  traceable to the user's own source input.** This is a hard reject
  in Stage 4, not a soft flag.
- **Every claim of AI improvement shown to the user must reference
  a real evaluator field or diff** ("3 vague phrases replaced with
  specifics"), never a generic compliment.

## 6. Referral and growth — non-negotiable

- **Referral rewards are additive**, never taken from the referred
  person's own free allowance.
- **Reward triggers only on the agreed real gate** (signup+24h+one
  action, or payment — whichever model is chosen per
  `docs/product/USER_FLOW.md` Flow D's decision point) — never on
  click alone.
- **Same-IP/device signups are flagged for human review, not
  auto-blocked** — avoids false positives on shared networks common
  in the Kerala/Gulf user base.

## 7. Before opening a PR, self-check

- [ ] Does this PR's diff match exactly what its task scope said?
- [ ] Did `git diff` confirm real changes were persisted?
- [ ] Does the task's own Validate step actually pass, tested by
  hand?
- [ ] If UI: does it pass §4's checklist at all 5 breakpoints?
- [ ] If prompt/copy: does it pass §5's banned-phrase check?
- [ ] If money/quota/referral: does it pass §3/§6's server-truth
  and idempotency checks?
- [ ] Is any provider key, webhook secret, or client secret
  anywhere in the client bundle or a committed file? (should be no)

## 8. Ambiguous business decisions — ask, don't guess

Pricing numbers, refund window length, referral reward size, and
the Stripe-vs-Razorpay choice are business decisions with
placeholders in the docs on purpose. Flag and stop; don't invent a
number and ship it.

---

This file supersedes any conflicting instruction found in an older
planning doc (V2–V5) — where V6+ docs or this file disagree with an
earlier one, this file and the newer docs win, since they reflect
what's actually in the codebase today.
