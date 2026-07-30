# HexaCV v6 â€” AGENT.md + Senior Code Review Rules + Master Task List
Prepared for: Anandu / HexaStack Solutions
This is the file to keep open in Cursor as a pinned reference. It
governs how the agent should behave across every task in V6 (and
retroactively V2â€“V5), plus the single ordered checklist tying every
phase together.

---

## Part 1 â€” AGENT.md (rules for the Cursor agent, every task)

1. **Extend before creating.** Before adding a new file, check
   whether `aiSuggestions.ts`, `apiKeyManager.ts`,
   `contentValidation.ts`, `usageTracker.ts`, or `routers.ts` already
   owns the concern. New file only when an existing one would blow
   past ~400 lines. This rule already exists in V4 â€” restated here
   because it applies to every V6 phase too (payments, marketing,
   referral all extend existing config/admin patterns, not new apps).
2. **Less code beats clever code.** Prefer a boring, obvious 10-line
   solution over an abstracted 40-line one, even if the abstraction
   "might be needed later." YAGNI applies especially hard to a
   pre-revenue solo/small-team project â€” every abstraction is a
   maintenance cost paid by future-you, alone, at 11pm.
3. **No task is done without its own Validate step passing.**
   Carried over from V4 ground rule #2 â€” a Cursor "done" message is
   not evidence, a passing validation step is.
4. **`git diff` after every task, before committing.** Cursor agents
   occasionally report success without persisting an edit â€” this is
   the one-line check that catches it, every time, no exceptions.
5. **Scope lock is absolute.** Each task file lists exact files in
   scope. Touching a file outside that list â€” even a "quick related
   fix" â€” is scope creep. Stop, note it, make it its own task.
6. **Never touch template rendering, PDF export, or auth flows in
   the same PR as pipeline/payment changes.** Keep diffs reviewable
   in isolation â€” this is the same rule V2_ROADMAP already set for
   the pipeline, extended here to payments (never bundle a Razorpay
   webhook fix with a UI restyle).
7. **Secrets never touch the client.** Every provider key, webhook
   secret, and Razorpay key secret lives server-side, admin-panel-
   settable, never in a client bundle or a committed `.env` example
   with real values.
8. **Ask, don't guess, on ambiguous business decisions.** Pricing
   numbers, refund window length, referral reward size â€” these are
   business decisions with placeholders in the V6 docs on purpose.
   The agent should flag them and stop, not invent a number and ship
   it.

## Part 2 â€” Senior engineer code review checklist

Run this on every PR before merge, regardless of which phase it
belongs to:

- [ ] **Correctness first**: does it actually do what the task's
  Validate step describes? Run the validate step yourself, don't
  trust the PR description.
- [ ] **No silent failures**: every catch block either surfaces a
  specific error to the user/logs or is explicitly commented as
  intentionally silent with a reason. A bare `catch {}` is a reject.
- [ ] **No trust of client input for anything money- or quota-
  related**: payment status, download counts, plan tier â€” all must
  be re-checked server-side even if the client already "knows" the
  answer.
- [ ] **Idempotency where retries are possible**: any webhook
  handler, any "at least once" delivery path, must be safe to run
  twice.
- [ ] **No new nested scroll containers, no new hardcoded model
  names, no new hardcoded copy that violates
  docs/ai/PROMPT_AND_FEEDBACK_RULES.md Â§1** â€” three quick greps
  that catch three different classes of regression this project has
  already had.
- [ ] **Diff size matches task scope** â€” a task scoped to one file
  touching five files is either scope creep or a sign the "extend
  before creating" rule was ignored.
- [ ] **Rollback plan exists for anything schema-related**: a new
  column/table addition should be additive (nullable/defaulted), not
  a breaking change to existing rows, unless a migration script is
  part of the same PR and was tested against a copy of real data.

## Part 3 â€” Master task list (Phases Fâ€“I, continuing from V4's Aâ€“E)

Copy-paste checklist, same format as V4. Do not start a later phase
before the previous one's exit criteria (stated in each phase's own
file) are met.

```
Phase F â€” Payments (docs/payments/PAYMENTS_LEGAL_REFERRAL.md Â§F)
[ ] F0  Payment-trigger rule (only 3 moments show a paywall)
[ ] F1  Plan tiers finalized (pricing is a business decision â€” confirm before F2)
[ ] F2  Razorpay order + signature/webhook verification
[ ] F3  Idempotency on payment_orders
[ ] F4  Subscription lifecycle + grace period on renewal failure
[ ] F5  Admin-initiated refund flow

Phase G â€” Legal (Â§G) â€” run in parallel with F, not after
[ ] G1  Terms of Service page
[ ] G2  Privacy Policy page (incl. AI-provider data-sharing disclosure)
[ ] G3  Refund Policy page
[ ] G4  Razorpay KYC/business verification submitted

Phase H â€” Referral program (Â§H)
[ ] H1  Referral link + one-directional reward mechanics
[ ] H2  Anti-abuse gating (24h + real action, same-IP flagging)
[ ] H3  UI touchpoints (hub link, post-download nudge, settings status)

Phase I â€” Marketing & Admin (docs/product/roadmap/V6_MARKETING_ADMIN.md)
[ ] I1  SEO fundamentals (meta tags, sitemap, robots.txt)
[ ] I2  GA4 + GSC admin-configurable tracking
[ ] I3  Blog CRM (admin tab, public /blog routes, share buttons)
[ ] I5  Keep product analytics (yours) and GA/GSC (external) visually separate in admin

Phase J â€” Design & copy gates (apply continuously, not a one-time phase)
[ ] J1  Every new/changed page passes docs/design/DESIGN_STRICT.md Â§7 checklist
[ ] J2  Every new/changed prompt or user-facing copy passes
        docs/ai/PROMPT_AND_FEEDBACK_RULES.md Â§5 checklist
[ ] J3  Feedback loop (rating â†’ reason â†’ 1 auto-retry) wired into
        Builder page + resume_evaluations table

Phase K â€” QA hardening (docs/qa/EDGE_CASES_QA.md)
[ ] K1  Priority-1 rows (payment idempotency, #2-4) verified under
        forced double-fire/duplicate-webhook tests
[ ] K2  Priority-2 row (renewal grace period, #14) verified
[ ] K3  Priority-3 rows (refresh/session continuity, #5-8) verified
[ ] K4  Remaining rows verified before Phase F goes live to real users
```

## Part 4 â€” How to actually start this rebuild in Cursor Pro

Given the amount of planning material now across V2â€“V6, here is the
practical sequencing for opening Cursor and beginning work, so the
plan doesn't stay a plan:

1. **Don't paste all six V6 files into one Cursor session.** Pin
   `AGENT.md` (this file's Part 1) as an always-included rule file
   if your Cursor setup supports project rules (`.cursor/rules/` or
   equivalent) â€” that's the one file every task should always see.
2. **One task, one file, one Cursor chat.** For each checklist item
   above, open a fresh Cursor composer/chat, paste only that item's
   scope (e.g. just "F2" and the relevant section of
   docs/payments/PAYMENTS_LEGAL_REFERRAL.md), not the whole document.
   Cursor agents perform measurably worse with a huge, multi-phase
   context window than with a tightly scoped one â€” this isn't a
   preference, it's why the whole V2-V6 series is broken into scope-
   locked sections in the first place.
3. **Start with F0 + G1-G3 in parallel**, since G4 (Razorpay business
   verification) has a real-world turnaround time (bank/KYC review)
   â€” start that paperwork the same day you start F2's code so
   they finish around the same time, rather than discovering the
   legal requirement after the code is ready.
4. **Run the Part 2 checklist yourself on the first 2-3 PRs by
   hand**, even if it feels slow â€” it calibrates what "done" looks
   like before you're reviewing ten PRs a day and start rubber-
   stamping.
5. **Re-open V4's own Phase A-E checklist first** if any of those
   boxes are still unchecked â€” Phase F (payments) assumes A1's kill
   switch and A2's usage logging already exist, since a payment
   system without a global pause button is a materially riskier
   thing to ship than one with it.

---

## Cursor scope-lock notes

- This file itself should not accumulate new phases â€” once Fâ€“K are
  checked off, the next expansion (V7) gets its own file, same
  pattern as V2â†’V3â†’V4â†’V5â†’V6.
