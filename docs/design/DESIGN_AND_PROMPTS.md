# HexaCv - Design & Prompts Documentation

**Prepared by:** Surag & Anandu Krishna | HexaStack Solutions  
**Website:** https://www.hexastacksolutions.com/  
**Application:** HexaCv - AI Resume Builder  
**Format:** UI/UX Design Prompts + TTS Narration Prompts (Stitch AI / tts-prompter)

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [UI/UX Design Prompts by Page](#uiux-design-prompts-by-page)
3. [TTS Narration Prompts](#tts-narration-prompts)
4. [Visual Style Guide](#visual-style-guide)
5. [Responsive Design Guidelines](#responsive-design-guidelines)
6. [Accessibility Standards](#accessibility-standards)

---

## Design Philosophy

HexaCv is designed with a **user-first, modern, and professional** aesthetic that reflects the quality and innovation of HexaStack Solutions. The design prioritizes:

- **Clarity:** Clear navigation and intuitive workflows
- **Efficiency:** Minimal clicks to achieve goals
- **Professionalism:** Polished, corporate aesthetic
- **Accessibility:** WCAG 2.1 AA compliance
- **Responsiveness:** Seamless experience across all devices

---

## UI/UX Design Prompts by Page

### Landing Page

#### Hero Section

**Design Direction:**
Create an inspiring hero section that immediately communicates HexaCv's value proposition. The hero should feature:

- **Background:** Gradient from primary blue (#1e40af) to a lighter slate, with subtle geometric patterns or wave SVG dividers
- **Typography:** Bold, large headline (48px+) with supporting subheading (18px)
- **Headline:** "Build Your Perfect Resume in Minutes"
- **Subheading:** "Upload your existing resume or build from scratch. Tailor your CV to any job description with AI-powered alignment. Export a polished PDF instantly."
- **CTA Buttons:** Two prominent buttons
  - Primary: "Upload Resume" (blue background)
  - Secondary: "Build from Scratch" (outline style)
- **Visual Element:** Resume mockup or dashboard screenshot on the right side (60% of hero width on desktop)
- **Trust Indicators:** Below CTA: "✓ Online • Works offline • No account required"

**Layout:**
- Desktop: Two-column layout (text left, visual right)
- Tablet: Stacked layout with visual below text
- Mobile: Single column, stacked vertically

**Animation:**
- Fade-in entrance animation for text (300ms ease-out)
- Subtle slide-up animation for visual element (400ms ease-out)
- Hover state on buttons: scale(0.98) with shadow increase

---

#### Features Section

**Design Direction:**
Display 6 key features in a grid layout with icons, titles, and descriptions.

**Features:**
1. **Smart Upload** - Upload PDF, Word, or text files and automatically parse content
2. **AI-Powered** - Align your resume to any job description and get keyword suggestions
3. **Job Targeting** - Select from preset jobs or add custom job descriptions
4. **Multiple Templates** - Choose from four professional designs
5. **Instant Export** - Download your resume as a beautifully formatted PDF
6. **Mobile Ready** - Build and edit your resume on any device

**Layout:**
- Desktop: 3-column grid (2 rows)
- Tablet: 2-column grid (3 rows)
- Mobile: Single column (6 rows)

**Card Design:**
- White background with subtle shadow (0 2px 8px rgba(0,0,0,0.1))
- Rounded corners (8px)
- Icon: 48x48px, primary color (#1e40af)
- Title: 16px, bold, slate-900
- Description: 14px, slate-600, max 2 lines
- Hover state: Lift effect (shadow increase, slight scale)

**Spacing:**
- Gap between cards: 24px
- Padding within cards: 24px
- Section padding: 64px vertical, 40px horizontal

---

#### Templates Section

**Design Direction:**
Showcase all 4 resume templates with visual previews and descriptions.

**Template Cards:**
- **Classic ATS Blue:** "Traditional, ATS-optimized design. Perfect for corporate roles."
- **Minimal Executive:** "Clean and modern. Ideal for senior positions."
- **Modern Sidebar Lite:** "Contemporary two-column layout. Great for creative professionals."
- **Technical Compact:** "Dense and tech-focused. Perfect for developers."

**Layout:**
- Desktop: 2x2 grid
- Tablet: 2-column grid
- Mobile: Single column

**Card Design:**
- Template preview image (400x500px on desktop)
- Template name below preview (18px, bold)
- Description below name (14px, slate-600)
- "View Template" button on hover (overlay)
- Border: 2px, slate-200, rounded 8px

---

#### Call-to-Action Section

**Design Direction:**
Create a prominent section encouraging users to get started.

**Content:**
- Headline: "Ready to Create Your Perfect Resume?"
- Subheading: "Join thousands of professionals using HexaCv to land their dream jobs."
- Primary CTA: "Get Started Now" (large button, blue background)
- Secondary CTA: "Learn More" (outline button)

**Design:**
- Background: Light blue (#eff6ff) or gradient
- Centered layout
- Headline: 32px, bold, slate-900
- Subheading: 16px, slate-600
- Buttons: Large size (56px height), 18px font
- Padding: 80px vertical, 40px horizontal

---

#### Footer

**Design Direction:**
Professional footer with HexaStack branding and links.

**Content:**
- **Left:** HexaStack Solutions logo and tagline
- **Center:** Quick links (Features, Templates, Documentation)
- **Right:** Social links and website link

**Design:**
- Background: Dark slate (#0f172a)
- Text: White/light slate
- Logo: 32x32px
- Company name: "HexaStack Solutions"
- Founders: "Surag & Anandu Krishna"
- Website link: https://www.hexastacksolutions.com/
- Copyright: "© 2026 HexaStack Solutions. All rights reserved."

**Layout:**
- Desktop: Three-column layout
- Tablet: Two-column layout
- Mobile: Single column, stacked

---

### Resume Builder Page

#### Upload Tab

**Design Direction:**
Create a welcoming upload interface with clear instructions and visual feedback.

**Components:**
1. **Drag-and-Drop Area**
   - Border: 2px dashed, slate-300
   - Background: Light slate (#f8fafc)
   - Icon: Large upload icon (64px), primary blue
   - Text: "Drag and drop your resume" (24px, bold)
   - Subtext: "or click to browse" (16px, slate-600)
   - Supported formats: "Supports PDF, Word (.docx), and plain text (.txt) files up to 10MB"

2. **File Info Display** (after selection)
   - File name (16px, bold)
   - File size (14px, slate-600)
   - Remove button (outline)

3. **Upload Button**
   - Full width
   - Primary blue background
   - 56px height
   - "Upload and Parse" text with upload icon
   - Loading state: Spinner + "Processing Resume..."

4. **Success State**
   - Green success alert
   - Checkmark icon
   - "Resume uploaded and parsed successfully!"
   - Next steps list

**Animation:**
- Hover on upload area: Border color change to blue, background shift to blue-50
- File selection: Smooth transition to file info display
- Upload progress: Animated progress bar (optional)

---

#### Build from Scratch Tab

**Design Direction:**
Multi-step form with clear progress indication and intuitive navigation.

**Components:**
1. **Step Indicator**
   - Horizontal scrollable on mobile
   - Shows all 8 steps: Header, Summary, Skills, Experience, Projects, Education, Certifications, Review
   - Current step: Highlighted (blue background, white text)
   - Completed steps: Checkmark icon
   - Future steps: Light background

2. **Form Section**
   - Step title (24px, bold)
   - Step description (14px, slate-600)
   - Form inputs with labels
   - Required field indicator (*)
   - Placeholder text for guidance

3. **Navigation Buttons**
   - Previous button (outline, left-aligned)
   - Next button (primary, right-aligned, with chevron icon)
   - Disabled state on first/last steps

4. **Completion CTA**
   - "Continue to Editor" button (green background, full width)
   - Chevron icon

**Form Fields:**
- Text inputs: 48px height, 14px font, rounded 6px
- Textareas: 120px height, 14px font, rounded 6px
- Labels: 12px, bold, slate-700
- Helper text: 12px, slate-500, below input

**Validation:**
- Red border on error
- Error message below field (12px, red-600)
- Prevent form submission if invalid

---

### Resume Editor Page

#### Three-Column Layout

**Design Direction:**
Professional editor interface with sidebar controls, center editing panel, and live preview.

**Left Sidebar (25% width on desktop):**
- Template selector dropdown
- Job description selector dropdown
- Preview/Edit toggle buttons
- Export PDF button (primary blue, full width)
- Sections list with visibility toggles

**Center Panel (50% width on desktop):**
- Section-specific form inputs
- Real-time validation
- Save/Cancel buttons at bottom

**Right Panel (25% width on desktop):**
- Live resume preview
- Updates instantly as user types
- Scrollable
- Print-friendly styling

**Mobile Layout:**
- Stack to single column
- Use tabs to switch between editor/preview
- Sidebar becomes bottom sheet

---

#### Template Selector

**Design:**
- Dropdown with all 4 templates
- Show template name and brief description
- Icon or color swatch for visual identification
- On selection: Preview updates immediately

---

#### Job Description Selector

**Design:**
- Dropdown with preset jobs
- Custom input field for job description
- Show keyword match score (e.g., "72% match")
- Suggested keywords panel below (optional)

---

#### Resume Preview

**Design:**
- Render resume using selected template styles
- Show all visible sections
- Print-friendly colors and fonts
- Scrollable on small screens
- "Export PDF" button above preview

---

### Documentation Page

#### Tabs Navigation

**Design:**
- Three tabs: Build Guide, UI/UX Prompts, TTS Prompts
- Tab styling: Active tab has blue underline, inactive tabs are slate-600
- Tab content: Card-based layout with sections

**Build Guide Tab:**
- Sections: What is HexaCv, Two Ways to Start, Key Features, Resume Sections, Template Selection, Exporting, About HexaStack
- Each section: Heading (18px, bold), content (14px), bullet points or paragraphs

**UI/UX Prompts Tab:**
- Sections: Landing Page, Resume Builder, Resume Editor, Color Palette, Typography, Mobile Responsiveness
- Design mockups or descriptions
- Color swatches
- Typography samples

**TTS Prompts Tab:**
- Sections: One per page/feature
- Format: [Style Instructions]: [Spoken Text]
- Code block styling for prompts
- Voice and language specifications

---

## TTS Narration Prompts

All TTS prompts follow the **tts-prompter format** for Stitch AI integration:

```
[Style Instructions]: [Spoken Text]
```

### Landing Page Hero

**Prompt:**
```
Speak in English with a professional, confident, and welcoming tone: Build your perfect resume in minutes. Upload your existing resume or build from scratch. Tailor your CV to any job description with AI-powered alignment. Export a polished PDF instantly. HexaCv is powered by HexaStack Solutions.
```

**Voice:** Charon (Informative)  
**Language:** en-US  
**Speed:** 1.0x  
**Emotion:** Confident, Professional

---

### Features Section

**Prompt:**
```
Speak in English with an enthusiastic and informative tone: HexaCv offers six powerful features. Smart Upload: Upload PDF, Word, or text files and automatically parse your resume content. AI-Powered: Align your resume to any job description and get keyword suggestions. Job Targeting: Select from preset jobs or add custom job descriptions. Multiple Templates: Choose from four professional designs. Instant Export: Download your resume as a beautifully formatted PDF. Mobile Ready: Build and edit your resume on any device.
```

**Voice:** Puck (Upbeat)  
**Language:** en-US  
**Speed:** 1.0x  
**Emotion:** Enthusiastic, Encouraging

---

### Resume Builder - Upload Tab

**Prompt:**
```
Speak in English with a helpful and encouraging tone: Upload your existing resume to get started. HexaCv supports PDF, Word documents, and plain text files. Simply drag and drop your file or click to browse. Your resume will be automatically parsed and organized into standard sections.
```

**Voice:** Leda (Youthful)  
**Language:** en-US  
**Speed:** 0.95x  
**Emotion:** Helpful, Encouraging

---

### Resume Builder - Build from Scratch Tab

**Prompt:**
```
Speak in English with a clear and instructional tone: Build your resume from scratch using our guided form. Fill in your information section by section: Header with your contact information, Professional Summary, Skills organized by category, Work Experience with detailed descriptions, Projects you've worked on, Education and degrees, and Certifications. Take your time to provide accurate and detailed information.
```

**Voice:** Charon (Informative)  
**Language:** en-US  
**Speed:** 1.0x  
**Emotion:** Clear, Instructional

---

### Template Selection

**Prompt:**
```
Speak in English with a professional and advisory tone: Choose the template that best matches your career stage and industry. Classic ATS Blue is a traditional single-column design optimized for ATS systems, best for corporate roles. Minimal Executive is a clean, modern aesthetic ideal for senior positions. Modern Sidebar Lite is a contemporary two-column layout perfect for creative professionals. Technical Compact is a dense, tech-focused design great for developers and engineers.
```

**Voice:** Rasalgethi (Informative)  
**Language:** en-US  
**Speed:** 1.0x  
**Emotion:** Professional, Advisory

---

### Job Description Targeting

**Prompt:**
```
Speak in English with an informative and supportive tone: Select a job description to tailor your resume. Choose from preset roles like Full-Stack Developer, Frontend Engineer, Backend Engineer, DevOps Engineer, Data Scientist, or Product Manager. Or enter a custom job description. HexaCv will analyze the job requirements and suggest keywords and content improvements to align your resume.
```

**Voice:** Aoede (Breezy)  
**Language:** en-US  
**Speed:** 0.95x  
**Emotion:** Informative, Supportive

---

### Resume Editor

**Prompt:**
```
Speak in English with a calm and instructional tone: You're now in the resume editor. On the left, you'll see all your resume sections. Click any section to edit its content. Your changes appear instantly in the live preview on the right. You can reorder sections by dragging, toggle section visibility, and edit bullets inline. When you're satisfied, click Export PDF to download your resume.
```

**Voice:** Charon (Informative)  
**Language:** en-US  
**Speed:** 1.0x  
**Emotion:** Calm, Instructional

---

### PDF Export

**Prompt:**
```
Speak in English with an encouraging and professional tone: Your resume is ready to export. Click the Export PDF button to download a beautifully formatted PDF file. The PDF is optimized for both screen viewing and printing. You can download it as many times as you'd like and customize it further in the editor.
```

**Voice:** Sulafat (Warm)  
**Language:** en-US  
**Speed:** 0.95x  
**Emotion:** Encouraging, Professional

---

### Documentation Page

**Prompt:**
```
Speak in English with a helpful and informative tone: Welcome to HexaCv documentation. This guide covers everything you need to know about building and managing your resume. HexaCv is an AI-powered resume builder developed by Surag and Anandu Krishna at HexaStack Solutions. Visit hexastacksolutions.com to learn more. You can upload an existing resume or build from scratch. Choose from four professional templates. Tailor your resume to any job description. Export your resume as a PDF with one click.
```

**Voice:** Charon (Informative)  
**Language:** en-US  
**Speed:** 1.0x  
**Emotion:** Helpful, Informative

---

### About HexaStack Solutions

**Prompt:**
```
Speak in English with a professional and proud tone: HexaCv is developed by Surag and Anandu Krishna at HexaStack Solutions. HexaStack Solutions is dedicated to building innovative tools that help professionals succeed. Visit www.hexastacksolutions.com to learn more about our work and other products.
```

**Voice:** Algieba (Smooth)  
**Language:** en-US  
**Speed:** 1.0x  
**Emotion:** Professional, Proud

---

## Visual Style Guide

### Color Palette

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Primary Blue | #1e40af | 30, 64, 175 | Primary CTA, headers, accents |
| Secondary Blue | #3b82f6 | 59, 130, 246 | Secondary elements, hover states |
| Accent Cyan | #0284c7 | 2, 132, 199 | Highlights, borders |
| Dark Slate | #0f172a | 15, 23, 42 | Text, dark backgrounds |
| Slate 900 | #1f2937 | 31, 41, 55 | Body text |
| Slate 700 | #374151 | 55, 65, 81 | Secondary text |
| Slate 600 | #4b5563 | 75, 85, 99 | Tertiary text |
| Light Slate | #f8fafc | 248, 250, 252 | Light backgrounds |
| White | #ffffff | 255, 255, 255 | Backgrounds, cards |
| Success Green | #16a34a | 22, 163, 74 | Success states |
| Error Red | #dc2626 | 220, 38, 38 | Error states |
| Warning Orange | #ea580c | 234, 88, 12 | Warning states |

---

### Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Hero Heading | Inter | 700 | 48px | 1.2 |
| Page Heading | Inter | 700 | 32px | 1.25 |
| Section Heading | Inter | 700 | 24px | 1.3 |
| Subsection Heading | Inter | 600 | 18px | 1.4 |
| Body Text | Inter | 400 | 16px | 1.6 |
| Small Text | Inter | 400 | 14px | 1.5 |
| Label Text | Inter | 500 | 12px | 1.4 |
| Code/Monospace | JetBrains Mono | 400 | 12px | 1.5 |

---

### Spacing System

| Size | Value | Usage |
|------|-------|-------|
| xs | 4px | Micro spacing |
| sm | 8px | Small gaps |
| md | 16px | Default spacing |
| lg | 24px | Section spacing |
| xl | 32px | Large gaps |
| 2xl | 48px | Major sections |
| 3xl | 64px | Page sections |

---

### Border Radius

| Size | Value | Usage |
|------|-------|-------|
| sm | 4px | Small elements |
| md | 6px | Default |
| lg | 8px | Cards, buttons |
| xl | 12px | Large components |
| full | 9999px | Pills, circles |

---

### Shadows

| Level | CSS | Usage |
|-------|-----|-------|
| sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle |
| md | 0 4px 6px rgba(0,0,0,0.1) | Default |
| lg | 0 10px 15px rgba(0,0,0,0.1) | Elevated |
| xl | 0 20px 25px rgba(0,0,0,0.1) | High elevation |

---

## Responsive Design Guidelines

### Breakpoints

| Device | Width | Usage |
|--------|-------|-------|
| Mobile | 320px - 640px | Phones |
| Tablet | 641px - 1024px | Tablets, small laptops |
| Desktop | 1025px+ | Desktops, large screens |

### Mobile-First Approach

1. **Design for mobile first** (320px width)
2. **Enhance for tablet** (641px breakpoint)
3. **Optimize for desktop** (1025px breakpoint)

### Responsive Patterns

**Navigation:**
- Mobile: Hamburger menu or bottom navigation
- Tablet: Top navigation with condensed menu
- Desktop: Full top navigation with all links

**Layouts:**
- Mobile: Single column, stacked vertically
- Tablet: Two-column layout
- Desktop: Three-column or multi-column layouts

**Typography:**
- Mobile: Smaller font sizes (14px-16px)
- Tablet: Medium font sizes (16px-18px)
- Desktop: Larger font sizes (16px-24px)

**Images:**
- Mobile: 100% width, optimized for mobile
- Tablet: 80% width or constrained
- Desktop: Full width with max-width constraint

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

1. **Color Contrast**
   - Text: Minimum 4.5:1 ratio for normal text
   - Large text: Minimum 3:1 ratio
   - UI components: Minimum 3:1 ratio

2. **Focus Indicators**
   - All interactive elements have visible focus ring
   - Focus ring color: Primary blue (#1e40af)
   - Focus ring width: 2px
   - Focus ring offset: 2px

3. **Keyboard Navigation**
   - All functionality available via keyboard
   - Tab order follows visual flow
   - No keyboard traps

4. **Screen Reader Support**
   - Semantic HTML (headings, lists, labels)
   - ARIA labels for icon-only buttons
   - Form labels associated with inputs
   - Alt text for images

5. **Motion & Animation**
   - Respect `prefers-reduced-motion` media query
   - No auto-playing videos or animations
   - Animations under 3 seconds

6. **Form Accessibility**
   - All form fields have labels
   - Error messages clearly associated with fields
   - Required fields indicated with asterisk (*)
   - Form validation messages in plain language

---

## Implementation Notes

### Using These Prompts

1. **UI/UX Prompts:** Use as reference when designing or developing each page
2. **TTS Prompts:** Integrate with Stitch AI or similar TTS service
3. **Design System:** Reference color palette, typography, and spacing for consistency
4. **Responsive:** Test on mobile, tablet, and desktop breakpoints
5. **Accessibility:** Verify WCAG 2.1 AA compliance before launch

### Brand Consistency

- Always credit "HexaStack Solutions" and "Surag & Anandu Krishna"
- Use primary blue (#1e40af) for primary CTAs
- Maintain professional, modern aesthetic throughout
- Include website link (https://www.hexastacksolutions.com/) in footer

---

## Credits

**Prepared by:** Surag & Anandu Krishna  
**Organization:** HexaStack Solutions  
**Website:** https://www.hexastacksolutions.com/  
**Application:** HexaCv - AI Resume Builder  
**Date:** June 2026

All rights reserved. © 2026 HexaStack Solutions.
