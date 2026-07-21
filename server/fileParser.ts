import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
import mammoth from "mammoth";
import { invokeLLM } from "./_core/llm";
import { ParsedResume } from "../shared/types";
import { nanoid } from "nanoid";
import {
  isPlaceholderText,
  isAiGeneratedPhrase,
  textGroundedInSource,
  normalizeForMatch,
} from "./contentValidation";
import {
  detectSectionHeader,
  parseLanguageLine,
  parseAchievementLine,
  parseReferenceLine,
} from "./resumeSections";

export { textGroundedInSource } from "./contentValidation";

type ExperienceHint = { role?: string; company?: string; current?: boolean; startDate?: string };

/** Infer job title and target role directly from raw resume text and parsed experiences */
export function inferJobTitleAndTargetRole(
  text: string,
  experiences?: ExperienceHint[]
): { jobTitle: string; targetRole: string } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const jobTitleKeywords = [
    "engineer", "developer", "manager", "designer", "consultant", "analyst",
    "specialist", "lead", "architect", "expert", "officer", "administrator",
    "scientist", "intern", "associate", "director", "coordinator", "executive",
  ];

  let nameLineIndex = -1;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      line.length < 60 &&
      !line.includes("@") &&
      !line.includes("http") &&
      !/^\d+$/.test(line) &&
      !/^(resume|curriculum vitae|cv)$/i.test(line)
    ) {
      nameLineIndex = i;
      break;
    }
  }

  let jobTitle = "";
  if (nameLineIndex !== -1) {
    for (let i = nameLineIndex + 1; i < Math.min(nameLineIndex + 4, lines.length); i++) {
      const line = lines[i];
      const lower = line.toLowerCase();
      if (
        jobTitleKeywords.some((kw) => lower.includes(kw)) &&
        line.length < 70 &&
        !line.includes("@") &&
        !line.includes("http")
      ) {
        jobTitle = line;
        break;
      }
    }
  }

  let targetRole = "";
  const targetPatterns = [
    /(?:career\s+)?objective\s*[:\-]?\s*(.+)/i,
    /(?:professional\s+)?summary\s*[:\-]?\s*(seeking|looking|aspiring)[^.]{0,120}/i,
    /(?:target\s+role|desired\s+(?:position|role)|seeking\s+(?:a\s+)?(?:position|role))\s*[:\-]?\s*(.+)/i,
  ];
  for (const pattern of targetPatterns) {
    const match = text.match(pattern);
    if (match) {
      const extracted = (match[1] || match[0]).trim();
      if (extracted.length > 3 && extracted.length < 120) {
        targetRole = extracted.replace(/^(seeking|looking for|aspiring to become)\s+/i, "").trim();
        break;
      }
    }
  }

  if (!jobTitle) {
    const titleRegex =
      /(senior|lead|principal|staff|junior)?\s*(software|full[\s-]?stack|front[\s-]?end|back[\s-]?end|data|devops|product|ui\/ux|qa|machine learning)\s*(engineer|developer|scientist|manager|designer|analyst|architect)/i;
    const titleMatch = text.match(titleRegex);
    jobTitle = titleMatch ? titleMatch[0].trim() : "";
  }

  // Most recent / current experience role as job title fallback
  if (!jobTitle && experiences && experiences.length > 0) {
    const sorted = [...experiences].sort((a, b) => {
      if (a.current && !b.current) return -1;
      if (!a.current && b.current) return 1;
      return (b.startDate || "").localeCompare(a.startDate || "");
    });
    const recentRole = sorted.find((e) => e.role && !isPlaceholderText(e.role))?.role;
    if (recentRole) jobTitle = recentRole.trim();
  }

  // Headline-style target from document title line patterns
  if (!targetRole) {
    const headlineMatch = text.match(
      /(?:^|\n)\s*([A-Z][^\n@]{5,60}(?:engineer|developer|manager|designer|analyst|consultant|specialist|architect|scientist)[^\n@]{0,30})\s*(?:\n|$)/i
    );
    if (headlineMatch) {
      const candidate = headlineMatch[1].trim();
      if (candidate.length > 4 && candidate.length < 80 && !candidate.includes("@")) {
        targetRole = candidate;
      }
    }
  }

  if (!targetRole && jobTitle) {
    targetRole = jobTitle;
  }

  if (!jobTitle && targetRole) {
    jobTitle = targetRole;
  }

  return { jobTitle: jobTitle.trim(), targetRole: targetRole.trim() };
}

function resolveHeaderRole(
  value: string | undefined,
  sourceText: string,
  inferred: string
): string {
  const cleaned = (value || "").trim();
  if (
    cleaned &&
    !isPlaceholderText(cleaned) &&
    textGroundedInSource(cleaned, sourceText, 0.45)
  ) {
    return cleaned;
  }
  return inferred;
}

/** Strip LLM-hallucinated or ungrounded content from parsed resume */
function validateParsedAgainstSource(sourceText: string, parsed: ParsedResume): ParsedResume {
  const header = { ...parsed.header };

  if (header.email && !textGroundedInSource(header.email, sourceText, 0.9)) {
    header.email = "";
  }
  if (header.phone && !textGroundedInSource(header.phone.replace(/\D/g, ""), sourceText.replace(/\D/g, ""), 0.7)) {
    const phoneDigits = header.phone.replace(/\D/g, "");
    if (phoneDigits.length >= 7 && !sourceText.replace(/\D/g, "").includes(phoneDigits)) {
      header.phone = "";
    }
  }
  if (header.name && !textGroundedInSource(header.name, sourceText, 0.5)) {
    const nameParts = header.name.split(/\s+/).filter((p) => p.length > 1);
    if (!nameParts.some((p) => textGroundedInSource(p, sourceText, 0.8))) {
      header.name = "";
    }
  }

  const summary =
    parsed.summary && textGroundedInSource(parsed.summary, sourceText, 0.45) && !isAiGeneratedPhrase(parsed.summary)
      ? parsed.summary
      : "";

  const skills = (parsed.skills || [])
    .map((group) => ({
      category: group.category,
      skills: (group.skills || []).filter(
        (s) => s && textGroundedInSource(s, sourceText, 0.6) && !isPlaceholderText(s)
      ),
    }))
    .filter((g) => g.skills.length > 0);

  const experiences = (parsed.experiences || [])
    .map((exp) => ({
      ...exp,
      description: (exp.description || []).filter(
        (b) => b && textGroundedInSource(b, sourceText, 0.45) && !isAiGeneratedPhrase(b)
      ),
    }))
    .filter(
      (exp) =>
        (exp.company || exp.role) &&
        !isPlaceholderText(exp.company) &&
        !isPlaceholderText(exp.role) &&
        (exp.description.length > 0 || textGroundedInSource(exp.company, sourceText, 0.5))
    );

  const projects = (parsed.projects || [])
    .map((p) => ({
      ...p,
      description:
        p.description &&
        textGroundedInSource(p.description, sourceText, 0.4) &&
        !isAiGeneratedPhrase(p.description)
          ? p.description
          : "",
      technologies: (p.technologies || []).filter(
        (t) => t && textGroundedInSource(t, sourceText, 0.6) && !isPlaceholderText(t)
      ),
    }))
    .filter(
      (p) => p.name && textGroundedInSource(p.name, sourceText, 0.5) && !isPlaceholderText(p.name)
    );

  const educations = (parsed.educations || [])
    .map(e => {
      let field = (e.field || "").trim();
      if (field.includes("•") || field.includes("- ") || field.length > 80 || /\b(developed|implemented|built|created|managed|designed|framework|express|node|react|django|api)\b/i.test(field)) {
        const parts = field.split(/[\n•;]| - /);
        const candidate = parts[0].replace(/^[•\-*]\s*/, "").trim();
        field = candidate.length <= 60 && !/\b(developed|built|implemented|created|managed|designed|framework|express|node|react|django|api)\b/i.test(candidate) ? candidate : "";
      }
      return { ...e, field };
    })
    .filter(
      (e) =>
        (e.institution || e.degree) &&
        !isPlaceholderText(e.institution) &&
        !isPlaceholderText(e.degree) &&
        (textGroundedInSource(e.institution, sourceText, 0.5) || textGroundedInSource(e.degree, sourceText, 0.5))
    );

  const certifications = (parsed.certifications || []).filter(
    (c) => c.name && textGroundedInSource(c.name, sourceText, 0.5) && !isPlaceholderText(c.name)
  );

  const achievements = (parsed.achievements || []).filter(
    (a) => a && textGroundedInSource(a, sourceText, 0.45) && !isAiGeneratedPhrase(a)
  );

  const languages = (parsed.languages || []).filter(
    (l) => l.language && textGroundedInSource(l.language, sourceText, 0.4)
  );

  const references = (parsed.references || []).filter(
    (r) => r.name && textGroundedInSource(r.name, sourceText, 0.6) && !isPlaceholderText(r.name)
  );

  const inferred = inferJobTitleAndTargetRole(sourceText, experiences);
  header.jobTitle = resolveHeaderRole(header.jobTitle, sourceText, inferred.jobTitle);
  header.targetRole = resolveHeaderRole(
    header.targetRole,
    sourceText,
    inferred.targetRole || inferred.jobTitle
  );

  return {
    ...parsed,
    header,
    summary,
    skills,
    experiences,
    projects,
    educations,
    certifications,
    achievements,
    languages,
    references,
  };
}

/**
 * Clean raw extracted text to remove consecutive duplicates, empty lines, and page numbers
 */
function cleanExtractedText(raw: string): string {
  if (!raw) return "";
  
  const lines = raw.split(/\r?\n/);
  const cleanedLines: string[] = [];
  const seenLongLines = new Set<string>();

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Filter out page numbers (e.g. Page 1 of 5, Page 3, 2 / 4, etc.)
    const pageNumRegex = /^(page\s+\d+(\s+of\s+\d+)?|\d+\s*\/\s*\d+|\bpage\b\s*\d+|-\s*\d+\s*-)$/i;
    if (pageNumRegex.test(line)) {
      continue;
    }

    // Filter PDF/DOC artifacts: lone page markers, confidential watermarks, file metadata
    if (/^(confidential|private|draft|resume|curriculum vitae|cv)$/i.test(line)) {
      continue;
    }
    if (/^[\d\.\-]+$/.test(line) && line.length <= 6) {
      continue;
    }

    // Skip lines that are only special characters
    if (!/[a-zA-Z0-9]/.test(line)) {
      continue;
    }

    // Deduplicate consecutive identical lines (e.g. text artifacts)
    if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] === line) {
      continue;
    }

    // Deduplicate repeated long lines (headers/footers across pages)
    // Only apply to long lines (> 30 characters) that are not list items
    const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*");
    if (line.length > 30 && !isBullet) {
      const normalized = line.toLowerCase().replace(/[\s,\.\-|]/g, "");
      if (seenLongLines.has(normalized)) {
        continue;
      }
      seenLongLines.add(normalized);
    }

    cleanedLines.push(line);
  }

  return cleanedLines.join("\n");
}

/**
 * Extract plain text from PDF, DOCX, or TXT file buffers
 */
export async function extractText(fileBuffer: Buffer, filename: string): Promise<string> {
  const extension = filename.split(".").pop()?.toLowerCase();
  let rawText = "";

  if (extension === "pdf") {
    const parser = new PDFParse({ data: fileBuffer });
    const data = await parser.getText();
    rawText = data.text || "";
  } else if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    rawText = result.value || "";
  } else if (extension === "doc") {
    // Legacy .doc binary format — mammoth only supports .docx; attempt extraction with clear fallback
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = result.value || "";
    } catch {
      throw new Error(
        "Legacy .doc files are not fully supported. Please save as .docx or PDF and upload again."
      );
    }
  } else if (extension === "txt") {
    rawText = fileBuffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported file extension: .${extension}`);
  }

  return cleanExtractedText(rawText);
}

/**
 * Clean and deduplicate parsed resume object to prevent duplicate entries, AI-generated/hallucinated text,
 * and ensure ID uniqueness.
 */
function deduplicateParsedResume(parsed: ParsedResume): ParsedResume {
  const cleanString = (str: string | undefined | null) => (str || "").trim();

  // 1. Header & Job Title
  const header = {
    name: cleanString(parsed.header?.name),
    email: cleanString(parsed.header?.email),
    phone: cleanString(parsed.header?.phone),
    location: cleanString(parsed.header?.location),
    jobTitle: cleanString(parsed.header?.jobTitle),
    targetRole: cleanString(parsed.header?.targetRole),
    links: (parsed.header?.links || []).map(link => {
      const origUrl = cleanString(link.url);
      let url = origUrl;
      if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      const label = cleanString(link.label).toLowerCase();
      const urlLower = url.toLowerCase();
      let normalizedLabel = cleanString(link.label) || "Portfolio";

      if (label.includes("linkedin") || urlLower.includes("linkedin.com")) {
        normalizedLabel = "LinkedIn";
      } else if (label.includes("github") || urlLower.includes("github.com")) {
        normalizedLabel = "GitHub";
      } else {
        normalizedLabel = "Portfolio";
      }

      return {
        label: normalizedLabel,
        url
      };
    }).filter(link => link.label && link.url),
    countryCode: cleanString(parsed.header?.countryCode),
    locationFields: parsed.header?.locationFields || {},
    targetCountryCode: cleanString(parsed.header?.targetCountryCode)
  };

  // 2. Summary
  const summary = cleanString(parsed.summary);

  // 3. Skills
  const seenCategories = new Map<string, Set<string>>();
  if (Array.isArray(parsed.skills)) {
    parsed.skills.forEach(group => {
      const category = cleanString(group.category) || "General";
      const normalizedCategory = category.toLowerCase();
      
      let skillsSet = seenCategories.get(normalizedCategory);
      if (!skillsSet) {
        skillsSet = new Set<string>();
        seenCategories.set(normalizedCategory, skillsSet);
      }
      
      const skillItems = Array.isArray(group.skills) ? group.skills : [];
      skillItems.forEach(s => {
        const cleaned = cleanString(s);
        if (cleaned) {
          skillsSet.add(cleaned);
        }
      });
    });
  }
  
  const skills = Array.from(seenCategories.entries()).map(([normCategory, skillsSet]) => {
    const originalGroup = parsed.skills?.find(g => cleanString(g.category).toLowerCase() === normCategory);
    const category = originalGroup ? cleanString(originalGroup.category) : normCategory.charAt(0).toUpperCase() + normCategory.slice(1);
    return {
      category,
      skills: Array.from(skillsSet)
    };
  }).filter(group => group.skills.length > 0);

  // Helper for tracking unique IDs
  const usedIds = new Set<string>();
  const getUniqueId = (prefix: string) => {
    let id = `${prefix}-${nanoid(4)}`;
    while (usedIds.has(id)) {
      id = `${prefix}-${nanoid(4)}`;
    }
    usedIds.add(id);
    return id;
  };

  // 4. Experiences
  const experiencesList = Array.isArray(parsed.experiences) ? parsed.experiences : [];
  const seenExperiences = new Set<string>();
  const experiences = experiencesList
    .map(exp => {
      const company = cleanString(exp.company);
      const role = cleanString(exp.role);
      const startDate = cleanString(exp.startDate);
      const key = `${company.toLowerCase()}|${role.toLowerCase()}|${startDate.toLowerCase()}`;
      
      if (!company && !role) return null;
      if (seenExperiences.has(key)) return null;
      if (isPlaceholderText(company) && isPlaceholderText(role)) return null;
      seenExperiences.add(key);

      // Deduplicate description bullets
      const seenBullets = new Set<string>();
      const description = (Array.isArray(exp.description) ? exp.description : [])
        .map(b => cleanString(b))
        .filter(b => {
          if (!b) return false;
          if (isAiGeneratedPhrase(b)) return false;
          const normalized = b.toLowerCase().replace(/[\s,\.\-|]/g, "");
          if (seenBullets.has(normalized)) return false;
          seenBullets.add(normalized);
          return true;
        });

      return {
        id: exp.id && !usedIds.has(exp.id) ? (usedIds.add(exp.id), exp.id) : getUniqueId("exp"),
        company,
        role,
        startDate,
        endDate: cleanString(exp.endDate) || (exp.current ? "Present" : ""),
        current: !!exp.current || cleanString(exp.endDate).toLowerCase() === "present",
        description
      };
    })
    .filter((exp): exp is NonNullable<typeof exp> => exp !== null);

  // 5. Educations
  const educationsList = Array.isArray(parsed.educations) ? parsed.educations : [];
  const seenEducations = new Set<string>();
  const educations = educationsList
    .map(edu => {
      let institution = cleanString(edu.institution);
      let degree = cleanString(edu.degree);
      let field = cleanString(edu.field);

      if (institution.startsWith("•") || institution.startsWith("-") || institution.startsWith("*")) {
        institution = institution.replace(/^[•\-*]\s*/, "").trim();
      }
      if (degree.startsWith("•") || degree.startsWith("-") || degree.startsWith("*")) {
        degree = degree.replace(/^[•\-*]\s*/, "").trim();
      }

      if (field.includes("•") || field.includes("\n") || field.length > 80 || /\b(developed|built|implemented|created|managed|designed|framework|express|node|react|django|api)\b/i.test(field)) {
        const parts = field.split(/[\n•;]| - /);
        const cleanCandidate = parts[0].replace(/^[•\-*]\s*/, "").trim();
        if (cleanCandidate.length <= 60 && !/\b(developed|built|implemented|created|managed|designed|framework|express|node|react|django|api)\b/i.test(cleanCandidate)) {
          field = cleanCandidate;
        } else {
          field = "";
        }
      }

      const key = `${institution.toLowerCase()}|${degree.toLowerCase()}|${field.toLowerCase()}`;

      if (!institution && !degree) return null;
      if (seenEducations.has(key)) return null;
      if (isPlaceholderText(institution) && isPlaceholderText(degree)) return null;
      seenEducations.add(key);

      return {
        id: edu.id && !usedIds.has(edu.id) ? (usedIds.add(edu.id), edu.id) : getUniqueId("edu"),
        institution,
        degree,
        field: field || "",
        graduationDate: cleanString(edu.graduationDate) || "",
        gpa: cleanString(edu.gpa)
      };
    })
    .filter((edu): edu is NonNullable<typeof edu> => edu !== null);

  // 6. Projects
  const projectsList = Array.isArray(parsed.projects) ? parsed.projects : [];
  const seenProjects = new Set<string>();
  const projects = projectsList
    .map(proj => {
      const name = cleanString(proj.name);
      const desc = cleanString(proj.description);
      const key = `${name.toLowerCase()}|${desc.substring(0, 50).toLowerCase()}`;

      if (!name) return null;
      if (seenProjects.has(key)) return null;
      seenProjects.add(key);

      const technologies = Array.from(new Set((Array.isArray(proj.technologies) ? proj.technologies : []).map(t => cleanString(t)).filter(Boolean)));

      return {
        id: proj.id && !usedIds.has(proj.id) ? (usedIds.add(proj.id), proj.id) : getUniqueId("proj"),
        name,
        description: desc,
        technologies,
        link: cleanString(proj.link),
        date: cleanString(proj.date) || ""
      };
    })
    .filter((proj): proj is NonNullable<typeof proj> => proj !== null);

  // 7. Certifications
  const certificationsList = Array.isArray(parsed.certifications) ? parsed.certifications : [];
  const seenCertifications = new Set<string>();
  const certifications = certificationsList
    .map(cert => {
      const name = cleanString(cert.name);
      const issuer = cleanString(cert.issuer);
      const key = `${name.toLowerCase()}|${issuer.toLowerCase()}`;

      if (!name) return null;
      if (seenCertifications.has(key)) return null;
      seenCertifications.add(key);

      return {
        id: cert.id && !usedIds.has(cert.id) ? (usedIds.add(cert.id), cert.id) : getUniqueId("cert"),
        name,
        issuer: issuer || "",
        date: cleanString(cert.date) || "",
        link: cleanString(cert.link)
      };
    })
    .filter((cert): cert is NonNullable<typeof cert> => cert !== null);

  // 8. Achievements — deduplicate by normalized text
  const seenAchievements = new Set<string>();
  const achievements = (Array.isArray(parsed.achievements) ? parsed.achievements : [])
    .map((a) => cleanString(a))
    .filter((a) => {
      if (!a || isAiGeneratedPhrase(a)) return false;
      const key = a.toLowerCase().replace(/[\s,\.\-|]/g, "");
      if (seenAchievements.has(key)) return false;
      seenAchievements.add(key);
      return true;
    });

  // 9. Languages
  const languagesList = Array.isArray(parsed.languages) ? parsed.languages : [];
  const seenLanguages = new Set<string>();
  const languages = languagesList
    .map(lang => {
      const language = cleanString(lang.language);
      if (!language) return null;
      const key = language.toLowerCase();
      if (seenLanguages.has(key)) return null;
      seenLanguages.add(key);
      return {
        language,
        proficiency: cleanString(lang.proficiency) || "Conversational"
      };
    })
    .filter((lang): lang is NonNullable<typeof lang> => lang !== null);

  // 10. References
  const referencesList = Array.isArray(parsed.references) ? parsed.references : [];
  const seenReferences = new Set<string>();
  const references = referencesList
    .map(ref => {
      const name = cleanString(ref.name);
      const email = cleanString(ref.email);
      const company = cleanString(ref.company);
      const key = `${name.toLowerCase()}|${email.toLowerCase()}|${company.toLowerCase()}`;

      if (!name) return null;
      if (seenReferences.has(key)) return null;
      seenReferences.add(key);

      return {
        id: ref.id && !usedIds.has(ref.id) ? (usedIds.add(ref.id), ref.id) : getUniqueId("ref"),
        name,
        company: company || "",
        title: cleanString(ref.title) || "",
        email: email || "",
        phone: cleanString(ref.phone) || "",
        availableOnRequest: !!ref.availableOnRequest
      };
    })
    .filter((ref): ref is NonNullable<typeof ref> => ref !== null);

  return {
    header,
    summary,
    skills,
    experiences,
    projects,
    educations,
    certifications,
    achievements,
    languages,
    references
  };
}

/**
 * Structuring plain text into standard ParsedResume layout using LLM
 */
export async function parseResumeWithLLM(text: string): Promise<ParsedResume> {
  if (!text || !text.trim()) {
    throw new Error("Resume text content is empty");
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume parsing and structuring system. Parse the following resume raw text into a clean, structured JSON object matching the schema. Follow these strict rules:\n" +
            "1. GENUINE CONTENT ONLY — never invent achievements, metrics, or duties.\n" +
            "2. NO DUPLICATES — dedupe experience, projects, skills, bullets.\n" +
            "3. NO MISMATCHES — keep names/dates/titles exactly as stated.\n" +
            "4. Identify header.jobTitle (current/most recent) and header.targetRole (from objective/summary/headline) automatically.\n" +
            "5. NO HALLUCINATIONS — empty string/array beats a fabricated field.\n" +
            "6. Generate a unique ID per experience/project/education/reference/cert.\n" +
            "7. EMPTY OVER INVENTED.\n" +
            "8. Map content into exactly these 10 sections, in order: header, summary, skills, experiences, projects, educations, certifications, achievements, languages, references.\n" +
            "9. Numbered section headers in the source (e.g. \"#3 Skills\") are a hint — use them to route content correctly.\n" +
            "10. Output strictly the JSON, no wrapping prose.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "parsed_resume",
          strict: true,
          schema: {
            type: "object",
            properties: {
              header: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  location: { type: "string" },
                  jobTitle: { type: "string", description: "Current or most recent job title inferred from the document" },
                  targetRole: { type: "string", description: "Target/desired professional role inferred from objective, summary, or headline" },
                  links: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        url: { type: "string" },
                      },
                      required: ["label", "url"],
                    },
                  },
                },
                required: ["name", "email", "phone", "location", "jobTitle", "targetRole", "links"],
              },
              summary: { type: "string" },
              skills: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    skills: { type: "array", items: { type: "string" } },
                  },
                  required: ["category", "skills"],
                },
              },
              experiences: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    company: { type: "string" },
                    role: { type: "string" },
                    startDate: { type: "string" },
                    endDate: { type: "string" },
                    current: { type: "boolean" },
                    description: { type: "array", items: { type: "string" } },
                  },
                  required: [
                    "id",
                    "company",
                    "role",
                    "startDate",
                    "endDate",
                    "current",
                    "description",
                  ],
                },
              },
              projects: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    technologies: { type: "array", items: { type: "string" } },
                    link: { type: "string" },
                    date: { type: "string" },
                  },
                  required: ["id", "name", "description", "technologies", "link", "date"],
                },
              },
              educations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    institution: { type: "string" },
                    degree: { type: "string" },
                    field: { type: "string" },
                    graduationDate: { type: "string" },
                    gpa: { type: "string" },
                  },
                  required: ["id", "institution", "degree", "field", "graduationDate", "gpa"],
                },
              },
              certifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    issuer: { type: "string" },
                    date: { type: "string" },
                    link: { type: "string" },
                  },
                  required: ["id", "name", "issuer", "date", "link"],
                },
              },
              achievements: {
                type: "array",
                items: { type: "string" },
              },
              languages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    language: { type: "string" },
                    proficiency: { type: "string" },
                  },
                  required: ["language", "proficiency"],
                },
              },
              references: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    company: { type: "string" },
                    title: { type: "string" },
                    email: { type: "string" },
                    phone: { type: "string" },
                    availableOnRequest: { type: "boolean" },
                  },
                  required: ["id", "name", "company", "title", "email", "phone", "availableOnRequest"],
                },
              },
            },
            required: [
              "header",
              "summary",
              "skills",
              "experiences",
              "projects",
              "educations",
              "certifications",
              "achievements",
              "languages",
              "references"
            ],
          },
        },
      },
      model: "gpt-4o",
      temperature: 0.1,
    });

    const content = response.choices[0]?.message.content;
    if (content && typeof content === "string") {
      const parsed = JSON.parse(content);
      const deduped = deduplicateParsedResume(parsed);
      return validateParsedAgainstSource(text, deduped);
    }
  } catch (error) {
    console.warn("LLM parser with json_schema failed, attempting json_object mode:", error);
  }

  // Attempt 2: JSON Object mode with LLM
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume parser. Parse raw resume text into a structured JSON object with keys: header (name, email, phone, location, jobTitle, targetRole, links[{label, url}]), summary (string), skills [{category, skills[]}], experiences [{id, company, role, startDate, endDate, current, description[]}], projects [{id, name, description, technologies[], link, date}], educations [{id, institution, degree, field, graduationDate, gpa}], certifications [{id, name, issuer, date, link}], achievements [], languages [{language, proficiency}], references [{id, name, company, title, email, phone, availableOnRequest}]. Return STRICT VALID JSON ONLY. Education field must ONLY contain degree field of study (e.g. Computer Science), never project descriptions.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
      model: "gpt-4o",
      temperature: 0.1,
    });

    const content = response.choices[0]?.message.content;
    if (content && typeof content === "string") {
      const parsed = JSON.parse(content);
      const deduped = deduplicateParsedResume(parsed);
      return validateParsedAgainstSource(text, deduped);
    }
  } catch (error) {
    console.error("LLM parser failed, falling back to heuristic parser:", error);
  }

  const heuristic = fallbackHeuristicParser(text);
  return validateParsedAgainstSource(text, deduplicateParsedResume(heuristic));
}

/**
 * Fallback parser using regex and text layout heuristics when LLM is unavailable or fails
 */
function fallbackHeuristicParser(text: string): ParsedResume {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // 1. Contact Info extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);

  const email = emailMatch ? emailMatch[0] : "";
  const phone = phoneMatch ? phoneMatch[0] : "";

  // Assume name is the first line if it's relatively short, otherwise default
  let name = "";
  let nameLineIndex = -1;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].length < 50 && !lines[i].includes("@") && !lines[i].includes("http") && !/^\d+$/.test(lines[i]) && !/^(resume|cv)$/i.test(lines[i])) {
      name = lines[i];
      nameLineIndex = i;
      break;
    }
  }

  const { jobTitle, targetRole } = inferJobTitleAndTargetRole(text);

  // Look for location patterns (e.g., San Francisco, CA or London, UK)
  const locationRegex = /\b[A-Z][a-zA-Z\s]{1,30},\s*\b[A-Z]{2}\b/;
  const locationMatch = text.match(locationRegex);
  const location = locationMatch ? locationMatch[0] : "";

  // Links — detect bare domains (linkedin.com, github.com) with or without http(s)://
  const links: { label: string; url: string }[] = [];
  const words = text.split(/[\s,]+/);
  const seenUrls = new Set<string>();
  const KNOWN_DOMAINS = ["linkedin.com", "github.com"] as const;

  words.forEach(word => {
    let cleanWord = word.replace(/[().,;:]+$/, "").trim();
    if (!cleanWord) return;

    const lowerWord = cleanWord.toLowerCase();
    const isKnownDomain = KNOWN_DOMAINS.some(d => lowerWord.includes(d));
    const isUrl = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/.test(cleanWord);

    if (isUrl || isKnownDomain) {
      let fullUrl = cleanWord;
      if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
        fullUrl = "https://" + fullUrl;
      }

      const lowerUrl = fullUrl.toLowerCase();
      if (seenUrls.has(lowerUrl)) return;
      seenUrls.add(lowerUrl);

      if (lowerUrl.includes("linkedin.com")) {
        links.push({ label: "LinkedIn", url: fullUrl });
      } else if (lowerUrl.includes("github.com")) {
        links.push({ label: "GitHub", url: fullUrl });
      } else if (links.length < 3) {
        links.push({ label: "Portfolio", url: fullUrl });
      }
    }
  });

  // 2. Simple sections partition
  const experiences: any[] = [];
  const educations: any[] = [];
  const skills: any[] = [];
  const projects: any[] = [];
  const certifications: any[] = [];
  const achievements: string[] = [];
  const languages: any[] = [];
  const references: any[] = [];
  let summary = "";

  let currentSection = "";
  let currentBullets: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const detected = detectSectionHeader(line);
    if (detected && detected !== "header") {
      if (currentBullets.length > 0 && experiences.length > 0) {
        experiences[experiences.length - 1].description = [...currentBullets];
        currentBullets = [];
      }
      currentSection = detected;
      continue;
    }
    if (detected === "header") {
      currentSection = "";
      continue;
    }

    if (currentSection === "summary") {
      summary += (summary ? " " : "") + line;
    } else if (currentSection === "skills") {
      const items = line.split(/[•,·|]/).map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
        skills.push(...items);
      }
    } else if (currentSection === "experience") {
      const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*");
      const dateRangeRegex = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current|\d{4})\s*(?:[-–—to]+|present|current)\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current|\d{4})/i;
      const hasDate = dateRangeRegex.test(line);
      const isHeader = !isBullet && (hasDate || line.includes("|") || line.includes(" - ") || experiences.length === 0);

      if (isHeader) {
        if (currentBullets.length > 0 && experiences.length > 0) {
          experiences[experiences.length - 1].description = [...currentBullets];
          currentBullets = [];
        }

        let company = "";
        let role = line;
        let dates: string[] = [];

        const dateMatch = line.match(dateRangeRegex);
        let cleanedLine = line;
        if (dateMatch) {
          const dateStr = dateMatch[0];
          cleanedLine = line.replace(dateStr, "").trim();
          cleanedLine = cleanedLine.replace(/^[|,\s-]+|[|,\s-]+$/g, "").trim();
          dates = dateStr.split(/[-–—to]+/i).map(d => d.trim());
        }

        if (cleanedLine.includes(" at ")) {
          const parts = cleanedLine.split(" at ");
          role = parts[0].trim();
          company = parts[1].trim();
        } else if (cleanedLine.includes(" - ")) {
          const parts = cleanedLine.split(" - ");
          company = parts[0].trim();
          role = parts[1].trim();
        } else if (cleanedLine.includes("|")) {
          const parts = cleanedLine.split("|");
          company = parts[0].trim();
          role = parts[1].trim();
        } else if (cleanedLine.includes(",")) {
          const parts = cleanedLine.split(",");
          role = parts[0].trim();
          company = parts[1].trim();
        }

        experiences.push({
          id: `exp-${nanoid(4)}`,
          company,
          role,
          startDate: dates[0] || "",
          endDate: dates[1] || "",
          current: (dates[1] || "").toLowerCase() === "present" || (!dates[1] && dates[0] !== ""),
          description: [],
        });
      } else {
        const bulletText = line.replace(/^[•\-*]\s*/, "").trim();
        if (bulletText) {
          currentBullets.push(bulletText);
        }
      }
    } else if (currentSection === "education") {
      const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*");
      const isProjectVerbOrTech = /\b(developed|implemented|built|created|managed|designed|framework|express|node|react|django|api|javascript|python|sql|html|css)\b/i.test(line) && !/university|college|school|institute|degree|bachelor|master|phd|b\.s|b\.a|m\.s|m\.a|b\.tech|m\.tech|diploma|academy|board|secondary|gpa/i.test(line);

      if (isBullet || isProjectVerbOrTech) {
        if (projects.length > 0) {
          const lastProj = projects[projects.length - 1];
          const bulletText = line.replace(/^[•\-*]\s*/, "").trim();
          lastProj.description = lastProj.description ? `${lastProj.description}\n${bulletText}` : bulletText;
        } else if (experiences.length > 0) {
          const bulletText = line.replace(/^[•\-*]\s*/, "").trim();
          currentBullets.push(bulletText);
        }
        continue;
      }

      const eduKeywords = /university|college|school|institute|degree|bachelor|master|phd|b\.s|b\.a|m\.s|m\.a|b\.tech|m\.tech|diploma|academy|board|secondary|hsc|ssc/i;
      const isEduDegreeLine = eduKeywords.test(line) || /b\.?tech|b\.?e|b\.?s|m\.?s|m\.?tech|b\.?a|m\.?b\.?a|computer science|information technology|engineering/i.test(line);

      if (isEduDegreeLine) {
        let degree = "";
        let institution = line;
        if (line.includes(" - ")) {
          const parts = line.split(" - ");
          institution = parts[0].trim();
          degree = parts[1].trim();
        } else if (line.includes(",")) {
          const parts = line.split(",");
          institution = parts[0].trim();
          degree = parts[1].trim();
        }
        educations.push({
          id: `edu-${nanoid(4)}`,
          institution,
          degree,
          field: "",
          graduationDate: "",
          gpa: "",
        });
      } else {
        const lastEdu = educations[educations.length - 1];
        if (lastEdu) {
          if (line.toLowerCase().includes("gpa") || line.match(/\b\d\.\d\b/)) {
            const gpaMatch = line.match(/\b\d\.\d\b/);
            lastEdu.gpa = gpaMatch ? gpaMatch[0] : line;
          } else if (line.match(/\b(19|20)\d{2}\b/)) {
            lastEdu.graduationDate = line.match(/\b(19|20)\d{2}\b/)?.[0] || line;
          } else if (!lastEdu.field && line.length < 70 && !line.includes("@") && !line.includes("http")) {
            lastEdu.field = line;
          }
        }
      }
    } else if (currentSection === "projects") {
      const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*");
      if (isBullet && projects.length > 0) {
        const lastProj = projects[projects.length - 1];
        const bulletText = line.replace(/^[•\-*]\s*/, "").trim();
        lastProj.description = lastProj.description ? `${lastProj.description}\n${bulletText}` : bulletText;
      } else {
        if (line.length < 50 || projects.length === 0) {
          let name = line;
          let description = "";
          let link = "";
          
          const urlMatch = line.match(/https?:\/\/[^\s$.?#].[^\s]*/);
          if (urlMatch) {
            link = urlMatch[0];
            name = line.replace(link, "").trim();
          }

          projects.push({
            id: `proj-${nanoid(4)}`,
            name: name || "",
            description,
            technologies: [],
            link,
            date: "",
          });
        } else {
          const lastProj = projects[projects.length - 1];
          lastProj.description = lastProj.description ? `${lastProj.description} ${line}` : line;
        }
      }
    } else if (currentSection === "certifications") {
      const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*");
      if (isBullet && certifications.length > 0) {
        const lastCert = certifications[certifications.length - 1];
        const bulletText = line.replace(/^[•\-*]\s*/, "").trim();
        lastCert.issuer = lastCert.issuer ? `${lastCert.issuer}, ${bulletText}` : bulletText;
      } else {
        if (line.length < 60 || certifications.length === 0) {
          let name = line;
          let issuer = "";
          if (line.includes(" - ")) {
            const parts = line.split(" - ");
            name = parts[0].trim();
            issuer = parts[1].trim();
          } else if (line.includes(",")) {
            const parts = line.split(",");
            name = parts[0].trim();
            issuer = parts[1].trim();
          }
          certifications.push({
            id: `cert-${nanoid(4)}`,
            name,
            issuer,
            date: "",
            link: "",
          });
        }
      }
    } else if (currentSection === "achievements") {
      const ach = parseAchievementLine(line);
      if (ach) achievements.push(ach);
    } else if (currentSection === "languages") {
      const items = line.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
      for (const item of items.length > 1 ? items : [line]) {
        const lang = parseLanguageLine(item);
        if (lang) {
          languages.push(lang);
        }
      }
    } else if (currentSection === "references") {
      const ref = parseReferenceLine(line);
      if (ref) {
        if (ref.availableOnRequest && references.length === 0) {
          references.push({
            id: `ref-${nanoid(4)}`,
            name: "",
            company: "",
            title: "",
            email: "",
            phone: "",
            availableOnRequest: true,
          });
        } else if (ref.name || ref.email) {
          references.push({
            id: `ref-${nanoid(4)}`,
            ...ref,
          });
        }
      }
    }
  }

  if (currentBullets.length > 0 && experiences.length > 0) {
    experiences[experiences.length - 1].description = [...currentBullets];
  }

  const skillCategories =
    skills.length > 0
      ? [{ category: "Skills", skills: skills.slice(0, 30) }]
      : [];

  const uniqueAchievements = Array.from(new Set(achievements.map((a) => a.trim()).filter(Boolean)));
  const seenLangs = new Set<string>();
  const uniqueLanguages = languages.filter((l) => {
    const key = l.language.toLowerCase();
    if (seenLangs.has(key)) return false;
    seenLangs.add(key);
    return true;
  });

  return {
    header: {
      name,
      email,
      phone,
      location,
      links,
      jobTitle,
      targetRole: targetRole || jobTitle,
    },
    summary,
    skills: skillCategories,
    experiences,
    projects: projects.slice(0, 10),
    educations,
    certifications: certifications.slice(0, 10),
    achievements: uniqueAchievements,
    languages: uniqueLanguages,
    references: references.slice(0, 10),
  };
}
