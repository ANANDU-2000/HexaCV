# 12. Pricing

> One honest price story — "₹99 per resume, first free, no subscription" — with build
> packs for volume. Consistent across the landing teaser, the Pricing page, and billing.

**Status:** Implemented · **NEW:** build packs grid, aligned teaser/FAQ.

## Purpose
Remove the contradiction between the landing copy ("₹99, no subscription") and the
old ₹399/₹799 subscription tiers, and give buyers more price points (bundles).

## Surfaces
| Surface | File |
|---------|------|
| Pricing page | `client/src/pages/Pricing.tsx` |
| Landing teaser | `client/src/components/landing/PricingTeaser.tsx` |
| Landing hero strip + FAQ | `client/src/pages/Landing.tsx`, `client/src/components/landing/LandingFaq.tsx` |
| Buy credits (dashboard) | `client/src/components/BillingPortal.tsx` |
| Packs constant | `client/src/lib/buildPacks.ts` |

## Pricing page structure
1. Hero: "₹99 per resume build. No subscription." + "First build free" badge.
2. Primary **per-build** card: ₹99, feature checklist (role+JD optimization, grounded
   rewrite, ATS keywords, PDF+Word, no-credit-on-failure), CTA → `/dashboard/billing`.
3. **NEW Build packs grid** (1/3/5/10) with per-build price + "Save ₹X" badges.
4. Free-vs-paid summary cards (first build free · PDF & Word export).
5. Legacy note: Pro ₹399 / Enterprise ₹799 only for existing accounts.

## Key details
- Amounts are the **source of truth on the server** (`RAZORPAY_PRICES_PAISE`); the client
  packs constant must match it.
- First build is free for every account via the `signup_free` credit.

## New additions (this cycle)
- Pricing page pack grid + consistent ₹99 story (removed the old subscription cards).
- Teaser now advertises "3 builds for ₹249"; FAQ answers reflect pay-per-build and Word export.
