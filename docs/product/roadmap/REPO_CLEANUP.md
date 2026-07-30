# HexaCV — REPO_CLEANUP.md (Folder & File Refactor Plan)

> **Status: completed.** This document describes the pre-cleanup mess
> and the target structure. The moves/deletes have been applied —
> see the live tree under `docs/` and `.cursor/rules/project.md`.
> Kept for history only.

Prepared for: Anandu / HexaStack Solutions
Grounded in the actual uploaded repo (`HexaCv-main.zip`) — this is
not a hypothetical mess, it's what's really at the root today. Every
item below is a real, verified finding, not a guess.

---

## 1. What's actually wrong at the root today (verified)

```
HexaCv-main/
├── ARCHITECTURE.md            ← 9 loose .md files at root, no /docs
├── BUILD_AND_DEPLOYMENT.md       folder — this is the "so many
├── DEPLOYMENT_GUIDE.md           files" problem, concretely
├── DESIGN_AND_PROMPTS.md
├── DOCUMENTATION.md
├── PRODUCTION_CHECKLIST.md
├── README.md
├── TEMPLATE_REFERENCE.md
├── USER_GUIDE.md
├── AI_PROMPT_GUIDE.md
├── todo.md
├── ResumeTemplate.tsx          ← a React component sitting at repo
├── ResumeTemplate.types.ts       root, outside client/src entirely
├── Resume_Template.docx        ← a Word file at repo root
├── template.json               ← 15KB, unclear if used or reference
├── prisma/                     ← schema.prisma + seed.ts exist, but
│                                  ZERO files in server/shared/client
│                                  import PrismaClient anywhere —
│                                  this is dead weight, Drizzle is
│                                  the actual ORM in use
├── drizzle/                    ← the real, active ORM
├── stitch-assets/              ← design system + HTML mockups
├── stitch_assets/               (hyphen)
│   ├── code/                  ← a SECOND, differently-named folder
│   └── screenshots/              (underscore) — easy to confuse,
│                                  easy for an agent to write to the
│                                  wrong one
├── references/                 ← Manus SDK reference docs (fine,
│                                  keep as-is, this one's not a mess)
└── package-lock.json AND       ← both lockfiles present — pnpm is
    pnpm-lock.yaml                 what CI actually uses
                                    (`pnpm/action-setup` in
                                    deploy.yml), npm's lockfile is
                                    stale drift risk
```

## 2. Target structure

```
HexaCv-main/
├── README.md                   ← only doc file at root; short,
│                                  points into docs/
├── docs/
│   ├── README.md                ← index — reading order, what's
│   │                               current vs. historical (see
│   │                               HexaCV_START_HERE.md's index)
│   ├── architecture/
│   │   ├── ARCHITECTURE.md      ← the as-built doc (merge the repo's
│   │   │                           existing ARCHITECTURE.md +
│   │   │                           HexaCV_ARCHITECTURE.md into one —
│   │   │                           don't keep two files with the
│   │   │                           same name meaning different things)
│   │   └── DATA_MODEL.md        ← schema reference (from DOCUMENTATION.md
│   │                               if that's what it mostly covers)
│   ├── product/
│   │   ├── roadmap/             ← HexaCV_V2_ROADMAP_v1.md, V2, V3,
│   │   │                           V4, V5, V6_* — move all of them
│   │   │                           here as-is, add docs/product/
│   │   │                           roadmap/README.md noting v1 is
│   │   │                           superseded-but-referenced by v2
│   │   └── USER_FLOW.md         ← HexaCV_USER_FLOW.md
│   ├── design/
│   │   ├── DESIGN_STRICT.md     ← HexaCV_V6_DESIGN_STRICT.md
│   │   ├── WIREFRAMES.md        ← merge V5_PAGE_BY_PAGE_SPEC.md +
│   │   │                           V6_WIREFRAMES.md into one file,
│   │   │                           don't keep the "old pages" /
│   │   │                           "new pages" split as two files
│   │   └── PAGE_TECH_SYNOPSIS.md
│   ├── ops/
│   │   ├── BUILD_AND_DEPLOYMENT.md
│   │   ├── DEPLOYMENT_GUIDE.md   ← if this substantially overlaps
│   │   │                           BUILD_AND_DEPLOYMENT.md, merge
│   │   │                           into one file, don't keep both
│   │   ├── PRODUCTION_CHECKLIST.md
│   │   └── CI_CD.md              ← new, see HexaCV_CI_CD.md
│   ├── ai/
│   │   ├── AI_PROMPT_GUIDE.md
│   │   └── PROMPT_AND_FEEDBACK_RULES.md ← HexaCV_V6_PROMPT_AND_FEEDBACK_RULES.md
│   ├── payments/
│   │   └── PAYMENTS_LEGAL_REFERRAL.md
│   ├── qa/
│   │   └── EDGE_CASES_QA.md
│   ├── tasks/
│   │   ├── MASTER_TASKS.md       ← HexaCV_V6_AGENT_AND_MASTER_TASKS.md
│   │   └── TASK_PROMPTS.md
│   └── user/
│       └── USER_GUIDE.md
├── .cursor/
│   └── rules/
│       └── project.md           ← HexaCV_CURSOR_RULES.md — the one
│                                    file every Cursor session should
│                                    always load, per Cursor's own
│                                    project-rules convention
├── client/                      ← unchanged
├── server/                      ← unchanged
├── shared/                      ← unchanged
├── drizzle/                     ← unchanged, the only ORM going forward
├── stitch-assets/                ← keep ONE of the two — see §3
├── .github/workflows/            ← see HexaCV_CI_CD.md
└── (root) package.json, tsconfig.json, vite.config.ts, etc. — unchanged
```

## 3. Concrete deletions/merges (do these first, before any V6 feature work)

| Action | Item | Why |
|---|---|---|
| Delete | `prisma/` folder entirely | Zero imports of `PrismaClient` anywhere in `server/`, `shared/`, or `client/` — confirmed by grep. Drizzle is the only ORM actually wired to the app. Keeping both is exactly the ambiguity V4's own Ground Rule E1 warned about ("pick whichever your active DB layer is — don't maintain both") — this resolves that decision: Drizzle wins, Prisma goes. |
| Delete | `package-lock.json` | CI (`deploy.yml`) uses `pnpm/action-setup` — npm's lockfile isn't what's actually driving installs and will silently drift out of sync with `pnpm-lock.yaml`. |
| Merge or rename | `stitch-assets/` + `stitch_assets/` | Two differently-named, easily-confused folders. `stitch-assets/` (hyphen) holds the design system + HTML mockups actually referenced in V5's page spec (`stitch-assets/hexacv_landing_page.html`, etc.) — keep that name, that's the one the docs already point to. Move `stitch_assets/code` and `stitch_assets/screenshots` inside it (`stitch-assets/code/`, `stitch-assets/screenshots/`), then delete the underscore folder. |
| Move | `ResumeTemplate.tsx`, `ResumeTemplate.types.ts` | Into `client/src/components/templates/` (or wherever other template components live) — a component file has no reason to sit at repo root. |
| Move or archive | `Resume_Template.docx`, `template.json` | Into `references/` if they're reference material for the template system, or `docs/design/assets/` — either way, not the bare repo root. |
| Investigate before moving | `DOCUMENTATION.md`, `DEPLOYMENT_GUIDE.md` | These likely overlap with `ARCHITECTURE.md`/`BUILD_AND_DEPLOYMENT.md` respectively — read both pairs side by side before merging; don't merge blind, but don't leave four files answering two questions either. |

## 4. Rule going forward (add to CURSOR_RULES.md too)

**No new top-level `.md` file at repo root, ever, after this cleanup.**
Every new planning/spec doc goes into the matching `docs/` subfolder
from §2. `README.md` at root stays short and links into `docs/`. This
one rule is what stops the "so many folders and files" problem from
recurring in 3 months.

---

## Cursor scope-lock notes
- This is a file-move + delete task, not a code-logic task — do it
  as its own PR, before starting any V6 feature work, so feature
  diffs aren't reviewed against a moving-target folder structure.
- After moving, grep the whole repo for any relative import or doc
  link pointing at old paths (`stitch_assets/`, root-level
  `ResumeTemplate`) and fix them in the same PR — a folder move that
  breaks an import is worse than the mess it was meant to fix.
- Do NOT delete `prisma/` and `drizzle/` in the same PR as any
  schema change — this PR only removes the unused `prisma/` folder,
  it does not touch `drizzle/schema.ts`.
