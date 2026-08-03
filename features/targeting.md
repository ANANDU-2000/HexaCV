# 3. Target Role, Region & Job Description

> "Who are you applying to?" — one role, optional JD, and a market. This configures
> the AI build and is where payment is gated for new users.

**Status:** Implemented · **NEW:** guest-usable targeting, Confirm & Pay screen.

## Purpose
Capture the three inputs that make a grounded, ATS-tailored resume possible:
**target role**, **region/market**, and an optional **job description** for keywords.

## User flow
1. Reach `/builder/target` (from landing upload, paste continue, builder, or footer link).
2. Pick a region (**India** / **Gulf** — segmented control).
3. Type a target role (floating-label input) → live suggestions ranked by the
   user's parsed experience ("based on your experience").
4. Optionally expand "+ Paste job description (recommended)" — floating-label textarea.
5. Click the CTA:
   - **Guest** → "Sign in to build your resume" → login (redirects back here).
   - **Signed in with credit** → "Build my resume — free" → AI pipeline.
   - **Signed in, no credit** → "Build my resume — ₹99" → **Confirm & Pay** screen → Razorpay → pipeline.

## Implementation
| Piece | File | Detail |
|-------|------|--------|
| Page | `client/src/pages/Targeting.tsx` | region control, role + suggestions, JD expander, sticky mobile CTA |
| Suggestions | `STATIC_ROLES` filtered by input + keyword overlap with the entry draft | |
| Draft prefill | `localStorage` `hexacv_target_panel_draft` | role/market/JD restored on refresh |
| Confirm & Pay | **NEW** overlay in `Targeting.tsx` | order summary (role · region, ₹99 incl. taxes), "Pay Securely with Razorpay", trust signals (encrypted checkout, no credit used if build fails) |
| Pipeline trigger | `runPipeline()` | `resume.startBuild` → `ai.generateFullResume` → redirect `/builder/ai?fromPipeline=1` |

## Key details
- **Guest-usable page** (**NEW**): the hard guest redirect was removed; guests can fill
  the form and are prompted to sign in only at the **build** action ("sign in only when you build").
- `experienceDetails()` reads the entry draft (parsed upload or pasted text) so the
  AI build is grounded in real content.
- Balance comes from `credits.getBalance` (disabled for guests → shows the sign-in CTA).
- The Confirm & Pay overlay closes when Razorpay opens; the pipeline loader takes over on success.

## New additions (this cycle)
- Guests can reach and fill targeting (no infinite login loop).
- Dedicated Confirm & Pay screen with trust signals (was a direct Razorpay popup).
- Floating-label inputs for role and JD.

## Edge cases
- Empty role → toast "Enter a target role".
- JD left blank → CTA still enabled; helper note shown.
- Guest with balance 0 → never opens payment; routed to login.
- Payment modal dismissed → "Payment closed — your draft is saved."
