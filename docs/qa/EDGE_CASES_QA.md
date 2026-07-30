# HexaCV v6 — Edge Cases & QA Scenarios
Prepared for: Anandu / HexaStack Solutions
Every row below must have a test before Phase F/H (payments,
referral) go live. "Same time users" and "money" edge cases are the
ones that actually cost you real amounts if missed — prioritize
those first.

| # | Scenario | Required behavior | Where it's handled |
|---|---|---|---|
| 1 | Two users trigger AI rewrite at the exact same second, both on a rate-limited free model | Both succeed or both fall back cleanly — no request silently dropped. Pre-emptive fallback (V3 §3) must be checked per-request, not cached stale | V4 A3 |
| 2 | Same user pays on two tabs at once (double-click checkout, or opens checkout twice) | Idempotent order creation — second attempt either reuses the pending order or creates a separate one that gets refunded/voided if the first succeeds, never double-charges | V6_PAYMENTS F2/F3 |
| 3 | User claims payment succeeded (manipulated client state) but no real payment occurred | Server never unlocks based on client-reported status alone — signature verification + webhook required | V6_PAYMENTS F2 |
| 4 | Webhook fires twice for the same payment (Razorpay's documented retry behavior) | Idempotency key on `razorpay_order_id` — second webhook is a no-op, not a double credit | V6_PAYMENTS F3 |
| 5 | Browser refresh mid-AI-generation (Builder page) | Generation continues server-side; on reload, poll/fetch the in-flight job's status and show the result if it completed, or resume the loading state if still running — never silently lose the call the user already paid quota for | V5 Page 5 edge cases |
| 6 | Browser refresh mid-checkout (Razorpay modal open, payment not yet completed) | On reload, if an order is `pending`, show a "resume payment" state tied to that order ID rather than creating a fresh order — avoids orphaned pending orders piling up | V6_PAYMENTS F2 |
| 7 | User signs up mid-session after using guest mode | Guest resumes + guest's one-time free-download status migrate to the new account — a signup must never grant a *second* free download by resetting the counter | V5 Page 2, V6_PAYMENTS F1 |
| 8 | User logs in on a new device/browser | Full resume history + quota state must be server-truth, not LocalStorage-truth — LocalStorage guest IDs are a bootstrap mechanism only, never the system of record once an account exists | V5 Page 2 |
| 9 | User edits a field manually, then clicks "Re-check with AI" | That exact field is never touched by the regeneration (`userEdited` flag) — verify across all 7 section tabs, not just one | V4 C4, V5 Page 5 |
| 10 | User duplicates a resume, then edits and downloads the copy | Duplicate is a full independent record (new ID), edits to the copy never touch the original, both remain independently downloadable at any time | New — see §Duplicate below |
| 11 | Two AI rewrite clicks on the same field in quick succession | Second click is a no-op until the first resolves — debounce at the button level, not just a visual disable that still lets a fast double-click fire two requests | V5 Page 5 |
| 12 | Free/guest download limit reached mid-edit (not on page load) | Payment prompt appears only when Download is clicked, never interrupts active editing — matches V6_PAYMENTS F0's "only 3 triggers" rule | V6_PAYMENTS F0 |
| 13 | Referral self-abuse: same person creates a second account to refer themselves | Credit gated on account age >24h + one real action; same-IP/device flagged for admin review, not auto-blocked (avoids false positives on shared networks) | V6_PAYMENTS H2 |
| 14 | Subscription renewal payment fails (card declined) | 3-day grace period with a visible banner before downgrade — never an instant, silent cutoff for a paying user | V6_PAYMENTS F4 |
| 15 | Admin disables an auth provider while a user has the signup page open | Click on that provider's button returns a clean "unavailable" message, not a broken redirect — check `enabled` server-side at click time, not just at initial page load | V5 Page 2 |
| 16 | Uploaded resume file is corrupted or an unsupported format | Specific error naming the problem ("couldn't read this DOCX"), never a silent failure or generic 500 | V5 Page 4 |
| 17 | AI provider returns malformed JSON or times out mid-Stage-3 | Falls back per the circuit breaker (V4 A4) — user sees a retry happen automatically, or a clear "couldn't generate this right now, your original text is unchanged" message, never a broken/half-rendered field | V4 A3/A4, V2_ROADMAP §11 |
| 18 | User is mid-session when their plan's monthly quota resets at midnight | Quota check happens per-request against live `quotaResetAt`, not a value cached at login — a user working past midnight should see their quota refresh without needing to re-login | V3 §4 |

## Duplicate-resume behavior (new — not fully specified elsewhere)
- Scope: `resumes` table already has an id; duplicate = insert new
  row with all fields copied, new id, `duplicatedFrom` pointer for
  admin/support traceability only (not shown to user as a feature)
- Any `userEdited` flags on the original do NOT carry semantic
  meaning for the copy's own future AI re-checks — the copy starts
  with the same flags (a field the user manually edited in the
  original should still be protected in the copy, since the words
  are still theirs), but each resume's edit history is independent
  going forward
- Validate: duplicate a resume, edit only the copy's Summary, run
  "Re-check with AI" on the copy — confirm the original resume is
  completely untouched and the copy's protected fields behave
  identically to how they did before duplication

## What "lost user / lost money" actually means here — priority order
If you can only harden a subset of the table above before Phase F
goes live with real payments, do it in this order:
1. Rows 2–4 (payment idempotency/verification) — this is literal
   money, get it airtight first
2. Row 14 (renewal grace period) — a paying user cut off unfairly is
   a churn + refund-request event, avoidable
3. Rows 5–8 (refresh/session continuity) — this is where a user
   "gets stuck" and abandons, the exact symptom you described
4. Rows 9, 11, 16, 17 — already partly covered by V4/V5, re-verify
   under real load, not just the happy-path demo
5. Row 13 (referral abuse) — lower cost if missed (worst case is a
   few extra free downloads, not a financial loss like rows 2–4)

---

## Cursor scope-lock notes

- This file is a test/QA checklist, not new architecture — every
  row maps to a scope already defined in V2–V6, cross-referenced in
  the rightmost column. Don't create new subsystems to "fix" a row;
  find the existing file/table it belongs to and harden that.
- Any row that fails in manual testing gets its own bug-tracking
  task, scoped to exactly that row — don't bundle three edge-case
  fixes into one PR, same discipline as the rest of this plan.
