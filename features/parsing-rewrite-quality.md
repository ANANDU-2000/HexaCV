# Parsing & Rewrite Quality

> Hard guarantees on what goes into a resume: **only genuine content from the source,
> no duplicates, no mismatches, no AI-invented words or sentences.** Rewrites target
> the job title + target role, and the target role is **auto-detected from the upload.**

**Status:** Implemented · **NEW:** auto-detected target role prefilled into targeting.

## Guarantees (parse → rewrite → validate)

### 1. Genuine content only — nothing invented
- Parse prompt (`server/fileParser.ts` → `parseResumeWithLLM`): "GENUINE CONTENT ONLY —
  never invent achievements, metrics, or duties" · "EMPTY OVER INVENTED".
- Rewrite pipeline (`server/ai/pipelineOrchestrator.ts` → `stageRewrite`): "Use ONLY facts
  from the Extract JSON … never invent skills."
- Grounding (edit-time rewrites): `filterGroundedRewrite` / `filterGroundedBullets` reject
  output that doesn't overlap the original (min-overlap), and reject known AI-filler
  phrases (`isAiGeneratedPhrase`).

### 2. No duplicates
- LLM is instructed to dedupe, and a **deterministic** `deduplicateParsedResume`
  (`fileParser.ts`) runs after — skills deduped per category via `Set`, links normalized.

### 3. No mismatches
- `validateParsedAgainstSource` (`fileParser.ts`) grounds every field against the source
  text: email (0.9 overlap), phone (digit match), name (part match), summary (0.45),
  skills (0.6), experience bullets (0.45), project/education fields — empties anything
  untraceable or placeholder (`isPlaceholderText`).

### 4. No AI-created words / sentences
- `server/contentValidation.ts` bans a curated list of filler phrases (`AI_GENERATED_PHRASES`).
- The full build is gated by **C3 deterministic evaluation** (`evaluateRewriteDeterministic`):
  score = content 40% + grounding 40% + banned-filler 20%; fails below 70, no real content,
  or any banned phrase → **one retry with feedback, then hard fail** (no credit used).

### 5. Rewrite based on job title + target role
- `stageTarget` extracts keywords/must-haves from the **job title + JD**; `stageRewrite`
  uses `Extract` facts + `Target` profile and is instructed to incorporate target keywords
  only where they match existing experience.
- Edit-time rewrites (`rewriteBulletsViaPipeline`, `rewriteSummaryViaPipeline`) pass both
  `jobTitle` and `targetRole` and explicitly forbid adding facts.

## Auto-detected target role (**NEW**)

The parse already extracts `header.jobTitle` (current/most recent) and
`header.targetRole` (from objective/summary/headline). **NEW:** after a PDF/DOCX upload,
the landing page writes the detected role into the targeting prefill
(`hexacv_target_panel_draft`), so `/builder/target` opens with the role already filled —
the user just confirms or edits it, and the rewrite targets that role automatically.

- Files: `client/src/pages/Landing.tsx` (detection + prefill write), `client/src/pages/Targeting.tsx` (loads it).

## API key usage

- All LLM calls go through `server/usageTracker.ts` → `trackedInvokeLLM` with tiered
  providers from `server/apiKeyManager.ts` (cheap → rewrite → premium failover per stage).
- Parse/extract use cheap tier; rewrite uses rewrite tier; no hardcoded keys in client.
- Keys come from env (`OPENROUTER_API_KEY`, `OPENAI_API_KEY`, etc.) — see `.env.example`.

## Files
| Concern | File |
|---------|------|
| Parse + dedupe + validate vs source | `server/fileParser.ts` |
| Banned filler / grounding helpers | `server/contentValidation.ts` |
| Extract→Target→Rewrite→Validate→C3 | `server/ai/pipelineOrchestrator.ts` |
| Grounding rules for rewrites | `server/ai/grounding.ts` |
| Auto-detect target role (client) | `client/src/pages/Landing.tsx` |

## Edge cases
- Scanned/image-only PDF → no text → error + "try Start fresh".
- LLM outputs banned filler → stripped by validation; if rewrite still fails C3 → build
  fails with feedback (credit released).
- Empty source → no usable content → build fails with guidance.
- Education field with project-talk → cleaned to degree field of study.
