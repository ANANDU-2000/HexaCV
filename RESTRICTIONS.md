# HexaCV — RESTRICTIONS.md (System Rules, Validations & Compliance)

Companion to `PLAN.md` §§2, 5, 11; `PROMPTS.md`; `docs/qa/EDGE_CASES_QA.md`.  
**Code:** `server/contentValidation.ts`, `server/middleware/security.ts`, `server/ai/grounding.ts`.

This is a hard rules file. Violations are bugs, not style preferences.

---

## 1. Product non-negotiables (PLAN §2)

1. Pay-per-use only — ₹99 per build. No subscription in the primary flow.
2. One free build credit at signup — not refreshed monthly.
3. Data entry never gated behind signup; AI pipeline / save is gated.
4. Manual edits always free forever.
5. AI never invents employers, date ranges, degrees, or numbers absent from source or explicit user input in-session.
6. Failed AI generation never charges — retry once, then release hold and show plain-language error.

---

## 2. Anti-hallucination validation

Implemented in `contentValidation.ts`:

| Check | Behavior |
| --- | --- |
| Placeholder patterns | Strip / reject ("Company", "N/A", "Professional Candidate", etc.) |
| AI fluff phrases | Flag / filter via `AI_GENERATED_PHRASES` |
| Grounding vs source | `textGroundedInSource` / `filterGroundedRewrite` / `filterGroundedBullets` |
| Deterministic rewrite eval | `evaluateRewriteDeterministic` — fail → one rewrite retry |
| Full resume validate | `validateGeneratedResume` / `resumeHasRealContent` |

### Review surface rule

If Validate cannot confirm a number/entity: hold in **needs your check**, amber marker on the line, plain note to the user. **Never** silently drop or silently keep.

---

## 3. Auth & data persistence

| Rule | Detail |
| --- | --- |
| Pre-auth draft | Must survive redirect via `sessionStorage` draftId |
| First authenticated write | Reattach draft to user; then DB is source of truth |
| Guest AI generate | Forbidden — force signup/login |
| Owned resume access | Server must verify ownership on every read/write/export |

---

## 4. Input limits (baseline — tighten in code if stricter already)

| Input | Constraint |
| --- | --- |
| Upload types | PDF, DOCX (LinkedIn export: **BLOCKED §10**) |
| Upload size | Enforce server max (reject with plain error) |
| Paste text | Non-empty; reject whitespace-only |
| Target role | Required; suggestions after 3 chars |
| Job description | Optional; max length enforced server-side |
| Region | Enum only — final list **BLOCKED §10** |

Corrupt / scanned-image PDF: inline error — do not invent content from failed parse.

---

## 5. Payment integrity

1. Amount fixed at ₹99 (9900 paise) for a build — no client-trusted price.
2. Idempotency on order create / webhook apply.
3. Credit consume **only** on successful generation (or confirmed unlock policy — never on failed pipeline after retries).
4. Interrupted checkout → `Draft — payment pending`; resume data kept.
5. Webhook signature verification required (`razorpayWebhook.ts`).
6. Admin refunds audited (see ADMIN.md).

---

## 6. Regional formatting compliance

| Region | Rules |
| --- | --- |
| India | Standard structure; ATS keyword clarity |
| Gulf | Visa/nationality fields available when user-supplied |
| Ireland | Usually omit DOB/photo |

Do not invent region-specific fields the user did not provide. Region list confirmation is **BLOCKED (PLAN §10)**.

---

## 7. Referral abuse controls

- Reward referrer only when referred user completes first **paid** build.
- Referred user does not get stacked extra free builds from the referral.
- Unique referral code per account; validate attribution server-side.

---

## 8. Security middleware expectations

`server/middleware/security.ts` and tRPC procedures must:

- Rate-limit sensitive routes.
- Reject unauthenticated admin and AI generate paths.
- Never return stack traces to the client — plain-language errors only.
- Sanitize filenames on export (`FirstName_LastName_TargetRole`).

---

## 9. UI / UX restrictions (cross-link)

From DESIGN.md / DESIGN_STRICT:

- No nested page scroll containers.
- No fake ATS precision badges as primary trust signal.
- No indigo/purple gradient "AI slop" visuals.
- Loader phases must be real — no artificial delay to "feel premium".

---

## 10. QA checklist (minimum)

- [ ] Guest can paste/upload without account; draft survives signup.
- [ ] Generate with 0 credits opens Razorpay; cancel keeps draft.
- [ ] Failed pipeline after retry: no charge, credit released.
- [ ] Validate flag appears amber on Review; user can edit.
- [ ] Manual edit does not decrement AI-assist credits.
- [ ] Export PDF/DOCX match on-screen preview.
- [ ] Referral credit only after referred paid build.
