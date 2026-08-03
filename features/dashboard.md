# 11. Dashboard

> The signed-in home: resume history, billing, settings, ATS scanner, affiliate, and
> admin views — routed under `/dashboard` (guest-accessible home for local drafts).

**Status:** Implemented.

## Purpose
A place to manage saved resumes, buy credits, scan for ATS compliance, configure the
account, and (for admins) run the CRM.

## Routes (`client/src/pages/Dashboard.tsx`)
| Route | View | Notes |
|-------|------|-------|
| `/dashboard` | `DashboardHome` | resume cards (role, region, status, edited time); **guest banner** at 2/3 of the 3-draft cap; Create → `/builder/target` |
| `/dashboard/ats` | `ATSScanner` | ATS compliance scanner over saved resumes |
| `/dashboard/affiliate` | `AffiliateSystem` | referral tracking |
| `/dashboard/billing` | `BillingPortal` | **build packs + legacy plans** (see [billing-credits.md](billing-credits.md)) |
| `/dashboard/settings` | `UserSettings` | account config |
| `/dashboard/admin`, `/admin`, `/url` | `AdminCRM` | admin views |
| `/dashboard/builder/*` | Redirects | legacy hub retired → `/builder/*` (preserves `?id=`) |

## Key details
- `DashboardHome` works for **guests** (shows local resumes); other sub-routes are
  account/admin scoped.
- Guest banner sign-in → `/login?convert=true`.
- Resume cards are cards, not a dense table (per design docs).

## Edge cases
- Zero resumes → single "Create your first resume" empty state.
- Guest at 2/3 cap → persistent banner nudges sign-in before the 3rd draft.
