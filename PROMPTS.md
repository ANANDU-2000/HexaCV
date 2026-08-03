# HexaCV — PROMPTS.md (Grounded AI Prompt Library)

Companion to `PLAN.md` §5, `LOGIC.md`, and `docs/ai/AI_PROMPT_GUIDE.md`.  
**Source of truth in code:** `server/ai/grounding.ts`, `server/promptVersions.ts`, `server/ai/pipelineOrchestrator.ts`.

Never loosen grounding rules to get more "impressive-sounding" output. A single fabricated metric or job title is a real failure mode for the user.

---

## 1. Non-negotiable grounding (copy into every phase)

Canonical strings live in `server/ai/grounding.ts` — do not duplicate elsewhere.

### Full-resume / generate (`AI_GROUNDING_RULES`)

1. ONLY use facts from the provided source / extract. Do NOT invent achievements, metrics, companies, degrees, tools, or responsibilities.
2. Preserve company names, dates, technologies, and numbers exactly as stated.
3. Do NOT use generic AI filler phrases (e.g. "results-driven", "synergy", "leveraged", "spearheaded").
4. Tailor wording to the job title and target profile, but never fabricate experience.
5. If a section has no grounded facts, use empty string or empty array.
6. Return empty strings or empty arrays rather than inventing placeholder content.

### Section rewrite (`STRICT_REWRITE_RULES`)

Same as above, plus:

- Do NOT add new bullet points — same count, same underlying facts.
- If a bullet cannot be improved without inventing facts, return it nearly unchanged.
- NEVER add skills, experiences, education, or sentences that are not in the source material.

### Parse / extract (`EXTRACT_PARSE_RULES`)

> GENUINE CONTENT ONLY — never invent achievements, metrics, or duties. NO HALLUCINATIONS — empty string/array beats a fabricated field. EMPTY OVER INVENTED. Preserve names/dates/titles exactly as stated.

---

## 2. Five-phase prompt contract (PLAN.md §5)

Loader copy shown to the user must stay literal (no emoji, no "AI magic"). Phase prompts below are the engineering contract; UI strings are in PLAN.md §5.

| Phase | Stage key | Intent | Temp guidance | Output |
| --- | --- | --- | --- | --- |
| **Extract** | `extract` | Parse upload/paste into structured JSON facts | 0.1 | Strict JSON schema (`parsed_resume`) |
| **Target** | `target` | Cross-reference Role + JD + Region; keyword priority list | 0.2 | Target profile keywords + region rules |
| **Rewrite** | `rewrite` | One structured rewrite using extract + target keywords | 0.2–0.3 | Resume JSON; active body from `prompt_versions` |
| **Validate** | (deterministic) | Diff original vs rewrite; flag new entities/numbers | n/a | Flags for Review amber markers |
| **Polish** | `polish` | Template formatting pass | TBD | **Not built yet** (see `docs/ai/PIPELINE.md`) |

### Default rewrite body (seeded in `promptVersions.ts`)

```
{AI_GROUNDING_RULES}
Generate a professional resume JSON matching the schema.
Use ONLY facts from the Extract JSON. Use Target keywords to prioritize wording — never invent skills.
Return only the JSON object.
```

**Versioning rule:** Never mutate an active prompt body — insert a new version and promote (`promptVersions.insertPromptVersion` + promote). Silent prompt drift is forbidden.

---

## 3. Phase prompt skeletons (for implementers)

### Extract

```
{EXTRACT_PARSE_RULES}
Parse the following resume source into the JSON schema.
Source text:
---
{sourceText}
---
Return only the JSON object.
```

### Target

```
Given the Extract JSON, target role "{role}", region "{region}", and optional JD:
---
{jobDescription}
---
Produce a target profile: ranked keywords from the JD that ALSO appear (or have close synonyms) in the extract.
Do not invent skills the candidate does not have.
Region formatting notes:
- India: standard ATS structure, keyword clarity
- Gulf: detailed experience, relocation/visa readiness fields when present in source
- Ireland: achievement-based; omit DOB/photo unless user supplied and region policy allows
Return structured JSON only.
```

> Region list is **BLOCKED (PLAN §10)** — confirm before hardcoding Ireland vs Kerala/Gulf-only.

### Rewrite

Use active `prompt_versions` row for stage `rewrite` (prepend `AI_GROUNDING_RULES` if missing). Pass Extract JSON + Target keywords. Temperature ≤ 0.3.

### Validate (no LLM — deterministic)

Use `server/contentValidation.ts`:

- `validateGeneratedResume` / `filterGroundedRewrite` / `filterGroundedBullets`
- `evaluateRewriteDeterministic` + one Rewrite retry on fail
- `isAiGeneratedPhrase` / `AI_GENERATED_PHRASES` — strip or flag fluff
- Unknown companies, dates, degrees, numbers → flag for user confirmation on Review (amber), never silently drop or keep

### Polish (future)

Premium/formatting pass into chosen template. Do not invent content. Template count at launch is **BLOCKED (PLAN §10)**.

---

## 4. Section AI-assist prompts (post-build)

Used by "Ask AI to improve this section" (PLAN.md §7). Always prepend `STRICT_REWRITE_RULES`.

| Action | Temp | Rules |
| --- | --- | --- |
| Improve bullets | 0.2 | Same bullet count; JD keywords only if grounded |
| Improve summary | 0.2 | No new employers/metrics |
| Improve projects | 0.2 | Preserve tech list from source |

Consume AI-assist credits per PLAN §7 — included free count and top-up price are **BLOCKED (§10)**.

---

## 5. Banned filler (must not appear in output)

Aligned with `AI_GENERATED_PHRASES` in `contentValidation.ts` (non-exhaustive):

- results-driven / highly motivated / proven track record / synergy / spearheaded / leveraged
- thought leader / game-changer / rockstar / ninja / guru
- placeholder employers ("Tech Solutions Corp", "State University of Technology", "Professional Candidate")
- Fake awards ("Employee of the Quarter") unless present in source

---

## 6. Schema and provider notes

From `docs/ai/AI_PROMPT_GUIDE.md`:

- Strict JSON schema is reliable on OpenAI / Gemini / Grok; test before relying on it via OpenRouter.
- Schema-critical calls (full generate, parse): pin to a known-good model (`gpt-4o` path where required).
- Rewrite tasks: low temperature (0.1–0.3). Generation-only marketing copy (cover letter etc.): 0.5–0.7 — still must not invent resume facts.

---

## 7. Loader copy (UI — do not paraphrase into slogans)

| Phase | User-facing text |
| --- | --- |
| Extract | "Reading your experience…" |
| Target | "Matching this to [Role] roles in [Region]…" |
| Rewrite | "Sharpening how you describe your work…" |
| Validate | "Double-checking nothing got made up…" |
| Polish | "Fitting it to the page…" |

On Validate flag: "We reworded this but couldn't confirm the number — check it's right."
