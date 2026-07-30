# HexaCv Product Requirements Document (PRD)

## Project Overview
HexaCv is a high-performance, full-stack PWA resume builder branded under **HexaStack Solutions**. It enables users to create ATS-optimized resumes through smart parsing (PDF/DOCX) or a structured step-by-step builder.

## Core Features
1. **Smart Parsing**: Client-side extraction from PDF, DOCX, and TXT files (<5MB).
2. **Multi-Step Builder**: Intuitive form flow from Header to Certifications.
3. **Live Editor**: Three-panel layout (desktop) with collapsible sections and real-time preview.
4. **Job Alignment**: Keyword extraction and match scoring against 8 preset roles or custom descriptions.
5. **PDF Export**: Client-side PDF generation using jsPDF and html2canvas.
6. **PWA Capabilities**: Offline support, manifest, and install prompts via Service Worker.

## Screen List
1. **Landing Page**: Brand intro, feature highlights, and template showcase.
2. **Resume Builder (Main Hub)**: Toggle between 'Upload' and 'Build from Scratch'.
3. **Resume Editor**: The workspace for refining content, choosing templates, and analyzing job fit.
4. **Documentation**: Technical guides and setup instructions.

## Technical Stack
- React 19, TypeScript, Tailwind 4.
- Express.js + tRPC (Backend).
- MySQL/TiDB (Database).
- pdfjs-dist, mammoth, jsPDF (Client-side libraries).
