# 7. Contextual Editor

> **NEW** — click any section in the live resume preview and a slide-out editor opens
> right there: inline editing, AI rewrite, and a regional tip.

**Status:** New (this cycle).

## Purpose
The synopsis's "contextual editor": instead of switching to a far-away wizard tab, the
user edits the exact section they're looking at in the preview — lower friction, fewer
lost edits.

## User flow
1. In the editor, hover a preview section → an "Edit" pill appears; click it.
2. A right slide-over opens (`animate-slide-in-right`) with the section's editing surface.
3. Edit inline (saves automatically through the normal debounced autosave); run
   "AI Rewrite" for summary/experience bullets; read the regional **AI Tip**.
4. Use "Open in full editor" to jump to the corresponding wizard tab.

## Implementation
| Piece | File | Detail |
|-------|------|--------|
| Slide-over | `client/src/components/ContextualEditor.tsx` | **NEW** — summary / skills / experience surfaces; default fallback links to the full editor |
| Clickable preview | `client/src/components/ResumePreview.tsx` | **NEW** `onSectionSelect` prop; `SectionShell` wraps each rendered section (hover ring + Edit pill, keyboard accessible); the offscreen PDF-export copy stays non-interactive |
| Wiring | `client/src/components/ResumeEditor.tsx` | `handleSectionSelect` sets `contextualSection` + mirrors the wizard tab; renders `<ContextualEditor>` with `updateSection`, `handleRewriteSummary`, `handleRewriteExperienceBullets` |
| Regional tip | reads `hexacv_target_panel_draft` market | Gulf: "mention visa status only if you supplied it"; India: "keep structure clear & grounded" |

## Key details
- Edits reuse the existing `updateSection` + `markBulletEdits` logic, so AI-rewrite
  protection applies here too.
- Experience editing: position chips to pick which role; bullets textarea (one per line).
- Skills editing: category + comma-separated skills, add/remove groups.

## Edge cases
- Empty experience → inline "add positions in the full editor" message.
- Mobile preview tap → the slide-over opens full-height (same component).
- Edit-protected lines → AI rewrite respects user edits (shared merge logic).
