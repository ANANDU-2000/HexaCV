# HexaCV — AGENT_TASKS.md (Per-Page Logic, Inputs & Build Tasks)
Companion to `PLAN.md`, `DESIGN_DESKTOP.md`, `DESIGN_MOBILE.md`, and `docs/design/DESIGN_STRICT.md`.

This is the Cursor/agent build contract. For each page: **Logic flow** → **Inputs flow** → **Agent tasks**.  
Items marked **BLOCKED (§10)** must stop and ask the product owner — do not invent pricing, regions, template counts, or LinkedIn scope.

---

## Global rules for every task

1. Pay-per-use only (₹99/build). No subscription paths in new UI.
2. Draft data captured pre-auth survives signup via `sessionStorage` (or equivalent) keyed by temp draft ID.
3. Failed AI generation: auto-retry once → then no charge / release hold.
4. Manual edits always free; AI section improves consume AI-assist credits (count pending §10).
5. No invented facts — Validate phase flags unknown entities for user confirmation.
6. Visual system: Ledger palette + Fraunces / Public Sans from `DESIGN_DESKTOP.md` §0. Replace stock `#1e40af` / `#2563eb` / `#b8c4ff` in `client/src/index.css`.
7. Icons: Tabler outline (`ti-*`) only — see DESIGN_STRICT.
8. One scroll container per page — DESIGN_STRICT §1.

---

## 1. Landing Page

**Files:** `client/src/pages/Landing.tsx`  
**Specs:** DESIGN_DESKTOP §1, DESIGN_MOBILE §1, PLAN §3

### Logic flow

```
Visitor lands on /
  ├─ Card A: Upload PDF/DOCX → parse → session draft → Continue
  ├─ Card B: Start fresh → expand paste (+ optional LinkedIn) → session draft → Continue
  └─ Log in link → /login (no draft required)
Continue clicked
  ├─ Auth present → parsed-data review (if upload/paste) → Targeting
  └─ Auth absent → /register or /login (draft preserved) → then Targeting
```

### Inputs flow

| Input | Required | Validation | Persistence |
|---|---|---|---|
| File (PDF/DOCX) | One of file/text/scratch | MIME + size; parse must yield text | `sessionStorage` draft ID; binary not stored long-term — extracted text/sections |
| Paste text | One of file/text/scratch | Non-empty after trim; min length helper | Same draft key |
| LinkedIn export | Optional | **BLOCKED (§10)** — confirm PDF vs paste vs v2 | Same draft key if in scope |
| Continue CTA | — | Enabled only when draft has usable content | — |

### Agent tasks

- [ ] Rebuild hero to two-card layout (Upload / Start fresh); desktop two-column with live sample preview; mobile stacked, preview below cards.
- [ ] Apply Ledger tokens + Fraunces/Public Sans; remove indigo gradients/blobs.
- [ ] Implement drag-drop + click upload; client parse via existing `server/fileParser.ts` path (or client preview then server parse).
- [ ] On parse failure: inline error under card (not toast) — copy from DESIGN_DESKTOP §1.
- [ ] Persist draft to `sessionStorage` before any auth redirect.
- [ ] Pricing strip: "₹99 per resume, first one free — no subscription" (mobile: above cards).
- [ ] Parsed-data review step after upload/paste (name + sections found) before Targeting — not optional.
- [ ] **BLOCKED (§10):** LinkedIn import — ask if in-cycle or v2 before shipping Card B LinkedIn affordance as "equal" to PDF/DOCX.

---

## 2. Signup / Login

**Files:** `client/src/pages/Register.tsx`, `client/src/pages/Login.tsx`, auth/OAuth under `server/_core/oauth.ts`  
**Specs:** DESIGN_DESKTOP §2, DESIGN_MOBILE §2, PLAN §2–3

### Logic flow

```
Arrive from Landing with draftId in session
  → Show "Your resume draft is saved…"
Submit signup
  → Create account
  → Grant 1 free build credit (once, not monthly)
  → Reattach draft to user on first authenticated write
  → Redirect to Targeting (not Dashboard) on first-run
Submit login
  → Load credit balance
  → Reattach draft if present
  → Targeting if draft; else Dashboard if returning without draft
```

### Inputs flow

| Input | Required | Validation | Persistence |
|---|---|---|---|
| OAuth (Google/LinkedIn) | Preferred path | Provider token verify | Session cookie / JWT as existing |
| Email | If email path | Valid email; unique on signup | User row |
| Password | If email path | Min length / existing rules | Hashed |
| draftId | Implicit | Must survive redirect | `sessionStorage` → DB on first write |

### Agent tasks

- [ ] Centered 420px card (desktop); full-screen (mobile); OAuth primary, email secondary/collapsed.
- [ ] Visible draft-saved reassurance line under headline.
- [ ] On signup: grant exactly 1 free credit; do not refresh monthly.
- [ ] After auth with draft: go to Targeting (or parsed-data review if not done), never empty Dashboard first-run detour.
- [ ] Existing email on signup → inline switch to Login with email prefilled.
- [ ] Ensure draft reattach on first authenticated resume write (API + client).

---

## 3. Dashboard

**Files:** `client/src/pages/Dashboard.tsx`, `DashboardHome.tsx`, `client/src/components/DashboardLayout.tsx`, `AffiliateSystem.tsx`  
**Specs:** DESIGN_DESKTOP §3, DESIGN_MOBILE §3, PLAN §8–9

### Logic flow

```
Authenticated user → /dashboard
  → Load resumes + credit balance
  ├─ Zero resumes → "Build your first resume" empty state
  └─ Has resumes → card list (role, region, status, actions)
New Resume
  ├─ Has prior resume → choose "Reuse extracted data" vs "Start fresh"
  └─ No prior → Landing/upload or Targeting entry
Nav: Home | My Resumes | Refer & Earn | Settings
```

### Inputs flow

| Input | Required | Validation | Persistence |
|---|---|---|---|
| New Resume choice | When starting 2nd+ build | Enum: reuse \| fresh | Routes to Targeting with/without prior structured data |
| Card actions | — | Edit / Download / Duplicate-for-new-role | Status must stay consistent with payment/generation |
| Credit pill | Display only | Reflect free + paid credits | Server source of truth |

### Agent tasks

- [ ] Sidebar (desktop) / slide-over (mobile): rename **"Affiliate Program" → "Refer & Earn"**; keep route `/dashboard/affiliate` unless a clean rename is trivial.
- [ ] Credit balance pill always visible (sidebar bottom desktop; top bar right mobile).
- [ ] Resume history as cards with status badges: Draft / Generating / Paid / Downloaded / Draft-payment-pending.
- [ ] "New Resume" accent CTA (desktop top-right; mobile FAB 56px).
- [ ] Empty state: single prominent first-build card (no orphan FAB-only empty page).
- [ ] Duplicate-for-new-role reuses extracted data → Targeting with new role/JD (new credit).
- [ ] Align referral reward to first *paid* build of referred user (**BLOCKED (§10)** confirm 1 free credit).
- [ ] Hide/retire subscription upgrade framing from primary dashboard path (`BillingPortal` must not contradict pay-per-build).

---

## 4. Targeting screen (role + JD)

**Files:** new screen (route TBD under builder flow; integrate with `ResumeBuilder` entry) + `server/aiSuggestions.ts` for ranking  
**Specs:** DESIGN_DESKTOP §4, DESIGN_MOBILE §4, PLAN §4

### Logic flow

```
Enter Targeting with structured draft + credit balance
  → Select Region (segmented)
  → Type Target Role (≥3 chars → debounce 250ms suggestions)
      → local static list first paint
      → ranked suggestions (prefer user's experience keywords)
  → Optional: expand JD paste
  → CTA:
      credit > 0 → "Build my resume — free"
      credit = 0 → "Build my resume — ₹99" → Payment hold then pipeline
  → Start AI Pipeline Loader
```

### Inputs flow

| Input | Required | Validation | Persistence |
|---|---|---|---|
| Region | Yes | Enum — **BLOCKED (§10)** final list | Resume + pipeline context |
| Target Role | Yes | Non-empty; suggestions after 3 chars / 250ms | Resume build record |
| Job Description | No (recommended) | Max length; if present, drive keyword reweight | Stored with build; must affect Target/Rewrite |
| CTA | — | Label from credit state | Triggers credit consume or Razorpay |

### Agent tasks

- [ ] Build centered max-640px form; region segmented control (not dropdown).
- [ ] Role suggestions: static India/Gulf list instant; replace ~300ms with ranked API; tag "based on your experience" when ranked from draft.
- [ ] JD collapsed behind "+ Paste job description (recommended)"; helper if left blank.
- [ ] Dynamic CTA copy only — never "Submit"/"Generate".
- [ ] Mobile: sticky bottom CTA when Role (+ Region) valid; suggestion list max 4 visible with contained scroll.
- [ ] Wire JD keywords into pipeline Target/Rewrite (do not ship "2x better match" copy without mechanism).
- [ ] **BLOCKED (§10):** confirm region list before hardcoding Ireland vs Kerala/Gulf-only.

---

## 5. AI Pipeline Loader

**Files:** `server/ai/pipelineOrchestrator.ts`, `server/ai/grounding.ts`, `server/contentValidation.ts`, `server/resumeSections.ts`, `server/promptVersions.ts`; new loader UI component  
**Specs:** DESIGN_DESKTOP §5, DESIGN_MOBILE §5, PLAN §5–6, §11

### Logic flow

```
Start build (credit reserved or free credit held)
  → Phase Extract — "Reading your experience…"
  → Phase Target — "Matching this to [Role] roles in [Region]…"
  → Phase Rewrite — "Sharpening how you describe your work…"
  → Phase Validate — "Double-checking nothing got made up…"
      → flags → mark lines for Review (needs check)
  → Phase Polish — "Fitting it to the page…"
Success → consume credit / confirm payment → Review
Fail → silent auto-retry once
  → still fail → release hold/credit, show phase that failed, retry CTA
```

### Inputs flow

| Input | Source | Notes |
|---|---|---|
| Structured resume | Draft / parse | Extract input |
| Role + JD + Region | Targeting | Target/Rewrite input |
| Template id | **BLOCKED (§10)** count | Polish input |

### Agent tasks

- [ ] Full-focus loader UI: 5 phases with Tabler icons; pulse current; checkmarks keep history; no fake % bar.
- [ ] Interpolate Role/Region into Target phase copy; no emoji/"AI magic" language.
- [ ] Wire real phase events from `pipelineOrchestrator` (no artificial delays).
- [ ] Validate: surface fabrication candidates to Review as amber "needs your check" — never silent drop/keep.
- [ ] On failure after one retry: plain-language error naming phase; **no charge**.
- [ ] **BLOCKED (§10):** template count at launch before Polish/"choose template" UI.

---

## 6. Review & Edit workspace

**Files:** `client/src/pages/ResumeBuilder.tsx`, `client/src/components/ResumeEditor.tsx`, `ResumePreview.tsx`, `ProfessionalResumeTemplate.tsx`  
**Specs:** DESIGN_DESKTOP §6, DESIGN_MOBILE §6, PLAN §6–7

### Logic flow

```
Enter Review with generated resume + validateFlags + keywordMatch
Desktop: left outline + JD match + tips | right live preview
Mobile: toggle Preview | Match & Tips
Click section
  → Edit panel (desktop slide-in / mobile full-sheet)
  → Edit text (free) OR Ask AI to improve (AI-assist credit)
Validate flag on line → amber marker → open edit focused on that line
Substantial Role/JD change → treated as new build (new credit) — confirm UX
Export when ready (paid or free credit used)
```

### Inputs flow

| Input | Cost | Validation | Persistence |
|---|---|---|---|
| Manual section text | Free forever | User-owned content | Resume document |
| Ask AI improve | 1 of included AI-assists; then top-up **BLOCKED (§10)** | Same no-invention rules | Version/section + decrement counter |
| JD keyword panel | Display | Found vs not-found from JD vs resume text | Computed; not a fake ATS % |
| Discard edit (mobile) | — | Confirm if dirty | — |

### Agent tasks

- [ ] Desktop 35/65 split; mobile Preview ↔ Match & Tips toggle (never both columns &lt;1024px).
- [ ] Preview must use same template engine as export — audit and fix divergence.
- [ ] Per-section: "Edit text" vs "Ask AI to improve this" with remaining count ("2 of 3 free AI edits left").
- [ ] JD keyword match list (found / not found) — no ATS score badges.
- [ ] Amber markers on Validate-flagged lines; click → edit focused + explanation note.
- [ ] Mobile unsaved-close → confirm-discard.
- [ ] **BLOCKED (§10):** confirm AI-edit included count and ₹19/3 top-up (or alternative) before implementing charge.

---

## 7. Payment (Razorpay)

**Files:** `server/payments/razorpay.ts`, `server/razorpayWebhook.ts`, UI modal/sheet (not subscription `BillingPortal` as primary)  
**Specs:** DESIGN_DESKTOP §7, DESIGN_MOBILE §7, PLAN §2, §7

### Logic flow

```
CTA with 0 credits → Payment UI
  Desktop: modal over dimmed Review/Targeting
  Mobile: bottom sheet
Show ₹99 + role/JD summary OR "Free — using your first build"
Razorpay success → release pipeline / mark Paid
User closes mid-pay → Draft — payment pending; resume kept
Generation fails after pay → retry once → refund/release (PLAN §2.6)
```

### Inputs flow

| Input | Required | Validation | Persistence |
|---|---|---|---|
| Order create | Yes | Amount 9900 paise (₹99); idempotency | Payment + resume hold |
| Webhook verify | Yes | Signature | Credit grant / build unlock |
| Free credit path | If balance &gt; 0 | Consume on success only | Credits table |

### Agent tasks

- [ ] Pay-per-build modal/sheet only — no subscription plan grid in this path.
- [ ] Trust line "Secured by Razorpay"; equal clarity for free-credit state.
- [ ] Interrupted payment → Draft — payment pending on dashboard.
- [ ] Failed generation after charge → auto-retry once → refund/release hold; plain error.
- [ ] Remove/disable recurring subscription CTAs that contradict PLAN §2 from primary user flows.

---

## 8. Export & Download

**Files:** export helpers used by `ResumeBuilder` / dashboard download actions; template components  
**Specs:** DESIGN_DESKTOP §8, DESIGN_MOBILE §8, PLAN §8

### Logic flow

```
Paid or free-credit-consumed resume
  → Show filename preview: FirstName_LastName_TargetRole.pdf|.docx
  → Download PDF | Download Word (equal weight)
  → Optional dismissible Refer & Earn card
Downloads remain available from dashboard indefinitely
```

### Inputs flow

| Input | Required | Validation | Persistence |
|---|---|---|---|
| Format | User choice | PDF or DOCX | File generated on demand or cached |
| Filename parts | From resume | Sanitize filesystem-unsafe chars | — |

### Agent tasks

- [ ] Two equal-weight buttons: PDF + Word (desktop side-by-side; mobile stacked, PDF first).
- [ ] Filename: `FirstName_LastName_TargetRole.{pdf|docx}` — never `resume_export_final_v2`.
- [ ] Show filename before download.
- [ ] Dashboard re-download for all paid/free-credit resumes.
- [ ] Dismissible referral card after export; copy per DESIGN_DESKTOP §8; links to Refer & Earn.

---

## Cross-cutting agent tasks

- [ ] Replace palette/typography in `client/src/index.css` per DESIGN_DESKTOP §0 (including dark mode teal, not lavender).
- [ ] Audit DESIGN_STRICT nested-scroll violations on Landing, Builder, Dashboard.
- [ ] Ensure `ATSScanner` fake-precision UX is not the primary "trust" signal on Review — prefer keyword match list (PLAN §6).
- [ ] Update any marketing/`Pricing.tsx` copy that still sells subscriptions to pay-per-build messaging (or quarantine page).

---

## §10 open decisions checklist (do not guess)

| # | Decision | Status |
|---|---|---|
| 1 | Region list (India / Gulf / Ireland vs Kerala/Gulf focus) | ASK |
| 2 | AI-edit top-up price + included free count (placeholder ₹19 / 3) | ASK |
| 3 | LinkedIn import scope this cycle vs v2 | ASK |
| 4 | Template count at launch | ASK |
| 5 | Referral reward = 1 free credit on referred user's first paid build | ASK |

When an agent hits a **BLOCKED (§10)** task, stop and ask. Do not invent values.
