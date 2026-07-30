# HexaCV — PAGE_TECH_SYNOPSIS.md (Frontend + API + Backend + DB per page)
Prepared for: Anandu / HexaStack Solutions
One row of detail per page/feature: the actual client file, the
tRPC procedures it calls, which backend module handles the logic,
and which DB tables get touched. Existing pages are grounded in the
real repo; new (V6) pages are marked accordingly.

---

## Landing (`client/src/pages/Landing.tsx`) — existing
- **Calls:** none (static/public) — referral param, if present, may
  fire `affiliate.trackClick` (public procedure)
- **Backend:** `routers.ts` → `affiliate.trackClick`
- **DB:** `affiliateReferrals` (write on click)
- **Flow:** Flow A step 1, Flow D step 2

## Login / Register (`client/src/pages/Login.tsx`,
`Register.tsx`) — existing
- **Calls:** `auth.me`, OAuth redirect (Manus OAuth, not a tRPC call
  — handled by `server/_core/oauth.ts` route directly), guest bypass
  (client-only, sets LocalStorage `guestId`)
- **Backend:** `server/_core/oauth.ts` (callback → `upsertUser`
  pattern), `routers.ts` `auth` namespace for session state
- **DB:** `users` (upsert on OAuth callback), `guestSessions` (guest
  path)
- **Flow:** Flow A step 2, Flow B step 3
- **Gap:** email/password (Phase D2) and Google/Apple (D3/D4) are
  planned, not present — only Manus OAuth + guest bypass exist today

## Resume Hub (`client/src/pages/ResumeBuilderHub.tsx`) — existing
- **Calls:** `resume.list` (protectedProcedure query, line ~41 in
  `routers.ts`), delete/edit mutations further down the `resume`
  namespace
- **Backend:** `routers.ts` `resume` namespace → `db.ts` query layer
- **DB:** `resumes` (read list, soft-delete flag on delete)
- **Flow:** Flow A step 3

## New resume modal (Page 4, likely inside `ResumeUpload.tsx` /
`ResumeScratch.tsx`) — existing
- **Calls:** upload path → `fileParser.ts` (not a tRPC procedure,
  likely a REST/multipart upload endpoint — confirm exact route
  before building on it) → `ai` namespace extract call; blank path →
  no backend call, client creates an empty resume shape locally until
  first save
- **Backend:** `fileParser.ts`, `aiSuggestions.ts` (Stage 1 extract)
- **DB:** `resumes` (insert on first save), `resumeHistory` (if
  version tracking is wired here)
- **Flow:** Flow A step 4

## Builder / Editor (`client/src/pages/ResumeEditorWorkspace.tsx`,
`ResumeAI.tsx`) — existing, core page
- **Calls:** `resume.update`/`resume.get` (autosave + load),
  `jobDescription.*` (Page 7 JD targeting), `ai.*` namespace
  (per-field rewrite/improve — this is the Stage 3 call path),
  likely a `contentValidation`-backed score-check call for "Check
  score" (Stage 4 evaluator)
- **Backend:** `aiSuggestions.ts` (rewrite logic),
  `contentValidation.ts` (validation/scoring), `countryRoutes.ts`
  (country-rule field visibility)
- **DB:** `resumes.content` (JSON, updated on save/AI-accept),
  `jobDescriptions` (JD + keywords), `resumeHistory` (if versioning
  is active)
- **Flow:** Flow A step 5–6
- **Note:** `userEdited`-per-field protection (V4 C4) is a schema
  addition to the `content` JSON shape, not a new table — confirm
  current `content` structure in `shared/types.ts` before adding it.

## Template selector (Page 6) — existing (slide-over, likely inside
`ResumeEditorWorkspace.tsx`, no separate route)
- **Calls:** none server-side for preview (client-side re-render);
  `resume.update` (templateId field) on Apply
- **DB:** `resumes.templateId`

## Export (Page 8) — existing (likely inside
`ResumeEditorWorkspace.tsx` or a dedicated export step)
- **Calls:** none required server-side if PDF render is fully
  client-side (`html2canvas`) — confirm whether a server-side
  PDF-generation call exists for the "Copy as text" or higher-
  fidelity export path
- **DB:** none written (read-only render of `resumes.content`)

## Admin dashboard (`client/src/pages/Dashboard.tsx`,
`DashboardHome.tsx`) — existing
- **Calls:** `admin.getDashboardStats`, `admin.getUsers`,
  `admin.getTickets`, `admin.getApiKeys` (all `adminProcedure`,
  confirmed in `routers.ts` lines 854–879)
- **Backend:** `routers.ts` `admin` namespace, `apiKeyManager.ts`
- **DB:** `users`, `supportTickets`, plus whatever `getDashboardStats`
  aggregates (confirm exact tables queried before extending)
- **Gap:** Model routing/fallback-chain editor, Prompt versions tab,
  Budget & quotas tab (V5 Page 9 spec) are planned, not present —
  `apiKeyManager.ts` exists as the likely home for the routing table
  addition (V4 B1) rather than a new file

---

## New pages (V6) — not yet built, spec only

### Pricing / Checkout (`Pricing.tsx`, new)
- **Calls:** `billing.getSubscription` (existing), 
  `billing.createCheckoutSession` (existing, real Stripe integration)
- **Backend:** `routers.ts` `billing` namespace (already implemented
  for Stripe), `stripeWebhook.ts` (async confirmation path)
- **DB:** `subscriptions` (written only via webhook, never directly
  from this page's own click handler)
- **Removal/lockdown needed:** `billing.upgradePlan` must stop being
  reachable as a free-form client mutation (docs/architecture/ARCHITECTURE.md §5)

### Referral dashboard (`Referral.tsx`, new)
- **Calls:** `affiliate.getStats` (existing), `affiliate.trackClick`
  (existing, fired from Landing not this page)
- **Backend:** `routers.ts` `affiliate` namespace, `db.ts`
  `getReferralsByReferrer` / `rewardReferralConversion`
- **DB:** `affiliateReferrals`
- **Rework needed:** gate logic decision (docs/product/USER_FLOW.md Flow D)

### Blog list/post (`BlogList.tsx`, `BlogPost.tsx`, new)
- **Calls:** new `blog.list` / `blog.getBySlug` procedures (new,
  add to a new or existing router — likely a new `blog` namespace
  in `routers.ts`, public procedures)
- **Backend:** new logic, small — CRUD + status filter
- **DB:** new `blog_posts` table

### Legal pages (`Terms.tsx`, `Privacy.tsx`, `Refund.tsx`, new)
- **Calls:** none — fully static content, no backend
- **DB:** none

### Admin Billing tab (extends `Dashboard.tsx`, new tab)
- **Calls:** new `admin.getBillingStats`, new
  `admin.manualGrantSubscription`, new `admin.refundSubscription`
- **Backend:** extends `routers.ts` `admin` namespace + `db.ts`,
  calls Stripe's refund API server-side
- **DB:** `subscriptions`, new `admin_audit_log` table (reason
  required on every grant/refund)

---

## Cursor scope-lock notes
- Rows marked "existing" should be re-confirmed against the actual
  file (this doc is accurate as of the uploaded zip, but re-grep
  before building on anything if time has passed) — this is a map,
  not a guarantee the code hasn't changed since.
- New procedures for Blog/Referral/Billing-admin should live in
  `routers.ts` as new namespaces or extensions of existing ones
  (`admin`, `affiliate`), per the "extend before creating" rule in
  docs/tasks/MASTER_TASKS.md Part 1.
