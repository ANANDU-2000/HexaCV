# HexaCV — Wireframes

Combined page specs: Part A covers pages that already exist in
`client/src/pages/`; Part B covers planned pages not yet built.

---

# Part A — Existing pages

(Source: former HexaCV_V5_PAGE_BY_PAGE_SPEC.md)
# HexaCV v5 â€” Page-by-Page End-to-End Spec
Prepared for: Anandu / HexaStack Solutions
Reads with: V2 (pipeline), V3 (admin limits), V4 (build order).
This file is the click-by-click spec â€” every page, every tab, every
button, what it does, in order. Build in the page order below; it
matches V4's phase order (auth â†’ editor â†’ admin).

Format per page: Purpose â†’ Layout regions â†’ Tabs/sub-tabs â†’
Buttons/icons table â†’ End-to-end flow â†’ Edge cases â†’ Validation.

Icons reference Tabler outline names (`ti-*`) to match what's already
in your stitch-assets design system.

---

## PAGE 1 â€” Landing page
*Already built (`stitch-assets/hexacv_landing_page.html`) â€” spec here
only for the two new entry points added by this plan.*

**Regions:** Hero, features, CTA footer (existing, unchanged)

**New buttons on hero:**
| Icon | Label | Click logic |
|---|---|---|
| `ti-rocket` | Start free | â†’ Page 2 (Signup), pre-selects guest-mode tab |
| `ti-login` | Log in | â†’ Page 2 (Signup), pre-selects login tab |

**End-to-end flow:** Visitor lands â†’ clicks "Start free" â†’ Page 2 â†’
either continues as guest (skips account creation entirely) or
signs up â†’ Page 3 (Resume Hub).

**Validation:** both buttons route correctly; guest path never shows
a blocking signup wall before reaching the builder.

---

## PAGE 2 â€” Signup / Login
*New page. Wireframe shown earlier in this conversation.*

**Layout regions:** centered card, provider buttons (top), divider,
email/password form (bottom), guest-mode link (footer of card)

**Tabs:** `Sign up` / `Log in` (toggle, not separate pages â€” same
form, different submit endpoint and copy)

**Buttons/icons:**
| Icon | Label | Click logic |
|---|---|---|
| `ti-brand-google` | Continue with Google | Only rendered if `auth_providers.google.enabled === true` (Phase D1). Redirects to Google OAuth consent, callback â†’ `upsertUser`, session cookie set â†’ Page 3 |
| `ti-brand-apple` | Continue with Apple | Same pattern, gated by `auth_providers.apple.enabled`. Omit entirely from DOM if disabled, not just hidden â€” no dead network calls |
| â€” | Create account / Log in (submit) | Email flow (Phase D2): validates email format + password length client-side first, then POST to `/api/auth/signup` or `/api/auth/login`; on success â†’ Page 3; on failure â†’ inline error under the field that failed, never a generic toast |
| â€” | Continue as guest | No account creation. Sets a `guestId` in LocalStorage, â†’ Page 3 directly. Guest resumes capped at 3 (enforced server-side too, not just client â€” Phase B3 quota) |

**End-to-end flow:**
1. User picks a method â†’ 2. Auth completes (or guest bypass) â†’
3. Session/guest ID established â†’ 4. Redirect to Page 3.
If the user later signs up from guest mode, existing guest resumes
migrate to the new account (this migration logic already exists per
your README â€” reuse it, don't rebuild).

**Edge cases:**
- Provider disabled mid-session (admin flips toggle while user has
  the page open) â†’ button click returns a clean "this sign-in
  method is currently unavailable" instead of a broken redirect
- Email already registered via Google â†’ email/password signup with
  same address should prompt "you already have an account, log in
  with Google instead" rather than creating a duplicate user

**Validation:** disable each provider one at a time in the admin
panel (Page 9, Tab 3), confirm the corresponding button disappears
from this page with no page reload needed on next visit.

---

## PAGE 3 â€” Resume Hub (dashboard)
*Reference: `stitch-assets/resume_builder_hub.html` â€” already built,
spec here covers logic gaps only.*

**Layout regions:** top nav (logo, account menu), "New resume" CTA,
grid of existing resume cards, empty state for first-time users

**Buttons/icons:**
| Icon | Label | Click logic |
|---|---|---|
| `ti-plus` | New resume | â†’ Page 4 (Upload/Build choice modal) |
| `ti-upload` | Upload existing (on card grid, first-time) | â†’ Page 4, pre-selects upload tab |
| `ti-edit` (per card) | Edit | â†’ Page 5 (Builder) with that resume's data loaded |
| `ti-download` (per card) | Download | Triggers PDF export directly without opening the editor (Page 8 logic, headless) |
| `ti-trash` (per card) | Delete | Confirmation modal ("Delete this resume? This can't be undone") â†’ soft-delete (flag, not hard delete, for 30 days recovery) |
| `ti-user-circle` | Account menu | Dropdown: Settings, Log out |

**End-to-end flow:** Land on hub â†’ see existing resumes (or empty
state) â†’ click New resume or Edit â†’ proceed to builder.

**Validation:** guest users see a persistent banner "Sign up to save
your resumes permanently" once they hit 2/3 guest limit, not only
after hitting the cap.

---

## PAGE 4 â€” New resume: Upload or Build from scratch (modal/page)

**Tabs:** `Upload existing` / `Build from scratch`

**Tab: Upload existing**
| Icon | Label | Click logic |
|---|---|---|
| `ti-file-upload` | Drop zone / Browse files | Accepts PDF/DOCX/TXT (existing `fileParser.ts`). On file select â†’ show inline progress â†’ Stage 1 EXTRACT runs â†’ on success, â†’ Page 5 pre-filled; on parse failure, show which section failed and let user fix manually rather than blocking entirely |

**Tab: Build from scratch**
| Icon | Label | Click logic |
|---|---|---|
| `ti-arrow-right` | Start blank | â†’ Page 5 with empty sections, Header tab active |

**End-to-end flow:** Choice â†’ (parse or blank) â†’ Page 5.

**Validation:** a corrupted/unsupported file shows a specific error
("couldn't read this DOCX â€” try exporting as PDF") not a silent
failure or generic 500.

---

## PAGE 5 â€” Builder / Editor workspace
*Core page. Reference: `stitch-assets/resume_editor_workspace.html`
+ `stitch-assets/screenshots/resume_editor.png` â€” spec covers the
tab logic and AI integration points.*

**Layout regions:** left sidebar (section tabs), center panel (form
for active section), right panel (live preview, sticky), top bar
(template switch, JD target, save status, export)

**Section tabs (left sidebar, top to bottom, matches section order
from V2_ROADMAP Â§8):**
| Icon | Tab | Sub-fields | AI button present? |
|---|---|---|---|
| `ti-user` | Header | Name, email, phone, location, links | No |
| `ti-file-text` | Summary | Single textarea | Yes â€” "Rewrite with AI" |
| `ti-tools` | Skills | Categorized skill groups | Yes â€” "Suggest from JD" |
| `ti-briefcase` | Experience | Repeatable: company, role, dates, bullets | Yes â€” per-bullet "Improve" + section-level "Rewrite all" |
| `ti-code` | Projects | Repeatable: name, description, tech, link | Yes â€” same pattern as Experience |
| `ti-school` | Education | Repeatable: institution, degree, field, date | No |
| `ti-certificate` | Certifications | Repeatable: name, issuer, date | No |

**Top bar buttons:**
| Icon | Label | Click logic |
|---|---|---|
| `ti-layout-grid` | Template | Opens Page 6 (Template selector) as a slide-over, not full navigation away |
| `ti-target-arrow` | Target job | Opens Page 7 (JD Targeting) modal |
| `ti-eye-check` | Check score | Runs Stage 4 evaluator only (not full Stage 3 rewrite â€” cheap, fast), shows score breakdown in a side panel |
| `ti-download` | Export | â†’ Page 8 |
| (auto, no click) | Save status | "Savingâ€¦" / "Saved" text, autosave on field blur, debounced 2s on typing |

**Per-field AI button logic ("Rewrite with AI" / "Improve"):**
1. Click â†’ button shows loading spinner, field becomes read-only
   during generation (prevents race condition with manual typing)
2. Calls Stage 3 for that field only, with current JD target +
   country context
3. Result shown as an inline diff (strikethrough old, highlight new)
   with **Accept** / **Reject** buttons â€” never auto-replaces
4. Accept â†’ field updates, `userEdited` flag stays `false` (AI-
   authored) so future re-checks can still touch it
5. If the user then manually types in that field, `userEdited` flips
   to `true` and stays that way until explicitly reset

**End-to-end flow:** Land in Header tab â†’ fill/edit each section
(manually and/or via AI buttons) â†’ optionally set JD target and
template â†’ check score â†’ export.

**Edge cases:**
- User navigates away mid-AI-generation â†’ generation continues
  server-side, result available when they return (don't lose the
  work, don't block navigation either)
- Two AI rewrite clicks on the same field in quick succession â†’
  debounce, second click is a no-op until first resolves

**Validation:** accept/reject buttons actually preserve/discard
correctly in 100% of manual tests across all 7 section tabs; no
field ever changes without either a direct user edit or an explicit
Accept click.

---

## PAGE 6 â€” Template selector (slide-over from Page 5)

**Regions:** grid of template thumbnails, live-swap preview

**Buttons/icons:**
| Icon | Label | Click logic |
|---|---|---|
| (thumbnail click) | Select template | Updates right-panel preview immediately (client-side re-render, no server round-trip needed since it's a rendering change, not content change) |
| `ti-check` | Apply | Persists choice, closes slide-over |
| `ti-x` | Cancel | Reverts preview to previously saved template, closes slide-over |

**Validation:** per V2_ROADMAP Â§8, only 1 flagship template is
default-visible; others (existing 4) appear under a collapsed
"More templates" toggle, not presented as equal options â€” this
matches the "one template first" decision.

---

## PAGE 7 â€” Job Description targeting (modal from Page 5)

**Regions:** JD paste/upload area, country selector, extracted
keyword preview (read-only, generated by Stage 2 TARGET)

**Buttons/icons:**
| Icon | Label | Click logic |
|---|---|---|
| `ti-clipboard-text` | Paste JD | Textarea, on blur (after 300+ chars) auto-triggers Stage 2 extraction preview |
| `ti-world` | Country / market | Dropdown: India, UAE, Saudi, Qatar, Oman, Kuwait, Bahrain, Other â€” drives country-rule engine (photo/visa/passport visibility) |
| `ti-check` | Apply target | Saves JD + country to the resume record, closes modal, does NOT auto-rewrite all sections â€” user chooses per-field via Page 5's AI buttons |
| `ti-x` | Clear target | Removes JD association, sections keep their last AI-written content (not reverted) |

**End-to-end flow:** Open modal â†’ paste JD â†’ see extracted keywords
â†’ pick country â†’ Apply â†’ back to Page 5 with target context now
available to every AI button.

**Validation:** country selection immediately changes which optional
fields (photo, visa status, passport) are shown/hidden in the Header
tab per V2_ROADMAP Â§8 country rules â€” verify for at least 3 country
selections.

---

## PAGE 8 â€” Export / Download

**Regions:** final preview (full page), format options

**Buttons/icons:**
| Icon | Label | Click logic |
|---|---|---|
| `ti-file-type-pdf` | Download PDF | Runs current PDF pipeline (jsPDF + html2canvas per docs/architecture/ARCHITECTURE.md), triggers browser download |
| `ti-copy` | Copy as text | Plain-text version for pasting into application portals that don't accept file uploads |
| `ti-arrow-left` | Back to editor | Returns to Page 5, no data loss |

**Validation:** exported PDF text layer is selectable (Ctrl+A/copy
test from V2_ROADMAP Â§10 accessibility check) â€” verify on every
supported template, not just the flagship.

---

## PAGE 9 â€” Super Admin Dashboard
*New. Extends existing CRM admin section â€” add tabs, don't build a
separate admin app. Wireframe for tabs 2â€“3 shown earlier.*

**Top-level tabs:**
`Overview` / `Model routing & usage` / `Auth providers` / `Users & CRM`
/ `Prompt versions` / `Budget & quotas`

### Tab: Overview
Existing analytics (guest sessions, conversions, downloads per
README) â€” no change, just becomes the default landing tab instead
of a standalone page.

### Tab: Model routing & usage
| Icon | Label | Click logic |
|---|---|---|
| (per-stage row) | Fallback chain editor | Drag-to-reorder list of models per stage (Extract/Target/Rewrite/Validate/Polish); save writes to `model_routing` table, live within 5 min cache |
| `ti-plus` | Add fallback model | Opens small form: provider, model ID, RPM/RPD limits |
| `ti-credit-card` | Add credit â€” [Provider] | Deep-links to that provider's billing page |
| `ti-player-pause` | Pause all AI | Confirmation ("This stops all resume generation for all users immediately") â†’ sets A1 kill switch |

### Tab: Auth providers
| Icon | Label | Click logic |
|---|---|---|
| (per-provider toggle) | Enable/disable | Flips `auth_providers.{provider}.enabled`, takes effect on Page 2 immediately, no deploy |
| `ti-edit` | Edit credentials | Opens form for client ID/secret; secret field shows masked value (`â€¢â€¢â€¢â€¢1234`) after save, never the real value again â€” re-entering means overwriting, not viewing |

### Tab: Users & CRM
Existing CRM data (per README: guest sessions, cloud backup stats)
â€” extend with: resume count per user, last active, plan tier. No
new page, add columns to existing table view.

### Tab: Prompt versions
| Icon | Label | Click logic |
|---|---|---|
| `ti-plus` | New version | Opens editor for the selected stage's prompt text, saves as inactive draft |
| `ti-flask` | Test against profiles | Runs the 10 test profiles (V2_ROADMAP Â§12) against the draft version, shows score comparison vs. active version |
| `ti-check` | Promote to active | Only enabled once test scores are shown and don't regress any profile below its baseline â€” button is disabled (not hidden) with a tooltip explaining why if scores haven't been checked yet |

### Tab: Budget & quotas
| Icon | Label | Click logic |
|---|---|---|
| â€” | Daily spend cap (input) | Number input, â‚¹ or $ based on admin locale, saves on blur |
| â€” | Per-tier quota (guest/free/paid) | Number inputs per plan tier, resumes/day or /month |
| `ti-chart-bar` | View spend history | Simple line chart, last 30 days, pulled from `usage_logs` daily rollup |

**End-to-end flow (admin):** Log in as admin (existing auth, elevated
role check) â†’ land on Overview â†’ navigate tabs as needed â†’ every
change in Auth providers or Model routing tabs reflects on the
live user-facing pages within the stated cache window, no deploy.

**Validation:** every toggle/save in this page has a corresponding
row in an `admin_audit_log` (who changed what, when) â€” add this as
a lightweight addition to A2's usage logging pattern, not a new
subsystem.

---

## Cross-page rules (apply everywhere)

- **Every destructive action** (delete resume, disable an auth
  provider mid-traffic, pause all AI) requires a confirmation step â€”
  no single-click destructive actions anywhere in the app.
- **Every AI-triggered button** shows a loading state on the button
  itself (spinner replacing icon, button disabled) â€” never a
  full-page loading overlay that blocks the rest of the editor.
- **Every icon-only button** (no visible label) has an `aria-label`
  matching its tooltip text â€” accessibility carry-over from
  V2_ROADMAP Â§10.
- **No button is ever hidden-but-clickable** (opacity trick) â€” either
  fully rendered and enabled, or not rendered at all (auth provider
  buttons), or rendered-disabled-with-tooltip (promote button).

---

## Cursor task file naming (for this phase)

Create one Cursor `.md` task per page, named to match this file's
section numbers, so progress is trackable 1:1 against this spec:

```
task_page02_signup.md
task_page03_hub.md
task_page04_new_resume.md
task_page05_builder.md
task_page06_template_selector.md
task_page07_jd_targeting.md
task_page08_export.md
task_page09_admin_dashboard.md
```

Each task file's scope = exactly the buttons/logic/validation listed
under that page's section above, nothing more. Do not let a single
task file grow to cover two pages â€” that's how scope creep happens
even inside a well-ordered plan.


---

# Part B — Planned pages

(Source: former HexaCV_V6_WIREFRAMES.md)
# HexaCV v6 â€” WIREFRAMES (Updated: New Pages Only)
Prepared for: Anandu / HexaStack Solutions
Same format as V5_PAGE_BY_PAGE_SPEC.md. V5 already covers Pages 1â€“9
(landing â†’ builder â†’ admin) against the actual client components
that exist today (`Landing.tsx`, `ResumeEditorWorkspace.tsx`,
`ResumeBuilderHub.tsx`, `Dashboard.tsx`, etc.) â€” **that spec still
stands, don't re-wireframe those.** This file adds the pages V6
introduced that don't exist in the codebase yet: Pricing/Checkout,
Referral dashboard, Blog, Legal, and the new Admin Billing tab.

ASCII boxes below are structure, not pixels â€” build to
DESIGN_STRICT.md's breakpoint/scroll rules, not to these proportions.

---

## PAGE 10 â€” Pricing / Checkout
*New file: `client/src/pages/Pricing.tsx`. Triggered per
V6_PAYMENTS Â§F0 â€” only from Download-limit-hit, paid-model-attempt,
or direct nav, never mid-edit.*

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  [logo]                      [Log in / Acct] â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚            Choose your plan                  â”‚
â”‚                                               â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”‚
â”‚  â”‚  Free    â”‚ â”‚ Monthly  â”‚ â”‚   Pro    â”‚     â”‚
â”‚  â”‚  â‚¹0      â”‚ â”‚ â‚¹___/mo  â”‚ â”‚ â‚¹___/mo  â”‚     â”‚
â”‚  â”‚  1 free  â”‚ â”‚ Unlimitedâ”‚ â”‚ Unlimitedâ”‚     â”‚
â”‚  â”‚  downloadâ”‚ â”‚ downloadsâ”‚ â”‚+ Premium â”‚     â”‚
â”‚  â”‚          â”‚ â”‚          â”‚ â”‚  polish  â”‚     â”‚
â”‚  â”‚[Current] â”‚ â”‚[Subscribe]â”‚ â”‚[Subscribe]â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â”‚
â”‚                                               â”‚
â”‚  Terms Â· Privacy Â· Refund policy (footer)    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Buttons:**
| Label | Click logic |
|---|---|
| Subscribe (Monthly/Pro) | Calls `billing.createCheckoutSession({ tier })` â†’ redirects to the returned Stripe Checkout `url` (existing procedure, `server/routers.ts` billing router â€” already wired to real Stripe when `STRIPE_SECRET_KEY` is set) |
| Current (Free) | Disabled, no click â€” just a state label |

**Critical fix required here (not a new feature â€” a real gap in
current code):** `billing.upgradePlan` currently exists as a
`protectedProcedure` that calls `db.updateSubscription` directly with
no Stripe verification. As long as that endpoint exists and is
reachable, the Pricing page's checkout flow can be bypassed entirely
by calling `upgradePlan` from the browser console â€” a user grants
themselves Pro for free with one API call. This page's checkout
button must go through `createCheckoutSession` â†’ Stripe â†’ the
`/api/webhooks/stripe` handler only. See docs/tasks/TASK_PROMPTS.md task P1.

**End-to-end flow:** land here (via trigger or nav) â†’ pick plan â†’
Stripe Checkout (hosted, off-site) â†’ success redirect to
`/dashboard/billing?session_id=...&status=success` â†’ webhook
(async, may arrive before or after redirect) flips `subscriptions`
row â†’ Dashboard/Billing shows active plan once webhook lands.

**Edge cases:** user closes the Stripe tab before completing payment
â†’ `success_url`/`cancel_url` both return to `/dashboard/billing`,
show "payment not completed" if no webhook arrived, never assume
success from the redirect alone (redirect â‰  payment, webhook = truth).

**Validation:** confirm `upgradePlan` is either removed or locked to
admin-only (manual comp/grant use case) before this page ships to
real users â€” this is the #1 priority fix in V6_EDGE_CASES_QA row 3.

---

## PAGE 11 â€” Referral / Affiliate dashboard
*New file: `client/src/pages/Referral.tsx`. Backed by the existing
`affiliate` router (`getStats`, `trackClick`) â€” extend, don't
replace.*

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  â† Back to Hub                               â”‚
â”‚                                               â”‚
â”‚   Share HexaCV, help someone job-hunt         â”‚
â”‚                                               â”‚
â”‚   [ hexacv.com/r/AB12CD ]        [Copy]      â”‚
â”‚                                               â”‚
â”‚   Signed up via your link: 3                  â”‚
â”‚   Free downloads earned: 2                    â”‚
â”‚                                               â”‚
â”‚   [WhatsApp] [LinkedIn] [Copy link]           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Buttons:**
| Label | Click logic |
|---|---|
| Copy | Copies referral URL to clipboard, shows a 2s "Copied" confirmation |
| WhatsApp / LinkedIn | Opens platform share-intent URL pre-filled with link + honest copy ("Building your resume with HexaCV â€” try it") â€” no outcome-guarantee language, per PROMPT_AND_FEEDBACK_RULES.md Â§1 |

**Gap vs. current code:** `affiliate.trackClick` and
`rewardReferralConversion` currently reward on **click + email match
at upgrade time**, with no signup-gate or 24h/real-action check â€”
this is more exploitable than V6_PAYMENTS Â§H2 specifies. This page's
stats display should reflect whatever the real anti-abuse rule ends
up being (task R2 in docs/tasks/TASK_PROMPTS.md) â€” don't build the UI to
show real-time "credit earned" until the backend actually enforces
the gate, or the UI will show a reward that a later fraud-fix
retroactively revokes, which is a worse user experience than a short
delay before the credit appears.

**End-to-end flow:** user opens page from Hub account menu â†’ sees
own link + stats (`affiliate.getStats`) â†’ shares â†’ referred person
signs up via `/r/<code>` landing param â†’ `trackClick` fires â†’ later,
once gated conditions are met, stats update on next page load.

---

## PAGE 12 â€” Blog (list + post)
*New files: `client/src/pages/BlogList.tsx`,
`client/src/pages/BlogPost.tsx`. Public routes, no auth required.*

```
BlogList                          BlogPost
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  [logo]      [Log in] â”‚         â”‚  [logo]      [Log in] â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤         â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  HexaCV Blog           â”‚         â”‚  â† All posts           â”‚
â”‚                        â”‚         â”‚                        â”‚
â”‚  [cover] Post title    â”‚         â”‚  Post title (h1)       â”‚
â”‚  excerpt...  Read â†’    â”‚         â”‚  body content...        â”‚
â”‚                        â”‚         â”‚                        â”‚
â”‚  [cover] Post title    â”‚         â”‚  [Share: WhatsApp/     â”‚
â”‚  excerpt...  Read â†’    â”‚         â”‚   LinkedIn]             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**End-to-end flow:** admin publishes in Admin â†’ Blog tab
(V6_MARKETING_ADMIN Â§I3) â†’ post appears in `BlogList` â†’ click â†’
`BlogPost` renders with SEO meta tags server-rendered (title,
description, OG image from `coverImageUrl`) â†’ sitemap regenerates.

**Validation:** a `draft` post's slug returns 404 on the public
route even if the URL is guessed directly â€” status check happens
server-side on every request, not just at list-render time.

---

## PAGE 13 â€” Legal pages (ToS / Privacy / Refund)
*New files: `client/src/pages/Terms.tsx`,
`client/src/pages/Privacy.tsx`, `client/src/pages/Refund.tsx`. Plain
static content pages, linked from footer + Pricing page + checkout.*

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  [logo]                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Terms of Service              â”‚
â”‚                                 â”‚
â”‚  (static long-form text)       â”‚
â”‚                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

No interactive elements beyond in-page anchor links (table of
contents for long documents). See V6_PAYMENTS_LEGAL_REFERRAL.md Â§G
for required content per page â€” do not let an agent generate the
legal text; that's a human/lawyer-reviewed copy task.

---

## PAGE 9 (extend) â€” Admin: new "Billing" tab
*Adds to the existing admin tab set from V5 Page 9
(`Dashboard.tsx` admin section) alongside Model routing / Auth
providers / Users & CRM / Prompt versions.*

```
â”Œâ”€ Billing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Active subscriptions: 12 Monthly, 3 Pro    â”‚
â”‚ MRR: â‚¹____                                 â”‚
â”‚ Failed renewals (grace period): 1          â”‚
â”‚ [View Stripe Dashboard â†’]                  â”‚
â”‚ Manual grant: [user email] [tier] [Grant]  â”‚
â”‚ Refund: [subscription id] [reason] [Refund]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Manual grant** replaces the client-callable `upgradePlan` mutation
as the *only* non-Stripe way to change a user's tier â€” admin-only,
requires a reason (logged to `admin_audit_log`), for comp accounts
and support resolutions. This closes the gap flagged on Page 10.

---

## Cursor scope-lock notes
- Pages 10â€“13 are net-new files; the admin Billing tab extends the
  existing admin dashboard component, it is not a new page.
- Every new page here must pass DESIGN_STRICT.md Â§7's checklist
  before merge, same as any V5 page.

