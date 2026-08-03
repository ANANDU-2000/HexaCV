# 9. Billing & Credits

> Pay-per-build monetization: a credit ledger, ₹99 single builds, **build bundles**,
> Razorpay checkout, idempotent fulfillment, and refunds.

**Status:** Implemented · **NEW:** build bundles (1/3/5/10) + credit-balance refresh.

## Purpose
"First build free, then ₹99 per resume — no subscription." The server owns pricing and
grant amounts; the client never reports a price or grants itself credits.

## Credit ledger (`server/credits.ts`)
`balance = SUM(delta)` over `creditLedger` rows. Reasons: `signup_free` (+1, once per
account) · `purchase` (+N per order) · `referral_reward` (+1) · `build_consume` (−1) ·
`build_release` (+1 on failed build) · `admin_grant`.

## Pricing (`server/payments/razorpay.ts` → `RAZORPAY_PRICES_PAISE`)
| Tier | Credits | ₹ |
|------|---------|---|
| `build` | 1 | 99 |
| `build_3` | 3 | 249 |
| `build_5` | 5 | 399 |
| `build_10` | 10 | 699 |
| `pro` / `enterprise` | — | legacy subscriptions (collapsed UI) |

`creditCountForBuildTier(tier)` maps a tier → credit count (null for legacy).

## Payment flow
1. `billing.createCheckoutSession({ tier })` → `createRazorpayOrder` (live API or sandbox
   mock when keys are placeholders) → persists a `paymentOrders` row (`pending`).
2. Client opens Razorpay Checkout; on success calls `verifyRazorpayPayment`
   (signature verify) **and** the server webhook (`/api/webhooks/razorpay`) both route to
   `fulfillVerifiedPayment`.
3. `fulfillVerifiedPayment` marks the order `verified` (idempotent), grants
   `creditCount` credits via `grantPurchaseCredit(userId, orderId, count)`, and fires the
   referral reward once.
4. Admin refund (`adminRefundPaymentOrder`) hits the Razorpay refund API and marks
   `refunded`.

## UI
| Surface | File |
|---------|------|
| Confirm & Pay | `Targeting.tsx` (single build, in-flow) |
| Buy credits / packs | `client/src/components/BillingPortal.tsx` — **NEW** 4 pack cards; **NEW** refreshes `credits.getBalance` after payment |
| Packs constant | `client/src/lib/buildPacks.ts` — single source of truth for all surfaces |

## Key details
- **Idempotency:** every grant uses a stable key (`purchase:${orderId}`), so retries and
  duplicate webhooks never double-credit.
- **Credit consumption** is idempotent per build (`build_consume:${buildId}`); released
  on failure.
- Legacy `pro`/`enterprise` still update the subscription row; the UI collapses them
  ("existing accounts only").

## New additions (this cycle)
- `build_3` / `build_5` / `build_10` tiers + `creditCountForBuildTier`.
- BillingPortal pack grid + post-payment balance refresh (was stale before).
- Pricing page packs grid and teaser mention.
