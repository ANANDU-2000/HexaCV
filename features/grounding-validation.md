# 5. Grounding & Validation

> The core differentiator: every AI rewrite is checked against the user's source, and
> anything untraceable is stripped or blocked — nothing invented.

**Status:** Implemented.

## Purpose
Job seekers (and the product's honesty promise) require that the AI never fabricates
metrics, titles, or achievements. Grounding enforces this at the pipeline and editor levels.

## User flow
- During the AI build, the **validate** stage double-checks each claim against the
  uploaded resume or pasted notes.
- In the editor, "AI Rewrite" for summary/bullets runs a merge that **protects
  user-edited lines** and blocks unsupported claims.
- The landing `GroundingProof` section demonstrates a before/after rewrite
  ("If it is not in your source, it does not stay").

## Implementation
| Piece | File | Detail |
|-------|------|--------|
| Server validation | `server/contentValidation.ts` (+ test) | rules that strip/flag untraceable claims |
| Pipeline validate stage | `server/ai/pipelineOrchestrator.ts` | applied after rewrite |
| Editor merge | `client/src/lib/userEditedMerge.ts` | `mergeSummaryAi`, `mergeBulletsAi`, `markBulletEdits` — keeps `*UserEdited` flags so manual edits are never clobbered by AI |
| Proof section | `client/src/components/landing/GroundingProof.tsx` | before (vague) → after (grounded) with `XCircle` / `CheckCircle2` |

## Key details
- **Pipeline validate** calls `validateGeneratedResume(resume, sourceText)` so invents,
  mismatches, and AI filler are stripped against the **uploaded document**, not only
  against a banned-phrase list.
- **User-edit protection:** when a summary or bullet was edited manually, an AI rewrite
  asks for confirmation ("Overwrite with AI?") and skips protected lines unless forced.
- **No invented metrics:** regional/ATS rules add tips, never fabricated percentages.
- **API keys:** all LLM calls use env keys — see [api-keys.md](api-keys.md).
- **Runtime failures:** unexpected errors append to `runtime-errors/` —
  see [runtime-error-reporting.md](runtime-error-reporting.md).

## Edge cases
- Manual edits + AI rewrite → protected lines preserved (blocked count shown).
- Education "Clean Fields" helper strips developer-talk that leaked into degree fields.
