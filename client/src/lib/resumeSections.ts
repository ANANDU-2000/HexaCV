import { Resume, ResumeSection, ParsedResume } from "@shared/types";
import { nanoid } from "nanoid";
import { matchPresetJobByTitle } from "./jobDescriptions";
import { getDefaultTemplate } from "./templates";

/** Market display names used by the target panel / Targeting page. */
export type ResumeMarket = "Global" | "India" | "Gulf" | "US";

/** Target profile captured by the builder's TargetPanel (canonical shape). */
export type ResumeTargetProfile = {
  targetRole: string;
  experience: string;
  market: string;
  jobDescription: string;
};

export function marketToCountryCode(market: string): string {
  if (market === "India") return "IN";
  if (market === "Gulf") return "AE";
  if (market === "US") return "US";
  if (market === "Global") return "GB";
  return "";
}

export function countryCodeToMarket(code: string): ResumeMarket {
  const c = code.trim().toUpperCase();
  if (c === "IN") return "India";
  if (["AE", "SA", "QA", "KW", "OM", "BH"].includes(c)) return "Gulf";
  if (c === "US") return "US";
  return "Global";
}

/** Canonical 10-section resume structure (matches parser output order) */
export const STANDARD_SECTION_ORDER: {
  type: ResumeSection["type"];
  order: number;
  label: string;
}[] = [
  { type: "header", order: 1, label: "Header" },
  { type: "summary", order: 2, label: "Summary" },
  { type: "skills", order: 3, label: "Skills" },
  { type: "experience", order: 4, label: "Experience" },
  { type: "projects", order: 5, label: "Projects" },
  { type: "education", order: 6, label: "Education" },
  { type: "certifications", order: 7, label: "Certifications" },
  { type: "achievements", order: 8, label: "Achievements" },
  { type: "languages", order: 9, label: "Languages" },
  { type: "references", order: 10, label: "References" },
];

const defaultContentFor = (
  type: ResumeSection["type"]
): ResumeSection["content"] => {
  switch (type) {
    case "header":
      return {
        header: {
          name: "",
          email: "",
          phone: "",
          location: "",
          links: [],
          jobTitle: "",
          targetRole: "",
          countryCode: "",
          locationFields: {},
          targetCountryCode: "",
        },
      };
    case "summary":
      return { summary: "" };
    case "skills":
      return { skills: [] };
    case "experience":
      return { experiences: [] };
    case "projects":
      return { projects: [] };
    case "education":
      return { educations: [] };
    case "certifications":
      return { certifications: [] };
    case "achievements":
      return { achievements: [] };
    case "languages":
      return { languages: [] };
    case "references":
      return { references: [] };
    default:
      return {};
  }
};

/** Ensure resume always has all 10 standard sections in correct order */
export function ensureStandardResumeSections(resume: Resume): Resume {
  const byType = new Map(resume.sections.map(s => [s.type, s]));
  const standardSections: ResumeSection[] = STANDARD_SECTION_ORDER.map(def => {
    const existing = byType.get(def.type);
    if (existing) {
      let content = existing.content;
      if (
        def.type === "education" &&
        content.educations &&
        Array.isArray(content.educations)
      ) {
        const sanitizedEducations = content.educations.map((edu: any) => {
          let field = (edu.field || "").trim();
          let institution = (edu.institution || "").trim();
          let degree = (edu.degree || "").trim();

          if (
            institution.startsWith("•") ||
            institution.startsWith("-") ||
            institution.startsWith("*")
          ) {
            institution = institution.replace(/^[•\-*]\s*/, "").trim();
          }
          if (
            degree.startsWith("•") ||
            degree.startsWith("-") ||
            degree.startsWith("*")
          ) {
            degree = degree.replace(/^[•\-*]\s*/, "").trim();
          }

          if (
            field.includes("•") ||
            field.includes("\n") ||
            field.length > 80 ||
            /\b(developed|built|implemented|created|managed|designed|framework|express|node|react|django|api)\b/i.test(
              field
            )
          ) {
            const parts = field.split(/[\n•;]| - /);
            const cleanCandidate = parts[0].replace(/^[•\-*]\s*/, "").trim();
            if (
              cleanCandidate.length <= 60 &&
              !/\b(developed|built|implemented|created|managed|designed|framework|express|node|react|django|api)\b/i.test(
                cleanCandidate
              )
            ) {
              field = cleanCandidate;
            } else {
              field = "";
            }
          }

          return { ...edu, institution, degree, field };
        });
        content = { ...content, educations: sanitizedEducations };
      }

      return {
        ...existing,
        order: def.order,
        visible: existing.visible !== false,
        content,
      };
    }
    return {
      id: nanoid(),
      type: def.type,
      order: def.order,
      visible: true,
      content: defaultContentFor(def.type),
    };
  });

  const extraSections = resume.sections
    .filter(s => !STANDARD_SECTION_ORDER.some(d => d.type === s.type))
    .map((s, i) => ({ ...s, order: 10 + i + 1 }));

  return {
    ...resume,
    sections: [...standardSections, ...extraSections],
  };
}

/**
 * Build a full 10-section Resume from parsed resume JSON (upload parse, AI
 * generation, LinkedIn import, scratch builder payload). The single home for
 * ParsedResume → Resume conversion — do not re-implement this inline.
 */
export function buildResumeFromParsed(
  parsed: ParsedResume,
  opts: {
    targetProfile?: ResumeTargetProfile | null;
    isAuthenticated?: boolean;
  } = {}
): Resume {
  const { targetProfile = null, isAuthenticated = false } = opts;

  const targetCountryCode = targetProfile
    ? marketToCountryCode(targetProfile.market)
    : parsed.header?.targetCountryCode || "";

  const sections: ResumeSection[] = [
    {
      id: nanoid(),
      type: "header",
      order: 1,
      visible: true,
      content: {
        header: {
          name: parsed.header?.name || "",
          email: parsed.header?.email || "",
          phone: parsed.header?.phone || "",
          location: parsed.header?.location || "",
          links: parsed.header?.links || [],
          jobTitle: targetProfile?.targetRole || parsed.header?.jobTitle || "",
          targetRole:
            targetProfile?.targetRole ||
            parsed.header?.targetRole ||
            parsed.header?.jobTitle ||
            "",
          countryCode: parsed.header?.countryCode || "",
          locationFields: parsed.header?.locationFields || {},
          targetCountryCode,
        },
      },
    },
    { id: nanoid(), type: "summary", order: 2, visible: true, content: { summary: parsed.summary || "" } },
    { id: nanoid(), type: "skills", order: 3, visible: true, content: { skills: parsed.skills || [] } },
    { id: nanoid(), type: "experience", order: 4, visible: true, content: { experiences: parsed.experiences || [] } },
    { id: nanoid(), type: "projects", order: 5, visible: true, content: { projects: parsed.projects || [] } },
    { id: nanoid(), type: "education", order: 6, visible: true, content: { educations: parsed.educations || [] } },
    { id: nanoid(), type: "certifications", order: 7, visible: true, content: { certifications: parsed.certifications || [] } },
    { id: nanoid(), type: "achievements", order: 8, visible: true, content: { achievements: parsed.achievements || [] } },
    { id: nanoid(), type: "languages", order: 9, visible: true, content: { languages: parsed.languages || [] } },
    { id: nanoid(), type: "references", order: 10, visible: true, content: { references: parsed.references || [] } },
  ];

  const matchedJobId = matchPresetJobByTitle(
    targetProfile?.targetRole || parsed.header?.jobTitle,
    targetProfile?.targetRole || parsed.header?.targetRole || parsed.header?.jobTitle
  );

  return ensureStandardResumeSections({
    id: nanoid(),
    userId: isAuthenticated ? "user" : "guest",
    title: parsed.header?.name ? `${parsed.header.name}'s Resume` : "Untitled Resume",
    templateId: getDefaultTemplate().id,
    jobDescriptionId: matchedJobId || undefined,
    sections,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
