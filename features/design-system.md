# 14. Design System

> The "Ledger" visual contract: warm paper + deep teal + terracotta, serif display type,
> mobile-first, and accessibility rules — plus the component library HexaCV follows.

**Status:** Implemented · **NEW:** floating-label fields, 44px tap targets.

## Tokens (`client/src/index.css`)
| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--ink` / `--paper` | `#1C1B18` / `#FBF8F3` | `#F5F2EB` / `#15130F` | text / page bg |
| `--primary` | `#123832` | `#7FBFA8` | deep teal — buttons, nav, active |
| `--accent` / `--accent-warm` | `#C5622A` | `#C5622A` | terracotta — Pay ₹99, money CTAs |
| `--success` / `--warning` / `--destructive` | `#3F7A54` / `#B8862E` / `#B3261E` | same | matched / validate / errors |
| `--border` | `#E4DFD3` | `#3A3428` | warm borders |
| `--radius` | `12px` | | generous radius (16–24px on cards) |

Typography: display = **Fraunces** (serif), body/UI = **Public Sans**; set `font-family`
explicitly on form controls.

## Component library
| Component | Spec | Status |
|-----------|------|--------|
| Primary CTA | accent bg, white text, min 44×44 | ✅ `bg-accent-warm text-white rounded-[18px]` |
| Secondary / Ghost | outline / transparent, primary/muted text | ✅ `Button variant="outline"` / `"ghost"` |
| Icon button | min 44×44, `aria-label` required | ✅ **NEW** — editor icon controls bumped to 44px |
| Text input | rounded, bordered, **floating label** | ✅ **NEW** `shared/ui/floating-field.tsx` (`FloatingLabelInput` / `FloatingLabelTextarea`) |
| Textarea | rounded, bordered, resizable | ✅ |
| File upload zone | dashed, drag-drop | ✅ (landing card + `ResumeUploader`) |
| Radio / checkbox | standard, themed | ✅ (region segmented control, checkboxes) |
| Icons | **lucide-react**, strokeWidth 1.75 | ✅ |
| Toasts / Tooltips | sonner / TooltipProvider | ✅ |
| Loaders | `PipelineLoader` + **NEW** `ParseLoader` | phased, real steps |

## Rules (from `DESIGN.md` / `docs/design/DESIGN_STRICT.md`)
- **Anti-slop:** no purple/indigo gradients, no blob/wave decorations, no fake ATS
  percentages, no stock "people-in-blazers" — the **resume preview itself is the hero visual**.
- **Honesty over spectacle:** trust strip uses verifiable claims only.
- One scroll container per page; icon-only controls ≥44px with `aria-label`; loading
  lives on the button for ordinary actions, full-screen loader only for the AI pipeline.

## Key details
- Floating-label fields are applied to the high-visibility inputs (landing paste,
  targeting role/JD, contextual editor); the dense editor wizard keeps static labels
  for space reasons.
- Motion: `animate-fade-slide-up` for sheets, **NEW** `animate-slide-in-right` for the
  contextual editor, `animate-marquee`, `text-shimmer`, etc.

## New additions (this cycle)
- `floating-field.tsx` — reusable floating-label input/textarea.
- `animate-slide-in-right` keyframe for the contextual editor slide-over.
- 44px minimums on global icon controls + mobile bottom nav in the editor.
