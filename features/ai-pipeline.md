# 4. AI Resume Pipeline

> The multi-stage LLM build: extract → target → rewrite → validate → polish, surfaced
> through a phased "Emotional Loader" so the user sees real steps, not a slogan.

**Status:** Implemented.

## Purpose
Generate a complete, ATS-tailored resume from the entry draft + targeting inputs,
while visibly progressing through honest stages and protecting against invented claims.

## User flow
1. `runPipeline()` creates a build row (`resume.startBuild`) and calls `ai.generateFullResume`.
2. **PipelineLoader** renders a full-screen phased loader with per-stage icons.
3. On success the result is stashed in `sessionStorage` (`hexacv_pipeline_result`)
   and the app routes to `/builder/ai?fromPipeline=1`, where `ResumeBuilder`
   consumes it and opens the editor.
4. On failure: loader shows the error + "Try again" (no credit charged).

## Implementation
| Piece | File | Detail |
|-------|------|--------|
| Loader | `client/src/components/PipelineLoader.tsx` | phases: **extract** (Search) → **target** (Crosshair, interpolates `{role}`/`{region}`) → **rewrite** (Pencil) → **validate** (ShieldCheck) → **polish** (LayoutTemplate); polls `resume.buildStatus` every 1s |
| Orchestrator | `server/ai/pipelineOrchestrator.ts` | runs the stages server-side, updates `builds.stage` |
| Router | `server/routers.ts` → `resume.startBuild`, `resume.buildStatus`, `ai.generateFullResume` | |
| Credits | `server/credits.ts` → `consumeBuildCredit` / `releaseBuildCredit` | 1 credit per build; released if generation fails |
| Builds ledger | `server/credits.ts` (`createBuild`, `updateBuildStage`, `getBuild`) | stage tracking + idempotent credit consume per build |

## Key details
- **Real steps, not a spinner with a slogan** — each phase maps to an actual pipeline stage.
- Grounding runs inside the pipeline (validate phase) — see
  [grounding-validation.md](grounding-validation.md).
- Model/provider selection is tiered (`server/apiKeyManager.ts`): cheap → rewrite → premium.
- Failure is surfaced honestly; no credit is used when a build fails.

## Edge cases
- `PAYMENT_REQUIRED` mid-flow → toast + returns to payment.
- Stage never reaches `done` → retry button; loader stops polling at `done`/`failed`.
- Result consumption missing → `ResumeBuilder` warns and stays on the builder home.
