# HexaCV v6 â€” DESIGN.md (Strict UI/UX Rules)
Prepared for: Anandu / HexaStack Solutions
This is the enforceable design contract. Any PR that violates a rule
below gets rejected in review regardless of what the feature does â€”
UI correctness is not negotiable the way a nice-to-have is.

---

## 1. The one rule that generates most of the current bugs

**No `overflow: auto/scroll` div nested inside another
`overflow: auto/scroll` div. Ever.**

This is almost certainly the root of "scroll vertical bad way" and
most of the mobile/desktop edge-case failures. One scroll container
per page â€” the page body itself. Anything that looks like it needs
its own internal scroll (a long dropdown, a template list) uses a
**fixed max-height with a visible "more" affordance** or a modal/
slide-over with its own single scroll region, never a scrollable div
sitting inside the page's already-scrollable body.

Checklist per page before merging:
- [ ] Grep the page's CSS/Tailwind classes for `overflow-y-auto`,
  `overflow-scroll`, `overflow-auto` â€” count them. More than 1 per
  page (the outer page shell) is a violation, find and flatten it.
- [ ] Test on a real mobile viewport (not just resized desktop
  Chrome) with momentum scroll (iOS Safari) â€” nested scroll areas
  visibly fight each other there even when they look fine on desktop.

## 2. Layout structure (every page)

- Single top-level scroll container = the page body.
- Fixed elements (top nav, sticky preview panel on the Builder page)
  use `position: sticky` or `fixed` with explicit height reserved in
  the layout â€” never `fixed` positioning that overlaps content
  without a matching padding/margin reservation.
- Mobile breakpoint: stack everything vertically, sidebar tabs
  (Page 5 Builder) become a horizontal scroll-free tab bar or a
  bottom sheet â€” never a squeezed sidebar that becomes unreadable
  under ~420px.
- Desktop breakpoint: sidebar + center + right-preview three-column
  layout only above ~1024px; between mobile and that width, drop to
  two columns (sidebar collapses to icons-only, preview becomes a
  toggleable view instead of always-visible) rather than cramming
  three columns into a tablet width.

## 3. Buttons and icons

- Icon-only buttons: minimum 44x44px tap target (mobile accessibility
  baseline), `aria-label` always present, tooltip on desktop hover
  only (never on mobile, where hover doesn't exist and a stuck
  tooltip is a bug).
- Never place two destructive-adjacent icon buttons (Delete next to
  Edit) with less than 8px gap â€” accidental taps on mobile are the
  #1 source of "user lost their work" complaints.
- Loading state lives **on the button itself** â€” icon replaced by a
  spinner, button disabled, label unchanged. No full-screen loading
  overlays for anything except the initial page load.
- Icon set: stick to one icon library end to end (Tabler outline,
  per the existing V5 spec's `ti-*` naming) â€” mixing icon families
  mid-app is a visual-consistency violation, not a style nitpick.

## 4. Viewport & responsive rules

- Test matrix, minimum, before any page is marked done: 375px
  (small mobile), 390px (standard mobile), 768px (tablet portrait),
  1280px (small desktop), 1920px (large desktop). Five sizes, every
  page, every time â€” not "looks fine on my monitor."
- No horizontal scroll anywhere, at any breakpoint, ever. A page
  that needs horizontal scroll to be usable is a layout bug, not a
  content-length problem.
- Text never touches the viewport edge â€” minimum 16px horizontal
  padding on mobile, 24px+ on desktop containers.

## 5. Loaders and animation

- AI-generation loaders (Builder page rewrite buttons, Export page
  PDF generation) use a short, specific label that changes state â€”
  not a generic spinner alone. E.g. "Reading your resumeâ€¦" â†’
  "Matching to the job descriptionâ€¦" â†’ "Polishing the wordingâ€¦" â€”
  2â€“4 short phrases cycling every ~2s during a call that takes
  several seconds, so the wait feels accounted-for rather than dead.
- Keep loader copy honest about what's actually happening (see
  docs/ai/PROMPT_AND_FEEDBACK_RULES.md for the tone rules that
  apply here too) â€” don't invent drama ("Crafting your destiny")
  for what is a straightforward API call.
- Animations are functional, not decorative: a fade/slide on modal
  open (150â€“200ms), a diff-highlight animation on AI-accept (draws
  the eye to what changed) â€” skip animation anywhere it delays the
  user from acting (no animated counters before a real number loads,
  no artificial delay to "feel more premium").

## 6. Wireframe-first rule (process, not visual)

Every new page or major page change gets a wireframe reviewed and
approved **before** implementation starts, following the same format
as V5's page-by-page spec: Purpose â†’ Layout regions â†’ Buttons/icons
table â†’ End-to-end flow â†’ Edge cases â†’ Validation. A page built
without this checklist filled in first is the page that reintroduces
nested-scroll and viewport bugs â€” the format exists specifically to
force viewport and edge-case thinking before code, not after a bug
report.

## 7. Definition of "done" for any UI task

A UI task is not done when it renders once on your screen. It's done
when:
- [ ] Passes the 5-breakpoint test matrix (Â§4)
- [ ] Zero nested scroll containers (Â§1)
- [ ] Every icon button has aria-label + correct tap target (Â§3)
- [ ] Loading and error states both visually verified, not just the
  happy path (a form that only ever demos with valid input hides
  exactly the edge cases users hit first)
- [ ] Matches the wireframe's button/icon table exactly â€” no
  "improved" icon or repositioned button that wasn't in the approved
  wireframe

---

## Cursor scope-lock notes

- This file is a review gate, not a build task â€” reference it in
  every UI-touching PR description, and reject PRs that skip the
  breakpoint/scroll checklist rather than fixing it after merge.
- If an existing page already violates Â§1 (nested scroll), fixing it
  is its own task â€” don't bundle a scroll-structure fix into an
  unrelated feature PR, per the existing scope-lock pattern from
  V4/V5.
