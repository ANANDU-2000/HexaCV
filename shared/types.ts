// Resume Section Types
export type ResumeSectionType = 'header' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'achievements' | 'languages' | 'references' | 'custom';

export interface ResumeHeader {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: { label: string; url: string }[];
  jobTitle?: string;
  targetRole?: string;
  // Structured location fields (optional — backward compatible)
  countryCode?: string;                    // ISO 3166-1 alpha-2 (e.g. "IN", "US")
  locationFields?: Record<string, string>; // e.g. { state: "Kerala", city: "Kochi", postalCode: "682001" }
  targetCountryCode?: string;              // ISO 3166-1 alpha-2 (e.g. "US", "CA")
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string[];
  /** C4 — per-bullet manual-edit flags (parallel to description). */
  descriptionEdited?: boolean[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  date?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link?: string;
}

export interface Language {
  language: string;
  proficiency: string; // e.g. Native, Fluent, Conversational
}

export interface Reference {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  availableOnRequest: boolean;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  order: number;
  visible: boolean;
  content: {
    header?: ResumeHeader;
    summary?: string;
    /** C4 — true when user manually edited the summary. */
    summaryUserEdited?: boolean;
    skills?: SkillCategory[];
    experiences?: Experience[];
    projects?: Project[];
    educations?: Education[];
    certifications?: Certification[];
    achievements?: string[];
    languages?: Language[];
    references?: Reference[];
    customSections?: CustomSection[];
  };
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  jobDescriptionId?: string;
  sections: ResumeSection[];
  createdAt: Date;
  updatedAt: Date;
}

// Template Types
export type TemplateId = 'classic-ats-blue' | 'minimal-executive' | 'modern-sidebar-lite' | 'technical-compact' | 'crystalline-professional';

export interface TemplateStyles {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: 'single-column' | 'two-column' | 'sidebar';
  spacing: 'compact' | 'normal' | 'spacious';
  cornerRadius: number;
}

export interface ResumeTemplate {
  id: TemplateId;
  name: string;
  description: string;
  preview: string;
  styles: TemplateStyles;
}

// Job Description Types
export interface JobDescription {
  id: string;
  userId?: string;
  title: string;
  description: string;
  keywords: string[];
  isCustom: boolean;
  createdAt: Date;
}

// Parsed Resume Types
export interface ParsedResume {
  header: Partial<ResumeHeader>;
  summary: string;
  skills: SkillCategory[];
  experiences: Experience[];
  projects: Project[];
  educations: Education[];
  certifications: Certification[];
  achievements?: string[];
  languages?: Language[];
  references?: Reference[];
  customSections?: CustomSection[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==========================================
// B3 — AI quotas / spend ceiling
// ==========================================

export type AiPlanTier = "guest" | "free" | "paid";

export type AiQuotaConfig = {
  guestDailyCalls: number;
  freeDailyCalls: number;
  paidDailyCalls: number;
  dailySpendCeilingUsd: number;
};

export type AiQuotaStatus = {
  planTier: AiPlanTier;
  usedToday: number;
  limit: number;
  remaining: number;
  globalSpendUsdToday: number;
  globalSpendCeilingUsd: number;
  premiumBlockedBySpend: boolean;
};

// ==========================================
// C1 — thin pipeline stages
// ==========================================

export type AiPipelineStage = "extract" | "target" | "rewrite";

export type PipelineTargetProfile = {
  keywords: string[];
  mustHaves: string[];
  countryAtsNotes: string[];
};

export type PipelineExtractFacts = {
  name: string;
  email: string;
  phone: string;
  location: string;
  roles: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  otherFacts: string[];
};

export type ResumePipelineInput = {
  sourceText: string;
  jobTitle: string;
  jobDescription?: string;
  market?: string;
  experienceLevel?: string;
};

// ==========================================
// C3 — deterministic rewrite evaluation
// ==========================================

export type RewriteEvaluation = {
  overall: number;
  passed: boolean;
  bannedHits: string[];
  groundingScore: number;
  hasRealContent: boolean;
  reasons: string[];
};
