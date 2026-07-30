# HexaCV — Data Model Reference

Prepared for: Anandu / HexaStack Solutions

**Live schema source of truth:** [`drizzle/schema.ts`](../../drizzle/schema.ts).  
For as-built table inventory and gaps, see [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3.

This document captures the application-level TypeScript shapes and
illustrative SQL historically documented in the old root
`ARCHITECTURE.md`. Prefer Drizzle types when they diverge from the
snippets below.

---

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

---

## Illustrative SQL (historical)

These CREATE TABLE snippets are documentation aids. The actual
schema is defined and migrated via Drizzle.

### Users

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

### Resumes

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

### Job Descriptions

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

---

## State management notes

**Global state (React Context):** current resume, selected template,
job description, auth, UI modals.

**Local state:** form inputs, preview scroll, section expansion.

**Persistent (localStorage):** draft resumes (guest mode),
preferences, recently used job descriptions.

Guest → cloud migration on login is handled by the app; see
[`ARCHITECTURE.md`](./ARCHITECTURE.md) and
[`../product/USER_FLOW.md`](../product/USER_FLOW.md).
