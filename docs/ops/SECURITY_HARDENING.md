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