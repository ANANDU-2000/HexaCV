# HexaCv - Complete Documentation

**Prepared by:** Surag & Anandu Krishna | HexaStack Solutions  
**Website:** https://www.hexastacksolutions.com/  
**Version:** 1.0.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Build & Deployment Guide](#build--deployment-guide)
3. [UI/UX Design System](#uiux-design-system)
4. [Page-by-Page UI/UX Prompts](#page-by-page-uiux-prompts)
5. [TTS Narration Prompts (Stitch AI Format)](#tts-narration-prompts-stitch-ai-format)
6. [Responsive Design Guidelines](#responsive-design-guidelines)
7. [Feature Implementation Guide](#feature-implementation-guide)

---

## Project Overview

HexaCv is a Progressive Web App (PWA) that enables users to build, edit, and export professional resumes. The application supports three main workflows:

1. **Upload Existing Resume** - Parse PDF, DOCX, or plain text files
2. **Build from Scratch** - Guided multi-step form for creating a resume
3. **Job Description Targeting** - Align resume content to specific job requirements

The app features one professionally designed, ATS-optimized template that works for all industries and career levels.

### Key Features

- **Client-side Processing** - All resume data stays on the user's device
- **PWA Support** - Installable app with offline functionality
- **Real-time Preview** - Live resume preview as users edit
- **PDF Export** - One-click download of formatted resume
- **Mobile Responsive** - Fully functional on all device sizes
- **Job Targeting** - 8 preset job roles + custom input
- **No Account Required** - Anonymous, privacy-first approach

---

## Build & Deployment Guide

### Prerequisites

- Node.js 18+ and pnpm 10+
- MySQL/TiDB database (provided by Manus)
- Environment variables configured

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# TypeScript check
pnpm check
```

The dev server runs on `http://localhost:3000` with hot module reloading.

### Project Structure

```
hexacv-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
│   └── public/            # Static assets & PWA config
├── server/                # Express backend
│   ├── routers.ts         # tRPC procedure definitions
│   ├── db.ts              # Database queries
│   └── _core/             # Framework internals
├── drizzle/               # Database schema & migrations
├── shared/                # Shared types
└── references/            # Integration guides
```

### Database Schema

The application uses a minimal schema focused on resume storage:

```sql
-- Users table (managed by Manus Auth)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resumes table (for future backend storage)
CREATE TABLE resumes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  title VARCHAR(255),
  content JSON,
  template VARCHAR(50) DEFAULT 'professional',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Deployment

1. **Create a Checkpoint** - Save the current project state
2. **Publish** - Click the Publish button in the Manus Management UI
3. **Custom Domain** - Configure domain in Settings → Domains
4. **Monitoring** - View analytics in Dashboard

---

## UI/UX Design System

### Color Palette

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| Primary | Blue | #1e40af | CTAs, links, accents |
| Light Blue | Light Blue | #eff6ff | Backgrounds, highlights |
| Dark Text | Slate 900 | #0f172a | Body text, headers |
| Light Text | Slate 600 | #475569 | Secondary text |
| Border | Slate 200 | #e2e8f0 | Dividers, borders |
| Background | White | #ffffff | Main background |
| Success | Green | #10b981 | Success states |
| Warning | Amber | #f59e0b | Warning states |
| Error | Red | #ef4444 | Error states |

### Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Page Title | Inter | 700 | 32-36px | 1.2 |
| Section Header | Inter | 600 | 20-24px | 1.3 |
| Subsection | Inter | 600 | 16-18px | 1.4 |
| Body Text | Inter | 400 | 14-16px | 1.6 |
| Small Text | Inter | 400 | 12-14px | 1.5 |
| Button Text | Inter | 500 | 14-16px | 1.5 |

### Spacing System

- **xs:** 4px (small gaps)
- **sm:** 8px (component padding)
- **md:** 16px (section spacing)
- **lg:** 24px (major sections)
- **xl:** 32px (page margins)
- **2xl:** 48px (hero spacing)

### Component Patterns

**Buttons:**
- Primary: Blue background, white text, 8px padding
- Secondary: White background, blue text, blue border
- Destructive: Red background, white text
- Disabled: Gray background, gray text, no cursor

**Cards:**
- White background, light border, subtle shadow on hover
- Padding: 16-24px depending on content
- Border radius: 8px

**Forms:**
- Label above input, 12px font size
- Input height: 40px, 8px padding
- Error state: Red border, red error text below
- Success state: Green checkmark, green text

**Modals:**
- Overlay: Semi-transparent black (rgba(0,0,0,0.5))
- Modal: White background, rounded corners, centered
- Close button: Top-right corner

---

## Page-by-Page UI/UX Prompts

### 1. Landing Page

**Purpose:** Introduce HexaCv and guide users to start building resumes

**Layout:**
- Hero section with large headline and two CTAs
- Features showcase (6 cards in 3-column grid)
- Template showcase (single professional template card)
- PWA installation section
- Documentation link
- Footer with HexaStack branding

**Key Elements:**
- Navigation bar (sticky) with logo, links, and Get Started button
- Hero image placeholder on desktop (resume preview mockup)
- Feature icons from lucide-react
- Installation prompt for PWA
- Responsive grid that stacks on mobile

**Interactions:**
- Smooth scroll to sections
- Hover effects on cards
- PWA install button (visible only if installable)
- Links to builder and documentation

**Mobile Considerations:**
- Stack hero content vertically
- Single-column feature grid
- Hamburger menu for navigation
- Larger touch targets (44px minimum)

---

### 2. Resume Builder Page

**Purpose:** Main interface for creating/editing resumes

**Layout:**
- Two-tab interface: Upload | Build from Scratch
- Upload tab: Drag-and-drop file upload, file type validation
- Scratch tab: Multi-step form with progress indicator
- Right sidebar: Real-time resume preview

**Upload Tab:**
- Drag-and-drop zone with visual feedback
- File input with accept="pdf,docx,txt"
- File size limit: 5MB
- Error messages for invalid files
- Success message with parsed data summary

**Scratch Tab:**
- Step-by-step form (Header → Summary → Skills → Experience → Projects → Education → Certifications)
- Progress bar showing current step
- Previous/Next buttons
- Save button at final step
- Form validation with error messages

**Preview Panel:**
- Live resume preview in professional template
- Template selector (currently only one option)
- Job description dropdown selector
- Scroll-sync with editor
- Print-friendly styles

**Mobile Considerations:**
- Stack editor and preview vertically
- Full-width form on mobile
- Simplified preview (text only, no PDF rendering)
- Touch-friendly form inputs

---

### 3. Resume Editor Page

**Purpose:** Edit and refine resume content

**Layout:**
- Three-panel interface: Sections list | Editor | Preview
- Left panel: Collapsible section navigation
- Center panel: Editable content for selected section
- Right panel: Live preview

**Section Navigation:**
- Expandable/collapsible sections
- Drag-to-reorder sections
- Add/remove section buttons
- Section visibility toggles

**Editor Panel:**
- Context-specific forms for each section
- Inline editing with save/cancel buttons
- Add/remove buttons for list items (bullets, skills, etc.)
- Rich text support for descriptions
- Date pickers for date fields

**Preview Panel:**
- Real-time updates as user edits
- Zoom controls for preview
- Print preview mode
- PDF export button

**Mobile Considerations:**
- Single-column layout on mobile
- Tab-based navigation between sections
- Full-width editor
- Preview accessible via modal

---

### 4. Documentation Page

**Purpose:** Provide comprehensive guides and prompts

**Layout:**
- Sidebar navigation with collapsible sections
- Main content area with markdown rendering
- Table of contents with anchor links
- Search functionality

**Sections:**
- Build & Deployment Guide
- UI/UX Design System
- Page-by-Page Prompts
- TTS Narration Prompts
- Responsive Design Guidelines
- Feature Implementation Guide

**Mobile Considerations:**
- Hamburger menu for sidebar
- Full-width content
- Readable font sizes (16px minimum)
- Collapsible sections for long content

---

## TTS Narration Prompts (Stitch AI Format)

### Landing Page Narration

**Prompt for TTS Generation:**

```
Generate a professional, welcoming narration for the HexaCv landing page.
Tone: Friendly, professional, encouraging
Pace: Moderate, clear enunciation
Duration: 60-90 seconds

Script:
"Welcome to HexaCv, the AI-powered resume builder by HexaStack Solutions.

Building a professional resume has never been easier. Whether you're starting fresh or refining an existing resume, HexaCv guides you through every step.

Upload your current resume in PDF, Word, or text format. Our intelligent parser automatically organizes your content into standard sections.

Or build from scratch with our guided form. Answer simple questions about your experience, skills, and education.

Then, target your resume to any job description. Select from eight common roles or add your own custom job description. HexaCv aligns your resume to match the requirements.

Finally, export your polished resume as a PDF, ready to send to employers.

All your data stays on your device. No uploads, no accounts, complete privacy.

HexaCv works online and offline. Install it as an app on your phone or computer for instant access anywhere.

Get started now. Build your perfect resume with HexaCv."

Emotional tone: Inspiring, empowering
Emphasis words: professional, easier, intelligent, perfect
```

**Audio Specifications:**
- Format: MP3, 128kbps
- Sample rate: 44.1kHz
- Voice: Professional, neutral accent
- Background: Subtle ambient sound (optional)

---

### Resume Builder Page Narration

**Prompt for TTS Generation:**

```
Generate step-by-step narration for the HexaCv resume builder.
Tone: Instructional, supportive, clear
Pace: Moderate with pauses between steps
Duration: 90-120 seconds

Script:
"Welcome to the HexaCv Resume Builder.

You have two options: Upload an existing resume or build from scratch.

If you're uploading, drag and drop your PDF, Word document, or text file into the upload area. We support files up to five megabytes. Our parser will automatically extract your information and organize it into standard resume sections.

If you're building from scratch, follow our guided form. Start with your header information: name, email, phone, and location. Then add a professional summary highlighting your key strengths.

Next, list your technical skills organized by category. Add your work experience with company names, roles, dates, and key responsibilities.

Include your projects, education, and certifications. Each section is optional, so include only what's relevant.

As you fill in your information, watch the live preview on the right. Your resume updates in real-time with professional formatting.

Once you're done, select a job description to tailor your resume. Choose from our preset roles or add a custom job description. HexaCv will highlight matching keywords and suggest improvements.

Finally, download your resume as a PDF with a single click.

Let's get started building your perfect resume."

Emotional tone: Supportive, encouraging
Emphasis words: easy, professional, real-time, perfect
```

---

### Resume Editor Page Narration

**Prompt for TTS Generation:**

```
Generate detailed narration for the HexaCv resume editor.
Tone: Instructional, professional, detailed
Pace: Moderate with clear section breaks
Duration: 120-150 seconds

Script:
"Welcome to the HexaCv Resume Editor.

You're now in the detailed editing interface. On the left, you'll see all the sections of your resume. Click any section to edit it.

The center panel shows the editable content for the selected section. Make changes directly in the form fields. Your changes appear instantly in the preview on the right.

You can reorder sections by dragging them in the left panel. Toggle section visibility to show or hide sections from your resume.

For experience and projects, add multiple bullet points describing your achievements. Use action verbs and quantifiable results to make your resume stand out.

The preview panel on the right shows your resume in real-time with professional formatting. This is exactly how your resume will appear when exported as a PDF.

Use the job description selector at the top to align your resume to a specific role. HexaCv highlights keywords that match the job description and suggests improvements.

When you're satisfied with your resume, click the Export to PDF button. Your resume downloads immediately, ready to send to employers.

You can also print your resume directly from the preview for a physical copy.

Make your resume perfect. Edit, preview, and export with HexaCv."

Emotional tone: Professional, empowering
Emphasis words: editing, professional, real-time, perfect, export
```

---

### Documentation Page Narration

**Prompt for TTS Generation:**

```
Generate an overview narration for the HexaCv documentation page.
Tone: Informative, professional, welcoming
Pace: Moderate, clear enunciation
Duration: 60-90 seconds

Script:
"Welcome to HexaCv Documentation.

Here you'll find comprehensive guides to help you build and use HexaCv effectively.

The Build and Deployment Guide covers installation, configuration, and deployment to production.

The UI/UX Design System documents our color palette, typography, spacing, and component patterns for consistent design.

Page-by-Page UI/UX Prompts provide detailed descriptions of each page's layout, interactions, and mobile considerations.

TTS Narration Prompts in Stitch AI format enable voice-over narration for all pages.

The Responsive Design Guidelines ensure your resume looks perfect on all device sizes, from mobile phones to desktop computers.

The Feature Implementation Guide walks through building each feature step by step.

All documentation is prepared by Surag and Anandu Krishna at HexaStack Solutions.

For more information, visit hexastacksolutions.com.

Browse the documentation using the sidebar navigation. Click any section to expand and explore."

Emotional tone: Informative, helpful
Emphasis words: comprehensive, guides, documentation, HexaStack Solutions
```

---

## Responsive Design Guidelines

### Breakpoints

- **Mobile:** 320px - 640px
- **Tablet:** 641px - 1023px
- **Desktop:** 1024px+

### Mobile-First Approach

1. **Design for mobile first** - Start with 320px viewport
2. **Progressive enhancement** - Add complexity for larger screens
3. **Touch-friendly** - Minimum 44px touch targets
4. **Readable text** - Minimum 16px font size
5. **Single column** - Stack content vertically on mobile

### Mobile Optimizations

**Navigation:**
- Hamburger menu for mobile
- Sticky header with logo and menu button
- Collapsible navigation items

**Forms:**
- Full-width inputs
- Large touch targets (44px)
- Clear labels above inputs
- Error messages below inputs
- One column layout

**Cards & Content:**
- Single column grid
- Full-width cards
- Reduced padding (8px-12px)
- Readable font sizes (14px minimum)

**Images & Media:**
- Responsive images (max-width: 100%)
- Lazy loading for performance
- Appropriate aspect ratios

**Resume Preview:**
- Text-only on mobile (no PDF rendering)
- Scrollable preview
- Zoom controls
- Full-width layout

### Tablet Optimizations

**Layout:**
- Two-column layout where appropriate
- Larger touch targets (48px)
- Increased spacing

**Navigation:**
- Horizontal navigation bar
- Visible menu items
- Dropdown menus

**Resume Editor:**
- Two-panel layout (editor + preview)
- Stacked vertically if needed
- Scrollable panels

### Desktop Optimizations

**Layout:**
- Multi-column layouts
- Optimal line length (60-80 characters)
- Generous whitespace

**Navigation:**
- Full horizontal navigation
- Dropdown menus
- Breadcrumb trails

**Resume Editor:**
- Three-panel layout (sections + editor + preview)
- Side-by-side panels
- Synchronized scrolling

---

## Feature Implementation Guide

### 1. Resume Upload & Parsing

**Files:**
- `client/src/components/ResumeUploader.tsx` - Upload UI
- `client/src/lib/resumeParser.ts` - Parsing logic

**Implementation:**
1. Accept PDF, DOCX, TXT files
2. Extract text from each format
3. Parse text into resume sections
4. Map parsed data to resume object
5. Populate editor with parsed data

**Testing:**
- Upload sample PDFs, DOCX, TXT files
- Verify section extraction
- Test error handling for invalid files

### 2. Resume Builder from Scratch

**Files:**
- `client/src/components/ResumeScratchBuilder.tsx` - Form UI
- `client/src/pages/ResumeBuilder.tsx` - Page component

**Implementation:**
1. Multi-step form with progress indicator
2. Validate each step before proceeding
3. Save form data to local state
4. Update preview in real-time
5. Submit final resume data

**Testing:**
- Fill out complete form
- Verify all sections appear in preview
- Test form validation
- Test mobile responsiveness

### 3. Job Description Targeting

**Files:**
- `client/src/lib/jobDescriptions.ts` - Job data
- `client/src/components/JobDescriptionSelector.tsx` - UI

**Implementation:**
1. Provide 8 preset job descriptions
2. Allow custom job description input
3. Extract keywords from job description
4. Highlight matching keywords in resume
5. Suggest improvements based on job

**Testing:**
- Select each preset job
- Add custom job description
- Verify keyword highlighting
- Test suggestions

### 4. Resume Preview & Editing

**Files:**
- `client/src/components/ProfessionalResumeTemplate.tsx` - Template
- `client/src/components/ResumeEditor.tsx` - Editor UI
- `client/src/components/ResumePreview.tsx` - Preview UI

**Implementation:**
1. Display resume in professional template
2. Allow inline editing of each section
3. Update preview in real-time
4. Support section reordering
5. Toggle section visibility

**Testing:**
- Edit each section
- Verify preview updates
- Test section reordering
- Test visibility toggles

### 5. PDF Export

**Files:**
- `client/src/lib/pdfExport.ts` - PDF generation
- `client/src/components/ExportButton.tsx` - Export UI

**Implementation:**
1. Render resume to canvas
2. Generate PDF from canvas
3. Embed fonts for compatibility
4. Set page size and margins
5. Download PDF file

**Testing:**
- Export resume to PDF
- Verify formatting in PDF
- Test on different browsers
- Verify file downloads

### 6. PWA Setup

**Files:**
- `client/public/manifest.json` - PWA manifest
- `client/public/service-worker.js` - Service worker
- `client/src/hooks/usePWA.ts` - PWA hook

**Implementation:**
1. Create manifest.json with app metadata
2. Implement service worker for offline support
3. Cache essential assets
4. Handle install prompt
5. Provide offline fallback

**Testing:**
- Install app on device
- Verify offline functionality
- Test cache invalidation
- Test app updates

---

## Troubleshooting

### Common Issues

**Resume not parsing correctly:**
- Check file format and encoding
- Verify file size is under 5MB
- Try copying text directly

**Preview not updating:**
- Clear browser cache
- Refresh the page
- Check browser console for errors

**PDF export not working:**
- Ensure JavaScript is enabled
- Try a different browser
- Check file permissions

**PWA not installing:**
- Ensure HTTPS is enabled
- Check manifest.json is valid
- Try a different browser

---

## Support & Credits

**Prepared by:** Surag & Anandu Krishna  
**Organization:** HexaStack Solutions  
**Website:** https://www.hexastacksolutions.com/  
**Version:** 1.0.0  
**Last Updated:** 2026

For support and inquiries, visit HexaStack Solutions website.

---

**© 2026 HexaStack Solutions. All rights reserved.**
