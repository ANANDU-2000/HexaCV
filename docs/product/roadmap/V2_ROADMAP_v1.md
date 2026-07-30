# HexaCV v2 — Reality-Checked Roadmap
Prepared for: Anandu / HexaStack Solutions
Scope: Fix why v1 got no users + a lean AI pipeline (not 25 agents)

---

## 0. Read this before writing any code

You already built most of what the "30-agent" plan described:
guest mode, cloud migration, resume upload/parse (PDF/DOCX/TXT),
zero-fabrication parsing, JD-targeted AI rewrite, 4 ATS templates,
PDF export, PWA, admin CRM + analytics. It's in `todo.md`, all
checked off.

So "no one needed it" is almost certainly one of these, not a
missing-feature problem:

1. **Nobody saw it.** Zero marketing = zero users, regardless of
   quality. Check: how many real visitors did it get? Where was it
   posted — LinkedIn, Reddit r/developersIndia, r/GetEmployed,
   college WhatsApp groups, Gulf jobseeker FB groups?
2. **Trust/credibility gap.** A resume tool from an unknown brand
   competes with Rezi, Kickresume, Teal, Novoresume — all with
   years of SEO and reviews. Free + unknown loses to free + trusted.
3. **The output wasn't actually better.** If the AI rewrite still
   sounded like AI (which your notes admit — "ai slop", generic
   grammar), users bounce after one try and don't come back.
4. **No reason to return.** One-time resume generation has no
   retention loop unless tied to job tracking, applications, or a
   recurring need.

**Before adding a single new agent:** get 15–20 real target users
(Kerala IT freshers + 5 Gulf jobseekers) to actually use v1, watch
where they drop off, and ask what they'd pay for. That data is worth
more than any architecture. If you skip this, v2 can fail exactly
like v1 — just with better prompts.

---

## 1. Lean AI pipeline (5 stages, not 25 agents)

Every extra agent = extra API call = extra latency = extra $ = extra
failure point. Merge responsibilities into stages that map to files
you already have.

```
Stage 1 — EXTRACT (cheap model, JSON only)
  Input: raw resume text / user form
  Output: strict JSON (facts only, no rewriting)
  File: server/fileParser.ts (already does this)
  Model: DeepSeek V4 Flash or Gemini 2.5 Flash-Lite (~$0.10/1M in)

Stage 2 — TARGET (cheap model, JSON only)
  Input: JD text + country (India/UAE/Saudi/Qatar/etc.)
  Output: { required_skills[], keywords[], country_rules{} }
  File: server/countryRoutes.ts + shared/countriesData.ts (exist)
  Model: same cheap tier

Stage 3 — REWRITE (mid model, one call per section, not per bullet)
  Input: extracted facts + target keywords
  Output: rewritten summary/experience bullets, STAR/impact phrasing,
          country rules applied (no photo/visa for India, etc.)
  File: server/aiSuggestions.ts (exists — this is your core IP)
  Model: Gemini 3.1 Pro or Claude Sonnet ($2-3/$12-15)
  Rule embedded in prompt: ban list of AI-slop words (see §3)

Stage 4 — VALIDATE (cheap model + deterministic code, not another LLM agent)
  - Fact-check: every name/date/number must exist in Stage 1 JSON
    (deterministic diff, not an LLM call — cheaper and more reliable)
  - ATS check: keyword coverage %, section order, no tables/columns/
    icons in the parsed text layer
  File: server/contentValidation.ts (exists — extend, don't replace)

Stage 5 — POLISH (premium model, ONE call, paid plan only)
  Final human-tone pass + slop removal in a single pass
  Model: Claude Opus, only gated behind paid tier
  Free tier stops after Stage 4.
```

Total for a free-tier resume: 3 cheap calls + 1 mid call ≈ **$0.02–0.05**.
Paid tier adds one premium call ≈ **$0.08–0.15** total. Both are
already inside the target you wrote ("<$0.10 standard plan").

---

## 2. Model routing table (verified July 2026 pricing)

| Stage | Model | $ /1M in | $ /1M out | Why |
|---|---|---|---|---|
| Extract / Target (JSON) | DeepSeek V4 Flash | 0.14 | 0.28 | cheapest capable JSON model |
| Extract / Target (fallback) | Gemini 2.5 Flash-Lite | 0.10 | 0.40 | fast, multimodal if scanning images |
| Rewrite | Claude Sonnet 4.6 | 3.00 | 15.00 | best quality/cost for prose rewriting |
| Rewrite (budget mode) | GLM-5.2 | 1.40 | 4.40 | mid-tier fallback |
| Validate | rule-based code + DeepSeek Flash spot-check | — | — | don't pay LLM prices for regex-shaped checks |
| Polish (paid tier only) | Claude Opus 4.8 | 5.00 | 25.00 | one call, not a whole pipeline |

Use OpenRouter (already in your `.env.example`) as the router so
swapping cheap-tier models later is a config change, not a
code change.

---

## 3. The actual differentiator: banned-word + tone rules

This is where your effort should go, not agent count. One well-tuned
prompt in `aiSuggestions.ts` beats 10 loosely-defined agents.

**Hard-ban list** (reject/rewrite if found): "passionate", "dynamic",
"results-driven", "highly motivated", "leverage", "utilized",
"responsible for", "dedicated professional", "team player",
"go-getter", "synergy", "seamlessly", "robust" (as filler),
"cutting-edge" (unless literal), any sentence starting with "As a...".

**Structural rule:** every bullet must follow
`[Action verb] + [what you did] + [measurable/contextual result]`.
If no measurable result exists in the source facts, keep it factual
and specific rather than inventing a number — never let the model
insert "increased efficiency by 30%" if that number isn't in the
user's input.

**Country rule engine** (`countriesData.ts` already has the shape —
extend it): India = no photo/passport/visa/marital status/religion,
1 page for <3 yrs exp. Gulf = photo/visa/nationality/notice period
configurable per employer type, not always-on.

---

## 4. What NOT to build right now

- 25 named agents — merge into the 5 stages above.
- Custom CRM from scratch — you already have one; extend it, don't
  rebuild.
- Multi-model orchestration frameworks (LangGraph/CrewAI) — your
  pipeline is linear with one validation loop; a framework adds
  overhead you don't need yet at this scale.
- Razorpay + full admin key-management UI — build this only after
  you have 20+ people who'd actually pay. Otherwise it's weeks of
  work protecting revenue that doesn't exist yet.

## 5. What to actually do this week

1. Ship v1 (as-is) to 15-20 real people. Watch, don't ask leading
   questions.
2. Fix Stage 3 prompt with the banned-word list above — this is a
   30-minute change with outsized impact on perceived quality.
3. Post it in 3 real places (LinkedIn post from your own account,
   1 relevant subreddit, 1 Kerala/Gulf jobseeker WhatsApp/FB group)
   and track signups per channel.
4. Only after that: decide if the bottleneck was quality (→ tune
   Stage 3/5) or distribution (→ no amount of agents fixes this).

---

## Cursor scope-lock notes (for when you're ready to implement)

- Touch only: `server/aiSuggestions.ts`, `server/contentValidation.ts`,
  `shared/countriesData.ts`, `server/apiKeyManager.ts`.
- Do not introduce new agent files/folders per stage — keep the 5
  stages as functions within existing files unless a file exceeds
  ~400 lines, then split.
- Every prompt change ships with a before/after sample resume in the
  PR description so quality regressions are visible in review.
