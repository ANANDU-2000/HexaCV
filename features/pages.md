# Page-by-Page Feature Map

Every route in HexaCV, its purpose, key features, and implementation. Routes come from
`client/src/App.tsx`. **NEW** = added/changed this development cycle.

## Route map

| Route | Page | Auth | Status |
|-------|------|------|--------|
| `/` | Landing | Public | Implemented + **NEW** hero |
| `/login` | Login | Public | Implemented + **NEW** guest fix |
| `/register` | Register | Public | Implemented |
| `/terms` / `/privacy` / `/refund` / `/cookies` | Legal pages | Public | Implemented (placeholders) |
| `/pricing` | Pricing | Public | Implemented + **NEW** packs |
| `/builder` | Builder home (mode grid) | Guest-OK | Implemented |
| `/builder/upload` `/builder/scratch` `/builder/ai` `/builder/linkedin` | Builder modes | Guest-OK | Implemented |
| `/builder/review-draft` | ParseReview | Public | Implemented |
| `/builder/target` | Targeting | Guest-OK, build gated | Implemented + **NEW** |
| `/dashboard` `/dashboard/:sub*` | Dashboard | Guest home OK | Implemented |
| `/admin` `/url` | AdminCRM | Admin | Implemented |
| `/resume-examples/:country/:role` | ResumeExampleLanding | Public (SEO) | Implemented |
| fallback | NotFound (404) | Public | Implemented |

---

## 1. Landing — `/`
The conversion funnel. Pain-point hero ("Stop being ghosted."), real resume preview,
3 entry methods, proof sections, pricing teaser, FAQ.
→ Details in [landing.md](landing.md), flow in [workflows.md](workflows.md).

## 2. Login — `/login`
- **Features:** "Sign in with HexaCv" (OAuth portal) · **"Continue as guest"** (→
  `guestHref`) · convert-flag handling ("Save your guest resume") · guest-draft
  migration on sign-in.
- **NEW:** `guestHref` avoids auth-gated routes — no login loop.
- File: `client/src/pages/Login.tsx` (→ [auth-and-guest.md](auth-and-guest.md)).

## 3. Register — `/register`
- **Features:** "Sign up with HexaCv" · "Continue as guest" · conversion redirects.
- File: `client/src/pages/Register.tsx`.

## 4. Legal pages — `/terms` `/privacy` `/refund` `/cookies`
- **Features:** shared `LegalPageLayout` shell; sections drafted as `LegalPlaceholder`
  prompts for a lawyer (download-access terms, AI-output disclaimer, guest-data
  retention, AI-provider sharing, evaluation opt-out, refund window, session cookies).
- **Refund** links to in-app Support (`/dashboard/settings`) and notes the Razorpay
  refund path (F5).
- Files: `client/src/pages/{Terms,Privacy,Refund,Cookie}.tsx`.

## 5. Pricing — `/pricing`
- **Features:** ₹99/build story · first-build-free badge · feature checklist ·
  **NEW** build-packs grid (1/3/5/10) with save badges · free-vs-paid summary ·
  legacy-plan note.
- File: `client/src/pages/Pricing.tsx` (→ [pricing.md](pricing.md)).

## 6. Builder home + modes — `/builder` and `/builder/{upload,scratch,ai,linkedin}`
- **Features:** mode-card grid (Upload / Create from scratch / AI generate / LinkedIn) ·
  **TargetPanel** (role, market, experience, JD) · saved-drafts list · `GuestBanner` +
  3-draft local cap · mobile bottom nav.
- `?role=` / `?country=` prefill the target panel (SEO deep links); `?id=` opens a draft.
- Files: `client/src/pages/ResumeBuilder.tsx` + `components/ResumeUploader`,
  `ResumeScratchBuilder`, `ResumeAIGenerator`, `ResumeLinkedInImporter`,
  `ResumeEditor` (→ [resume-editor.md](resume-editor.md), [upload-and-extraction.md](upload-and-extraction.md)).

## 7. ParseReview — `/builder/review-draft`
- **Features:** post-parse review ("Does this look right?") — name, source, sections found.
- **NEW:** "Looks good — continue" sends guests straight to targeting (no login wall at review).
- File: `client/src/pages/ParseReview.tsx`.

## 8. Targeting — `/builder/target`
- **Features:** region (India/Gulf) · target role + suggestions · optional JD · CTA with
  dynamic label · **NEW** Confirm & Pay overlay + guest gating at the build step ·
  floating-label inputs.
- File: `client/src/pages/Targeting.tsx` (→ [targeting.md](targeting.md)).

## 9. Dashboard — `/dashboard` (+ sub-routes)
- **Features:** home resume cards (guest-OK, guest banner) · `/ats` scanner ·
  `/affiliate` referral · `/billing` **BillingPortal** (**NEW** pack grid + balance
  refresh) · `/settings` · `/admin` (AdminCRM, also at `/admin`, `/url`) · legacy
  `/dashboard/builder/*` redirects to `/builder/*`.
- Files: `client/src/pages/Dashboard.tsx`, `DashboardHome.tsx` + `components/`
  (→ [dashboard.md](dashboard.md), [billing-credits.md](billing-credits.md)).

## 10. ResumeExampleLanding — `/resume-examples/:country/:role`
- **Features:** SEO landing for "`<role>` resume for `<country>`" — ATS/format notes,
  grounded example bullets, "Build this resume" CTA prefilled into `/builder`.
- Uses `lib/resumeExamples.ts`; renders `NotFound` for unknown slugs.
- File: `client/src/pages/ResumeExampleLanding.tsx`.

## 11. NotFound — fallback
- **Features:** 404 card + "Go Home". Used for unknown routes and missing examples.
- File: `client/src/pages/NotFound.tsx`.

---

## Feature → page quick index

| Feature | Main page(s) |
|---------|--------------|
| Extraction window (ParseLoader) | Landing `/` |
| Build bundles / buy credits | `/pricing`, `/dashboard/billing` |
| Contextual editor | Builder editor |
| Guest mode / sign-in | Landing, `/login`, `/register`, `/builder/*` |
| ATS score / regional rules | Builder editor, `/dashboard/ats` |
| Export | Builder editor ("Review & Export") |
