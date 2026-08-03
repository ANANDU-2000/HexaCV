# 8. Export (PDF / Word)

> Download the finished resume as an ATS-friendly PDF and a Word file — both rendered
> from the same templates shown in the preview.

**Status:** Implemented.

## Purpose
"what you download matches what you reviewed" — export from the real preview engine,
in both formats job seekers need.

## User flow
1. In the editor's "Review & Export" step (or bottom-nav Export), click **Finish & Export**.
2. The completion modal shows the ATS match score, matched keywords, and two actions:
   **Download PDF Format** and **Download Word (DOCX)**.
3. Filename follows the convention `<Name>_<TargetRole>.pdf` / `.doc`.

## Implementation (`client/src/lib/pdfExport.ts`)
| Export | How | Notes |
|--------|-----|-------|
| **PDF** | `html2canvas` (scale 2) on a cloned, zoom-reset preview → `jsPDF` A4 | dynamic pagination algorithm inserts `.pdf-avoid-break` spacers so entries don't split across pages; fallback to `window.print()` on failure |
| **Word** | Word-HTML envelope (`application/msword`) wrapping the preview's inner HTML + MS Office CSS | matches the emerald single-column ATS template |
| Trigger | `ResumeEditor.handleExportPDF` / `handleExportDOCX` | uses the offscreen `exportPreviewRef` instance (`contentId="resume-pdf-content"`) |

## Key details
- The **offscreen export copy** of `ResumePreview` is non-interactive (no contextual-editor
  click handlers), at 100% zoom, on a hidden fixed container for stable html2canvas capture.
- Filename builder: `client/src/lib/exportFilename.ts`.

## Edge cases
- Canvas render fails → `window.print()` fallback.
- Multi-page resumes → pagination keeps `pdf-avoid-break` blocks intact (≤50 attempts).
- Export is **not** separately paywalled — payment gates the build itself (see
  [billing-credits.md](billing-credits.md)).
