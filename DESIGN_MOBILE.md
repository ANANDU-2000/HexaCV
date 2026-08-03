# HexaCV — DESIGN_MOBILE.md (Mobile UI/UX Spec, 375–430px)
Companion to `PLAN.md` and `DESIGN_DESKTOP.md` — same color/type system and anti-slop checklist apply (§0 in `DESIGN_DESKTOP.md`, not repeated here). This file covers what's genuinely different on mobile: layout collapse, tap targets, sequential vs. split screens.

Test matrix per `docs/design/DESIGN_STRICT.md` §4: 375px and 390px minimum, no horizontal scroll ever, single scroll container per page.

---

## 1. Landing Page (`client/src/pages/Landing.tsx`)
**Purpose**: same as desktop — get to an upload/paste action fast, but here it must fit near the top of the screen without scrolling to feel immediate.

**Layout** (single column, stacked, top to bottom):
- Top bar: wordmark left, "Log in" text link right (44px tap target).
- Headline (Fraunces, ~32px) + one-line subhead — kept short specifically so it doesn't push the cards below the fold on a 667px-tall screen (iPhone SE class).
- **Two cards, stacked vertically, full width**: Card A "Upload resume" (upload icon), Card B "Start fresh" (plus icon). No side-by-side on mobile — full-width stacked cards are easier to tap accurately and read.
- Resume preview visual (the desktop hero image) moves **below** the cards on mobile, as a smaller supporting element, not competing for the first screen — the action cards are the priority, not the visual proof, when space is scarce.
- Pricing line ("₹99 per resume, first free") as a small persistent strip just above the cards, not buried at the bottom — on mobile people don't reliably scroll to the pricing section before deciding to tap.

**Flow**: tap Card A/B → if Card B, expands to a **new stacked screen** (not an inline expand like desktop — inline expansion on a narrow viewport pushes content awkwardly) with textarea + LinkedIn upload option, both full width, textarea min-height ~160px with visible border so it doesn't look like empty page background.

**Edge cases**: same as desktop (parse failure messaging) — but error text must appear directly under the card without pushing the CTA off-screen; use a max-height reveal, not a layout jump.

---

## 2. Signup / Login (`Register.tsx`, `Login.tsx`)
**Layout**: full-screen single column, generous top padding, no split marketing panel (mobile has no room for one anyway). OAuth buttons full-width, stacked, 48px height minimum. "or continue with email" divider, then email/password fields below, collapsed by default behind a tap if OAuth is clearly primary — reduces initial visual weight.

Same "your draft is saved" reassurance line, placed directly under the headline so it's seen before any typing starts.

---

## 3. Dashboard (`Dashboard.tsx` / `DashboardHome.tsx` / `DashboardLayout.tsx`)
**Purpose**: same as desktop, but the 3-column desktop idea (sidebar + main + preview) has no room here.

**Layout**:
- **Top bar**: hamburger (left) → opens a full-height slide-over nav (Home / My Resumes / **Refer & Earn** / Settings), wordmark center, credit-balance pill (right) — always visible without opening the menu, since "how many builds do I have left" is a frequent glance-check.
- **Main area**: resume history as full-width stacked cards (same info as desktop card: role, region, status badge, quick actions) — actions collapse into a single overflow (⋮) menu per card on mobile rather than 3 separate icon buttons, to respect the 8px minimum gap / no-adjacent-destructive-icons rule in DESIGN_STRICT §3.
- **New Resume**: floating action button, bottom-right, `--accent` color, 56px diameter, always reachable with a thumb — not just a top-of-page button that requires scrolling back up.

**Edge cases**: zero resumes → single centered "Build your first resume" card takes the place of the FAB-plus-empty-list combo, so a brand-new user isn't looking at an empty page with just a small floating dot.

---

## 4. Targeting screen (role + JD)
**Layout**: single column, one field visible with full attention at a time is not required (both role and JD can be on one scrollable screen — it's short), but:
- Region selector as a **horizontal segmented control** pinned near the top, thumb-reachable, not a dropdown requiring a second tap-and-select gesture.
- Target Role input, full width, suggestion list appears **below** the field pushing content down (not an overlay that covers the JD field beneath it) — cap the suggestion list at 4 visible items with scroll inside that list only if needed (a single, contained exception to the "no nested scroll" rule is acceptable here per DESIGN_STRICT §1's "fixed max-height with visible more affordance," not a violation).
- JD field collapsed behind "+ Paste job description" same as desktop, but on mobile this save is more valuable — a full JD paste field expanded by default would push the CTA off the first screen.
- CTA: **sticky at the bottom of the viewport** (not inline at the end of the scroll) once both minimum fields are valid — this is the one screen on mobile where a persistent sticky action bar is justified, since scrolling back down to find "Build my resume" after filling a form is a common drop-off point.

---

## 5. AI Pipeline Loader
**Layout**: full-screen, single column, same 5-phase vertical list as desktop but larger touch-friendly spacing between phases (this screen has no interactive elements, so use the space for legibility, not density) — icon + label per phase, current phase pulsing, completed phases checked. No nav/tab bar visible during this state (full-focus, matches desktop).

---

## 6. Review & Edit workspace (`ResumeBuilder.tsx`)
**Purpose**: the desktop split-screen has no equivalent on mobile — this becomes **two sequential views connected by a toggle**, not stacked.

**Layout**:
- Default view: **Preview** (the actual resume, scaled to fit width, this is what most users want to look at first).
- A **segmented toggle at the top** — "Preview" / "Match & Tips" — switches between the resume view and the JD-keyword-match + region-tips panel from the desktop's left column. Never show both at once on mobile; that's the nested-column-squeeze DESIGN_STRICT §2 explicitly bans below 1024px.
- Tapping any section of the preview opens a **full-screen edit sheet** (not an inline slide-in — there's no room) with the same two actions as desktop: "Edit text" (manual, free) and "Ask AI to improve this" (with remaining-count shown), stacked as two full-width buttons, manual edit textarea visible by default since it's the free/always-available action and should be the path of least resistance.
- Validate-phase flags: amber marker directly on the flagged line in Preview, same as desktop — tapping it opens the edit sheet pre-scrolled to that line.

**Edge cases**: user tries to close the edit sheet with unsaved manual changes → confirm-discard prompt (small, not a full modal) — losing a manual edit on mobile (easier to accidentally back-swipe) is the top data-loss risk on this screen.

---

## 7. Payment (Razorpay)
**Layout**: bottom sheet (not a full page, not a centered modal) — slides up from the bottom, keeps the resume visible above it. Price, role/JD summary, single Razorpay button full-width, trust line beneath. Sheet is dismissible by swipe-down, which returns to Review with the resume unchanged (nothing lost, per PLAN.md §3's failure-handling philosophy).

---

## 8. Export & Download
**Layout**: two full-width stacked buttons (Download PDF above Download Word — PDF is the more common need, gets the top/primary position but both are equal visual weight, same size, not one bigger than the other). Filename preview shown before download (`FirstName_LastName_TargetRole.pdf`). Referral card below, dismissible, same copy as desktop — label "Refer & Earn", not "Affiliate Program".
