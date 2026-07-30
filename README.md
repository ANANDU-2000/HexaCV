# HexaCv - AI Resume Builder

**Prepared by:** Surag & Anandu Krishna | HexaStack Solutions  
**Website:** https://www.hexastacksolutions.com/  
**Version:** 1.1.0  
**License:** © 2026 HexaStack Solutions

---

## Overview

**HexaCv** is a full-featured, Progressive Web App (PWA) resume builder that empowers users to create, customize, and export professional resumes with AI-powered job description alignment. Built with modern web technologies, HexaCv provides a seamless experience across mobile, tablet, and desktop devices. 

---

### Key Features

- **Optional Authentication & Guest Mode:** Open the app and start building instantly as a Guest. Guest data persists in `LocalStorage` with a limit of 3 resumes.
- **Auto Cloud Migration:** Upon registration or login, guest resumes, cover letters, and reports are automatically migrated to the cloud database.
- **Robust Resume Upload & Parsing:** Support for PDF, DOCX, and TXT with raw text cleaning (strips consecutive duplicates, page numbers, and repeating headers/footers) and strict LLM parsing schemas.
- **Zero AI-Fabrication Guarantee:** Structured parser enforces "Genuine Content Only", mapping roles, company names, and dates verbatim with no hallucinated achievements.
- **Candidate Job Title Auto-Detection:** Automatically infers the candidate's core professional target role based on the uploaded document's content.
- **AI Summary Rewriting:** Tailor your professional summary instantly to any target job description and target country ATS standards with a dedicated "Rewrite with AI" interface.
- **Print-Safe Preview & Typography:** Features Google Fonts `Inter` styling and strict disc bullet rendering that overrides standard Tailwind CSS reset rules.
- **Super Admin CRM & Analytics:** Track guest sessions, conversions, cloud backup statistics, and database analytics through the CRM panel.
- **PWA Support:** Installable app with offline capabilities and service workers.

---

## Quick Start

### Prerequisites

- Node.js 22.13.0 or higher
- pnpm 10.4.1 or higher
- MySQL/TiDB database connection

### Installation

```bash
# Clone or navigate to project directory
cd /home/ubuntu/hexacv-app

# Install dependencies
pnpm install

# Generate database schema & apply migrations
pnpm run db:push

# Start development server
pnpm run dev
```

The app will be available at `http://localhost:3000`

### Environment Setup & LLM Providers

Before running the server, copy `.env.example` to `.env` and configure your API keys. HexaCv supports a tier of fallback LLM providers for resume parsing and rewriting:

- **OpenRouter**: `OPENROUTER_API_KEY`, `OPENROUTER_API_URL`, `OPENROUTER_MODEL` (e.g., `google/gemma-4-31b-it:free`)
- **OpenCode.ai**: `OPENCODE_API_KEY`, `OPENCODE_API_URL`, `OPENCODE_MODEL` (e.g., `glm-5.2`)
- **Bynara**: `BYNARA_API_KEY`, `BYNARA_API_URL`, `BYNARA_MODEL` (e.g., `glm-5.2-free`)
- **TokenRouter**: `TOKENROUTER_API_KEY`, `TOKENROUTER_API_URL`, `TOKENROUTER_MODEL` (e.g., `z-ai/glm-5.2-free`)
- **Direct fallbacks**: Supports standard OpenAI, Groq (`GROK_API_KEY`), and Gemini (`GEMINI_API_KEY`) APIs.

### Building for Production

```bash
# Build frontend and backend
pnpm run build

# Start production server
pnpm run start
```

---

## Project Structure

```
hexacv-app/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── _core/                   # Core framework utilities
│   │   │   └── hooks/               # Core state and data sync hooks
│   │   │       ├── useAuth.ts       # Authentication state hook
│   │   │       └── useResumeStorage.ts # Local Storage & Cloud DB sync coordinator
│   │   ├── pages/                  # Main page components
│   │   │   ├── Landing.tsx         # Product marketing & CTAs
│   │   │   ├── Home.tsx            # Home landing redirection
│   │   │   ├── Login.tsx           # OAuth login & simulated bypass page
│   │   │   ├── Register.tsx        # Registration and user setup page
│   │   │   ├── Dashboard.tsx       # Cloud resume list and actions
│   │   │   ├── ResumeBuilder.tsx   # Builder container orchestration
│   │   │   ├── Documentation.tsx   # Developer and end-user guide
│   │   │   └── ComponentShowcase.tsx # Live style guide and sandbox
│   │   ├── components/             # Reusable UI components
│   │   │   ├── templates/          # Reference ResumeTemplate (not wired into app)
│   │   │   ├── ResumeUploader.tsx  # Document upload parser hook UI
│   │   │   ├── ResumeScratchBuilder.tsx # Multi-step builder wizard
│   │   │   ├── ResumeEditor.tsx    # Live edit form (with summary AI rewriting)
│   │   │   ├── ResumePreview.tsx   # PDF templates preview with Inter typography
│   │   │   ├── AdminCRM.tsx        # Admin CRM stats & conversion tracking
│   │   │   ├── CountryLocationFields.tsx # Country-dependent address forms
│   │   │   ├── AIChatBox.tsx       # AI interactive resume feedback chatbot
│   │   │   ├── ATSScanner.tsx      # ATS alignment keyword checker UI
│   │   │   ├── RecruiterPortal.tsx # Job postings & candidate scoring dashboard
│   │   │   ├── OrganizationPortal.tsx # Multi-tenant team configurations
│   │   │   └── Marketplace.tsx     # Custom templates marketplace catalog
│   │   ├── hooks/                  # Client-side general hooks
│   │   │   ├── usePWA.ts           # PWA install prompt & offline listener
│   │   │   └── useComposition.ts   # Keyboard IME composition tracking
│   │   ├── contexts/               # React Context Providers
│   │   │   └── ThemeContext.tsx    # Theme manager provider
│   │   ├── lib/                    # Library integrations
│   │   │   ├── countryData.ts      # Country-specific dial codes, formats & schemas
│   │   │   ├── jobDescriptions.ts  # ATS baseline presets for resume matching
│   │   │   ├── pdfExport.ts        # jsPDF export layout compiler
│   │   │   ├── resumeParser.ts     # Client side extraction helpers
│   │   │   ├── templates.ts        # Style definitions for classic, executive, sidebar, tech
│   │   │   └── trpc.ts             # TRPC client wrapper hooks setup
│   │   ├── App.tsx                 # Client router (wouter) & provider setup
│   │   └── main.tsx                # Entry point
│   ├── public/                      # Static assets
│   │   ├── manifest.json           # PWA installation config
│   │   ├── service-worker.js       # Offline asset caching worker
│   │   └── favicon.ico             # Brand icon
│   └── index.html                  # HTML shell
├── server/                          # Backend Express application
│   ├── _core/                      # Server engine & libraries
│   │   ├── context.ts              # Session and tracking header contexts
│   │   ├── cookies.ts              # OAuth session cookie controls
│   │   ├── env.ts                  # Backend environment guards
│   │   ├── llm.ts                  # LLM generic invoker client
│   │   ├── oauth.ts                # Manus OAuth endpoint routes
│   │   ├── sdk.ts                  # Session verification middleware
│   │   └── trpc.ts                 # TRPC instance & permissions guards
│   ├── middleware/                 # Express middleware layers
│   │   └── security.ts             # CSRF/CORS protections
│   ├── routers.ts                  # Main TRPC endpoints mapping
│   ├── db.ts                       # Database CRUD operations, conversion metrics & backups
│   ├── fileParser.ts               # Text cleaning + strict LLM structured parsing
│   ├── aiSuggestions.ts            # LLM prompts for summaries & bullets suggestions
│   ├── storage.ts                  # Cloud file assets manager (S3 SDK)
│   ├── countryRoutes.ts            # Country configurations & regional rules endpoint
│   └── stripeWebhook.ts            # Stripe webhook hook
├── drizzle/                         # Database schema & migration tools
│   ├── schema.ts                   # Tables definitions
│   └── migrations/                 # Applied Drizzle migrations
├── shared/                          # Cross-boundary parameters
│   ├── types.ts                    # Shared types
│   └── const.ts                    # Global shared consts
├── stitch-assets/                   # Design system + HTML mockups
├── references/                      # SDK refs + template reference assets
├── docs/                            # All planning & ops documentation
│   └── README.md                    # Docs index (start here)
├── .cursor/rules/project.md         # Always-on Cursor project rules
└── README.md                        # This file
```

## Documentation

All product, architecture, design, ops, and task docs live under
[`docs/`](./docs/README.md). Start with that index. Do not add new
Markdown files at the repo root.

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend Framework | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Express.js + tRPC 11 |
| Database ORM | Drizzle ORM |
| Database | MySQL/TiDB |
| Authentication | Manus OAuth + Optional Guest session tracking |
| PDF Generation | jsPDF + html2canvas |
| PWA | Service Worker + Web App Manifest |
| Testing | Vitest |
| Package Manager | pnpm |

---

## Features in Detail

### 1. Guest Experience & Local Storage
- **Anonymous Entry:** Users can start building resumes immediately.
- **Local Persistence:** Resumes and reports saved to browser's `LocalStorage` (up to 3 resume files).
- **Auto Cloud Migration:** As soon as a guest logs in, their drafts are uploaded to the MySQL database and local storage is cleared.

### 2. Strict PDF/DOCX Parser & Sanitizer
- **Raw Cleaning:** Filters out page numbers ("Page 1 of 5") and duplicate lines (e.g. repeated page headers or footers in double-column layouts).
- **Structured Schema:** Converts PDF text layers to JSON using structured schemas.
- **Genuine Check:** Rejects fabricated text. Dates and company names are mapped verbatim.
- **Post-LLM Clean:** Server-side deduplication merges duplicate skill categories, filters repetitive bullet points, and generates unique IDs.

### 3. AI Professional Summary Rewrite
- **Tailored Summaries:** A "Rewrite with AI" button is integrated into the summary editor tab.
- **ATS Alignment:** Rewrites are tailored to target job titles, target descriptions, and regional formatting standards.
- **Concise Layout:** Restricts summaries to 2-4 sentences with strong action verbs.

### 4. Print-Ready Template Preview
- **Disc Bullets Rendering:** Restores custom `list-style-type: disc` markers that Tailwind CSS's preflight resets would otherwise remove.
- **Typography:** Enforces a clean, standard, print-safe Google Font `Inter` stack on the PDF template layouts.

### 5. Admin CRM & Dashboard Analytics
- **Conversion Tracking:** Measures active guest counts, registered counts, and conversion percentages.
- **Cloud Backup:** Shows active backups and backup history metrics.

---

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

### Type Checking & Formatting

```bash
# Check TypeScript compilation
pnpm run check

# Format code
pnpm run format
```

---

## Changelog

### Version 1.1.0 (June 2026)
- **Guest Mode Persistence:** Added `LocalStorage` guest support with a 3-resume draft limit.
- **Automatic Cloud Migration:** Unified hook to sync local data to the database upon user login.
- **Sanitized PDF Parser:** Prevented AI hallucinations, auto-detected target roles, and eliminated duplicated text.
- **AI Summary Rewriting:** Added a 1-click summary optimizer inside the editor.
- **Styling Upgrade:** Enforced Inter fonts and bullet disc styling to prevent layout resets.
- **CRM conversion rates:** Active guest session analytics implemented in the super admin panel.

### Version 1.0.0 (Initial Release)
- Landing page with HexaStack branding
- Basic resume upload and parsing
- Multi-step builder from scratch
- Four professional templates
- Preset job descriptions and keyword mapping
- PDF exports

---

## Credits

**Developed by:** Surag & Anandu Krishna  
**Organization:** HexaStack Solutions  
**Website:** https://www.hexastacksolutions.com/

---

**Thank you for using HexaCv! Good luck with your job search! 🚀**
