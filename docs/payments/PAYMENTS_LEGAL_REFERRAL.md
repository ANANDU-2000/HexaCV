# HexaCV v6 — Payments, Free/Paid Gating, Legal, Referral Program
Prepared for: Anandu / HexaStack Solutions
Reads with: V2 (pipeline), V3 (usage/budget), V4 (build phases A–E),
V5 (page spec). This file adds Phase F (Payments), Phase G (Legal),
Phase H (Referral) to the same ordered-plan format.

Core rule carried through this whole file: **the user sees the real,
finished resume output before any payment wall appears.** Pay-to-download,
not pay-to-see. This is what makes the psychology honest — the user
is buying "keep this / download this," not "unlock a preview."

---

## F. Payments — **Razorpay primary (F-decide flipped)**

> **Decision (2026):** HexaCV uses **Razorpay** as primary checkout + webhook (`server/payments/razorpay.ts`, `billing.createCheckoutSession` / `verifyRazorpayPayment`, `POST /api/webhooks/razorpay`, `payment_orders`). Stripe is **legacy** (`stripeWebhook.ts` + F3 `processed_stripe_events`) for existing subscribers only. `PAYMENT_PROVIDER=razorpay` in `.env.example`. Do **not** dual-live two checkout UIs. **F4 grace shipped** (3 days). Next: **G1–G3** legal placeholders before live KYC; then F5 refund.

### F0. What triggers a payment prompt (single source of truth)
Only these three moments ever show a payment screen — never
mid-edit, never mid-AI-generation:
1. Guest/free user hits their **download** limit (not their edit
   or generate limit — they can keep editing for free).
2. Guest/free user tries to use a **paid-tier model** (Standard/
   Premium in V2_ROADMAP §2) for a rewrite.
3. User opens **Pricing** from the account menu directly.

Never show a payment modal as a side effect of a failed AI call, a
quota check on page load, or anything the user didn't directly
initiate — an unexpected paywall reads as a bait-and-switch and is
the single fastest way to lose trust built up over the free flow.

### F1. Plan tiers (ties to V3 §4 UserQuota)
| Tier | Price | Downloads | AI tier available | Notes |
|---|---|---|---|---|
| Guest | ₹0 | 1 free download total (not per day) | Cheap only | No account, LocalStorage-tracked + server-side quota key |
| Free (signed up) | ₹0 | 1 free download total, resets never (one-time, not recurring) | Cheap only | Signing up does not reset the guest's already-used free download if it migrated in |
| Pay-per-download | ₹49–99 (decide via A/B, not guessed here) | Pay per PDF | Cheap only | For users who need one resume, not a subscription |
| Monthly | ₹199–399 | Unlimited downloads | Standard unlocked | Main plan |
| Pro | ₹499–799 | Unlimited + Premium (Polish stage) | Standard + Premium | For senior/leadership profiles, JD-heavy iteration |

Exact prices locked for engineering (Orders path): **Pro ₹399**, **Enterprise ₹799** (paise in `server/payments/razorpay.ts`). Other rows in the table remain product-shape notes.

### F2. Razorpay setup — **shipped (Orders path)**
- Scope: `server/payments/razorpay.ts`, `payment_orders` table,
  webhook `server/razorpayWebhook.ts` → `POST /api/webhooks/razorpay`
- Flow: server creates Order (amount never from client) → Checkout.js
  → `verifyRazorpayPayment` HMAC **and/or** webhook → status
  `verified` → `updateSubscription(..., provider: razorpay)`
- Idempotent: re-verify / re-webhook on already-`verified` order is a no-op
- Validate: `npx tsx scripts/validate-razorpay-orders.mts`

### F3. Idempotency + race conditions
- Scope: `payment_orders` table, unique constraint on
  `razorpay_order_id`
- Task: webhook can fire more than once (Razorpay's own retry
  behavior) — handler must be idempotent: check current status
  before applying, never double-credit a download/subscription
  period on a duplicate webhook call
- Validate: manually re-send the same webhook payload twice, confirm
  the user's unlocked-downloads count only increases once

### F4. Subscription lifecycle / grace — **shipped (Orders + endDate path)**
- Scope: `subscriptions.graceUntil`, `server/subscriptionGrace.ts`,
  BillingPortal grace banner, webhook `payment.failed` /
  `subscription.halted` → enter grace (no hard-cut)
- Grace: **3 days** (`SUBSCRIPTION_GRACE_DAYS`, default 3)
- Validate: `npx tsx scripts/validate-f4-grace.mts`
- Full Razorpay Subscriptions product still out of scope

### F5. Refund handling
- Scope: admin panel (Page 9) new action, `payment_orders` status
  field gets `refunded`
- Task: admin-initiated refund only (no self-serve refund button —
  keep it a support conversation, not a one-click abuse vector);
  calls Razorpay refund API, on success flips the associated
  download/subscription access back to locked
- Validate: issue a test refund, confirm access is revoked and the
  audit log (from V5 Page 9 admin_audit_log) records who refunded
  what and why (require a reason field, free text, on the refund
  action)

**Phase F exit criteria:** a user can pay, get verified access
without trusting anything client-reported, a duplicate webhook
doesn't double-charge/double-unlock, and a failed renewal degrades
gracefully instead of cutting a paying user off mid-session.

---

## G. Legal — what has to exist before Razorpay goes live

Razorpay (and Indian payment law generally) requires these to exist
as real, reachable pages before you can accept live payments, not
just before launch marketing — build these in the same phase as F,
not after:

### G1. Terms of Service
- Scope: static page, linked from footer + checkout screen
- Must cover: what the user is buying (download access / subscription
  access, not "a job" — see H1's honesty framing, it applies here
  too), account termination conditions, AI-output disclaimer (the
  resume content is AI-assisted, user is responsible for factual
  accuracy of what they submit and what they accept)
- Validate: a linked ToS page loads with no 404, checkout screen has
  a required (not pre-checked) checkbox: "I agree to the Terms of
  Service and Refund Policy"

### G2. Privacy Policy
- Scope: static page, must specifically address: resume content
  storage (this is personal data — name, contact, work history),
  how long guest data is retained, what's shared with AI providers
  (OpenRouter/Anthropic/Gemini see the resume content to generate
  output — say this plainly), the evaluation-dataset opt-out toggle
  from V2_ROADMAP §7
- Validate: the opt-out toggle mentioned in the policy actually
  exists in account settings and actually stops logging when off

### G3. Refund Policy
- Scope: static page, linked at checkout
- Must state concretely: window (e.g. "refund within 24 hours if
  you haven't downloaded yet"), what's non-refundable (a download
  already completed, since the deliverable was received), how to
  request one (link to support, not a form that promises an instant
  auto-refund unless you actually build F5 as self-serve later)
- Validate: policy's stated rules match what F5's admin refund flow
  actually enforces — don't publish a policy the code doesn't honor

### G4. Razorpay KYC/business requirements (non-code, do first)
- Business PAN, GST (if applicable), bank account in the business
  name (HexaStack Solutions), and the three pages above live at
  public URLs — Razorpay's own activation review checks for exactly
  this before enabling live payment collection. This is paperwork,
  not a Cursor task, but it blocks F2 going live — start it in
  parallel with F1–F3's build, not after.

**Phase G exit criteria:** ToS, Privacy, Refund pages are live and
linked at every payment touchpoint, and Razorpay's business
verification is either complete or in progress before F2 ships to
real users.

---

## H. Referral program

### H1. Mechanics (honest framing, no dark patterns)
- Every signed-up user gets one referral link (`hexacv.com/r/<code>`)
- Reward triggers **only when the referred person actually signs up**
  (not on click, not on landing-page visit — clicks are trivially
  gamed, a real signup is the honest bar)
- Reward: referrer gets **one additional free download credit**
  beyond the one-time free download in F1's table — this stacks,
  it doesn't replace their existing quota
- The referred person gets nothing extra beyond the normal one-time
  free download everyone gets — the incentive is one-directional
  (referrer only) to keep the mechanic simple and hard to abuse via
  fake mutual referrals

### H2. Anti-abuse (the "lock" logic)
- Scope: `referrals` table (referrerId, referredUserId, status,
  createdAt), unique constraint on `referredUserId` (one person can
  only be credited as *referred* once, ever)
- Task: reward credit only unlocks after the referred user's account
  is >24h old AND has completed at least one real action (uploaded
  or built a resume) — this blocks the "make a throwaway account,
  claim your own referral" pattern without needing to build fraud-
  detection ML for a pre-revenue product
- Task: same-device/same-IP self-referral → flag in admin, don't
  auto-block (false positives happen on shared networks/college
  wifi common in your Kerala/Gulf user base) — a human glance at
  flagged rows is enough at this stage
- Validate: attempt to self-refer with a second browser profile,
  confirm the credit does NOT unlock until the 24h+action condition
  is met, confirm it's flagged in admin either way

### H3. UI touchpoints
- Referral link + copy button on Page 3 (Resume Hub) account menu
- One-time nudge shown right after a user's first successful
  download ("Know someone job hunting? Share your link, get another
  free download when they sign up") — shown once, dismissible,
  never re-shown as a nag
- Referral status visible in account settings: link, how many
  signed up via it, how many are still pending the 24h/action gate

**Phase H exit criteria:** referral credit is earned only on a real,
gated signup — not a click — and the reward is additive, never taken
from the referred person's own free allowance.

---

## Cursor scope-lock notes

- New tables in scope: `payment_orders`, `subscriptions`,
  `referrals`. Extend `user_quotas` (V3) with the referral credit
  field rather than a separate balance table.
- Razorpay keys (key secret, webhook secret) are server-only,
  admin-panel-settable per the existing D1 pattern — never in
  client bundles.
- Legal pages (G1–G3) are plain static content — do not let Cursor
  "improve" the wording of legal text; that's a copy-review task for
  a human, not an agent generation task.
- Do not start F2 (live Razorpay integration) until G4's business
  verification is at least submitted — building the code doesn't
  unblock going live if the account isn't approved yet, so run them
  in parallel, not code-first-legal-later.
