# HexaCV v2 â€” Full Roadmap (Lean Architecture + Quality Layers)
Prepared for: Anandu / HexaStack Solutions
Supersedes: docs/product/roadmap/V2_ROADMAP_v1.md (keep the "Reality Check" and
"This Week" sections from that file, they still apply â€” this file
adds the missing quality/UX layers on top of the same lean pipeline)

---

## 0. Non-negotiable reality check (carried over â€” read it)

You already built most of the feature list. "No one needed it" is a
distribution/trust problem until proven otherwise by real users. Ship
this to 15â€“20 real people before or in parallel with anything below.
Nothing in this document is worth doing if nobody sees the result.

Scorecard for where v1 actually stood:

| Area | Score | Note |
|---|---|---|
| Architecture | 9.5/10 | already lean, keep it that way |
| Cost efficiency | 10/10 | routing table gets you to $0.02â€“0.15/resume |
| Maintainability | 10/10 | as long as you resist agent sprawl |
| AI output quality | 8.5/10 | good bones, needs evaluation layer |
| UX | 7.5/10 | needs the editing-loop work below |
| Recruiter psychology | 7/10 | not addressed yet â€” Â§4 |
| Human editing workflow | 6.5/10 | not addressed yet â€” Â§5 |
| Evaluation / testing | 5/10 | not addressed yet â€” Â§3, Â§12 |

The gaps aren't "more agents." They're evaluation, human-in-the-loop
UX, and a feedback loop that improves prompts with real data instead
of guesses.

---

## 1. Core pipeline â€” 5 stages, 1 call per stage

Unchanged from v1, restated with the internal-module detail:

```
Stage 1 EXTRACT   â†’ strict JSON, facts only         (cheap model)
Stage 2 TARGET    â†’ JD keywords + country rules      (cheap model)
Stage 3 REWRITE   â†’ single call, internal modules:    (mid model)
   Summary â†’ Experience â†’ Projects â†’ Skills â†’
   Achievements â†’ Country formatter â†’ ATS keyword
   insertion â†’ Human tone â†’ Slop removal â†’ Output
Stage 4 VALIDATE  â†’ deterministic checks + evaluator  (rule-based
                    + one cheap-model scoring call)   (see Â§3)
Stage 5 POLISH    â†’ one call, paid tier only          (premium model)
```

Stage 3 is one API call with the sub-steps as **prompt sections**,
not separate requests â€” a single well-structured prompt with clear
internal ordering outperforms ten small calls on both cost and
coherence, since later steps (tone, slop removal) need context from
earlier ones (country formatting, keyword insertion).

---

## 2. Model routing â€” config-driven, not hardcoded

Do not hardcode model names anywhere in `aiSuggestions.ts`. Add a
`model_routing` table (or extend `apiKeyManager.ts`) so admin can
change models without a deploy:

```ts
// shared/types.ts addition
interface ModelRoute {
  stage: 'extract' | 'target' | 'rewrite' | 'validate' | 'polish';
  tier: 'cheap' | 'standard' | 'premium' | 'fallback';
  provider: string;   // 'openrouter' | 'gemini' | 'anthropic' | ...
  model: string;       // e.g. 'deepseek/deepseek-v4-flash'
  maxTokens: number;
  updatedAt: Date;
  updatedBy: string;   // admin user id, for audit
}
```

Admin panel: one screen, per-stage dropdown, all four tiers, save â†’
writes to DB, `aiSuggestions.ts` reads current route at call time
(cache 5 min, don't hit DB every request).

Verified July 2026 pricing for the defaults:

| Tier | Model | $/1M in | $/1M out |
|---|---|---|---|
| Cheap | DeepSeek V4 Flash | 0.14 | 0.28 |
| Cheap (fallback) | Gemini 2.5 Flash-Lite | 0.10 | 0.40 |
| Standard | Claude Sonnet 4.6 | 3.00 | 15.00 |
| Standard (fallback) | GLM-5.2 | 1.40 | 4.40 |
| Premium | Claude Opus 4.8 | 5.00 | 25.00 |
| Fallback (any tier down) | Gemini 3.1 Pro | 2.00 | 12.00 |

Fallback rule: if primary provider errors or times out (>8s), retry
once on the fallback model for that tier before surfacing an error
to the user. Log every fallback event â€” a spike tells you a provider
is degraded before users complain.

---

## 3. Layer â€” Resume Quality Evaluator (was missing)

Runs at the end of Stage 4, one cheap-model call plus deterministic
checks. Output is a structured score, not prose:

```json
{
  "ats_score": 0-100,
  "human_score": 0-100,
  "grammar_score": 0-100,
  "trust_score": 0-100,
  "readability_score": 0-100,
  "keyword_match_pct": 0-100,
  "ai_probability": 0-100,
  "repetition_flags": ["..."],
  "hallucination_flags": ["..."],
  "formatting_flags": ["..."],
  "overall": 0-100
}
```

Rule: `overall < 70` â†’ automatic single regeneration of Stage 3 with
the flags fed back into the prompt ("previous draft scored low on
X because Y â€” fix specifically that"). Cap at 1 auto-retry to avoid
runaway cost; if still <70, surface to user for manual edit instead
of silently looping.

Store every score in a `resume_evaluations` table â€” this becomes
your prompt-improvement dataset (Â§7).

---

## 4. Layer â€” Recruiter Psychology Pass (was missing)

Not a separate agent â€” a scoring rubric applied during Stage 4
evaluation, since recruiters scan in seconds and hierarchy/first-
impression matters as much as word choice:

- **First 3 lines**: does the strongest, most specific claim appear
  before any generic statement? (Score: name/title/summary clarity)
- **Visual hierarchy**: is the highest-impact section (experience for
  senior, projects for freshers) placed and formatted to draw the
  eye first?
- **Trust signals**: specific numbers/tools/company names present vs.
  vague claims â€” flag any sentence with no concrete noun.
- **Confidence without exaggeration**: active voice ratio, no hedging
  language ("helped with", "assisted in") unless factually accurate.

This becomes 4 additional fields in the evaluator JSON above
(`hierarchy_score`, `trust_signal_count`, `confidence_score`,
`vague_claim_count`) rather than a new pipeline stage.

---

## 5. Layer â€” Human Editing Assistant (was missing)

This is the highest-trust-building feature and currently absent from
v1's flow. Add a review step between Stage 3 output and export:

```
AI writes (Stage 3)
   â†“
Show diff view: original facts vs AI rewrite, inline
   â†“
User edits directly in the preview (already have live editor)
   â†“
"Re-check with AI" button â†’ re-runs Stage 4 evaluator only
  (cheap, since Stage 3 isn't re-run unless user asks)
   â†“
User accepts â†’ export
```

Key UX rule: **never auto-replace text the user has manually edited**
on a subsequent AI pass. Track a per-field `userEdited: boolean` flag
so regeneration only touches AI-authored fields, never overwrites
human edits. This is a small addition to your existing resume JSON
schema (`server/routers.ts` / `shared/types.ts`) but is the single
biggest driver of user trust â€” people abandon tools that silently
overwrite their work.

---

## 6. Layer â€” Prompt Versioning (was missing)

Add a `prompt_versions` table:

```ts
interface PromptVersion {
  id: string;
  stage: 'extract' | 'target' | 'rewrite' | 'validate' | 'polish';
  version: number;
  promptText: string;
  createdAt: Date;
  isActive: boolean;
  metrics: {
    avgOverallScore: number;
    avgAtsScore: number;
    avgEditDistance: number;   // how much users change the output
    avgUserRating: number;
    sampleSize: number;
  };
}
```

Rule: never edit an active prompt in place. Create v(n+1), run it
against the test suite (Â§12) plus a 5% live traffic shadow, compare
`metrics`, then promote. This is what actually lets you improve
quality with data instead of vibes â€” and it's cheap to build since
you already have the DB layer.

---

## 7. Layer â€” Evaluation Dataset (was missing)

With consent (one line in ToS/privacy, opt-out toggle in settings),
log per resume:

- Which AI suggestions were accepted vs. deleted vs. edited
- Time spent editing after generation
- Template chosen
- Final `overall` score at export time
- Optional 1-5 satisfaction rating shown once after download

This feeds both Â§6 (prompt comparison) and product decisions (which
templates/sections people actually keep). Don't build a separate
analytics platform â€” this is a few columns on your existing
`resumes` table plus one event-log table, queryable from the CRM
panel you already have.

---

## 8. Layer â€” Design System (was missing / "build one template")

Agreed with the one-template-first approach â€” resist the urge to
ship 4 templates when 1 excellent one outperforms them. Keep your
existing 4 as archived/experimental, default new users into a single
flagship:

- White background, dark gray/black text, one accent color max
- ATS-safe fonts only (Arial, Calibri, or your existing Inter â€” verify
  Inter parses cleanly through common ATS text extractors, some
  older parsers choke on non-system fonts embedded in PDFs)
- No icons, no graphics, no tables for layout
- Section order â€” freshers: Name â†’ Contact â†’ Summary â†’ Skills â†’
  Projects â†’ Experience â†’ Education â†’ Certifications
- Section order â€” experienced: Name â†’ Summary â†’ Experience â†’
  Projects â†’ Skills â†’ Education â†’ Certifications
- Skills layout: <12 items = 1 column, 12â€“30 = 2 columns, 30+ = 3
  columns, always grouped by category not alphabetical

Add the other 3 templates back only after the evaluation dataset
(Â§7) shows real demand for them â€” not before.

---

## 9. Layer â€” AI Slop Detection, expanded (was word-list only)

The v1 banned-word list is necessary but not sufficient. Add
structural checks in Stage 4 (deterministic where possible, cheap-
model call only for the parts code can't catch):

Deterministic (regex/code, no LLM cost):
- Repeated sentence openers across bullets (e.g. 3+ bullets starting
  with the same verb)
- Duplicate bullets across sections
- Placeholder text patterns (`[Company Name]`, `TBD`, `Lorem`)
- Passive voice ratio above threshold (simple POS-tag heuristic)

Cheap-model call (one combined call, not per-check):
- Buzzword density beyond the ban list (context-dependent slop)
- Empty claims (states an outcome with no supporting specific)
- Cross-section repetition (same achievement phrased differently
  in Summary and Experience)

---

## 10. Layer â€” Accessibility (was missing)

Cheap to add, easy to skip, so make it a checklist not an
afterthought:
- Contrast ratio â‰¥ 4.5:1 for all text (check against your accent
  color choices in Â§8)
- Minimum 10pt body text in generated PDFs
- Logical heading tags in the underlying HTML before PDF conversion
  (h1 name, h2 section headers) â€” this also directly helps ATS
  parsing, so it's dual-purpose
- Verify PDF text layer is selectable/copyable (test: can you
  Ctrl+A and paste the PDF into a plain text editor and get clean
  text back â€” if not, ATS systems can't read it either)

---

## 11. Layer â€” Error Prevention / Hard Rejects (was missing)

Stage 4 must hard-fail (not just flag) generation if it detects:
- Any fact not traceable to Stage 1's extracted JSON (deterministic
  diff check)
- Missing required dates on experience entries
- Duplicate bullets (exact or near-duplicate, >90% similarity)
- Broken/incomplete formatting (unclosed sections, empty required
  fields)

Hard-fail means: don't show the user broken output â€” retry Stage 3
once automatically, and if it fails again, fall back to the
unmodified extracted facts with a "we couldn't improve this section,
here's your original text" message. Never show fabricated content,
even as a fallback.

---

## 12. Layer â€” Prompt Testing Suite (was missing)

Before promoting any prompt version (Â§6), run it against a fixed
set of synthetic test profiles and compare evaluator scores:

1. Fresher, no experience, strong English
2. Fresher, no experience, weak English
3. 2-year developer, India target
4. AI/ML engineer, strong portfolio
5. Gulf applicant, visa-sponsorship needed
6. Career switcher (non-tech â†’ tech)
7. 10+ years experience, senior/leadership
8. Long employment gap
9. Weak English throughout, factual content
10. Over-claimed original resume (tests hallucination suppression)

Store expected score ranges per profile. A prompt version that
regresses any profile below its baseline blocks promotion. This is
the actual "next level" quality assurance â€” not more agents, a real
regression test suite, same idea as your existing `*.test.ts` files
in `server/`.

---

## 13. What NOT to build (unchanged from v1, still true)

- 25 named agents â€” stays 5 stages with internal modules
- Custom orchestration frameworks (LangGraph/CrewAI) â€” your pipeline
  is linear with one bounded retry loop, a framework is overhead
- Full Razorpay + admin key UI â€” build after 20+ people would pay
- 4 templates live at launch â€” one flagship first (Â§8)

---

## 14. Build order (most leverage first)

1. Model routing table + config screen (Â§2) â€” unblocks everything else, ~1 day
2. Banned-word + structural slop detection in Stage 3/4 (Â§9) â€” highest quality/effort ratio
3. Evaluator scoring (Â§3) + hard-reject rules (Â§11) â€” stops bad output reaching users
4. Human editing loop with `userEdited` flag (Â§5) â€” biggest trust win
5. Prompt versioning table (Â§6) â€” needed before you start tuning prompts seriously
6. One-template design system default (Â§8)
7. Evaluation dataset logging (Â§7) â€” passive, add once the above is stable
8. Prompt testing suite (Â§12) â€” gate future changes with this from here on
9. Recruiter psychology scoring (Â§4) + accessibility checklist (Â§10) â€” polish once core loop is solid

Steps 1â€“4 alone would meaningfully raise output quality and trust
without touching agent count. Everything else compounds on top.

---

## Cursor scope-lock notes

- Files in scope: `server/aiSuggestions.ts`, `server/contentValidation.ts`,
  `shared/countriesData.ts`, `server/apiKeyManager.ts`, `shared/types.ts`,
  `drizzle/schema.ts` only (for new tables:
  `model_routing`, `resume_evaluations`, `prompt_versions`).
- New tables only for the four listed above â€” no new service
  directories, no new microservices.
- Every prompt or scoring-rubric change ships with before/after
  output on at least 3 of the 10 test profiles (Â§12) in the PR
  description.
- Do not touch template rendering, PDF export, or auth flows in the
  same PR as pipeline changes â€” keep diffs reviewable.
