# 2. PDF/DOCX Upload & Extraction

> Bring an existing resume, extract its structured sections with AI, show a proper
> **processing animation**, then hand off to the target-role portion.

**Status:** Implemented · **NEW:** full-screen extraction process window.

## Purpose
Lowest-friction entry: the user already has a resume, so HexaCV reads it and
structures it — with visible feedback that "real work" is happening.

## User flow
1. User drags a file onto the upload card, or clicks and picks one.
2. File is validated (`.pdf` / `.docx` / `.doc`), then base64-encoded and sent to
   `trpc.resume.parse`.
3. **NEW** A full-screen **ParseLoader** overlay plays 5 animated extraction steps.
4. On success the draft is saved and the user is routed to the **target-role portion** (`/builder/target`).
5. On failure the overlay closes and an inline error shows under the card.

## Implementation
| Piece | File | Detail |
|-------|------|--------|
| ParseLoader | `client/src/components/ParseLoader.tsx` | **NEW** — 5 timed steps (Reading → Contact → Experience/Education/Skills → ATS sections → Structuring), green checks, spinner on active, `Loader2`/`Check` icons |
| Upload card | `client/src/pages/Landing.tsx` | drag-drop + file input, "Most used" badge, validation, error text |
| Parse API | `server/routers.ts` → `resume.parse` | public procedure: `extractText` → `parseResumeWithLLM` |
| Draft store | `client/src/lib/entryDraft.ts` | `EntryDraft` saved to **sessionStorage** (`hexacv_entry_draft`) so it survives the targeting step |

## Key details
- The extraction window stays up for a **minimum of ~1.6s** so fast parses still feel
  like real processing; slow parses let the steps play out naturally.
- The parsed result (`name`, `sectionsFound`, `parsed`) flows into `Targeting` via
  `experienceDetails()` (reads `loadEntryDraft()`) and feeds the AI build.
- No account is required to upload — sign-in is deferred to the build step.

## New additions (this cycle)
- `ParseLoader` extraction window replaces the old single-line "Reading your file…" text.
- On success the flow now goes **straight to the target-role portion** (previously it
  paused at a draft card + region sheet; the region sheet was removed as redundant —
  region selection lives on the targeting screen).

## Edge cases
- Non-PDF/DOCX file → "Please upload a PDF or DOCX file."
- Scanned/image-only PDF → extraction error → "We couldn't read text from this PDF —
  try 'Start fresh' and paste it instead."
- Guest limit (3 local resumes) enforced later in the builder, not at parse.
