# HexaCV v6 — Honest Messaging Rules + AI Feedback Loop
Prepared for: Anandu / HexaStack Solutions
Reads with: V2_ROADMAP §3–5 (evaluator, human editing loop). This is
the tone/copy layer that sits on top of that scoring system — it
governs every word the app shows the user, and every word inside the
Stage 3 system prompt.

Core principle: **the emotional/psychological effect on the user must
come from truthfully highlighting real improvement, never from a
promise about outcomes the app cannot guarantee.** A user who feels
more confident because their resume genuinely reads clearer is a win
that compounds (they trust the tool, they come back). A user who
feels confident because of an implied guarantee that later doesn't
hold is a trust loss the moment they don't get the interview — and
they will, correctly, blame the app.

---

## 1. Hard-banned phrase categories (system prompt + UI copy both)

Never generate or display, anywhere in the product:
- Outcome guarantees: "guaranteed interview," "will get you hired,"
  "job-winning," "ATS-proof" (claim "ATS-optimized" or "ATS-friendly"
  instead — a claim about formatting compatibility, not a guarantee
  about a system you don't control)
- Fabricated authority: "recruiters always...", "99% of hiring
  managers...", any statistic not sourced from your own evaluation
  dataset (V2_ROADMAP §7) — if you don't have the number, don't
  invent one, even a vague-sounding one
- Fabricated content in the resume itself: this is already a hard-
  reject rule in V2_ROADMAP §11 (fact-traceability check) — the
  honesty rule here is the same principle applied to marketing copy
  as well as resume content

## 2. What's allowed and encouraged — the honest-confidence register

Language that names a specific, true, visible improvement:
- "Your summary now leads with your strongest project instead of a
  generic opener" (specific, true, checkable by the user)
- "3 vague phrases were replaced with specific numbers from your
  experience" (ties to the evaluator's `vague_claim_count` field —
  the copy should literally reference what changed, not a generic
  compliment)
- "This version scores higher on clarity and keyword match for the
  job you targeted" (references real evaluator fields, not a vibe)

Rule of thumb for anyone writing this copy (human or Cursor agent):
if the sentence would still be true with the words "we think" removed
and stated as fact, and it's grounded in an actual evaluator field or
diff, it's allowed. If it needs "we think" or "usually" to be
defensible, it's a claim, not a fact — cut it.

## 3. Where this applies concretely

| Surface | Rule |
|---|---|
| Stage 3 system prompt (rewrite) | Explicit instruction block: "Do not add outcome claims, statistics, or guarantees. State only what changed and why, grounded in the source facts." Ship this as a literal prompt section, not a vibe the model is expected to infer. |
| Stage 4 evaluator feedback shown to user | Score deltas + specific flags fixed ("removed 2 repeated sentence openers"), never a generic "Great job!" banner divorced from what actually changed |
| Loading-state copy (Builder AI buttons) | Describe the actual pipeline step happening (see DESIGN.md §5) — no manufactured drama |
| Landing/marketing page | "Improve your resume's clarity and ATS compatibility" — not "land your dream job." The value prop is real (clearer writing, ATS-safe formatting, JD-targeted keywords) and doesn't need inflation. |
| Post-download nudge (referral, V6_PAYMENTS §H3) | Frames sharing as helping a friend job-hunt, not as a discount hunt — matches the referral program's honest, additive framing |

## 4. The feedback loop (user feedback → agent improvement)

This is the mechanism that lets the "psychological" side stay honest
over time instead of drifting into hype, because it's grounded in
real signal from real users:

```
User downloads → optional 1-tap rating shown once
   ("Did this feel like a real improvement?" 👍/👎)
      ↓
👍 → logged to resume_evaluations (V2_ROADMAP §3) as a positive
     signal tied to that prompt_version (V2_ROADMAP §6)
👎 → prompt: "What felt off?" — short-list, not free text, to keep
     signal structured: [Too generic] [Doesn't sound like me]
     [Lost important details] [Formatting issue] [Other]
      ↓
👎 with a reason → triggers ONE automatic Stage 3 regeneration with
     that specific reason fed into the prompt as a correction
     instruction, same pattern as the evaluator's <70-score retry
     in V2_ROADMAP §3 — cap at 1 auto-retry, same reasoning (avoid
     runaway cost/looping)
      ↓
Regenerated result shown as a new diff (same Accept/Reject pattern
as V5 Page 5) — never silently replaces, even after negative
feedback, because "the user disliked it" is not the same permission
as "the user accepted this specific rewrite"
```

- Store every rating + reason against its `prompt_version` (already
  exists per V2_ROADMAP §6) — this is what actually improves prompts
  with data, not guesses, closing the loop the v2 roadmap flagged as
  a gap.
- Never show the user a raw aggregate ("87% of users loved this!")
  unless you actually have enough samples for that number to mean
  something and it's pulled live from real data — see §1's banned-
  statistics rule, it applies to your own dashboard copy too, not
  just marketing.

## 5. Definition of done for any user-facing copy change

- [ ] No phrase from §1's banned list appears anywhere in the diff
- [ ] Every claim of improvement ties to a real evaluator field, a
  real diff, or real logged data — not a generic compliment
- [ ] Loading/feedback copy matches the honest tone in §2, checked
  against DESIGN.md §5's loader rules
- [ ] If this is a Stage 3 prompt change, it went through
  V2_ROADMAP §12's test-profile suite before promotion, same as any
  other prompt version

---

## Cursor scope-lock notes

- Scope: `server/aiSuggestions.ts` (system prompt text), client
  copy strings (wherever your i18n/copy constants currently live —
  extend that file, don't create a new one), `resume_evaluations`
  table (extend with `userRating`, `userRatingReason` columns).
- This file is a copy/prompt-content gate, same role as
  V6_DESIGN_STRICT.md is a UI gate — reference it in PR reviews for
  any prompt or user-facing text change, reject language that
  violates §1 regardless of how well-intentioned the phrasing was.
