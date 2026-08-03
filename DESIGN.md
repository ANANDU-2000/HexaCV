# HexaCV — DESIGN.md (Visual Philosophy & System Tokens)

System-level design contract. Per-page layouts live in:

- `DESIGN_DESKTOP.md` (≥1024px)
- `DESIGN_MOBILE.md` (375–430px)
- `docs/design/DESIGN_STRICT.md` (scroll, breakpoints, icons, tap targets — still enforced)

---

## 1. Philosophy

HexaCV should feel like a **calm professional ledger**, not a generic AI SaaS landing page.

- Warm paper tones, deep teal primary, terracotta accent for money moments.
- Typography with personality (serif display) + clear UI sans — never Inter-everywhere.
- Honesty over spectacle: factual keyword match lists, real resume preview as hero, no fake ATS percentages.
- Copy tone: direct, specific, slightly understated.

---

## 2. Problem with the current build

`client/src/index.css` still uses stock Tailwind blues:

- Light: `--primary: #1e40af`
- Gradients: `#2563eb`
- Dark: lavender `#b8c4ff` with no relation to light brand

This reads as templated. Replace with the Ledger palette below — full token swap, not a tint.

---

## 3. Ledger palette

| Token | Hex | Use |
| --- | --- | --- |
| `--ink` | `#1C1B18` | Primary text / headings (warm near-black) |
| `--paper` | `#FBF8F3` | Page background |
| `--surface` | `#FFFFFF` | Cards |
| `--primary` | `#123832` | Deep teal — buttons, nav, sidebar active |
| `--primary-hover` | `#0D2B26` | Hover / active |
| `--accent` | `#C5622A` | Terracotta — Pay ₹99, Free badge, New Resume CTA |
| `--success` | `#3F7A54` | Matched keywords, payment success |
| `--warning` | `#B8862E` | Validate "please confirm" flags (not errors) |
| `--danger` | `#B3261E` | Real errors only |
| `--muted-text` | `#635F55` | Secondary copy, placeholders |
| `--border` | `#E4DFD3` | Warm borders |

### Dark mode (same hue family)

| Token | Hex |
| --- | --- |
| `--paper` | `#15130F` |
| `--surface` | `#1E1B15` |
| `--primary` | `#7FBFA8` |

Do not use generic slate-900 or lavender accents.

---

## 4. Typography

| Role | Family | Notes |
| --- | --- | --- |
| Display / headings | **Fraunces** (variable serif) | Weight 500–600; slight negative letter-spacing on H1 only |
| Body / UI | **Public Sans** | Fallbacks: `-apple-system, "Segoe UI", Roboto, sans-serif` |

Desktop sizes: H1 48/56, H2 32, H3 22, Body 16, Caption 13.  
Never introduce a third font family. Set `font-family` on form controls explicitly.

---

## 5. Anti-slop checklist (every screen)

- No purple/indigo gradients, blob/wave SVG decorations, or 3D robot illustrations.
- No sparkle (✨) as an "AI did something" stand-in — use the lucide-react outline icons already used across the app (strokeWidth 1.75).
- No fake-precision numbers ("98.7% ATS Score!") — use found / not-found keyword lists (PLAN.md §6).
- No stock photography of people-in-blazers — use the resume preview itself as the hero visual.
- Copy: "Built for the job you actually applied to" beats "Unlock Your Dream Career With The Power of AI".

---

## 6. Layout hard rules (summary — full text in DESIGN_STRICT)

1. **One scroll container per page** — no nested `overflow: auto/scroll`.
2. Desktop three-column / split layouts only ≥1024px; collapse below.
3. Icon-only controls: min 44×44px tap target; `aria-label` required.
4. Loading state lives on the button itself for ordinary actions; full-focus loader only for the AI pipeline wait.
5. Icons: lucide-react outline only — do not mix icon packs.

---

## 7. Component tokens (quick reference)

- Cards: `--surface` on `--paper`, border `--border`, radius generous (align with existing 16–24px patterns; prefer calm over glassy).
- Primary button: `--primary` / `--primary-hover`.
- Money / convert CTA: `--accent`.
- Flagged Validate lines: `--warning` amber marker on the line itself.

---

## 8. Where to implement

| Change | File |
| --- | --- |
| CSS tokens | `client/src/index.css` |
| Per-page desktop | `DESIGN_DESKTOP.md` + `client/src/pages/*.tsx` |
| Per-page mobile | `DESIGN_MOBILE.md` |
| Scroll/icon rules | `docs/design/DESIGN_STRICT.md` |
| Build tasks | `AGENT_TASKS.md` (cross-cutting + Landing) |
