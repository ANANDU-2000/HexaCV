# 6. Resume Editor

> The builder workspace: live split-screen (editor steps + real preview), guided
> section wizard, AI rewrite with edit-protection, ATS score, and export.

**Status:** Implemented · **NEW:** 44px tap targets on icon controls.

## Purpose
Let the user review and refine the AI output (or build from scratch) with a
what-you-see-is-what-you-get live preview, then export.

## User flow
1. Open a resume (`/builder` → mode → editor, or `/builder/ai?fromPipeline=1`).
2. Work through the stepper: **Header → Summary → Skills → Experience → Projects →
   Education → More → Review & Export → Live Preview** (horizontal stepper, scrollable).
3. Live preview (desktop right column / mobile tab) updates as you edit; zoom controls included.
4. Use "Rewrite with AI" per summary/bullets; manual edits are protected.
5. Finish → **Download PDF / Word** (see [export.md](export.md)).

## Implementation
| Piece | File | Detail |
|-------|------|--------|
| Editor | `client/src/components/ResumeEditor.tsx` | split grid, stepper, per-section tabs, undo/redo history, autosave (1.5s debounce), ATS score widget, export modal, mobile bottom nav |
| Preview | `client/src/components/ResumePreview.tsx` | renders the A4 page from `templates`; **clickable sections** when `onSectionSelect` is passed (drives the contextual editor) |
| Templates | `client/src/lib/templates.ts`, `shared/types` | e.g. `classic-ats-blue`, `minimal-executive`, `technical-compact` |
| Sections | `client/src/lib/resumeSections.ts` | ensures all 10 standard sections exist |
| AI rewrite | `trpc.ai.improveSummary` / `improveBullets` + `lib/userEditedMerge.ts` | grounded, edit-protected |
| ATS score | computed in `ResumeEditor` (`getResumeTextContent` + `calculateATSScore`) | keyword match + completeness + readability + regional rules |

## Key details
- **Split-screen** (desktop): editor left, `ResumePreview` right; **mobile**: bottom nav
  (Layout / Editor / Preview / Export) with the preview auto-scaled to ~42%.
- **Contextual editor**: clicking a section in the live preview opens a slide-out —
  see [contextual-editor.md](contextual-editor.md).
- Autosave + undo/redo history; guest drafts persist to `localStorage`
  (`hexacv_local_resumes`, max 3 for guests).
- **NEW:** icon-only controls (undo/redo, zoom, move/delete, stepper chevrons, mobile nav)
  now meet the 44px minimum tap target.

## Edge cases
- Empty required fields → stepper checkmarks reflect completion.
- AI rewrite with protected edits → blocked/protected feedback via toast.
- Phone/ZIP/URL format validation → inline errors (see [regional-ats.md](regional-ats.md)).
