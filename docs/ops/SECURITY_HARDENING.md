# HexaCv Security Hardening — Phase 3 (implemented) & Production Follow-ups

Implementation status for the three critical findings from the technical audit,
plus the step-2/3/4/6/12 items they unlocked. Follow-ups below are NOT yet done —
they are production-deployment work, listed in priority order.

## Implemented (this change set)

| # | Item | Where |
|---|------|-------|
| 1 | **AI endpoints require sign-in.** All LLM-invoking `ai.*` generation procedures run through `aiCreditProtectedProcedure` (kill switch + auth + credit balance ≥ 1). `submitEvaluation` (feedback signal) is auth-only. `generateFullResume` keeps its own richer gate (auth + credit billing + consume-on-success/release-on-failure). Guests get `UNAUTHORIZED` "Please sign in to use this AI feature." | `server/routers.ts` |
| 1a | **Credit gate on generation.** Signed-in users with balance 0 get `PAYMENT_REQUIRED` ("No build credits left…") instead of running paid LLM micro-tools — extending the build-pipeline policy to all AI generation. New accounts receive the existing idempotent signup credit, so fresh users are unaffected; consumption semantics (per-build, consume-on-success, release-on-error) are unchanged. | `server/routers.ts` |
| 2 | **No client-supplied identity.** `x-local-user-openid` removed from the client and no longer read by the server; identity comes only from the signed `app_session_id` JWT. | `client/src/main.tsx`, `server/_core/sdk.ts` |
| 3 | **`resume.parse` upload hardening.** Server-authoritative gate on extension (pdf/docx/doc/txt), base64 well-formedness, and decoded size ≤ 10 MB (`MAX_RESUME_UPLOAD_BYTES`). Runs before any parsing/LLM work. | `server/uploadValidation.ts` (new), wired in `server/routers.ts` |
| 4 | **Parse text-length guard.** Extracted text over 100k chars (`MAX_RESUME_PARSE_TEXT_CHARS`) is rejected before the parse LLM. | `server/uploadValidation.ts`, `server/routers.ts` |
| 5 | **AI_PAUSED kill switch now covers `resume.parse`** too (it calls the LLM). | `server/routers.ts` |
| 6 | **Scanned/image-only PDFs** produce a clear user-facing error instead of a bare "empty content" message. | `server/fileParser.ts` |
| 7 | **AI input validation.** `aiText`/`aiRequiredText` cap all LLM-facing fields at 50k chars; empty requirements rejected pre-LLM. | `server/routers.ts` |
| 8 | **Ownership enforcement on resume-backed AI.** `generateSuggestions` with a `resumeId` now fails hard (`NOT_FOUND`) for a resume the caller does not own — no silent fallback to caller-supplied content. | `server/routers.ts` |
| 9 | **Guest UX.** ATS scanner no longer fabricates results on sign-in errors — it prompts sign-in instead. | `client/src/components/ATSScanner.tsx` |
| 10 | **Security regression tests** (20) covering all of the above, plus credit consume/release/retry semantics. | `server/securityRegressions.test.ts` (new) |

**Verification:** `npm run check` clean · `npm run build` clean · `npm test` → 55 passing (35 prior + 20 new).

## Production follow-ups (NOT done — deployment work)

1. **Trust proxy + rate-limiter source IP.**
   The in-memory limiter (`server/middleware/security.ts`) keys on `req.ip`, and
   the app does not call `app.set("trust proxy", ...)`. Behind a reverse proxy
   (Vercel/Render/nginx) every visitor shares the proxy's IP, so one bucket is
   shared by all users — the `/api` 150/15-min limit and `/api/trpc/ai` 30/hr
   limit can be exhaustedly consumed by normal traffic, and carve-outs per user
   are impossible.
   - Fix direction: set `app.set("trust proxy", <proxy hops>)` (or a CIDR list)
     so `req.ip` is the real client IP; then keep per-IP limits as a coarse
     global backstop.
   - The in-memory Map also does not survive multi-instance deploys / restarts —
     use a shared store (Redis) for production.

2. **CSP tightening.** `securityHeaders` allows `script-src 'unsafe-inline'
   'unsafe-eval'` (needed by Vite dev). Before production, pin a stricter CSP
   (`'self'` + hashed bundles) and verify the prerendered/Vite build loads under
   it. The current header is a progressive-enhancement baseline, not a guard
   against modern XSS.

3. **Session expiry.** Session cookies are valid **1 year** (`ONE_YEAR_MS`).
   The production checklist already calls for 24h sessions + refresh rotation.
   Shipping that is a deliberate trade-off (one sign-in per year vs. re-login
   churn) — revisit before public launch.

4. **Upload transport.** `resume.parse` still ships base64 over tRPC (~33% size
   overhead and a large request body). The `TODO(upload)` notes the desired
   multipart/binary body. The server-side size gate makes the base64 path safe
   today; converting to multipart is an efficiency follow-up, not a security one.

5. **CSRF.** Cookie auth with `credentials: "include"` is protected by the
   `SameSite` attribute set in `server/_core/cookies.ts` — it is currently
   `None` under HTTPS (needed because the app is served cross-site from the OAuth
   portal) and `Lax` otherwise. `SameSite=None` must stay paired with `Secure`
   and with a custom-`Origin`/header check on state-changing tRPC routes, since
   `None` does not stop cross-site requests on its own. Verify origin verification
   exists on the Express adapter before public launch.

## Related constraints

- The single resume template (`classic-ats-blue`) is LOCKED — no template files
  were changed in this effort.
- No country-selection feature work and no redesign were introduced.

---

# Phase 4 — Production Deployment Hardening (implemented & documented)

Runs on top of Phase 3. Follow-ups above marked NOT done are re-addressed here
where they are deployment-safe; anything still open is listed in "Remaining
deployment risks" below.

## 4.1 Trust proxy (`server/_core/app.ts`)

- **Before:** no `app.set("trust proxy", …)` — behind Render's reverse proxy
  every visitor shared the proxy IP, so the in-memory limiter's `/api`
  150/15-min and `/api/trpc/ai` 30/hr buckets treated all traffic as one IP.
- **After:** `if (process.env.RENDER || process.env.TRUST_PROXY) app.set("trust proxy", 1)` —
  exactly one trusted hop (Render's edge). Local dev stays `false` (default) so
  `req.ip` is the socket address and XFF is ignored.
- **Verified:** `server/deploymentSecurity.test.ts` asserts XFF → `req.ip` with
  Render set, and XFF ignored without it. This makes the in-memory limiter a
  real per-IP backstop instead of a shared bucket.
- **Why `1` and not `true`:** Render sits directly in front of the Node process
  (no second hop we trust). `true` would trust any spoofable header chain.

## 4.2 Rate limiting (no removal, no relaxation)

- The in-memory limiter is **preserved** with **unchanged limits**
  (150/15-min global, 30/hr AI). It is now keyed on the real client IP (4.1).
- **Documented explicitly in the middleware:** single-instance process-local
  counters reset on restart/multi-instance; Redis is the upgrade path and will
  only be added when multi-instance requires it — no fake Redis config was
  introduced. The AI quota system (`AI_QUOTA_GUEST/FREE/PAID`, `AI_RPM_LIMIT`,
  `AI_DAILY_SPEND_CEILING_USD`) already provides per-user/per-plan budgeting on
  the application layer, so per-user budget doesn't require a shared store today.

## 4.3 CSP — production-safe, both origins covered

Architecture fact: the **user-facing HTML is served from Vercel's CDN**, not
from Express — so an Express response header never reached the real origin.

- **`server/middleware/security.ts`** now serves a dev/prod-split policy
  (`contentSecurityPolicy(isProduction)`, exported). Production drops
  `'unsafe-eval'`, adds `https://checkout.razorpay.com` (was previously
  **blocked** — the Razorpay Checkout SDK could not load), and pins
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`.
- **`vite.config.ts` `vitePluginMetaCsp`** injects the identical production
  policy as a `<meta http-equiv="Content-Security-Policy">` into the built HTML
  (build-time only, dev untouched) so the Vercel-served pages enforce it too.
- **`vercel.json`** adds CDN headers (X-Frame-Options DENY, nosniff,
  Referrer-Policy, Permissions-Policy, HSTS, COOP/None). CSP is deliberately NOT
  repeated there to avoid a header+meta double-enforcement conflict.
- **Why `'unsafe-inline'` stays in `script-src`:** `vite-plugin-manus-runtime`
  injects a ~367 KB inline script into every built HTML page. Stripping that
  plugin from production is the migration that unlocks a hash/nonce-based strict
  CSP (see 4.8 remaining risk). No `eval`/`new Function` exists in the build.
- **Optional cross-origin scripts (enabled via env, currently OFF in prod):**
  Umami analytics (`VITE_ANALYTICS_ENDPOINT`, loaded in `main.tsx`) and the
  Google Maps proxy (`Map.tsx`, `VITE_FRONTEND_FORGE_API_URL`) dynamically load
  third-party scripts. Both are **blocked** by `script-src` until their origins
  are allow-listed. If either feature is ever enabled, add its origin to
  `script-src` (and `connect-src` for Umami's beacon/fetch) in
  `contentSecurityPolicy` (security.ts) and the Vercel meta tag will follow
  automatically.

## 4.4 Security headers (Express + CDN)

- **Removed `X-XSS-Protection`** (deprecated; CSP + `nosniff` are the modern
  defense). Regression-tested absent.
- **`Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`**
  added (payment left enabled — needed by Razorpay).
- **HSTS is HTTPS-only**: set only when `req.protocol === "https"`
  (`max-age=1y; includeSubDomains`). Local http dev never sees it; Render
  forwards `X-Forwarded-Proto: https` so it activates in production. Vercel CDN
  always sends a 2-year HSTS (static CDN is HTTPS-only by nature).

## 4.5 Session (audit — no change made intentionally)

- **Current:** 1-year `app_session_id` JWT cookie (`ONE_YEAR_MS`), HttpOnly,
  `SameSite=None` + `Secure` behind TLS, `Lax` otherwise.
- **Stayed 1 year**: shortening it is a deliberate product trade-off (one
  sign-in/year vs re-login churn) and would ripple into OAuth + refresh
  handling. Per the phase brief this is **documented, not implemented**.
- **Recommended (not shipped):** 24h access + rotating refresh (already notes in
  `PRODUCTION_CHECKLIST.md`). **Migration required:** new JWT `exp` handling +
  `refreshToken` table + rotation endpoints; roll out with the OAuth refresh
  flow so users aren't silently logged out.

## 4.6 Cookies (verified, no change)

- `app_session_id`: `HttpOnly`, `path=/`, `Secure` when `req.protocol=https`
  (now correct via trust proxy + X-Forwarded-Proto), `SameSite=None` (cross-site
  OAuth portal) or `Lax`. No identity is stored in `localStorage`
  (`hexacv_logged_out` is an anti-flash flag, not identity; legacy mock users
  are purged on load).

## 4.7 CORS (audit — nothing to add)

- The browser only ever talks to the **Vercel origin**: `vercel.json` rewrites
  `/api/*` → Render server-side, and `client/src/main.tsx` uses
  `credentials: "include"` with a same-origin `/api/trpc` URL (`VITE_API_URL` is
  unset in production). No cross-origin XHR exists, so **no `Access-Control-Allow-Origin` wildcard is present or needed**.
- ⚠️ If `VITE_API_URL` is ever pointed at a different origin, CORS + the CSP
  `connect-src` must be updated together — do not add `*`; allow-list the
  Vercel production origin only.

## 4.8 Secrets / env / errors / logging (audited)

- Server secrets (JWT, DB, provider keys, Razorpay, admin) live **only** in
  `server/_core/env.ts` (server-side `process.env`). The client bundle
  references only public `VITE_*` config (`VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`,
  `VITE_FRONTEND_FORGE_API_KEY`, analytics site id) — no secret reaches a
  bundle, API response, log, or error. `.env*` is gitignored; no secret patterns
  in the repo; only `.env.example` is committed.
- 500 responses are generic ("Internal server error"); tRPC `onError` reports
  server-side to `runtime-errors/**` (gitignored, never served) without exposing
  stack traces to clients. `/api/health` returns `{ok:true, service:"hexacv"}`
  with no DB/secrets.
- Logging: admin actions log user/material IDs only; no AI prompt, resume
  content, bearer token, or API key is logged. Webhook signature failure and
  unhandled event types are logged without body contents.

## 4.9 Upload memory (kept base64, documented)

- `resume.parse` still uses base64 transport (documented `TODO(upload)` — a
  ~33% overhead, not a security issue). Server gates with a pre-flight encoded
  length check **before** any `Buffer.from` allocation, so an oversized payload
  never consumes memory. Multipart transport remains a documented future
  efficiency upgrade.

## 4.10 DB ownership (verified)

- Every user-owned resource resolves identity from the signed session
  (`ctx.user.id`): resume list/get/create/update/delete/history/restore, builds,
  credits, subscriptions, payments. `resume.get`/`update`/`delete`/`restore`
  additionally verify `resume.userId === ctx.user.id`. No browser-supplied user
  IDs are trusted for authorization.

## 4.11 Razorpay (audited — no price change, no redesign)

- Webhook signed with HMAC-SHA256 over the raw body (`express.raw`) + webhook
  secret via `timingSafeEqual`; if `RAZORPAY_WEBHOOK_SECRET` is unset it falls
  back to sandbox parse-only with a loud warning (production must set it).
- Amounts are server-derived (`amountPaiseForTier`), never client-reported.
  Paid events are fulfilled idempotently (`status==="verified"` short-circuits
  duplicates) and associate the order → user via the DB order row with an
  `expectedUserId` check. ₹99 price and flows untouched.

## 4.12 PWA (verified, no removal)

- Service worker **bypasses all `/api/` requests** (never caches auth/session/
  personal data) and only caches static assets + the app shell (cache-first,
  network-first for navigations). No credentials are written to any cache.
  PWA manifest/sw unchanged.

## 4.13 Deployment config & health

- PORT/HOST/NODE_ENV are env-driven (`index.ts`: `PORT` env, Render-detected,
  `0.0.0.0`). No hardcoded production secrets anywhere (4.8).
- `/api/health` verified minimal and safe (no DB/LLM/external calls) — kept as
  the liveness probe the CI smoke test hits.

## Verification (Phase 4)

- `npm run check` clean · `npm run build` clean (Vite + prerender + esbuild) ·
  `npm test` → 63 passing (55 prior + 8 Phase 4 new). Template untouched.

## Remaining deployment risks (Phase 5 candidates)

1. **Strict CSP blocked by the inline Manus runtime script.** Strip
   `vitePluginManusRuntime` from production builds (it's a ~367 KB dev harness
   inlined into every page) → then swap `script-src 'unsafe-inline'` for hashed
   bundles / nonces. Product win (smaller pages) + security win together.
2. **Session lifetime (1 yr)** — 4.5 RECOMMENDED/MIGRATION plan.
3. **Redis shared rate limiter** — needed only at multi-instance; quota layer
   already budgets per user today.
4. **Multipart upload transport** — efficiency, not security.
5. **`VITE_API_URL` cross-origin** — if ever enabled, must update CORS +
   connect-src together (never a wildcard).