# HexaCV — DESIGN_DESKTOP.md (Desktop UI/UX Spec, ≥1024px)
Companion to `PLAN.md` and `docs/design/DESIGN_STRICT.md` (scroll/breakpoint/icon rules apply to every page below, not repeated per-page).
Format per page: Purpose → Layout regions → Components → Flow → Edge cases, per the existing wireframe-first rule.

---

## 0. Visual system (fixes the "generic AI SaaS" problem)

**The problem with the current build:** `client/src/index.css` uses stock Tailwind blues — `--primary: #1e40af`, gradients with `#2563eb` on cool slate backgrounds, and dark-mode lavender `#b8c4ff` with no relation to the light brand color. This is the default palette of roughly every AI-SaaS landing page built in 2024–2026. It reads as templated, not as a product with a point of view. Fix below is a full replacement, not a tint adjustment.

### Color — "Ledger" palette (not generic SaaS blue/purple)
| Token | Hex | Use |
|---|---|---|
| `--ink` (primary text/headings) | `#1C1B18` | warm near-black, never pure `#000` |
| `--paper` (background) | `#FBF8F3` | warm off-white, paper-like — not cold slate |
| `--surface` (cards) | `#FFFFFF` | cards sit slightly lighter than page bg |
| `--primary` (Deep Teal) | `#123832` | primary buttons, nav, sidebar active state, headings accent |
| `--primary-hover` | `#0D2B26` | button hover/active |
| `--accent` (Terracotta) | `#C5622A` | CTAs that need to stand out from primary (Pay ₹99, referral highlights), "Free" badge |
| `--success` | `#3F7A54` | verified/matched keywords, payment success |
| `--warning` (flagged-for-check lines) | `#B8862E` | Validate-phase "please confirm" flags — amber, not red (it's not an error) |
| `--danger` | `#B3261E` | real errors only |
| `--muted-text` | `#635F55` | secondary copy, placeholders |
| `--border` | `#E4DFD3` | warm-toned border, not cool gray |

Dark mode: same hue family shifted, not a generic slate-900 — `--paper` → `#15130F`, `--surface` → `#1E1B15`, `--primary` → `#7FBFA8` (desaturated teal that stays legible on dark, not the current arbitrary `#b8c4ff` lavender which has no relation to the light-mode brand color at all).

### Typography
- **Display/Headings**: `Fraunces` (variable serif, warm, has personality — this is what breaks the "every AI tool uses Inter for everything" pattern). Weight 500–600, slight negative letter-spacing on H1 only.
- **Body/UI**: `Public Sans` (clean, built for clarity at small sizes, not the default Inter-everywhere look). Fallback stack: `-apple-system, "Segoe UI", Roboto, sans-serif`.
- Sizes (desktop): H1 48px/56px line-height, H2 32px, H3 22px, Body 16px, Small/Caption 13px.
- Never mix a third font family in anywhere (no system-default creeping into inputs — set `font-family` explicitly on form controls too).

### Anti-slop checklist (apply to every screen below)
- No purple/indigo gradients. No blob/wave SVG background decorations. No generic 3D-render robot or floating-card illustrations.
- No sparkle (✨) icon used as a stand-in for "AI did something" — use the lucide-react outline icon set already used across the app, picking a literal icon (Search for Extract, Crosshair for Target, Pencil for Rewrite, ShieldCheck for Validate).
- No fake-precision numbers ("98.7% ATS Score!") — use factual, checkable statements (keyword found/not found list, per PLAN.md §6).
- No stock photography of generic diverse-people-in-blazers. Use the resume preview itself as the hero visual — it's more credible and more relevant.
- Copy tone: direct, specific, slightly understated. "Built for the job you actually applied to" beats "Unlock Your Dream Career With The Power of AI ✨."

---

## 1. Landing Page (`client/src/pages/Landing.tsx`)
**Purpose**: convert a cold visitor into either an upload/paste action or account creation, in one screen, no scroll needed to see the core action.

**Layout regions** (1280px+ two-column hero):
- Top bar: wordmark (Fraunces, `--primary`) left, "Log in" text link right — no heavy nav, this is a conversion page not a marketing site with 6 nav items.
- Left column (55% width): H1 headline, one-line subhead, the **two action cards** stacked or side-by-side depending on width:
  - **Card A — "Upload your resume"**: drag-and-drop zone, accepts PDF/DOCX, icon = upload-tray.
  - **Card B — "Start from scratch"**: opens paste-text area + optional LinkedIn export upload, icon = plus/pencil.
- Right column (45% width): a real rendered resume preview (using an anonymized sample), not an illustration — this is the credibility anchor. On hover over a bullet point, show a small "rewritten for: Site Engineer, Dubai" tag to demonstrate the product live, without requiring interaction.
- Below the fold (scroll-optional): 3-region strip — how it works (Extract → Rewrite → Validate, 3 icons), regional coverage (India/Gulf/etc. badges), pricing line ("₹99 per resume, first one free — no subscription").

**Components table**:
| Element | Behavior |
|---|---|
| Card A (Upload) | Click or drag file → parses client-side preview instantly → routes to parsed-data review |
| Card B (Start fresh) | Click → expands inline (not a new page) to textarea + LinkedIn upload option |
| Hero preview panel | Static sample, hover micro-interaction only, never blocks main CTA visually |

**Flow**: Landing → (upload/paste captured in session) → "Continue" button appears once data present → Auth check (PLAN.md §3) → Targeting.

**Edge cases**: file upload fails to parse (corrupt/scanned-image PDF) → inline error under the card, not a toast that disappears ("We couldn't read text from this PDF — try 'Start fresh' and paste it instead"). Empty paste-text submit → CTA stays disabled with helper text, not a click-then-error.

---

## 2. Signup / Login (`client/src/pages/Register.tsx`, `client/src/pages/Login.tsx`)
**Purpose**: lowest-friction account creation without losing the data captured on Landing.

**Layout**: centered single card, max-width 420px, on `--paper` background — no split-screen marketing panel here, the user has already been sold on Landing; don't re-sell, just get them through.

**Components**: Email + password fields OR OAuth buttons (Google/LinkedIn) as primary — OAuth first, email/password as a secondary "or continue with email" link, since OAuth removes the password-creation friction point entirely. A small non-bold line: "Your resume draft is saved — you'll pick up right where you left off" (this is the promise from PLAN.md §3, make it visible so users trust the redirect).

**Flow**: Submit → account created, 1 credit granted, draft data reattached → Targeting screen directly (no dashboard detour on first-ever run — send new users straight into the thing they came to do).

**Edge cases**: existing email on signup → inline "Looks like you already have an account — log in instead" with a one-click switch to Login, fields prefilled.

---

## 3. Dashboard (`client/src/pages/Dashboard.tsx` / `DashboardHome.tsx`, layout: `DashboardLayout.tsx`)
**Purpose**: home base for returning users — resume history, credit balance, referral, new build entry point.

**Layout** (three-region, sidebar fixed):
- **Left sidebar** (240px, `--primary` background, light text): logo, nav items — Home, My Resumes, **Refer & Earn** (currently labeled "Affiliate Program" at `/dashboard/affiliate` — rename copy/nav, do not rebuild the route from scratch), Settings. Credit balance shown as a small pill at the bottom of the sidebar, always visible ("1 free build left" / "0 credits — ₹99 per build").
- **Main area**: resume history as cards (not a dense table) — each card shows target role, region, status badge (Draft/Generating/Paid/Downloaded), last-edited date, and quick actions (Edit, Download, Duplicate-for-new-role).
- **Top-right**: "New Resume" primary button (`--accent` color, not `--primary` — it should visually pop against the sidebar's teal).

**Flow**: New Resume → if a resume already exists, offer "Start from an existing resume" (reuse extracted data) vs. "Start completely fresh" — don't force re-upload for a second role targeting the same base experience.

**Edge cases**: zero resumes yet (first-time state) → main area shows a single prominent "Build your first resume" card instead of an empty table with a small button in the corner.

---

## 4. Targeting screen (role + JD)
**Purpose**: capture role, JD, region in one uncluttered screen — this is the "3 fields max" rule from the design system, kept literal.

**Layout**: centered column, max-width 640px, generous vertical spacing (this screen should feel like it takes 20 seconds, not like a form).
- Region selector (segmented control, not a dropdown — India / Gulf / Ireland visible at a glance; final list pending PLAN.md §10).
- Target Role input with live suggestion dropdown beneath it (§ PLAN.md §4) — suggestions render as a simple list, each with a small "based on your experience" tag when ranked from the user's own data.
- JD textarea, collapsed by default with a "+ Paste job description (recommended)" expander, so it doesn't visually compete with Role on first paint.
- CTA button, full-width within the column, dynamic label per PLAN.md §4.

**Edge cases**: user leaves JD blank → CTA still enabled (JD is optional) but a small persistent note stays under the field: "Adding a JD usually improves keyword match — you can skip this."

---

## 5. AI Pipeline Loader
**Purpose**: make an 8–20 second wait feel accounted for and honest, not decorative.

**Layout**: centered, no sidebar/nav visible (full-focus state) — a vertical list of the 5 phases from PLAN.md §5, each with its literal icon, current phase highlighted and animated (subtle pulse, not a spinner replacing the text), completed phases shown with a small checkmark, not removed from view (so the user sees the whole journey, reinforcing "this was real work," not a black box).

**Components**: phase list (Extract/Target/Rewrite/Validate/Polish), each with icon + literal label text from PLAN.md's table. No progress percentage bar with fake precision — the phase list itself is the progress indicator.

**Edge cases**: pipeline fails at any phase → don't reset to a generic error screen; show which phase failed with the same visual list (failed phase gets `--danger` icon color), auto-retry once silently, then if still failing: "We hit a snag on [phase] — no credit used, try again" with a retry button.

---

## 6. Review & Edit workspace (`client/src/pages/ResumeBuilder.tsx` + `ResumeEditor.tsx` / `ResumePreview.tsx`)
**Purpose**: this is the highest-value screen — real preview, manual + AI edit, JD match transparency.

**Layout** (split screen, this is the one place a persistent two-column layout is justified per DESIGN_STRICT §2):
- **Left (35%)**: section list / outline + JD keyword match panel (found vs. not-found, factual list per PLAN.md §6) + region-specific tips (e.g., "Ireland: DOB and photo are usually omitted" as a dismissible inline note, not a modal interruption).
- **Right (65%)**: live resume preview, rendered from the same template engine used for export (PLAN.md §8 requirement — flag to engineering if preview currently diverges from PDF output).
- Clicking any section on the right opens an inline edit panel (slide-in from the left panel area, not a full-screen modal that hides the preview — desktop has room to show both).
- Each section's edit panel has two clearly separate actions: **"Edit text"** (manual, free) and **"Ask AI to improve this"** (consumes an included AI-assist credit per PLAN.md §7, with the remaining-count shown: "2 of 3 free AI edits left on this resume").

**Edge cases**: a line flagged by Validate (PLAN.md §5) shows an amber inline marker directly on that line in the preview, not buried in a separate notifications panel — clicking it opens the edit panel pre-focused on that line with a note explaining what couldn't be confirmed.

---

## 7. Payment (Razorpay)
**Purpose**: single clear moment, no surprise fees.

**Layout**: modal (not a page navigation — keep the resume visible dimmed behind it, so the user doesn't lose their place). Shows: role/JD being built, price ₹99 (or "Free — using your first build" state), Razorpay button, small trust line ("Secured by Razorpay").

**Implementation notes**: wire through existing `server/payments/razorpay.ts` + `server/razorpayWebhook.ts`. Subscription UI in `BillingPortal` must not appear in this modal flow — pay-per-build only (PLAN.md §2).

**Edge cases**: payment interrupted/closed mid-flow → resume stays saved in Review state, dashboard shows it as "Draft — payment pending," never lost.

---

## 8. Export & Download
**Purpose**: deliver the two files, cleanly, no upsell friction in the way of the thing they paid for.

**Layout**: two equal-weight buttons (Download PDF / Download Word) side by side, filename convention per PLAN.md §8 shown before download so there's no surprise. Below: referral prompt card ("Know someone job hunting? Share your link, get a free build when they complete theirs") — present but not blocking, dismissible. Link goes to Refer & Earn (`/dashboard/affiliate` route may keep path for now; visible label is Refer & Earn).
