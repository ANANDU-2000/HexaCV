# HexaCv - Build Guide and Deployment Documentation

**Prepared by:** Surag & Anandu Krishna | HexaStack Solutions  
**Website:** https://www.hexastacksolutions.com/  
**Application:** HexaCv - AI Resume Builder  
**Last Updated:** June 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Build Instructions](#build-instructions)
3. [Development Setup](#development-setup)
4. [Deployment Guide](#deployment-guide)
5. [PWA Configuration](#pwa-configuration)
6. [UI/UX Design Prompts](#uiux-design-prompts)
7. [TTS Narration Prompts](#tts-narration-prompts)
8. [Feature Implementation Guide](#feature-implementation-guide)

---

## Project Overview

**HexaCv** is a full-featured, Progressive Web App (PWA) resume builder that empowers users to create, tailor, and export professional resumes with AI-powered job description alignment. The application is built with modern web technologies and is fully responsive across mobile, tablet, and desktop devices.

### Key Features

- **Resume Upload & Parsing:** Support for PDF, DOCX, and TXT formats with client-side text extraction
- **Build from Scratch:** Guided multi-step form for creating resumes from the ground up
- **Job Description Targeting:** Preset roles and custom job description input for resume alignment
- **Multiple Templates:** Four professional designs (Classic ATS Blue, Minimal Executive, Modern Sidebar Lite, Technical Compact)
- **Real-time Preview:** Live resume preview that updates instantly as you edit
- **PDF Export:** One-click download of polished, print-ready resumes
- **PWA Support:** Installable app with offline functionality
- **Complete Documentation:** In-app guides with UI/UX and TTS prompts

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend Framework | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Express.js + tRPC 11 |
| Database | MySQL/TiDB |
| Authentication | Manus OAuth |
| PDF Generation | jsPDF + html2canvas |
| PWA | Service Worker + Web App Manifest |

---

## Build Instructions

### Prerequisites

- Node.js 22.13.0 or higher
- pnpm 10.4.1 or higher
- MySQL/TiDB database connection

### Installation

```bash
# Navigate to project directory
cd /home/ubuntu/hexacv-app

# Install dependencies
pnpm install

# Generate database schema
pnpm drizzle-kit generate

# Apply database migrations
pnpm drizzle-kit migrate
```

### Development Server

```bash
# Start development server (with hot reload)
pnpm dev

# The app will be available at http://localhost:3000
```

### Production Build

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start

# The app will be available at http://localhost:3000
```

### Type Checking

```bash
# Check TypeScript compilation
pnpm check

# Format code
pnpm format

# Run tests
pnpm test
```

---

## Development Setup

### Project Structure

```
hexacv-app/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   ├── contexts/         # React contexts
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   ├── public/               # Static assets
│   │   ├── manifest.json     # PWA manifest
│   │   ├── service-worker.js # Service worker
│   │   └── favicon.ico       # App icon
│   └── index.html            # HTML template
├── server/                    # Backend Express application
│   ├── routers.ts            # tRPC procedure definitions
│   ├── db.ts                 # Database queries
│   ├── storage.ts            # S3 storage helpers
│   └── _core/                # Framework core
├── drizzle/                   # Database schema and migrations
│   ├── schema.ts             # Table definitions
│   └── migrations/           # SQL migration files
├── shared/                    # Shared types and constants
│   ├── types.ts              # TypeScript type definitions
│   └── const.ts              # Shared constants
└── ARCHITECTURE.md           # Architecture documentation
```

### Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/Landing.tsx` | Landing page with hero and features |
| `client/src/pages/ResumeBuilder.tsx` | Main resume builder interface |
| `client/src/pages/Documentation.tsx` | In-app documentation |
| `client/src/components/ResumeUploader.tsx` | File upload component |
| `client/src/components/ResumeScratchBuilder.tsx` | Multi-step form builder |
| `client/src/lib/resumeParser.ts` | Resume parsing logic |
| `client/src/lib/pdfExport.ts` | PDF generation utilities |
| `client/src/lib/templates.ts` | Template definitions |
| `client/src/lib/jobDescriptions.ts` | Job description presets |
| `client/src/hooks/usePWA.ts` | PWA functionality hook |
| `server/routers.ts` | API endpoints |
| `drizzle/schema.ts` | Database schema |

---

## Deployment Guide

### Manus Platform Deployment

HexaCv is designed to deploy on the Manus platform with built-in hosting, database, and authentication.

#### Pre-deployment Checklist

- [ ] All TypeScript errors resolved (`pnpm check`)
- [ ] All tests passing (`pnpm test`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] PWA manifest and service worker in place
- [ ] Favicon and app icons created
- [ ] Branding assets uploaded to S3

#### Deployment Steps

1. **Create Checkpoint**
   ```bash
   # Save project state before deployment
   # Use webdev_save_checkpoint in Manus UI
   ```

2. **Configure Environment**
   - Set required environment variables in Manus Settings
   - Configure database connection
   - Set up OAuth credentials

3. **Build and Deploy**
   - Click "Publish" button in Manus Management UI
   - System will build and deploy automatically
   - App will be available at assigned domain

4. **Post-deployment Verification**
   - Test landing page loads correctly
   - Verify PWA install prompt appears
   - Test resume upload functionality
   - Confirm PDF export works
   - Check offline functionality

### Environment Variables

Required environment variables (automatically injected by Manus):

```bash
DATABASE_URL=mysql://user:password@host/database
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login
OWNER_OPEN_ID=owner-id
OWNER_NAME=Owner Name
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
```

---

## PWA Configuration

### Web App Manifest

The `public/manifest.json` file defines PWA metadata:

```json
{
  "name": "HexaCv - AI Resume Builder",
  "short_name": "HexaCv",
  "description": "Build, tailor, and export professional resumes",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e40af",
  "icons": [...]
}
```

### Service Worker

The `public/service-worker.js` handles:

- **Offline Support:** Caches app shell and assets
- **Background Sync:** Syncs data when connection restored
- **Push Notifications:** Delivers notifications to users
- **Cache Strategy:** Network-first with fallback to cache

### Installation

Users can install HexaCv as an app:

1. **Desktop:** Click install button in browser address bar
2. **Mobile:** Use "Add to Home Screen" option
3. **PWA Prompt:** Custom install prompt appears on landing page

### Offline Functionality

- App shell cached and available offline
- Previously built resumes accessible
- Editor functionality available offline
- Data synced when connection restored

---

## UI/UX Design Prompts

### Landing Page Design Direction

**Hero Section:**
Create an inspiring hero with a clear value proposition. Use a gradient background (blue to slate), bold typography, and a prominent CTA. Include a visual mockup of a resume or dashboard on the right side.

**Features Section:**
Display 6 key features in a 3x2 grid. Each feature should have an icon, title, and short description. Use card components with hover effects.

**Templates Section:**
Show all 4 templates with preview images. Use a 2x2 grid on desktop, stack vertically on mobile. Include template names and brief descriptions.

**CTA Section:**
Add a prominent call-to-action section encouraging users to get started. Use contrasting colors (blue on white or white on blue).

**Footer:**
Include HexaStack Solutions branding, links to templates, documentation, and company website. Credit founders: Surag & Anandu Krishna.

### Resume Builder Page Design

**Layout:**
Use a two-tab interface (Upload / Build from Scratch). Tabs should be clearly labeled and easy to switch between.

**Upload Section:**
Create a drag-and-drop file upload area with support for PDF, DOCX, and TXT files. Show upload progress and parsing status.

**Build from Scratch:**
Use a multi-step form with clear section headers. Each step should focus on one resume section (Header, Summary, Skills, etc.). Include form validation and helpful placeholders.

**Progress Indicator:**
Show progress through the form with a step indicator or progress bar.

### Resume Editor Page Design

**Three-Column Layout:**
Left sidebar for section navigation, center for editing, right for live preview.

**Section Navigation:**
Vertical list of resume sections with visibility toggles and drag handles for reordering.

**Editor Panel:**
Form inputs for editing section content. Support inline editing for bullets and list items.

**Live Preview:**
Real-time preview of the resume using the selected template. Updates instantly as user types.

**Template & Job Selector:**
Dropdowns to select template and job description. Show preview updates immediately.

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | #1e40af | Primary CTA, headers, accents |
| Dark Slate | #0f172a | Text, dark backgrounds |
| Light Slate | #f8fafc | Light backgrounds, cards |
| Success Green | #16a34a | Success states, confirmations |
| Error Red | #dc2626 | Error states, warnings |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headings | Inter | 700 | 24px-48px |
| Body Text | Inter | 400-500 | 14px-16px |
| Code/Monospace | JetBrains Mono | 400 | 12px-14px |

### Mobile Responsiveness

- Stack three-column layout to single column on mobile
- Use bottom sheet for section navigation on mobile
- Simplify preview to full-width on small screens
- Ensure touch-friendly button sizes (min 44x44px)
- Optimize forms for mobile input (large inputs, clear labels)

---

## TTS Narration Prompts

All TTS prompts follow the **tts-prompter format**: `[Style Instructions]: [Spoken Text]`

### Landing Page Hero

**Prompt:**
```
Speak in English with a professional, confident, and welcoming tone: Build your perfect resume in minutes. Upload your existing resume or build from scratch. Tailor your CV to any job description with AI-powered alignment. Export a polished PDF instantly. HexaCv is powered by HexaStack Solutions.
```

**Voice:** Charon (Informative)  
**Language:** en-US

### Features Section

**Prompt:**
```
Speak in English with an enthusiastic and informative tone: HexaCv offers six powerful features. Smart Upload: Upload PDF, Word, or text files and automatically parse your resume content. AI-Powered: Align your resume to any job description and get keyword suggestions. Job Targeting: Select from preset jobs or add custom job descriptions. Multiple Templates: Choose from four professional designs. Instant Export: Download your resume as a beautifully formatted PDF. Mobile Ready: Build and edit your resume on any device.
```

**Voice:** Puck (Upbeat)  
**Language:** en-US

### Resume Builder - Upload Tab

**Prompt:**
```
Speak in English with a helpful and encouraging tone: Upload your existing resume to get started. HexaCv supports PDF, Word documents, and plain text files. Simply drag and drop your file or click to browse. Your resume will be automatically parsed and organized into standard sections.
```

**Voice:** Leda (Youthful)  
**Language:** en-US

### Resume Builder - Build from Scratch Tab

**Prompt:**
```
Speak in English with a clear and instructional tone: Build your resume from scratch using our guided form. Fill in your information section by section: Header with your contact information, Professional Summary, Skills organized by category, Work Experience with detailed descriptions, Projects you've worked on, Education and degrees, and Certifications. Take your time to provide accurate and detailed information.
```

**Voice:** Charon (Informative)  
**Language:** en-US

### Template Selection

**Prompt:**
```
Speak in English with a professional and advisory tone: Choose the template that best matches your career stage and industry. Classic ATS Blue is a traditional single-column design optimized for ATS systems, best for corporate roles. Minimal Executive is a clean, modern aesthetic ideal for senior positions. Modern Sidebar Lite is a contemporary two-column layout perfect for creative professionals. Technical Compact is a dense, tech-focused design great for developers and engineers.
```

**Voice:** Rasalgethi (Informative)  
**Language:** en-US

### Job Description Targeting

**Prompt:**
```
Speak in English with an informative and supportive tone: Select a job description to tailor your resume. Choose from preset roles like Full-Stack Developer, Frontend Engineer, Backend Engineer, DevOps Engineer, Data Scientist, or Product Manager. Or enter a custom job description. HexaCv will analyze the job requirements and suggest keywords and content improvements to align your resume.
```

**Voice:** Aoede (Breezy)  
**Language:** en-US

### Resume Editor

**Prompt:**
```
Speak in English with a calm and instructional tone: You're now in the resume editor. On the left, you'll see all your resume sections. Click any section to edit its content. Your changes appear instantly in the live preview on the right. You can reorder sections by dragging, toggle section visibility, and edit bullets inline. When you're satisfied, click Export PDF to download your resume.
```

**Voice:** Charon (Informative)  
**Language:** en-US

### PDF Export

**Prompt:**
```
Speak in English with an encouraging and professional tone: Your resume is ready to export. Click the Export PDF button to download a beautifully formatted PDF file. The PDF is optimized for both screen viewing and printing. You can download it as many times as you'd like and customize it further in the editor.
```

**Voice:** Sulafat (Warm)  
**Language:** en-US

### Documentation Page

**Prompt:**
```
Speak in English with a helpful and informative tone: Welcome to HexaCv documentation. This guide covers everything you need to know about building and managing your resume. HexaCv is an AI-powered resume builder developed by Surag and Anandu Krishna at HexaStack Solutions. Visit hexastacksolutions.com to learn more. You can upload an existing resume or build from scratch. Choose from four professional templates. Tailor your resume to any job description. Export your resume as a PDF with one click.
```

**Voice:** Charon (Informative)  
**Language:** en-US

### About HexaStack Solutions

**Prompt:**
```
Speak in English with a professional and proud tone: HexaCv is developed by Surag and Anandu Krishna at HexaStack Solutions. HexaStack Solutions is dedicated to building innovative tools that help professionals succeed. Visit www.hexastacksolutions.com to learn more about our work and other products.
```

**Voice:** Algieba (Smooth)  
**Language:** en-US

---

## Feature Implementation Guide

### Resume Upload & Parsing

**Implementation Steps:**

1. **File Upload Component**
   - Create drag-and-drop upload area
   - Support PDF, DOCX, TXT formats
   - Validate file size (max 10MB)
   - Show upload progress

2. **Text Extraction**
   - Use `pdfjs-dist` for PDF extraction
   - Use `mammoth` for DOCX extraction
   - Use native FileReader for TXT

3. **Content Parsing**
   - Use `resumeParser.ts` utilities
   - Extract sections: header, summary, skills, experience, projects, education, certifications
   - Normalize and validate data

4. **State Management**
   - Store parsed resume in React context
   - Persist to localStorage for offline access
   - Sync with backend when online

### Resume Builder from Scratch

**Implementation Steps:**

1. **Multi-step Form**
   - Create form component with step navigation
   - Each step focuses on one section
   - Include form validation

2. **Section Forms**
   - Header: name, email, phone, location, links
   - Summary: textarea for professional overview
   - Skills: category-based skill input
   - Experience: company, role, dates, description
   - Projects: project name, description, technologies
   - Education: institution, degree, field, graduation date
   - Certifications: name, issuer, date

3. **Form Validation**
   - Validate required fields
   - Show error messages
   - Prevent form submission if invalid

4. **State Persistence**
   - Save form data to localStorage
   - Allow users to resume later
   - Clear data after successful completion

### Job Description Targeting

**Implementation Steps:**

1. **Preset Jobs**
   - Create dropdown with preset job descriptions
   - Include 8 common roles
   - Allow custom job description input

2. **Keyword Extraction**
   - Parse job description
   - Extract key technologies and skills
   - Store keywords for matching

3. **Resume Alignment**
   - Compare resume content with job keywords
   - Calculate keyword match score
   - Suggest content improvements

4. **UI Components**
   - Job description selector dropdown
   - Custom input field
   - Keyword match score display
   - Content suggestion panel

### Template System

**Implementation Steps:**

1. **Template Definitions**
   - Define 4 templates in `templates.ts`
   - Include color schemes, fonts, layouts
   - Create preview images

2. **Template Selector**
   - Create dropdown component
   - Show template previews
   - Allow template switching

3. **Template Rendering**
   - Create template components for each design
   - Implement responsive layouts
   - Apply template styles to resume

4. **Live Preview**
   - Show real-time preview of selected template
   - Update preview as user edits
   - Support template switching mid-edit

### PDF Export

**Implementation Steps:**

1. **PDF Generation**
   - Use `jsPDF` and `html2canvas`
   - Render resume to canvas
   - Convert to PDF

2. **Styling**
   - Apply print-friendly CSS
   - Optimize for PDF output
   - Handle page breaks

3. **Download**
   - Generate download link
   - Trigger browser download
   - Clean up resources

4. **Error Handling**
   - Fallback to print dialog if generation fails
   - Show error messages to user
   - Log errors for debugging

---

## Branding Guidelines

### HexaStack Solutions Identity

- **Company Name:** HexaStack Solutions
- **Founders:** Surag & Anandu Krishna
- **Website:** https://www.hexastacksolutions.com/
- **Product:** HexaCv - AI Resume Builder

### Logo & Colors

- **Primary Color:** #1e40af (Blue)
- **Secondary Color:** #0f172a (Dark Slate)
- **Accent Color:** #16a34a (Green)

### Typography

- **Headings:** Inter, 700 weight
- **Body:** Inter, 400-500 weight

### Messaging

- Always credit "HexaStack Solutions" and "Surag & Anandu Krishna"
- Include website link in footer and documentation
- Use consistent branding across all pages

---

## Support & Resources

For questions or issues:

- **Documentation:** See in-app documentation page
- **Website:** https://www.hexastacksolutions.com/
- **Email:** Contact through website

---

## License & Attribution

HexaCv is developed by **Surag & Anandu Krishna** at **HexaStack Solutions**.

All rights reserved. © 2026 HexaStack Solutions.

**Visit:** https://www.hexastacksolutions.com/
