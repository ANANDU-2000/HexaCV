import { ParsedResume, ResumeHeader, Experience, Education, Certification, Project, SkillCategory } from '@shared/types';

/**
 * Parse resume text content into structured sections
 */
export function parseResumeText(text: string): ParsedResume {
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

  return {
    header: parseHeader(lines),
    summary: parseSummary(lines),
    skills: parseSkills(lines),
    experiences: parseExperiences(lines),
    projects: parseProjects(lines),
    educations: parseEducations(lines),
    certifications: parseCertifications(lines),
  };
}

/**
 * Extract header information (name, email, phone, location)
 */
function parseHeader(lines: string[]): Partial<ResumeHeader> {
  const header: Partial<ResumeHeader> = {
    links: [],
  };

  // First non-empty line is usually the name
  if (lines.length > 0) {
    header.name = lines[0];
  }

  // Look for email, phone, location
  for (const line of lines.slice(0, 10)) {
    if (line.includes('@')) {
      header.email = extractEmail(line);
    }
    if (line.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)) {
      header.phone = extractPhone(line);
    }
    if (line.match(/^[A-Z][a-z]+,\s*[A-Z]{2}/)) {
      header.location = line;
    }
  }

  return header;
}

/**
 * Extract email from text
 */
function extractEmail(text: string): string | undefined {
  const match = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  return match ? match[0] : undefined;
}

/**
 * Extract phone number from text
 */
function extractPhone(text: string): string | undefined {
  const match = text.match(/[\d\s\-().+]+/);
  return match ? match[0].trim() : undefined;
}

/**
 * Parse professional summary section
 */
function parseSummary(lines: string[]): string {
  const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
  let inSummary = false;
  const summaryLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Check for summary section header
    if (summaryKeywords.some((keyword) => line.includes(keyword))) {
      inSummary = true;
      continue;
    }

    // Stop at next section
    if (inSummary && isSectionHeader(line)) {
      break;
    }

    // Collect summary lines
    if (inSummary && lines[i].length > 0) {
      summaryLines.push(lines[i]);
    }
  }

  return summaryLines.join(' ').substring(0, 500);
}

/**
 * Parse skills section
 */
function parseSkills(lines: string[]): SkillCategory[] {
  const skillsKeywords = ['skills', 'technical skills', 'competencies'];
  const skills: SkillCategory[] = [];
  let inSkills = false;
  let currentCategory = 'Technical Skills';
  let currentSkills: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Check for skills section header
    if (skillsKeywords.some((keyword) => line.includes(keyword))) {
      inSkills = true;
      continue;
    }

    // Stop at next section
    if (inSkills && isSectionHeader(line)) {
      if (currentSkills.length > 0) {
        skills.push({ category: currentCategory, skills: currentSkills });
      }
      break;
    }

    // Parse skill lines
    if (inSkills && lines[i].length > 0) {
      // Check if this is a category header
      if (lines[i].match(/^[A-Z][a-z\s]+:?$/)) {
        if (currentSkills.length > 0) {
          skills.push({ category: currentCategory, skills: currentSkills });
        }
        currentCategory = lines[i].replace(/:$/, '');
        currentSkills = [];
      } else {
        // Parse individual skills (comma-separated or bullet points)
        const skillList = lines[i]
          .replace(/^[-•*]\s*/, '')
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        currentSkills.push(...skillList);
      }
    }
  }

  // Add last category if exists
  if (currentSkills.length > 0) {
    skills.push({ category: currentCategory, skills: currentSkills });
  }

  return skills;
}

/**
 * Parse experience section
 */
function parseExperiences(lines: string[]): Experience[] {
  const experienceKeywords = ['experience', 'work experience', 'employment'];
  const experiences: Experience[] = [];
  let inExperience = false;
  let currentExp: Partial<Experience> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check for experience section header
    if (experienceKeywords.some((keyword) => lowerLine.includes(keyword))) {
      inExperience = true;
      continue;
    }

    // Stop at next section
    if (inExperience && isSectionHeader(lowerLine)) {
      if (currentExp.company) {
        experiences.push(currentExp as Experience);
      }
      break;
    }

    // Parse experience entries
    if (inExperience && line.length > 0) {
      // Check for company/role line
      if (line.match(/[A-Z]/)) {
        if (currentExp.company) {
          experiences.push(currentExp as Experience);
        }
        currentExp = {
          id: Math.random().toString(36),
          company: line,
          role: '',
          startDate: '',
          endDate: '',
          current: false,
          description: [],
        };
      } else if (line.match(/\d{4}/)) {
        // Likely a date line
        const dateMatch = line.match(/(\d{4}|[A-Z][a-z]+)\s*[-–]\s*(\d{4}|[A-Z][a-z]+|Present|Current)/);
        if (dateMatch) {
          currentExp.startDate = dateMatch[1];
          currentExp.endDate = dateMatch[2];
          currentExp.current = dateMatch[2].toLowerCase().includes('present') || dateMatch[2].toLowerCase().includes('current');
        }
      } else {
        // Likely a description line
        if (currentExp.description) {
          currentExp.description.push(line);
        }
      }
    }
  }

  // Add last experience if exists
  if (currentExp.company) {
    experiences.push(currentExp as Experience);
  }

  return experiences;
}

/**
 * Parse projects section
 */
function parseProjects(lines: string[]): Project[] {
  const projectKeywords = ['projects', 'portfolio', 'notable projects'];
  const projects: Project[] = [];
  let inProjects = false;
  let currentProject: Partial<Project> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check for projects section header
    if (projectKeywords.some((keyword) => lowerLine.includes(keyword))) {
      inProjects = true;
      continue;
    }

    // Stop at next section
    if (inProjects && isSectionHeader(lowerLine)) {
      if (currentProject.name) {
        projects.push(currentProject as Project);
      }
      break;
    }

    // Parse project entries
    if (inProjects && line.length > 0) {
      if (line.match(/^[-•*]/)) {
        if (currentProject.name) {
          projects.push(currentProject as Project);
        }
        currentProject = {
          id: Math.random().toString(36),
          name: line.replace(/^[-•*]\s*/, ''),
          description: '',
          technologies: [],
        };
      }
    }
  }

  // Add last project if exists
  if (currentProject.name) {
    projects.push(currentProject as Project);
  }

  return projects;
}

/**
 * Parse education section
 */
function parseEducations(lines: string[]): Education[] {
  const educationKeywords = ['education', 'academic', 'degree'];
  const educations: Education[] = [];
  let inEducation = false;
  let currentEdu: Partial<Education> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check for education section header
    if (educationKeywords.some((keyword) => lowerLine.includes(keyword))) {
      inEducation = true;
      continue;
    }

    // Stop at next section
    if (inEducation && isSectionHeader(lowerLine)) {
      if (currentEdu.institution) {
        educations.push(currentEdu as Education);
      }
      break;
    }

    // Parse education entries
    if (inEducation && line.length > 0) {
      if (line.match(/University|College|Institute|School/i)) {
        if (currentEdu.institution) {
          educations.push(currentEdu as Education);
        }
        currentEdu = {
          id: Math.random().toString(36),
          institution: line,
          degree: '',
          field: '',
          graduationDate: '',
        };
      } else if (line.match(/\d{4}/)) {
        currentEdu.graduationDate = line;
      }
    }
  }

  // Add last education if exists
  if (currentEdu.institution) {
    educations.push(currentEdu as Education);
  }

  return educations;
}

/**
 * Parse certifications section
 */
function parseCertifications(lines: string[]): Certification[] {
  const certKeywords = ['certifications', 'certificates', 'credentials'];
  const certifications: Certification[] = [];
  let inCerts = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check for certifications section header
    if (certKeywords.some((keyword) => lowerLine.includes(keyword))) {
      inCerts = true;
      continue;
    }

    // Stop at next section
    if (inCerts && isSectionHeader(lowerLine)) {
      break;
    }

    // Parse certification entries
    if (inCerts && line.length > 0 && line.match(/^[-•*]/)) {
      const cert: Certification = {
        id: Math.random().toString(36),
        name: line.replace(/^[-•*]\s*/, ''),
        issuer: '',
        date: '',
      };
      certifications.push(cert);
    }
  }

  return certifications;
}

/**
 * Check if a line is a section header
 */
function isSectionHeader(line: string): boolean {
  const headers = [
    'summary',
    'objective',
    'skills',
    'experience',
    'education',
    'projects',
    'certifications',
    'languages',
    'awards',
    'publications',
    'volunteer',
    'references',
  ];

  return headers.some((header) => line.toLowerCase().includes(header));
}

/**
 * Calculate keyword match score between resume and job description
 */
export function calculateKeywordMatch(resumeText: string, jobKeywords: string[]): number {
  const resumeLower = resumeText.toLowerCase();
  let matches = 0;

  for (const keyword of jobKeywords) {
    if (resumeLower.includes(keyword.toLowerCase())) {
      matches++;
    }
  }

  return Math.round((matches / jobKeywords.length) * 100);
}
