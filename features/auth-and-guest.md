# 10. Auth & Guest Mode

> Sign in / up with the HexaCv OAuth portal, plus a full **guest mode** where drafts
> live on-device and migrate to the account on sign-in.

**Status:** Implemented · **NEW:** guest-flow fix (no login loop).

## Purpose
Lowest-friction on-ramp: guests can upload, target, and build locally without an
account; sign-in is required only at the build/payment step and saves their work to cloud.

## Guest mode
- Resumes persist to `localStorage` (`hexacv_local_resumes`), **max 3 guest drafts**
  (enforced in `useResumeStorage.saveResume` → `GUEST_LIMIT_REACHED`).
- Entry drafts (`hexacv_entry_draft`) and target drafts (`hexacv_target_panel_draft`)
  live in session/localStorage so nothing is lost across the funnel.
- `GuestBanner` shows in the builder with a Sign-in CTA.

## Sign-in / up (`client/src/pages/Login.tsx`, `Register.tsx`)
- Primary: **"Sign in with HexaCv"** → OAuth portal (`getLoginUrl`) — shows a
  "guest mode still works" note when the portal isn't configured (`canUseOAuthPortal`).
- Secondary: **"Continue as guest"** → `guestHref(redirect)`.

## Guest-flow rules (**NEW fix**)
- `guestHref` never routes a guest into an auth-gated page (`/dashboard/*`, `/admin`,
  `/url` → falls back to `/builder`) — this removed an **infinite login loop** where
  `Continue as guest → /builder/target → /login → Continue as guest → …`.
- `Targeting` is now guest-usable: guests fill role/region/JD, and the build CTA says
  **"Sign in to build your resume"** → `/login?redirect=/builder/target&convert=true`.
- `ParseReview` lets guests continue straight to targeting (sign-in gated at the build).

## Conversion on sign-in (`Login.handlePostLoginFlow`)
- Reads `guest_session_id` (legacy hook) and calls `syncGuestDataToCloud()`, which
  uploads up to 3 local resumes + backups and clears local storage.
- The server grants the free `signup_free` credit on account creation / guest conversion
  (`db.ts`, `routers.ts.convertGuest`).

## Implementation
| Piece | File |
|-------|------|
| Auth state | `client/src/_core/hooks/useAuth.ts` — `auth.me`, logout, `manus-runtime-user-info` |
| Local store | `client/src/lib/localStorageDb.ts` |
| Storage abstraction | `client/src/_core/hooks/useResumeStorage.ts` — cloud vs local, sync, limit |
| Server auth | `server/_core/*`, `server/routers.ts` (auth router, `convertGuest`), `server/guest.test.ts` |

## Edge cases
- OAuth portal unavailable → guests still fully functional.
- Guest hits 3-draft limit → toast "Guest limit reached. Sign in to save unlimited resumes."
- Cloud save fails → transparent fallback to local storage.
