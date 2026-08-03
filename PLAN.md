# HexaCV — PLAN.md (Strict Product & Logic Spec, v6)
Prepared for: Anandu / HexaStack Solutions
Supersedes: `AI_Resume_Builder_Design_and_Flow_Optimization_Plan` draft docs (folder removed).
Companion files: `DESIGN_DESKTOP.md`, `DESIGN_MOBILE.md`, `AGENT_TASKS.md`, existing `docs/design/DESIGN_STRICT.md` (scroll/breakpoint/icon rules — still in force, not repeated here).

This is a build contract, not inspiration. Every "?" item in section 10 is a real open decision — Cursor/OpenCode should stop and ask rather than guess on those.

---

## 1. What was wrong with the last plan (why this rewrite exists)

The previous draft (`HexaCV Overhaul Plan...md` + Desktop/Mobile UX specs) had the right instincts but reads like generic AI-SaaS copy: "psychological triggers" tables, vague "interactive preview," no real color hex system tied to the actual codebase. Audit of the live app confirms:

- `client/src/index.css` still uses stock Tailwind blues: `--primary: #1e40af` (blue-800), gradients with `#2563eb`, and dark-mode lavender `#b8c4ff` with no relation to the light brand color — the exact "every AI SaaS looks the same" palette.
- Referral/affiliate backend + UI exist (`AffiliateSystem`, route `/dashboard/affiliate`, nav label "Affiliate Program" in `client/src/components/DashboardLayout.tsx`) but are misaligned with the product: wrong naming ("Affiliate" vs "Refer & Earn"), and reward logic is not locked to first *paid* build.
- No generation caps / pay-per-build credit model wired end-to-end; subscription-era surfaces (`BillingPortal`, pricing page) still compete with the new pay-per-use rule.

This spec fixes that by:
- Tying every page to a **real file** in the current codebase (`client/src/pages/*.tsx`), not an imaginary IA.
- Replacing the generic palette with a specific, non-default one (§9 colors in DESIGN_*.md).
- Turning "emotional hook" from a vibe into literal copy strings and literal loader text, so Cursor can't reinterpret it as a spinner with a slogan.
- Naming the actual gaps found in the codebase audit so this plan builds on reality, not a clean-slate fantasy.

---

## 2. Non-negotiable product rules

1. **Pay-per-use, not subscription.** ₹99 per resume *build* (a build = one role + one JD combination turned into a final resume). No recurring billing anywhere in the flow.
2. **First build free per account.** One free credit granted at signup, consumed on first successful generation. Not refreshed monthly.
3. **Data entry never gated behind signup.** A visitor can paste text, upload a file, or start typing target role/JD before creating an account. Signup is only forced at the moment they try to *run the AI pipeline or save*.
4. **Manual edits are always free, unconditionally, forever**, on any resume the user owns (paid or the free one). AI-assisted edits after the initial build are what cost money (§7).
5. **No invented facts.** The AI may rephrase, restructure, and quantify only what the user supplied. It may never add an employer, a date range, a degree, or a number that wasn't in the source data or explicitly typed by the user in that session.
6. **A failed AI generation never charges a credit or ₹99.** Retry automatically once; if it still fails, refund the credit/hold and show a plain-language error, not a stack trace.

---

## 3. Entry flow — exact logic (this was the most garbled part of the brief, spelled out precisely)

This is the sequence from landing page to first generated resume. Read it as a state machine; each arrow is a real route change.

```
Landing (/) 
  │  User pastes resume text OR uploads PDF/DOCX/LinkedIn export OR clicks "Start fresh"
  ▼
Data captured in local/session state (NOT saved to DB yet, no account needed)
  │  User clicks "Continue" / "Build my resume"
  ▼
Auth check
  ├─ Already logged in  ───────────────► go straight to Targeting screen, carry the captured data
  └─ Not logged in
        │  Show signup/login screen (data already captured is preserved, not lost)
        ▼
     Signup or Login
        │
        ├─ New account → 1 free credit granted → Targeting screen
        └─ Existing account, logging in → Targeting screen (existing credit balance applies)
  ▼
Targeting screen (role + JD) — see §4
  ▼
AI Pipeline runs (§5) → Review/Edit (§6) → Payment if credit=0 (§7) → Export (§8)
```

Key rule Cursor must not "simplify": **the resume text/file the user provided before signup must survive the signup/login redirect.** Store it in `sessionStorage` (or equivalent) keyed to a temporary draft ID, and reattach it to the account on first authenticated write. Losing this is the #1 way SaaS resume tools lose a user at the worst possible moment — right after they did the most effortful part (uploading/pasting).

If the user chose "Upload existing" or "Paste text," the very next screen (still pre-targeting) is a **parsed-data review** step: show what was extracted (name, sections found) so they can fix obvious parser mistakes before role/JD targeting. This is not optional — it's the difference between "the AI understood me" and "the AI ate my resume and spat out garbage," which is the #1 trust-killer for this category.

---

## 4. Targeting screen (role + JD) — dynamic suggestion logic

Two inputs, one screen, nothing else competing for attention (per DESIGN_STRICT §2's "max 3 fields" instinct, kept here explicitly):

- **Target Role** (single-line). Debounced suggestions start after the 3rd character typed, ~250ms debounce, so it feels live/"dynamic" without firing a request per keystroke. Suggestions come from (a) a static local list of common India/Gulf roles for instant first-paint, replaced within ~300ms by (b) a real ranked call once available. If the user already uploaded a resume, rank suggestions by relevance to what's actually in their experience (someone with 5 years of accounting experience typing "acc" should see "Senior Accountant" and "Accounts Manager" before generic "Account Executive (Sales)").
- **Job Description** (multtextarea, optional but pushed hard: "Paste the JD for a 2x better match" — this is a real, testable claim only if the pipeline actually reweights against JD keywords; don't ship the copy without the mechanism).
- **Country/Region** selector (India / Gulf / Ireland or whichever regions are actually live — confirm final list, see §10) sits above these two fields, not buried in settings, because it changes formatting rules (Gulf: visa/nationality field available; Ireland: no DOB/photo; India: standard).

CTA button text is state-dependent, not static:
- Has free credit: **"Build my resume — free"**
- No credit: **"Build my resume — ₹99"**
Never show a generic "Submit" or "Generate" — the button is the moment the user decides to spend money or their one freebie, the copy has to say that plainly.

---

## 5. AI pipeline — five phases (already exists in the codebase — keep and refine, do not reinvent)

Confirmed present and to be refined (not rebuilt):

| File | Role |
|---|---|
| `server/ai/pipelineOrchestrator.ts` | Orchestrates pipeline phases |
| `server/ai/grounding.ts` | Grounding / source fidelity helpers |
| `server/aiSuggestions.ts` | Suggestion helpers |
| `server/contentValidation.ts` | Validate / anti-hallucination checks |
| `server/resumeSections.ts` | Section structure |
| `server/promptVersions.ts` | Prompt versioning |
| `server/fileParser.ts` | Upload/parse PDF/DOCX text |

The pipeline shape already matches this plan:

| Phase | What happens | Loader text shown to user |
|---|---|---|
| **Extract** | Parse uploaded/pasted source into structured sections | "Reading your experience…" |
| **Target** | Cross-reference role + JD + region against structured data | "Matching this to [Role] roles in [Region]…" |
| **Rewrite** | LLM rewrites bullet points with stronger verbs and quantification *of existing facts only* | "Sharpening how you describe your work…" |
| **Validate** | Diff original vs rewritten — reject/flag any new company, date, degree, or number not present in source | "Double-checking nothing got made up…" |
| **Polish** | Final formatting pass into the chosen template | "Fitting it to the page…" |

Rules for this loader specifically:
- Real phases, not decorative ones — if Validate takes 200ms because it's a cheap diff, don't stretch it artificially to "feel premium" (DESIGN_STRICT §5 already bans this).
- Copy stays literal and specific to *this* user's role/region ("Matching this to Site Engineer roles in UAE," not "Matching to your dream job ✨"). No emoji, no "AI magic" language — the brand promise here is honesty, and the loader is where that promise is either earned or blown.
- If Validate flags a possible fabrication, don't silently drop it and don't silently keep it — hold that resume in a "needs your check" state and surface the specific line to the user on the Review screen with a plain note ("We reworded this but couldn't confirm the number — check it's right").

---

## 6. Review & Edit workspace

- Full resume rendered in the actual output template (not a stripped-down "web preview" that looks different from the PDF — mismatched preview vs. export is a classic complaint category and erodes the "honest" positioning).
- Every section is click-to-edit inline. Two actions per section:
  - **Edit manually** — free, unlimited, always available, plain text/rich-text field.
  - **Ask AI to improve this section** — see §7 for what this costs.
- A visible, honest signal near sections the model rewrote heavily: not a gamified "ATS Score: 94%!" fake-precision badge (that's the "AI slop" pattern to avoid), but a plain **JD keyword match list** — "Found in your resume: Python, AWS, Team Leadership. Not found: Kubernetes, Agile" — factual, checkable, not a mystery percentage.

---

## 7. What costs money after the initial build (this needs your decision — see §10)

Current recommendation, pending your sign-off:
- Initial generation: 1 credit (first one free, then ₹99 each for a new role/JD combination).
- Manual text edits on any resume you own: free forever.
- "Ask AI to improve this section" after the resume is already generated: **3 AI-assist re-writes included free per paid build**, then a small top-up (suggest ₹19 for a pack of 3 more) rather than a second full ₹99 — a full re-charge for a one-line reword will feel punitive and is a plausible source of chargebacks/complaints.
- Changing the **target role or JD** substantially (not just tweaking a sentence) after generation counts as a new build and needs a new credit/₹99 — because it's genuinely a different optimization target, not an edit.

---

## 8. Export

- Two buttons, equal visual weight: **Download PDF** (ATS-safe, this is the default most people want) and **Download Word** (editable, some recruiters/agencies in Gulf specifically ask for .docx). Do not hide Word behind a second click or make it look like a lesser option.
- Downloads remain available indefinitely from the dashboard for any resume the user has paid for (or used their free credit on) — this is already implied by the "resume history" feature area in the codebase (Dashboard/DashboardHome) and should just be made complete, not rebuilt.
- Filename on download: `FirstName_LastName_TargetRole.pdf` — not `resume_export_final_v2.pdf`. Small detail, matters to someone about to email this to a recruiter.

---

## 9. Referral program

- Every account gets a unique referral link/code. UI already exists: `client/src/components/AffiliateSystem.tsx`, routed at `/dashboard/affiliate`, listed in `DashboardLayout` nav as **"Affiliate Program"**.
- **This cycle's work is not "wire an orphaned feature"** — it is already wired. Required changes:
  1. Rename nav + page copy to **"Refer & Earn"** (product language, not affiliate jargon).
  2. Align reward logic: referrer gets **1 free build credit** when a referred user completes their first *paid* build (not just signs up — ties the reward to real usage, avoids fake-referral abuse).
  3. Referred user still gets the standard first-build-free; the referral doesn't stack extra freebies for them, it rewards the referrer.
- Credit balance should remain visible from the dashboard sidebar (pill), with Refer & Earn as a first-class nav item (not buried under Settings).

---

## 10. Open decisions — flagging rather than guessing

**Locked for v6 build (2026-08-01):**
1. **Region list**: India + Gulf only.
2. **AI-edit after build**: unlimited (no metering / no top-up pack this cycle).
3. **LinkedIn import**: deferred to v2 — PDF/DOCX upload + paste only.
4. **Template count**: 1 template at launch (no picker).
5. **Referral reward**: 1 free build credit when referred user completes first paid build.

---

## 11. Risk register (hallucination, output quality, "AI slop" resume risk)

| Risk | Mitigation | Owner check |
|---|---|---|
| AI invents a job title, employer, or number | Validate phase diff-checks every entity against source (§5); flagged lines held for user confirmation, never silently shipped | Backend |
| Resume *looks* AI-generated (generic layout, default fonts, too much whitespace or cramming) | Templates are pre-tested at realistic content lengths (short 1-page fresher resume through dense 10-year resume) before launch, not just with lorem-ipsum-length demo content | Design/QA |
| PDF/Word export doesn't match the on-screen preview | Preview renders from the *same* template engine used for export, not a separate lightweight web view | Frontend |
| User pays and generation fails | Retry once automatically; on second failure, no charge, plain-language error, credit/₹99 hold released | Backend/Payments |
| Generic "AI SaaS" visual feel undermines trust | See DESIGN_DESKTOP.md / DESIGN_MOBILE.md §"Anti-slop checklist" | Design |
| Referral abuse (fake accounts farming credits) | Reward tied to referred user's first *paid* build, not signup (§9) | Backend |

---

## 12. Cross-references

- Master documentation index: `MASTER.md`.
- Layout, scroll, breakpoint, and icon rules: `docs/design/DESIGN_STRICT.md` (existing, unchanged, still enforced).
- Visual system (Ledger palette / type): `DESIGN.md`.
- Per-page desktop specs: `DESIGN_DESKTOP.md`.
- Per-page mobile specs: `DESIGN_MOBILE.md`.
- Per-page logic / inputs / agent task lists: `AGENT_TASKS.md`.
- Workflow & pipeline logic: `LOGIC.md`.
- Grounded prompt library: `PROMPTS.md`.
- Admin CRM spec: `ADMIN.md`.
- System rules & validations: `RESTRICTIONS.md`.
- API / cost / retry controls: `API-LIMITS.md`.
- Cursor / agent coding rules: `SKILLS.md`.
- Real pages: `client/src/pages/Landing.tsx`, `Login.tsx`, `Register.tsx`, `Dashboard.tsx`, `DashboardHome.tsx`, `ResumeBuilder.tsx`, `Pricing.tsx`.
- Real pipeline: `server/ai/pipelineOrchestrator.ts`, `server/ai/grounding.ts`, `server/contentValidation.ts`, `server/resumeSections.ts`, `server/promptVersions.ts`, `server/fileParser.ts`.
- Payments: `server/payments/razorpay.ts`, `server/razorpayWebhook.ts`.
- Referral UI: `client/src/components/AffiliateSystem.tsx`, `client/src/components/DashboardLayout.tsx`.
