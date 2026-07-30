import { nanoid } from "nanoid";
import type { RewriteEvaluation } from "@shared/types";

/** Shared validation helpers for parsing and AI rewrite — keeps only genuine document content */

const PLACEHOLDER_PATTERNS = [
  /^(organization|institution|issuer|company|previous employer|state university|tech solutions corp)$/i,
  /^(professional role|professional associate|professional candidate|degree|field of study)$/i,
  /^(location unknown|candidate name|extracted skills)$/i,
  /^(not provided|n\/a|tbd|unknown)$/i,
  /^(professional candidate|candidate@|candidate\b)/i,
];

export const AI_GENERATED_PHRASES = [
  /contributed to core projects/i,
  /collaborated across cross-functional/i,
  /experienced professional looking/i,
  /results-driven and highly motivated/i,
  /proven track record of designing scalable/i,
  /responsible for execution and delivery/i,
  /general studies/i,
  /applied science/i,
  /bachelor degree$/i,
  /leveraged synergies/i,
  /spearheaded initiatives/i,
  /dynamic and detail-oriented/i,
  /passionate about delivering/i,
  /thought leader/i,
  /game.?changer/i,
  /synergy/i,
  /rockstar/i,
  /ninja/i,
  /guru/i,
  /led the architecture and development of core software solutions/i,
  /collaborated with product designers to create mobile-responsive interfaces/i,
  /improved system performance and database queries/i,
  /improved system performance and database queries, resulting in/i,
  /state university of technology/i,
  /hexacv platform/i,
  /professional candidate/i,
  /tech solutions corp/i,
  /employee of the quarter/i,
  /awarded employee of the quarter/i,
  /optimizing frontend performance in react/i,
  /available upon request/i,
  /delivered \d+\+ major products on schedule/i,
  /aws certified solutions architect/i,  // only when clearly fabricated (no real issuer context)
];

export function normalizeForMatch(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPlaceholderText(text: string): boolean {
  const trimmed = (text || "").trim();
  if (!trimmed) return true;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

export function isAiGeneratedPhrase(text: string): boolean {
  return AI_GENERATED_PHRASES.some((p) => p.test(text || ""));
}

/** Check if extracted text is grounded in the original source document */
export function textGroundedInSource(
  fragment: string,
  sourceText: string,
  threshold = 0.55
): boolean {
  const normFragment = normalizeForMatch(fragment);
  const normSource = normalizeForMatch(sourceText);
  if (!normFragment || normFragment.length < 4) return true;
  if (normSource.includes(normFragment)) return true;

  const words = normFragment.split(" ").filter((w) => w.length > 2);
  if (words.length === 0) return true;

  const matchCount = words.filter((w) => normSource.includes(w)).length;
  return matchCount / words.length >= threshold;
}

export function wordOverlapRatio(original: string, candidate: string): number {
  const origWords = normalizeForMatch(original).split(" ").filter((w) => w.length > 2);
  const candWords = normalizeForMatch(candidate).split(" ").filter((w) => w.length > 2);
  if (origWords.length === 0) return 1;
  const overlap = origWords.filter((w) => candWords.includes(w)).length;
  return overlap / origWords.length;
}

/** Ensure rewritten text stays grounded in the original — reject AI filler */
export function filterGroundedRewrite(original: string, rewritten: string, minOverlap = 0.2): string {
  const candidate = (rewritten || "").trim();
  if (!candidate) return original;
  if (isAiGeneratedPhrase(candidate) && !isAiGeneratedPhrase(original)) return original;
  if (wordOverlapRatio(original, candidate) < minOverlap) return original;
  return candidate;
}

/** Ensure rewritten bullets stay grounded in the originals — same count, no new facts */
export function filterGroundedBullets(originals: string[], rewritten: string[]): string[] {
  if (originals.length === 0) return [];
  const padded =
    rewritten.length === originals.length
      ? rewritten
      : originals.map((orig, i) => rewritten[i] ?? orig);

  return originals.map((original, i) =>
    filterGroundedRewrite(original, padded[i] || original, 0.25)
  );
}

/**
 * Validate an AI-generated resume (no source document available).
 * Strips placeholder text, AI-generated phrases, and empty entries.
 * Returns the cleaned object with only valid, non-fabricated data.
 */
export function validateGeneratedResume(resume: any): any {
  if (!resume || typeof resume !== "object") return resume;

  const clean = (val: string | undefined | null) => (val || "").trim();

  // Header validation
  const header = { ...(resume.header || {}) };
  if (header.name && isPlaceholderText(header.name)) header.name = "";
  if (header.email && isPlaceholderText(header.email)) header.email = "";
  if (header.phone && isPlaceholderText(header.phone)) header.phone = "";
  if (header.location && isPlaceholderText(header.location)) header.location = "";

  // Links — filter out empty/fake URLs
  if (Array.isArray(header.links)) {
    header.links = header.links.filter(
      (l: any) => l?.url && !isPlaceholderText(l.url) && l.url !== "https://"
    );
  }

  // Summary — strip if AI-generated or placeholder
  let summary = clean(resume.summary);
  if (!summary || isAiGeneratedPhrase(summary) || isPlaceholderText(summary)) {
    summary = "";
  }

  // Skills — remove AI-generated skills and placeholders
  const skills = (Array.isArray(resume.skills) ? resume.skills : [])
    .map((group: any) => ({
      category: clean(group.category),
      skills: (Array.isArray(group.skills) ? group.skills : [])
        .filter(
          (s: string) =>
            s && !isPlaceholderText(s) && !isAiGeneratedPhrase(s)
        )
        .map((s: string) => clean(s))
        .filter(Boolean),
    }))
    .filter((g: any) => g.category && g.skills.length > 0);

  // Experiences — remove AI-generated bullets and placeholders
  const experiences = (Array.isArray(resume.experiences) ? resume.experiences : [])
    .map((exp: any) => ({
      id: exp.id || `exp-${nanoid(4)}`,
      company: clean(exp.company),
      role: clean(exp.role),
      startDate: clean(exp.startDate),
      endDate: clean(exp.endDate) || (exp.current ? "Present" : ""),
      current: !!exp.current,
      description: (Array.isArray(exp.description) ? exp.description : [])
        .map((b: string) => clean(b))
        .filter(
          (b: string) =>
            b && !isAiGeneratedPhrase(b) && !isPlaceholderText(b)
        ),
    }))
    .filter(
      (exp: any) =>
        exp.company &&
        !isPlaceholderText(exp.company) &&
        !isPlaceholderText(exp.role) &&
        exp.description.length > 0
    );

  // Projects
  const projects = (Array.isArray(resume.projects) ? resume.projects : [])
    .map((proj: any) => ({
      id: proj.id || `proj-${nanoid(4)}`,
      name: clean(proj.name),
      description: clean(proj.description),
      technologies: (Array.isArray(proj.technologies) ? proj.technologies : [])
        .map((t: string) => clean(t))
        .filter((t: string) => t && !isPlaceholderText(t)),
      link: clean(proj.link),
      date: clean(proj.date),
    }))
    .filter(
      (proj: any) =>
        proj.name &&
        !isPlaceholderText(proj.name) &&
        !isAiGeneratedPhrase(proj.description)
    );

  // Educations
  const educations = (Array.isArray(resume.educations) ? resume.educations : [])
    .map((edu: any) => ({
      id: edu.id || `edu-${nanoid(4)}`,
      institution: clean(edu.institution),
      degree: clean(edu.degree),
      field: clean(edu.field),
      graduationDate: clean(edu.graduationDate),
      gpa: clean(edu.gpa),
    }))
    .filter(
      (edu: any) =>
        edu.institution &&
        !isPlaceholderText(edu.institution) &&
        !isPlaceholderText(edu.degree)
    );

  // Certifications
  const certifications = (Array.isArray(resume.certifications) ? resume.certifications : [])
    .map((cert: any) => ({
      id: cert.id || `cert-${nanoid(4)}`,
      name: clean(cert.name),
      issuer: clean(cert.issuer),
      date: clean(cert.date),
      link: clean(cert.link),
    }))
    .filter(
      (cert: any) =>
        cert.name &&
        !isPlaceholderText(cert.name) &&
        !isPlaceholderText(cert.issuer) &&
        !isAiGeneratedPhrase(cert.name)
    );

  // Achievements
  const achievements = (Array.isArray(resume.achievements) ? resume.achievements : [])
    .map((a: string) => clean(a))
    .filter(
      (a: string) =>
        a && !isAiGeneratedPhrase(a) && !isPlaceholderText(a)
    );

  // Languages
  const languages = (Array.isArray(resume.languages) ? resume.languages : [])
    .map((l: any) => ({
      language: clean(l.language),
      proficiency: clean(l.proficiency) || "Conversational",
    }))
    .filter(
      (l: any) =>
        l.language && !isPlaceholderText(l.language)
    );

  // References
  const references = (Array.isArray(resume.references) ? resume.references : [])
    .map((ref: any) => ({
      id: ref.id || `ref-${nanoid(4)}`,
      name: clean(ref.name),
      company: clean(ref.company),
      title: clean(ref.title),
      email: clean(ref.email),
      phone: clean(ref.phone),
      availableOnRequest: !!ref.availableOnRequest,
    }))
    .filter(
      (ref: any) =>
        ref.name && !isPlaceholderText(ref.name)
    );

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
    references,
  };
}

function collectResumeTextSnippets(resume: any): string[] {
  const out: string[] = [];
  if (resume?.summary) out.push(String(resume.summary));
  if (resume?.header?.name) out.push(String(resume.header.name));
  for (const exp of Array.isArray(resume?.experiences) ? resume.experiences : []) {
    if (exp?.company) out.push(String(exp.company));
    if (exp?.role) out.push(String(exp.role));
    for (const b of Array.isArray(exp?.description) ? exp.description : []) {
      if (b) out.push(String(b));
    }
  }
  for (const proj of Array.isArray(resume?.projects) ? resume.projects : []) {
    if (proj?.description) out.push(String(proj.description));
    if (proj?.name) out.push(String(proj.name));
  }
  for (const a of Array.isArray(resume?.achievements) ? resume.achievements : []) {
    if (a) out.push(String(a));
  }
  return out.filter((t) => t.trim().length > 0);
}

export function resumeHasRealContent(resume: any): boolean {
  return !!(
    resume?.header?.name ||
    resume?.summary ||
    (Array.isArray(resume?.skills) && resume.skills.length > 0) ||
    (Array.isArray(resume?.experiences) && resume.experiences.length > 0) ||
    (Array.isArray(resume?.projects) && resume.projects.length > 0) ||
    (Array.isArray(resume?.educations) && resume.educations.length > 0)
  );
}

/**
 * C3 — deterministic evaluator (no LLM judge).
 * Fail if overall < 70, no real content, or banned filler still present.
 */
export function evaluateRewriteDeterministic(
  resume: any,
  sourceText: string
): RewriteEvaluation {
  const reasons: string[] = [];
  const bannedHits: string[] = [];
  const snippets = collectResumeTextSnippets(resume);

  for (const snippet of snippets) {
    for (const pattern of AI_GENERATED_PHRASES) {
      if (pattern.test(snippet)) {
        const hit = snippet.slice(0, 80);
        if (!bannedHits.includes(hit)) bannedHits.push(hit);
      }
    }
  }
  if (bannedHits.length > 0) {
    reasons.push(
      `Remove banned/filler phrases (e.g. "${bannedHits[0].slice(0, 40)}…")`
    );
  }

  const hasRealContent = resumeHasRealContent(resume);
  if (!hasRealContent) {
    reasons.push("Resume has no usable grounded content after validation");
  }

  const source = (sourceText || "").trim();
  let groundingScore = 100;
  if (!source) {
    groundingScore = hasRealContent ? 50 : 0;
    if (!source && hasRealContent) {
      reasons.push("No source text provided for grounding check");
    }
  } else {
    const checkable = snippets.filter((s) => s.length >= 8);
    if (checkable.length === 0) {
      groundingScore = 0;
      reasons.push("No text snippets available to ground against source");
    } else {
      const groundedCount = checkable.filter((s) =>
        textGroundedInSource(s, source, 0.4)
      ).length;
      groundingScore = Math.round((groundedCount / checkable.length) * 100);
      if (groundingScore < 50) {
        reasons.push(
          `Weak grounding vs source (${groundingScore}% of snippets match)`
        );
      }
    }
  }

  const contentScore = hasRealContent ? 100 : 0;
  const bannedPenalty =
    bannedHits.length === 0 ? 100 : Math.max(0, 100 - bannedHits.length * 25);

  // content 40 + grounding 40 + banned 20
  const overall = Math.round(
    contentScore * 0.4 + groundingScore * 0.4 + bannedPenalty * 0.2
  );

  const passed =
    overall >= 70 && hasRealContent && bannedHits.length === 0;

  if (!passed && overall < 70 && reasons.length === 0) {
    reasons.push(`Overall quality score ${overall} is below 70`);
  }

  return {
    overall,
    passed,
    bannedHits,
    groundingScore,
    hasRealContent,
    reasons,
  };
}
