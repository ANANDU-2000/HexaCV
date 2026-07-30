// ResumeTemplate.types.ts
// Type definitions for the reusable resume template component.

export interface ResumeContact {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin?: string; // full URL
  github?: string; // full URL
  portfolio?: string; // full URL
  location: string;
}

export interface SkillCategory {
  label: string; // e.g. "Frontend"
  value: string; // e.g. "React, TypeScript, Tailwind CSS"
}

export interface ExperienceItem {
  title: string; // "Job Title | Company Name"
  dateRange: string; // "Jan 2024 – Present"
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  tag?: string; // e.g. "[Capstone]" or "↗ Live"
  stack: string; // tech stack string
  deployment?: string; // e.g. "[Deployed: Render]"
  bullets: string[];
}

export interface ProjectCategory {
  category: string; // e.g. "AI / Machine Learning"
  projects: ProjectItem[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  detail?: string; // grade / CGPA / distinction
  dateRange: string;
}

export interface ResumeData {
  contact: ResumeContact;
  summary: string;
  skills: SkillCategory[];
  experience: ExperienceItem[];
  projects: ProjectCategory[];
  education: EducationItem[];
  certifications?: string[];
  achievements?: string[];
}
