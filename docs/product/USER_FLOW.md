# HexaCV — USER_FLOW.md (End-to-End Journeys)
Prepared for: Anandu / HexaStack Solutions
Reads with: docs/architecture/ARCHITECTURE.md (what backs each step),
docs/design/WIREFRAMES.md (page detail),
docs/qa/EDGE_CASES_QA.md (what can go wrong at each step).

Each flow below is written as a sequence of (user action → system
response → data touched) so a task-prompt can reference "step 4 of
Flow A" unambiguously.

---

## Flow A — First-time visitor → downloaded resume (guest path)

1. Land on `Landing.tsx` → click "Start free"
2. → `Login.tsx`/`Register.tsx` (Page 2), "Continue as guest" →
   `guestId` set in LocalStorage, `guestSessions` row created server-side
3. → `ResumeBuilderHub.tsx` (Page 3), empty state → "New resume"
4. → Page 4 modal: Upload existing or Build from scratch
   - Upload → `fileParser.ts` parses file → `ai.extract` (Stage 1) →
     pre-filled builder
   - Blank → empty builder
5. → `ResumeEditorWorkspace.tsx` (Page 5): fill sections, optionally
   click AI buttons per field (`ai.*` procedures, Stage 3 rewrite) →
   autosave writes to `resumes.content` JSON on blur/debounce
6. Optionally: Template (Page 6, client-side render swap), JD Target
   (Page 7 modal, `jobDescription` router + Stage 2 target)
7. Click Export (Page 8) → PDF render (html2canvas client-side) →
   browser download triggered
8. **First download consumes the guest's one-time free download**
   (V6_PAYMENTS §F1) — quota check happens server-side against
   `guestSessions`/a quota table, not just a client-side counter
9. Second download attempt → Page 10 (Pricing) triggered per
   V6_PAYMENTS §F0's "only 3 triggers" rule

**Drop-off risks along this flow:** step 4 (upload parse failure —
must show a specific error, V5 Page 4 edge case), step 5 (AI
generation feels slow with no state — DESIGN_STRICT §5 loader copy),
step 8 (unexpected paywall if quota logic doesn't match what the
user was told — V6_PAYMENTS §F0 exists specifically to prevent this).

---

## Flow B — Guest → signed-up account (mid-session conversion)

1. Guest has 1–2 resumes built under `guestId`
2. Clicks "Sign up" (from the persistent banner shown at 2/3 guest
   limit, per V5 Page 3 validation note, or from account menu)
3. → `Register.tsx`, completes email/password or OAuth (Manus OAuth
   today, per docs/architecture/ARCHITECTURE.md §1 — Google/Apple are Phase D, not
   yet built)
4. On success: existing guest resumes migrate to the new `userId`
   (README-documented migration logic — reuse, per V5 Page 2) — the
   guest's already-used free-download status **migrates too**, it
   does not reset (V6_EDGE_CASES_QA row #7)
5. → `ResumeBuilderHub.tsx`, now shows migrated resumes under the
   real account

**Critical invariant:** step 4's "does not reset" is the one most
likely to be silently broken by a naive signup implementation
(new user row → fresh quota row by default) — explicitly test this,
don't assume it falls out of the migration logic automatically.

---

## Flow C — Free user hits paywall → subscribes (money path)

1. User (guest or free-registered) clicks Download at their limit,
   or clicks a paid-tier AI action → Page 10 (Pricing) shown
2. Picks Monthly or Pro → `billing.createCheckoutSession({ tier })`
   called → Stripe Checkout Session created server-side → client
   redirected to Stripe-hosted checkout page (off-site)
3. User enters card details on Stripe's page (HexaCV never sees raw
   card data — Stripe handles PCI scope entirely)
4. Stripe redirects back to `success_url`
   (`/dashboard/billing?session_id=...&status=success`) —
   **this redirect is not proof of payment**, it only means the
   browser came back
5. **In parallel**, Stripe sends a webhook
   (`customer.subscription.created`/`updated`) to
   `/api/webhooks/stripe` → signature verified → `subscriptions`
   table updated with the real tier — this is the actual source of
   truth for access
6. `Dashboard.tsx`/billing view polls or refetches
   `billing.getSubscription` → once the webhook has landed, shows
   the new tier active
7. User returns to the builder with the new tier's AI models/
   download limits unlocked

**Where this flow is currently unsafe (see docs/architecture/ARCHITECTURE.md §5):**
`billing.upgradePlan` offers a shortcut around steps 2–5 entirely —
until that's locked to admin-only, a user doesn't need to complete
steps 2–4 at all to get step 6's result. Fixing this is a
prerequisite for this flow being trustworthy, not a nice-to-have.

---

## Flow D — Referral (existing user refers a friend)

1. User opens `Referral.tsx` (Page 11) from account menu, sees their
   link and copies/shares it
2. Friend clicks the link → lands on `Landing.tsx` with a referral
   param → `affiliate.trackClick` fires, recording the referrerId +
   friend's email
3. Friend signs up (Flow A/B) → account created
4. **Gate check** (per V6_PAYMENTS §H2, not yet built into current
   `affiliateReferrals` logic): reward should only credit once the
   friend's account is >24h old and has done one real action —
   current code instead credits at `upgradePlan`/invoice-paid time
   via email match, which is a different (weaker) gate tied to the
   friend's own payment, not their signup
5. Once the (to-be-rebuilt) gate passes, referrer's
   `affiliate.getStats` reflects +1 free download credit
6. Referrer sees updated stats next time they open Page 11

**Decision needed before building:** V6_PAYMENTS §H1 designed the
reward around "friend signs up" (top-of-funnel, low friction to
earn). The current code rewards around "friend pays" (bottom-of-
funnel referral commission, a different and also legitimate model,
common for SaaS affiliate programs). These are two different
programs wearing the same table name — pick one explicitly, because
the UI copy on Page 11 and the gate logic in `db.ts` need to agree
with each other. Don't build Page 11 assuming one model while
`rewardReferralConversion` still implements the other.

---

## Flow E — Admin: publish a blog post and watch it go live

1. Admin logs in (existing `role: "admin"` check, `adminProcedure`)
2. → Admin dashboard, `Blog` tab (new, V6_MARKETING_ADMIN §I3)
3. Writes title/body/excerpt/cover image, saves as Draft
4. Previews (if built) → clicks Publish → `blog_posts.status` →
   `published`, `publishedAt` set
5. Sitemap regenerates (on next scheduled run or on-publish trigger,
   per V6_MARKETING_ADMIN §I1) → post appears at `/blog/<slug>` and
   in `/sitemap.xml`
6. Admin uses the Share button → opens WhatsApp/LinkedIn share
   intent with the live URL

---

## Flow F — Admin: something is going wrong, pull the kill switch

1. Admin notices a spike in errors/spend on the admin Overview tab
2. → Model routing & usage tab → sees which model/stage is failing
   or a circuit breaker open (once V4 Phase A is built — not yet
   present in current code, this is a planned addition)
3. If severe: clicks "Pause all AI" → confirmation → global flag set
4. Every AI-calling procedure in `routers.ts`'s `ai` namespace starts
   returning a clean "temporarily unavailable" instead of hitting
   any provider
5. Non-AI flows (auth, resume CRUD, template rendering, PDF export
   of already-written content) continue working — only new AI
   generation pauses
6. Admin fixes the underlying issue, unpauses

---

## Cross-flow invariants (must hold in every flow above)

- A resume's `content` JSON is never modified by anything except (a)
  a direct user edit, or (b) an explicit Accept click on an AI
  suggestion — never a silent background rewrite, in any flow.
- Money state (`subscriptions.status`/`tier`) changes only through a
  verified Stripe webhook or an admin-initiated manual grant with a
  logged reason — never through a client-callable mutation with no
  server-side payment check (the gap named in Flow C).
- Quota/limit state is always re-checked server-side at the moment
  of the gated action (download, paid-model call) — never trusted
  from a value fetched earlier in the session.

---

## Cursor scope-lock notes
- Flow C step 5–6 and Flow D step 4 are the two places where "what
  the docs say" and "what the code does" currently diverge — resolve
  both explicitly (see docs/architecture/ARCHITECTURE.md §5 and this file's Flow D
  decision note) before building new UI on top of either.
