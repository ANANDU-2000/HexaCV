# HexaCv Architecture & Data Model

## Project Overview

**HexaCv** is a full-stack PWA resume builder application that enables users to upload, build, edit, and export professional resumes with AI-powered job description alignment. The application is branded under **HexaStack Solutions** (Surag & Anandu Krishna).

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19, TypeScript, Tailwind CSS 4 | UI components, state management, responsive design |
| Backend | Express.js, tRPC 11 | API routes, business logic, authentication |
| Database | MySQL/TiDB | User data, saved resumes, templates |
| Storage | S3 (via Manus) | PDF exports, user files |
| Auth | Manus OAuth | User authentication and session management |
| PWA | Service Worker, Web App Manifest | Offline support, installability |
| PDF Generation | jsPDF + html2canvas | Client-side PDF export |
| File Parsing | pdf-parse, mammoth, text extraction | Resume content extraction |

## Core Data Model

### Resume Structure

```typescript
interface Resume {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  jobDescriptionId?: string;
  sections: ResumeSection[];
  createdAt: Date;
  updatedAt: Date;
}

interface ResumeSection {
  id: string;
  type: 'header' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications';
  order: number;
  visible: boolean;
  content: SectionContent;
}

interface SectionContent {
  // Header
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: { label: string; url: string }[];

  // Summary
  summary?: string;

  // Skills
  skills?: SkillCategory[];

  // Experience
  experiences?: Experience[];

  // Projects
  projects?: Project[];

  // Education
  educations?: Education[];

  // Certifications
  certifications?: Certification[];
}

interface SkillCategory {
  category: string;
  skills: string[];
}

interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string[];
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  date?: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

interface Certification {
  name: string;
  issuer: string;
  date: string;
  link?: string;
}
```

### Job Description Model

```typescript
interface JobDescription {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  isCustom: boolean;
  createdAt: Date;
}

// Preset job descriptions
const PRESET_JOBS = [
  { title: 'Full-Stack Developer', description: '...' },
  { title: 'Frontend Engineer', description: '...' },
  { title: 'Backend Engineer', description: '...' },
  { title: 'DevOps Engineer', description: '...' },
  { title: 'Data Scientist', description: '...' },
  { title: 'Product Manager', description: '...' },
  // ... more presets
];
```

### Template Model

```typescript
interface ResumeTemplate {
  id: 'classic-ats-blue' | 'minimal-executive' | 'modern-sidebar-lite' | 'technical-compact';
  name: string;
  description: string;
  preview: string;
  styles: TemplateStyles;
}

interface TemplateStyles {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: 'single-column' | 'two-column' | 'sidebar';
  spacing: 'compact' | 'normal' | 'spacious';
}
```

## Application Architecture

### Frontend Structure

```
client/src/
├── pages/
│   ├── Home.tsx                 # Landing page
│   ├── ResumeBuilder.tsx        # Main builder interface
│   ├── ResumeUpload.tsx         # Upload and parsing
│   ├── ResumeEditor.tsx         # Edit and preview
│   ├── Documentation.tsx        # In-app docs
│   └── NotFound.tsx
├── components/
│   ├── ResumeUploader.tsx       # File upload component
│   ├── ResumeParser.tsx         # Parse uploaded content
│   ├── SectionEditor.tsx        # Edit individual sections
│   ├── TemplateSelector.tsx     # Template chooser
│   ├── ResumePreview.tsx        # Live preview
│   ├── JobDescriptionSelector.tsx
│   ├── PDFExporter.tsx
│   └── ui/                      # shadcn/ui components
├── hooks/
│   ├── useResume.ts             # Resume state management
│   ├── useResumeParser.ts       # Parsing logic
│   └── useJobDescription.ts
├── lib/
│   ├── trpc.ts                  # tRPC client
│   ├── resumeParser.ts          # Client-side parsing
│   ├── pdfExport.ts             # PDF generation
│   └── templates.ts             # Template definitions
├── contexts/
│   ├── ResumeContext.tsx        # Global resume state
│   └── ThemeContext.tsx
└── App.tsx
```

### Backend Structure

```
server/
├── routers.ts                   # tRPC procedures
├── db.ts                        # Database queries
├── storage.ts                   # S3 operations
└── _core/
    ├── index.ts                 # Server entry
    ├── context.ts               # tRPC context
    ├── trpc.ts                  # tRPC setup
    └── ...
```

## Key Features & Implementation

### 1. Resume Upload & Parsing (Client-Side)

**Flow:**
1. User selects file (PDF, DOCX, TXT)
2. Client extracts text using appropriate library
3. Parser identifies resume sections using heuristics
4. Parsed data normalized into Resume structure
5. Auto-populate editor with extracted content

**Libraries:**
- `pdf-parse` or `pdfjs-dist` for PDF extraction
- `mammoth` for DOCX extraction
- Native text parsing for TXT

### 2. Resume Builder from Scratch

**Flow:**
1. Multi-step form guides user through sections
2. Each step focuses on one section (header, summary, skills, etc.)
3. Form validation ensures data quality
4. State persisted to browser localStorage
5. On completion, create Resume object

### 3. Job Description Targeting

**Flow:**
1. User selects preset job or enters custom description
2. Keywords extracted from job description
3. Resume content analyzed for keyword alignment
4. Suggestions provided for content enhancement
5. User can apply suggestions or manually edit

### 4. Template System

**Four Templates:**
1. **Classic ATS Blue** - Traditional, ATS-optimized, single-column
2. **Minimal Executive** - Clean, modern, minimal styling
3. **Modern Sidebar Lite** - Two-column with sidebar
4. **Technical Compact** - Dense, tech-focused layout

**Template Features:**
- Live preview in editor
- Customizable colors and fonts
- Responsive design for all screen sizes
- Print-friendly styling

### 5. PDF Export

**Flow:**
1. Render resume using selected template
2. Convert DOM to canvas using html2canvas
3. Generate PDF using jsPDF
4. Download to user's device

### 6. PWA Support

**Components:**
- `manifest.json` - Web app metadata
- `service-worker.js` - Offline caching
- Install prompt UI
- Offline shell with cached assets

**Offline Features:**
- App shell cached and available offline
- Previously built resumes accessible
- Editor functionality available offline
- Sync when connection restored

## Database Schema

### Users Table (Pre-existing)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Resumes Table
```sql
CREATE TABLE resumes (
  id VARCHAR(36) PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(255),
  templateId VARCHAR(50),
  jobDescriptionId VARCHAR(36),
  content JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Job Descriptions Table
```sql
CREATE TABLE jobDescriptions (
  id VARCHAR(36) PRIMARY KEY,
  userId INT,
  title VARCHAR(255),
  description TEXT,
  keywords JSON,
  isCustom BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## State Management

**Global State (React Context):**
- Current resume data
- Selected template
- Current job description
- User authentication state
- UI state (modal visibility, etc.)

**Local State (Component):**
- Form inputs
- Preview scroll position
- Section expansion state

**Persistent State (localStorage):**
- Draft resume data
- User preferences (template choice, theme)
- Recently used job descriptions

## API Routes (tRPC)

### Resume Routes
- `resume.list()` - Get user's resumes
- `resume.get(id)` - Get specific resume
- `resume.create(data)` - Create new resume
- `resume.update(id, data)` - Update resume
- `resume.delete(id)` - Delete resume
- `resume.export(id)` - Generate PDF

### Job Description Routes
- `jobDescription.list()` - Get preset and custom jobs
- `jobDescription.create(data)` - Create custom job description
- `jobDescription.delete(id)` - Delete custom job

## Security Considerations

1. **Authentication** - All protected routes require valid session
2. **Authorization** - Users can only access their own resumes
3. **File Upload** - Client-side only, no server upload
4. **PDF Export** - Generated client-side, no server processing
5. **Data Privacy** - Resume data stored encrypted in database

## Performance Optimization

1. **Code Splitting** - Lazy load template components
2. **Image Optimization** - Compress template previews
3. **Caching** - Service worker caches app shell
4. **Memoization** - React.memo for preview components
5. **Debouncing** - Debounce editor changes before save

## Responsive Design

| Breakpoint | Device | Layout |
|-----------|--------|--------|
| < 640px | Mobile | Single column, stacked sections |
| 640px - 1024px | Tablet | Two column with sidebar |
| > 1024px | Desktop | Three column (editor, preview, sidebar) |

## Branding & Styling

**HexaStack Solutions Identity:**
- Primary Color: Professional blue (#1e40af)
- Secondary Color: Accent teal (#0d9488)
- Font: Inter (headings), Segoe UI (body)
- Logo: HexaStack Solutions branding
- Founders: Surag & Anandu Krishna
- Website: https://www.hexastacksolutions.com/

## Development Workflow

1. **Feature Development** - Create feature branch
2. **Testing** - Write vitest tests
3. **Code Review** - Self-review before commit
4. **Checkpoint** - Save checkpoint before major milestone
5. **Deployment** - Publish via Manus UI

## Future Enhancements

- AI-powered content suggestions
- Real-time collaboration
- Resume analytics (keyword matching score)
- ATS compatibility checker
- Multiple language support
- Custom template builder
- Resume version history
