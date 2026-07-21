/**
 * Standard resume section order and header detection for PDF/DOC parsing.
 * 1 header → 2 summary → 3 skills → 4 experience → 5 projects →
 * 6 education → 7 certifications → 8 achievements → 9 languages → 10 references
 */

export const RESUME_SECTION_KEYS = [
  "header",
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
  "achievements",
  "languages",
  "references",
] as const;

export type ResumeSectionKey = (typeof RESUME_SECTION_KEYS)[number];

const SECTION_TITLE_MAP: Record<string, ResumeSectionKey> = {
  header: "header",
  contact: "header",
  "contact information": "header",
  "personal information": "header",
  summary: "summary",
  "professional summary": "summary",
  profile: "summary",
  "professional profile": "summary",
  objective: "summary",
  "career objective": "summary",
  "about me": "summary",
  skills: "skills",
  "technical skills": "skills",
  "core competencies": "skills",
  "key skills": "skills",
  competencies: "skills",
  expertise: "skills",
  "technology stack": "skills",
  "skills & competencies": "skills",
  "skills & expertise": "skills",
  "tools & technologies": "skills",
  experience: "experience",
  "work experience": "experience",
  employment: "experience",
  "work history": "experience",
  "career history": "experience",
  "professional experience": "experience",
  "internship experience": "experience",
  internships: "experience",
  projects: "projects",
  "personal projects": "projects",
  "key projects": "projects",
  "academic projects": "projects",
  "technical projects": "projects",
  "selected projects": "projects",
  "major projects": "projects",
  "side projects": "projects",
  "projects & experience": "projects",
  "notable projects": "projects",
  education: "education",
  "academic background": "education",
  "educational background": "education",
  "educational qualifications": "education",
  qualifications: "education",
  academics: "education",
  "academic profile": "education",
  "education & qualifications": "education",
  "education & certifications": "education",
  certifications: "certifications",
  certification: "certifications",
  credentials: "certifications",
  licenses: "certifications",
  courses: "certifications",
  "licenses & certifications": "certifications",
  "certifications & courses": "certifications",
  achievements: "achievements",
  achievement: "achievements",
  awards: "achievements",
  honors: "achievements",
  honours: "achievements",
  accomplishments: "achievements",
  "honors & awards": "achievements",
  "key achievements": "achievements",
  languages: "languages",
  language: "languages",
  "language proficiency": "languages",
  "languages spoken": "languages",
  references: "references",
  reference: "references",
  referees: "references",
};

/** Detect which resume section a line is a header for (supports #1, 1., 1) prefixes) */
export function detectSectionHeader(line: string): ResumeSectionKey | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 100) return null;

  let title = trimmed;
  // Remove leading bullets, numbers, markdown symbols
  const numbered = trimmed.match(/^(?:[#*•-]*\s*\d*[\.\):\-]*\s*)(.+)$/i);
  if (numbered && numbered[1]) {
    title = numbered[1].trim();
  }

  const normalized = title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (SECTION_TITLE_MAP[normalized]) {
    return SECTION_TITLE_MAP[normalized];
  }

  // Partial match for short section header lines only
  if (title.length <= 55) {
    const checks: [RegExp, ResumeSectionKey][] = [
      [/^(professional\s+)?(summary|profile|objective)\b/i, "summary"],
      [
        /(technical\s+)?skills?(\s*&\s*(competencies|expertise|tools))?\b/i,
        "skills",
      ],
      [
        /(work|professional|career)\s+experience|employment|work\s+history|internships?/i,
        "experience",
      ],
      [
        /^(personal|academic|technical|selected|key|major|side|notable\s+)?projects?\b/i,
        "projects",
      ],
      [/projects?\b/i, "projects"],
      [
        /^(academic\s+)?education|academic\s+background|educational\s+qualifications|academics\b/i,
        "education",
      ],
      [/education\b/i, "education"],
      [/certifications?|credentials|licenses?|courses?\b/i, "certifications"],
      [
        /achievements?|awards?|honors?|honours?|accomplishments?\b/i,
        "achievements",
      ],
      [/languages?\b/i, "languages"],
      [/references?|referees?\b/i, "references"],
    ];
    for (const [pattern, key] of checks) {
      if (pattern.test(title)) return key;
    }
  }

  return null;
}

const PROFICIENCY_PATTERN =
  /native|fluent|conversational|professional|basic|intermediate|advanced|bilingual|working|proficient|mother\s*tongue/i;

/** Parse a language line: "English - Native", "French (Fluent)", "Hindi: Conversational" */
export function parseLanguageLine(
  line: string
): { language: string; proficiency: string } | null {
  const cleaned = line.replace(/^[•\-*]\s*/, "").trim();
  if (!cleaned || cleaned.length < 2) return null;

  const paren = cleaned.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    return { language: paren[1].trim(), proficiency: paren[2].trim() };
  }

  const separated = cleaned.match(/^(.+?)\s*[-–—:|]\s*(.+)$/);
  if (separated && PROFICIENCY_PATTERN.test(separated[2])) {
    return { language: separated[1].trim(), proficiency: separated[2].trim() };
  }

  if (/^[A-Za-zÀ-ÿ\s]+$/.test(cleaned) && cleaned.length < 40) {
    return { language: cleaned, proficiency: "" };
  }

  return null;
}

/** Parse achievement / award bullet */
export function parseAchievementLine(line: string): string | null {
  const cleaned = line.replace(/^[•\-*]\s*/, "").trim();
  if (!cleaned || cleaned.length < 3) return null;
  if (/^(achievements?|awards?|honors?)\s*$/i.test(cleaned)) return null;
  return cleaned;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

/** Parse a reference line or block fragment */
export function parseReferenceLine(line: string): {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  availableOnRequest: boolean;
} | null {
  const cleaned = line.replace(/^[•\-*]\s*/, "").trim();
  if (!cleaned) return null;

  if (/available\s+(?:on|upon)\s+request/i.test(cleaned)) {
    return {
      name: "",
      title: "",
      company: "",
      email: "",
      phone: "",
      availableOnRequest: true,
    };
  }

  const emailMatch = cleaned.match(EMAIL_RE);
  const phoneMatch = cleaned.match(PHONE_RE);
  const email = emailMatch ? emailMatch[0] : "";
  const phone = phoneMatch ? phoneMatch[0] : "";

  let remainder = cleaned
    .replace(EMAIL_RE, "")
    .replace(PHONE_RE, "")
    .replace(/^[|,\s-]+|[|,\s-]+$/g, "")
    .trim();

  let name = remainder;
  let title = "";
  let company = "";

  if (remainder.includes("|")) {
    const parts = remainder
      .split("|")
      .map(p => p.trim())
      .filter(Boolean);
    name = parts[0] || "";
    title = parts[1] || "";
    company = parts[2] || "";
  } else if (remainder.includes(" - ")) {
    const parts = remainder
      .split(" - ")
      .map(p => p.trim())
      .filter(Boolean);
    name = parts[0] || "";
    title = parts[1] || "";
    company = parts[2] || "";
  } else if (remainder.includes(",")) {
    const parts = remainder
      .split(",")
      .map(p => p.trim())
      .filter(Boolean);
    name = parts[0] || "";
    if (parts.length >= 2) title = parts[1];
    if (parts.length >= 3) company = parts[2];
  }

  if (!name && !email && !phone) return null;

  return {
    name,
    title,
    company,
    email,
    phone,
    availableOnRequest: false,
  };
}
