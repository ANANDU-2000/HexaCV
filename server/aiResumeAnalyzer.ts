/**
 * PHASE 6 — AI Resume Analyzer.
 *
 * Evaluates an EXISTING resume and produces:
 *   - an explainable 0–100 overall score (DETERMINISTIC, never AI-invented)
 *   - per-category scores (Contact, Summary, Experience, Skills, Projects,
 *     Education, ATS structure, Target alignment)
 *   - deterministic checks (missing fields, invalid URLs/dates, filler phrases)
 *   - AI qualitative analysis (strengths, issues, recommendations) which is
 *     validated, grounded, and NEVER allowed to invent facts.
 *
 * Everything about the resume is evaluated ONLY from supplied content. The AI
 * qualitative block is advisory prose; the score and checks are computed by
 * `scoreResumeDeterministic`, so the overall number is always explainable.
 *
 * Country / target-market context (Phase 5) is informational only. The prompt
 * carries COUNTRY_GROUNDING_RULES and a residual deterministic guard removes AI
 * claims about visa status, work authorization, residency, salary, or local
 * certifications whenever the resume itself is silent on those topics.
 */

import { randomUUID } from "node:crypto";
import {
  AI_GROUNDING_RULES,
  COUNTRY_GROUNDING_RULES,
} from "./ai/grounding";
import {
  isAiGeneratedPhrase,
  isPlaceholderText,
  normalizeForMatch,
} from "./contentValidation";
import { getCountryContext, resolveCountryCode, ALL_COUNTRIES } from "@shared/countriesData";
import type { AiPlanTier } from "@shared/types";
import { trackedInvokeLLM, type TrackedInvokeOptions } from "./usageTracker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnalystSeverity = "critical" | "high" | "medium" | "low";

export type AnalyzerQuality = "full" | "degraded";

export type AnalyzerCategoryId =
  | "contact"
  | "summary"
  | "experience"
  | "skills"
  | "projects"
  | "education"
  | "structure"
  | "alignment";

export interface AnalyzerCategoryScore {
  id: AnalyzerCategoryId;
  label: string;
  /** 0–100. When `applied` is false the category did not factor into the overall score. */
  score: number;
  /** Weight used when the category is applied. */
  weight: number;
  /** True when this category is included in the overall weighted average. */
  applied: boolean;
  notes: string[];
}

export interface AnalyzerCheck {
  id: string;
  severity: AnalystSeverity;
  message: string;
}

export interface AnalyzerRecommendation {
  text: string;
  priority: AnalystSeverity;
  source: "deterministic" | "ai";
}

export interface AnalyzerScoreExplanation {
  strongAreas: string[];
  areasToImprove: string[];
  biggestScoreOpportunities: string[];
}

export interface AnalyzerCountryContext {
  sourceCountryCode: string;
  targetCountryCode?: string;
  sourceCountryName: string;
  targetCountryName?: string;
  hadSpecificRule: boolean;
  atsNote: string;
}

export interface AnalyzerAiAnalysis {
  summaryAnalysis: string;
  strengths: string[];
  issues: string[];
  recommendations: Array<{ text: string; priority: AnalystSeverity; area?: string }>;
  experienceAnalysis: string;
  skillsAnalysis: string;
  projectAnalysis: string;
  keywordObservations: string;
}

export interface ResumeAnalysis {
  /** ISO timestamp of when the analysis was produced. */
  generatedAt: string;
  /**
   * "full"   → the AI qualitative block is present and usable.
   * "degraded"→ AI qualitative unavailable/malformed; the deterministic score,
   *             checks and recommendations are still complete.
   */
  quality: AnalyzerQuality;
  aiAvailable: boolean;
  targetRole?: string;
  countryContext: AnalyzerCountryContext | null;
  /** Deterministic, explainable overall score. */
  overallScore: number;
  categoryScores: AnalyzerCategoryScore[];
  checks: AnalyzerCheck[];
  recommendations: AnalyzerRecommendation[];
  scoreExplanation: AnalyzerScoreExplanation;
  // AI qualitative fields (empty when degraded).
  summaryAnalysis: string;
  strengths: string[];
  issues: string[];
  experienceAnalysis: string;
  skillsAnalysis: string;
  projectAnalysis: string;
  keywordObservations: string;
}

export interface DeterministicAnalysis {
  overallScore: number;
  categoryScores: AnalyzerCategoryScore[];
  checks: AnalyzerCheck[];
  recommendations: AnalyzerRecommendation[];
  scoreExplanation: AnalyzerScoreExplanation;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;

function toStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

/** Pull a plausible year (e.g. "2024-06", "Jun 2023") out of a date string. */
function parseYear(text: string): number | null {
  if (!text) return null;
  const m = String(text).match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

function countryName(code?: string | null): string | undefined {
  if (!code) return undefined;
  return ALL_COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase())
    ?.name;
}

/**
 * Convert the client-facing resume content object into flat text, mirroring
 * `extractResumeText` but for the stored ParsedResume shape ({ header, summary,
 * skills, experiences, ... }). Used for prompt building + keyword alignment.
 */
export function contentToText(content: any): string {
  const parts: string[] = [];
  if (!content || typeof content !== "object") return "";
  const h = content.header;
  if (h && typeof h === "object") {
    const name = toStr(h.name);
    const email = toStr(h.email);
    const phone = toStr(h.phone);
    const location = toStr(h.location) || toStr(h.locationFields?.city) || toStr(h.locationFields?.state);
    const head = [name, email, phone, location].filter(Boolean).join(" ");
    if (head) parts.push(head);
  }
  if (toStr(content.summary)) parts.push(content.summary);
  for (const group of asArray(content.skills)) {
    const cat = toStr(group?.category);
    const list = asArray(group?.skills).map(toStr).filter(Boolean);
    if (list.length > 0) parts.push(cat ? `${cat}: ${list.join(", ")}` : list.join(", "));
  }
  for (const exp of asArray(content.experiences)) {
    const role = toStr(exp?.role);
    const company = toStr(exp?.company);
    const dates = [toStr(exp?.startDate), exp?.current ? "Present" : toStr(exp?.endDate)]
      .filter(Boolean)
      .join(" - ");
    if (role || company) parts.push([role, company].filter(Boolean).join(" at ") + (dates ? ` (${dates})` : ""));
    for (const bullet of asArray(exp?.description).map(toStr).filter(Boolean)) parts.push(bullet);
  }
  for (const proj of asArray(content.projects)) {
    const name = toStr(proj?.name);
    const desc = toStr(proj?.description);
    const tech = asArray(proj?.technologies).map(toStr).filter(Boolean).join(", ");
    const line = [name, desc].filter(Boolean).join(": ");
    if (line) parts.push(line + (tech ? ` (${tech})` : ""));
  }
  for (const edu of asArray(content.educations)) {
    const degree = toStr(edu?.degree);
    const field = toStr(edu?.field);
    const institution = toStr(edu?.institution);
    const line = [degree, field].filter(Boolean).join(" in ") + (institution ? ` from ${institution}` : "");
    if (line) parts.push(line);
  }
  for (const cert of asArray(content.certifications)) {
    const name = toStr(cert?.name);
    const issuer = toStr(cert?.issuer);
    if (name) parts.push(name + (issuer ? ` from ${issuer}` : ""));
  }
  for (const ach of asArray(content.achievements).map(toStr).filter(Boolean)) parts.push(ach);
  for (const lang of asArray(content.languages)) {
    const name = toStr(lang?.language);
    const prof = toStr(lang?.proficiency);
    if (name) parts.push(name + (prof ? ` (${prof})` : ""));
  }
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Deterministic category scorers
// ---------------------------------------------------------------------------

interface CategoryResult {
  score: number;
  notes: string[];
  checks: AnalyzerCheck[];
}

const CATEGORY_LABELS: Record<AnalyzerCategoryId, string> = {
  contact: "Contact & Header",
  summary: "Summary / Profile",
  experience: "Experience",
  skills: "Skills",
  projects: "Projects",
  education: "Education",
  structure: "ATS Structure",
  alignment: "Target Alignment",
};

const CATEGORY_WEIGHTS: Record<AnalyzerCategoryId, number> = {
  contact: 10,
  summary: 15,
  experience: 25,
  skills: 15,
  projects: 10,
  education: 10,
  structure: 10,
  alignment: 10,
};

function scoreContact(content: any): CategoryResult {
  const h = content?.header && typeof content.header === "object" ? content.header : {};
  const name = toStr(h.name);
  const email = toStr(h.email);
  const phone = toStr(h.phone);
  const location = toStr(h.location) || toStr(h.locationFields?.city) || toStr(h.locationFields?.state);
  const checks: AnalyzerCheck[] = [];
  const notes: string[] = [];
  let score = 0;

  if (name && !isPlaceholderText(name)) {
    score += 35;
    notes.push(`Name present (${name})`);
  } else {
    checks.push({ id: "missing_name", severity: "critical", message: "The resume is missing a name in the header." });
  }

  if (email && EMAIL_RE.test(email)) {
    score += 25;
    notes.push("Email address present and well-formed");
  } else if (email) {
    checks.push({ id: "invalid_email", severity: "high", message: `The email "${email}" does not look valid.` });
  } else if (phone) {
    checks.push({ id: "missing_email", severity: "high", message: "Email is missing from the header." });
  } else {
    checks.push({ id: "missing_contact", severity: "critical", message: "No contact email or phone number is listed." });
  }

  if (phone) {
    score += 25;
    notes.push("Phone number present");
  } else if (!email) {
    // already covered by missing_contact
  } else {
    checks.push({ id: "missing_phone", severity: "medium", message: "A phone number is not listed." });
  }

  if (location) {
    score += 15;
    notes.push(`Location present (${location})`);
  } else {
    checks.push({ id: "missing_location", severity: "low", message: "Location is not listed." });
  }

  // Invalid URLs in the header's links.
  let invalid = 0;
  for (const link of asArray(h.links)) {
    const url = toStr(link?.url);
    if (url && !URL_RE.test(url)) {
      invalid += 1;
      checks.push({ id: "invalid_header_url", severity: "medium", message: `Header link "${url.slice(0, 60)}" is not a valid URL.` });
    }
  }
  if (invalid > 0) {
    score = clamp(score - invalid * 8);
    notes.push(`${invalid} invalid header URL(s) detected`);
  }

  return { score, notes, checks };
}

function scoreSummary(content: any): CategoryResult {
  const summary = toStr(content.summary);
  const checks: AnalyzerCheck[] = [];
  const notes: string[] = [];
  let score = 0;
  if (!summary) {
    checks.push({ id: "missing_summary", severity: "high", message: "The resume has no professional summary/profile." });
    return { score: 0, notes, checks };
  }
  const len = summary.length;
  score += 40;
  if (len >= 40 && len <= 800) {
    score += 30;
    notes.push(`Summary length is reasonable (${len} characters)`);
  } else if ((len >= 10 && len < 40) || (len > 800 && len <= 1500)) {
    score += 15;
    notes.push(len < 40 ? "Summary is quite short." : "Summary is long — consider tightening it.");
  } else {
    score += 5;
    notes.push(len < 10 ? "Summary is too short to convey a profile." : "Summary is very long.");
  }
  if (isAiGeneratedPhrase(summary)) {
    score -= 20;
    checks.push({ id: "generic_summary", severity: "medium", message: "The summary uses generic/AI-sounding filler phrases." });
  }
  return { score: clamp(score), notes, checks };
}

function scoreExperience(content: any): CategoryResult {
  const exps = asArray(content.experiences).filter((e) => e && typeof e === "object");
  const checks: AnalyzerCheck[] = [];
  const notes: string[] = [];
  if (exps.length === 0) {
    checks.push({ id: "missing_experience", severity: "critical", message: "No work experience section is listed." });
    return { score: 0, notes, checks };
  }

  let structureOk = 0;
  let datesOk = 0;
  let bulletsTotal = 0;
  let withMetrics = 0;
  let genericBullets = 0;
  let entriesWithBullets = 0;

  for (const exp of exps) {
    const role = toStr(exp.role);
    const company = toStr(exp.company);
    const start = toStr(exp.startDate);
    const end = toStr(exp.endDate);

    if (role && company && !isPlaceholderText(role) && !isPlaceholderText(company)) structureOk += 1;
    else if (role && company) checks.push({ id: "placeholder_exp", severity: "medium", message: `Experience entry for "${company || role}" has placeholder role/company text.` });

    if (start || end || exp.current) datesOk += 1;
    else checks.push({ id: "missing_exp_dates", severity: "medium", message: `Experience at "${company || role || "unknown"}" has no dates.` });

    const bullets = asArray(exp.description).map(toStr).filter(Boolean);
    bulletsTotal += bullets.length;
    if (bullets.length > 0) entriesWithBullets += 1;
    else checks.push({ id: "no_exp_bullets", severity: "low", message: `Experience at "${company || role || "unknown"}" has no bullet points.` });
    for (const b of bullets) if (isAiGeneratedPhrase(b)) genericBullets += 1;
    if (bullets.some((b) => /\d/.test(b))) withMetrics += 1;

    // Date sanity: start after end, implausible years.
    const sy = parseYear(start);
    const ey = parseYear(end);
    if (start && sy === null) checks.push({ id: "bad_exp_start", severity: "low", message: `Experience start date "${start}" is not a recognizable date.` });
    if (end && ey === null) checks.push({ id: "bad_exp_end", severity: "low", message: `Experience end date "${end}" is not a recognizable date.` });
    if (!exp.current && start && end && sy !== null && ey !== null && sy > ey) {
      checks.push({ id: "exp_dates_inverted", severity: "medium", message: `Experience at "${company || role || "unknown"}": start (${sy}) is after end (${ey}).` });
    }
  }

  const n = exps.length;
  let score = 20; // section present
  score += 30 * (structureOk / n);
  score += 20 * (datesOk / n);
  score += 20 * Math.min(1, entriesWithBullets / n);
  score += 10 * (withMetrics > 0 ? 1 : 0);
  if (genericBullets > 0) {
    score -= 15;
    checks.push({ id: "generic_exp_bullets", severity: "medium", message: `${genericBullets} experience bullet(s) read like generic/AI-sounding filler.` });
  }

  notes.push(`${n} experience entr${n === 1 ? "y" : "ies"} listed`);
  if (withMetrics === 0) {
    checks.push({ id: "no_metrics", severity: "medium", message: "Experience bullets contain no quantified results (e.g. numbers, %, ₹/$. Only add metrics that reflect your real work)." });
  } else {
    notes.push(`Quantified results present in ${withMetrics} entr${withMetrics === 1 ? "y" : "ies"}`);
  }

  return { score: clamp(score), notes, checks };
}

function scoreSkills(content: any): CategoryResult {
  const groups = asArray(content.skills).filter((g) => g && typeof g === "object" && asArray(g.skills).length > 0);
  const flat = groups.flatMap((g) => asArray(g.skills).map(toStr).filter((s: string) => s && !isPlaceholderText(s)));
  const checks: AnalyzerCheck[] = [];
  const notes: string[] = [];
  if (flat.length === 0) {
    checks.push({ id: "missing_skills", severity: "high", message: "The resume has no skills listed." });
    return { score: 0, notes, checks };
  }
  let score = 50;
  if (groups.length >= 1) score += 20;
  if (flat.length >= 5) score += 20;
  else if (flat.length >= 2) score += 10;
  if (flat.every((s) => s.length < 40)) score += 10;
  notes.push(`${flat.length} skill${flat.length === 1 ? "" : "s"} across ${groups.length} categor${groups.length === 1 ? "y" : "ies"}`);
  if (groups.length === 1 && flat.length > 5) {
    checks.push({ id: "ungrouped_skills", severity: "low", message: "Skills are in a single ungrouped list — grouping them (e.g. Languages, Tools, Frameworks) reads better." });
  }
  return { score: clamp(score), notes, checks };
}

function scoreProjects(content: any): { applied: boolean } & CategoryResult {
  const projs = asArray(content.projects).filter((p) => p && typeof p === "object" && toStr(p.name));
  const checks: AnalyzerCheck[] = [];
  const notes: string[] = [];
  // Optional section — a missing Projects section is NEVER penalized; it only
  // just does not contribute to the overall weighted score.
  if (projs.length === 0) {
    return { applied: false, score: 0, notes, checks };
  }
  let withDesc = 0;
  let withTech = 0;
  let invalidLinks = 0;
  for (const proj of projs) {
    const desc = toStr(proj.description);
    if (desc.length >= 20) withDesc += 1;
    else if (desc.length > 0) notes.push(`Project "${proj.name}" has a thin description.`);
    else checks.push({ id: "project_no_desc", severity: "low", message: `Project "${proj.name}" has no description.` });
    if (asArray(proj.technologies).filter(Boolean).length > 0) withTech += 1;
    const link = toStr(proj.link);
    if (link && !URL_RE.test(link)) {
      invalidLinks += 1;
      checks.push({ id: "invalid_project_url", severity: "medium", message: `Project link "${link.slice(0, 60)}" is not a valid URL.` });
    }
  }
  const n = projs.length;
  let score = 40;
  score += 40 * (withDesc / n);
  score += 20 * (withTech / n);
  if (invalidLinks > 0) score -= 10 * invalidLinks;
  notes.push(`${n} project${n === 1 ? "" : "s"} listed`);
  return { applied: true, score: clamp(score), notes, checks };
}

function scoreEducation(content: any): CategoryResult {
  const edus = asArray(content.educations).filter((e) => e && typeof e === "object");
  const checks: AnalyzerCheck[] = [];
  const notes: string[] = [];
  if (edus.length === 0) {
    checks.push({ id: "missing_education", severity: "high", message: "The resume has no education section." });
    return { score: 0, notes, checks };
  }
  let complete = 0;
  for (const edu of edus) {
    const institution = toStr(edu.institution);
    const degree = toStr(edu.degree);
    const field = toStr(edu.field);
    if (institution && degree && !isPlaceholderText(institution) && !isPlaceholderText(degree)) complete += 1;
    if (!toStr(edu.graduationDate)) {
      checks.push({ id: "missing_edu_date", severity: "low", message: `Education entry at "${institution || "unknown"}" has no graduation date.` });
    }
  }
  let score = 55 + 45 * (complete / edus.length);
  notes.push(`${edus.length} education entr${edus.length === 1 ? "y" : "ies"} listed`);
  return { score: clamp(score), notes, checks };
}

function scoreStructure(content: any): CategoryResult {
  const checks: AnalyzerCheck[] = [];
  const notes: string[] = [];
  let score = 100;
  let invalidUrls = 0;

  const checkUrl = (url: string, id: string, label: string) => {
    const u = toStr(url);
    if (u && !URL_RE.test(u)) {
      invalidUrls += 1;
      checks.push({ id, severity: "medium", message: `"${label}" link "${u.slice(0, 60)}" is not a valid URL.` });
    }
  };

  const h = content?.header && typeof content.header === "object" ? content.header : {};
  for (const link of asArray(h.links)) checkUrl(link?.url, "invalid_header_url_struct", "Header");
  for (const proj of asArray(content.projects)) checkUrl(proj?.link, "invalid_project_url_struct", "Project");
  for (const cert of asArray(content.certifications)) checkUrl(cert?.link, "invalid_cert_url_struct", "Certification");
  for (const ref of asArray(content.references)) {
    checkUrl(ref?.email, "invalid_ref_email", "Reference");
  }

  if (invalidUrls > 0) {
    score -= Math.min(50, invalidUrls * 10);
    notes.push(`${invalidUrls} invalid URL(s) found`);
  }

  // A section that is EXPLICITLY present as an empty array (vs truly absent).
  const emptyOptional = asArray(content.projects)?.length === 0 &&
    "projects" in content;
  if (emptyOptional && asArray(content.experiences).length > 0) {
    checks.push({ id: "empty_projects", severity: "low", message: "The Projects section is present but empty — it adds nothing until filled." });
  }

  // Detect duplicate-looking header/output is out of scope; keep notes lean.
  if (score >= 100) notes.push("No obvious ATS structural issues (URLs, dates) detected");
  return { score: clamp(score), notes, checks };
}

function scoreAlignment(content: any, targetRole: string): { applied: boolean } & CategoryResult {
  const checks: AnalyzerCheck[] = [];
  const notes: string[] = [];
  const target = toStr(targetRole);
  if (!target) return { applied: false, score: 0, notes, checks };
  const tokens = normalizeForMatch(target).split(" ").filter((w) => w.length > 2);
  if (tokens.length === 0) return { applied: false, score: 0, notes, checks };

  const resumeText = normalizeForMatch(contentToText(content));
  const matched = tokens.filter((t) => resumeText.includes(t) || resumeText.includes(`${t}s`));
  const missing = tokens.filter((t) => !matched.includes(t));
  const ratio = matched.length / tokens.length;
  const score = Math.round(ratio * 100);
  notes.push(`Target role "${target}": ${matched.length}/${tokens.length} key term${tokens.length === 1 ? "" : "s"} matched in the resume`);
  if (matched.length > 0) checks.push({ id: "aligned_terms", severity: "low", message: `Aligned terms found: ${matched.slice(0, 8).join(", ")}.` });
  if (missing.length > 0) {
    checks.push({
      id: "missing_role_terms",
      severity: ratio < 0.5 ? "high" : "medium",
      message: `For the target role "${target}", these terms are not visible in the resume: ${missing.slice(0, 8).join(", ")}. Only add them if they reflect your real experience.`,
    });
  }
  return { applied: true, score, notes, checks };
}

// ---------------------------------------------------------------------------
// Deterministic engine
// ---------------------------------------------------------------------------

/**
 * Deterministic, explainable scoring. Never invents facts: every deduction is
 * tied to content that is present or absent in the supplied resume. Optional
 * sections (Projects, and the never-scored Languages/References/Achievements/
 * Certifications) are not penalized when absent.
 */
export function scoreResumeDeterministic(
  content: any,
  opts: { targetRole?: string | null } = {}
): DeterministicAnalysis {
  const checks: AnalyzerCheck[] = [];
  const categoryScores: AnalyzerCategoryScore[] = [];

  const contact = scoreContact(content);
  const summary = scoreSummary(content);
  const experience = scoreExperience(content);
  const skills = scoreSkills(content);
  const education = scoreEducation(content);
  const structure = scoreStructure(content);
  const projects = scoreProjects(content);
  const alignment = scoreAlignment(content, opts.targetRole || "");

  const push = (label: AnalyzerCategoryId, result: { applied?: boolean } & CategoryResult, applied: boolean, weight: number) => {
    categoryScores.push({
      id: label,
      label: CATEGORY_LABELS[label],
      score: result.score,
      weight,
      applied,
      notes: result.notes,
    });
    checks.push(...result.checks);
  };

  push("contact", contact, true, CATEGORY_WEIGHTS.contact);
  push("summary", summary, true, CATEGORY_WEIGHTS.summary);
  push("experience", experience, true, CATEGORY_WEIGHTS.experience);
  push("skills", skills, true, CATEGORY_WEIGHTS.skills);
  push("education", education, true, CATEGORY_WEIGHTS.education);
  push("structure", structure, true, CATEGORY_WEIGHTS.structure);
  push("projects", projects, projects.applied, CATEGORY_WEIGHTS.projects);
  push("alignment", alignment, alignment.applied, CATEGORY_WEIGHTS.alignment);

  const appliedCategories = categoryScores.filter((c) => c.applied);
  const totalWeight = appliedCategories.reduce((sum, c) => sum + c.weight, 0) || 1;
  const weighted = appliedCategories.reduce((sum, c) => sum + c.score * c.weight, 0);
  const overallScore = clamp(Math.round(weighted / totalWeight));

  // Deterministic recommendations — cap to avoid overwhelming, prioritize real issues.
  const detRecommendations: AnalyzerRecommendation[] = [];
  for (const severity of ["critical", "high", "medium"] as const) {
    for (const c of checks) {
      if (c.severity !== severity) continue;
      detRecommendations.push({ text: c.message, priority: severity, source: "deterministic" });
    }
    if (detRecommendations.length >= 6) break;
  }
  const recs = detRecommendations.slice(0, 6);
  for (const c of checks) {
    if (c.severity === "low" && recs.length < 4) {
      recs.push({ text: c.message, priority: "low", source: "deterministic" });
    }
  }

  const scoreExplanation = buildScoreExplanation(categoryScores, totalWeight, overallScore);

  return {
    overallScore,
    categoryScores,
    checks,
    recommendations: recs,
    scoreExplanation,
  };
}

function buildScoreExplanation(
  categories: AnalyzerCategoryScore[],
  totalWeight: number,
  overall: number
): AnalyzerScoreExplanation {
  const applied = categories.filter((c) => c.applied);
  const strongAreas = applied
    .filter((c) => c.score >= 70)
    .map((c) => `${c.label} score ${c.score}/100`);
  const areasToImprove = applied
    .filter((c) => c.score < 70)
    .map((c) => `${c.label} at ${c.score}/100`);
  const biggestScoreOpportunities = applied
    .map((c) => ({ c, gain: (c.weight * (100 - c.score)) / totalWeight }))
    .sort((a, b) => b.gain - a.gain)
    .filter((x) => x.gain > 0)
    .slice(0, 3)
    .map((x) => `Raise ${x.c.label} → worth ~+${x.gain.toFixed(1)} pts to the overall score`);
  if (biggestScoreOpportunities.length === 0 && overall >= 95) {
    biggestScoreOpportunities.push("Small refinements only — the resume scores near the top.");
  }
  return { strongAreas, areasToImprove, biggestScoreOpportunities };
}

// ---------------------------------------------------------------------------
// Country grounding guard
// ---------------------------------------------------------------------------

/**
 * Per-topic grounding rules. Each topic has:
 *   claim  — regex detecting a AI-generated sentence that asserts/involves the topic
 *   evidence — function that returns true if the resume supplies evidence for it
 *   assertOnly — when true the topic is only stripped when the text asserts a fact
 *                (e.g. "holds a PMP certification") but is NOT stripped for advice
 *                (e.g. "consider adding a certification").
 *
 * Visa/work-auth/residency/salary topics are always stripped when the resume is
 * silent — even recommendations to "mention" them imply a fabricated fact.
 * Certification/licensure are asserted-only, so helpful advice to add certs is
 * not aggressively removed.
 */
const COUNTRY_CLAIM_TOPICS: Array<{
  claim: RegExp;
  evidence: (content: any) => boolean;
  assertOnly?: boolean;
}> = [
  {
    claim: /\bvisa\b|\bsponsorship\b|\bh[- ]?1b\b|\bwork permit\b|\bimmigration\b/i,
    evidence: (content: any) =>
      /\bvisa\b|\bsponsor|\bh[- ]?1b\b|\bwork permit\b|\bimmigration\b/i.test(
        contentToText(content)
      ),
  },
  {
    claim: /\bwork authorization\b|\bright to work\b|\bbonded\b/i,
    evidence: (content: any) =>
      /\bwork authorization\b|\bright to work\b|\bbonded\b/i.test(contentToText(content)),
  },
  {
    claim: /\bresiden(tial|t|cy|ce)\b|\bcitizenship\b|\bpermit to work\b/i,
    evidence: (content: any) =>
      /\bresiden(tial|t|cy|ce)\b|\bcitizenship\b|\bpermit to work\b/i.test(
        contentToText(content)
      ),
  },
  {
    claim: /\bsalary\b|\bcompensation\b|\bctc\b|\bnbwp\b|\bremuneration\b|\bpay range\b/i,
    evidence: (content: any) =>
      /\bsalary\b|\bcompensation\b|\bctc\b|\bnbwp\b|\bremuneration\b|\bpay range\b/i.test(
        contentToText(content)
      ),
  },
  {
    // Certifications / licenses — assertOnly so genuine advice like
    // "consider adding a PMP certification" is not removed.
    claim: /\bcertification\b|\blicens(e|ure|ed|ing)\b|\bcredential\b|\bcertif(?:ied)?\b/i,
    evidence: (content: any) =>
      asArray(content.certifications).length > 0 ||
      /\bcertif|\blicens|\bcredential/i.test(contentToText(content)),
    assertOnly: true,
  },
  {
    claim: /\bemployer requirements\b|\bmarket rate\b/i,
    evidence: (content: any) =>
      /\bemployer requirements\b|\bmarket rate\b/i.test(contentToText(content)),
  },
];

/** Detect words that assert possession / fact about the candidate. */
const ASSERT_VERB_RE = /\b(holds?|held|has|have|is|was|certified|licensed|qualified|obtained|earned|completed|possesses?|a |an )\b/i;

/**
 * True when the given text asserts a country-market fact (visa status,
 * work authorization, residency, salary, certification, employer requirements)
 * that the resume does not support. Ungrounded claims are stripped from the
 * structured AI lists before the analysis is returned.
 */
export function isUngroundedCountryClaim(text: string, content: any): boolean {
  const t = (text || "").trim();
  if (!t) return false;
  for (const topic of COUNTRY_CLAIM_TOPICS) {
    if (!topic.claim.test(t)) continue;
    if (topic.evidence(content)) return false; // resume supports the claim
    if (topic.assertOnly && !ASSERT_VERB_RE.test(t)) return false; // advice, not fabrication
    return true; // ungrounded assertion/involvement
  }
  return false;
}

function applyCountryGroundingGuard(
  ai: AnalyzerAiAnalysis,
  content: any
): AnalyzerAiAnalysis {
  return {
    ...ai,
    strengths: ai.strengths.filter((s) => !isUngroundedCountryClaim(s, content)),
    issues: ai.issues.filter((i) => !isUngroundedCountryClaim(i, content)),
    recommendations: ai.recommendations.filter(
      (r) => !isUngroundedCountryClaim(r.text, content)
    ),
  };
}

// ---------------------------------------------------------------------------
// AI qualitative analysis (validated, grounded)
// ---------------------------------------------------------------------------

const AI_PRIORITIES: AnalystSeverity[] = ["critical", "high", "medium", "low"];

function isValidSeverity(v: unknown): v is AnalystSeverity {
  return typeof v === "string" && (AI_PRIORITIES as string[]).includes(v);
}

const MAX_TEXT_LEN = 1000;
function cleanString(v: unknown, max = MAX_TEXT_LEN): string {
  return toStr(v).slice(0, max);
}

/**
 * Parse + sanitize the LLM's qualitative JSON. Returns a degenerate-but-empty
 * object for anything that isn't shaped as expected so a malformed AI response
 * can never crash the analysis.
 */
export function validateAiAnalysis(raw: unknown): AnalyzerAiAnalysis {
  const empty: AnalyzerAiAnalysis = {
    summaryAnalysis: "",
    strengths: [],
    issues: [],
    recommendations: [],
    experienceAnalysis: "",
    skillsAnalysis: "",
    projectAnalysis: "",
    keywordObservations: "",
  };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty;
  const r = raw as Record<string, unknown>;

  const strList = (v: unknown, cap = 6): string[] => {
    if (!Array.isArray(v)) return [];
    return v
      .map((item) => cleanString(item))
      .filter((s: string) => s.length > 0)
      .slice(0, cap);
  };

  const recs: AnalyzerAiAnalysis["recommendations"] = [];
  if (Array.isArray(r.recommendations)) {
    for (const item of r.recommendations) {
      if (!item || typeof item !== "object") continue;
      const text = cleanString((item as Record<string, unknown>).text).slice(0, 500);
      if (!text) continue;
      const rawPriority = (item as Record<string, unknown>).priority;
      const priority: AnalystSeverity = isValidSeverity(rawPriority) ? rawPriority : "medium";
      const area = cleanString((item as Record<string, unknown>).area, 80) || undefined;
      recs.push({ text, priority, area });
      if (recs.length >= 8) break;
    }
  }

  const analysis: AnalyzerAiAnalysis = {
    summaryAnalysis: cleanString(r.summaryAnalysis, 1600),
    strengths: strList(r.strengths, 6),
    issues: strList(r.issues, 6),
    recommendations: recs,
    experienceAnalysis: cleanString(r.experienceAnalysis, 1600),
    skillsAnalysis: cleanString(r.skillsAnalysis, 1600),
    projectAnalysis: cleanString(r.projectAnalysis, 1600),
    keywordObservations: cleanString(r.keywordObservations, 1600),
  };

  const usable =
    analysis.summaryAnalysis.length > 0 ||
    analysis.experienceAnalysis.length > 0 ||
    analysis.skillsAnalysis.length > 0 ||
    analysis.strengths.length > 0 ||
    analysis.issues.length > 0 ||
    analysis.recommendations.length > 0;
  return usable ? analysis : empty;
}

/** True when at least one qualitative field carries real content. */
export function aiAnalysisIsUsable(ai: AnalyzerAiAnalysis): boolean {
  return (
    ai.summaryAnalysis.length > 0 ||
    ai.experienceAnalysis.length > 0 ||
    ai.skillsAnalysis.length > 0 ||
    ai.projectAnalysis.length > 0 ||
    ai.strengths.length > 0 ||
    ai.issues.length > 0 ||
    ai.recommendations.length > 0
  );
}

function mergeRecommendations(
  deterministic: AnalyzerRecommendation[],
  ai: AnalyzerAiAnalysis
): AnalyzerRecommendation[] {
  const merged: AnalyzerRecommendation[] = [...deterministic];
  for (const r of ai.recommendations) {
    const t = normalizeForMatch(r.text);
    if (!t) continue;
    const duplicate = merged.some((m) => {
      const mt = normalizeForMatch(m.text);
      return mt === t || mt.includes(t) || t.includes(mt);
    });
    if (!duplicate) {
      merged.push({ text: r.text, priority: r.priority, source: "ai" });
    }
  }
  return merged.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

const ANALYZER_GROUNDING_RULES =
  "ADDITIONAL ANALYZER RULES:\n" +
  "1. Evaluate ONLY content already present in the resume. Never invent achievements, metrics (e.g. \"improved performance by 40%\"), skills, companies, degrees, dates, or projects.\n" +
  "2. If a section is missing or empty, say it is missing or empty — never invent it. If a skill is not visible in the resume, write \"Not found in the resume\" or omit it; never claim the candidate has a skill that is not listed.\n" +
  "3. Never invent quantified results for the candidate (no fabricated percentages, dollar/₹ figures, or head counts). If the resume has none, note that metrics are absent and recommend adding real ones.\n" +
  "4. Do not assume the candidate is applying from India, the US, or any specific country unless the resume states it.\n" +
  "5. Do not rewrite the resume. Provide analysis and actionable recommendations only.\n";

const COUNTRY_PROHIBITION_INLINE =
  "Do NOT invent or assert the candidate's visa status, work authorization, residency, local work experience, local certifications, licenses, salary figures, or employer requirements based on the target country.\n";

function buildSystemPrompt(): string {
  return (
    "You are an expert resume reviewer and ATS advisor. You evaluate an existing resume and give honest, specific, grounded feedback. " +
    "You NEVER invent facts about the candidate. " +
    AI_GROUNDING_RULES +
    ANALYZER_GROUNDING_RULES +
    COUNTRY_PROHIBITION_INLINE +
    COUNTRY_GROUNDING_RULES +
    "Always respond with valid JSON matching the provided schema."
  );
}

function buildUserPrompt(
  contentText: string,
  opts: { targetRole?: string | null; countryContext?: string }
): string {
  const targetRole = (opts.targetRole || "").trim();
  const parts: string[] = ["RESUME:\n" + contentText];
  parts.push(
    "\nTARGET ROLE (optional): " +
      (targetRole
        ? `${targetRole}\nWhen a target role is given, mention only terms that actually appear in the resume and note the rest as missing.`
        : "Not provided. Skip keyword/target-specific commentary.")
  );
  if (opts.countryContext) {
    parts.push(
      "\nCOUNTRY / TARGET-MARKET CONTEXT (INFORMATIONAL ONLY — for formatting, terminology and expectations guidance; never invent country-specific facts about the candidate):\n" +
        opts.countryContext
    );
  }
  parts.push(
    "\nRespond ONLY with the JSON object described by the schema. Keep analysis concrete and reference the resume's real content."
  );
  return parts.join("\n\n");
}

function buildCountryContextText(
  sourceCountryCode?: string,
  targetCountryCode?: string
): string | null {
  const source = resolveCountryCode(sourceCountryCode);
  if (!source) return null;
  const ctx = getCountryContext(source, targetCountryCode);
  if (!ctx) return null;
  const targetName = countryName(ctx.targetCountryCode);
  const rule = ctx.atsRule;
  const lines = [
    `Source country: ${ctx.country.name} (${ctx.sourceCountryCode})${ctx.targetCountryCode && targetName ? ` → targeting ${targetName} (${ctx.targetCountryCode})` : ""}`,
    `ATS notes (${ctx.hadSpecificRule ? "specific source→target rule" : "generic rule"}): ${rule.preferredFormatting}`,
    `Regional hiring expectations: ${rule.regionalHiringExpectations}`,
    `Relevant keywords: ${Array.isArray(rule.keywords) ? rule.keywords.join(", ") : ""}`,
    "These notes are informational only. Do NOT fabricate visa status, work authorization, residency, local experience, certifications, salary, or employer requirements from them.",
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Analyzer entry point
// ---------------------------------------------------------------------------

export interface AnalyzerOptions {
  targetRole?: string | null;
  targetCountryCode?: string | null;
  sourceCountryCode?: string | null;
}

/**
 * Auth / credit / ownership context for the analyzer. In production the router
 * handles most of these; the function-level hooks exist so unit tests can
 * exercise the full credit lifecycle without a real DB or router.
 */
export interface AnalyzerRunContext {
  userId?: string | number | null;
  planTier?: AiPlanTier;
  guestKey?: string;
  balance?: number;               // current credit balance; < 1 → rejected
  resumeId?: string;
  fetchResume?: (id: string) => Promise<{ userId: string | number; content: any }>;
  onCreditConsume?: (buildId: string) => void;
  onCreditRelease?: (buildId: string) => void;
  /** Inject a stub LLM; defaults to trackedInvokeLLM. */
  llm?: typeof trackedInvokeLLM;
}

/**
 * Analyze an existing resume (client-facing ParsedResume content object).
 *
 * The AI layer is advisory. The score, checks and deterministic
 * recommendations are computed locally and NEVER hinge on the AI's honesty —
 * a hallucinated or malformed AI response degrades gracefully and never crashes.
 */
export async function analyzeResume(
  content: any,
  analyzerOpts: AnalyzerOptions = {},
  runCtx: AnalyzerRunContext = {}
): Promise<ResumeAnalysis> {
  // ------------------------------------------------------------------
  // 1. Input validation
  // ------------------------------------------------------------------
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new Error("Resume content must be a valid content object");
  }

  // ------------------------------------------------------------------
  // 2. Auth & credit gate (when runCtx provides the relevant fields)
  // ------------------------------------------------------------------
  if (runCtx.guestKey && !runCtx.userId) {
    throw new Error("Sign in to run AI analysis.");
  }
  if (runCtx.userId && runCtx.balance !== undefined && runCtx.balance < 1) {
    throw new Error("Insufficient credits. Please upgrade your plan.");
  }

  // ------------------------------------------------------------------
  // 3. Ownership check (optional — router does this in prod)
  // ------------------------------------------------------------------
  if (runCtx.resumeId && runCtx.fetchResume) {
    const fetched = await runCtx.fetchResume(runCtx.resumeId);
    if (!fetched || String(fetched.userId) !== String(runCtx.userId)) {
      throw new Error("Resume not found or access denied.");
    }
  }

  // ------------------------------------------------------------------
  // 4. Credit consumption signal
  // ------------------------------------------------------------------
  const buildId = randomUUID();
  if (runCtx.userId) {
    runCtx.onCreditConsume?.(buildId);
  }

  // ------------------------------------------------------------------
  // 5. Deterministic scoring (always runs, never fails)
  // ------------------------------------------------------------------
  const targetRole = (analyzerOpts.targetRole || "").trim() || undefined;
  const sourceCountryCode =
    resolveCountryCode(analyzerOpts.sourceCountryCode) ??
    resolveCountryCode(content?.header?.countryCode);
  const targetCountryCode =
    resolveCountryCode(analyzerOpts.targetCountryCode) ??
    resolveCountryCode(content?.header?.targetCountryCode);

  const deterministic = scoreResumeDeterministic(content, { targetRole });

  const countryText = buildCountryContextText(sourceCountryCode, targetCountryCode);
  const countryContext: AnalyzerCountryContext | null = sourceCountryCode
    ? {
        sourceCountryCode,
        targetCountryCode,
        sourceCountryName: countryName(sourceCountryCode) || sourceCountryCode,
        targetCountryName: targetCountryCode ? countryName(targetCountryCode) : undefined,
        hadSpecificRule:
          !!targetCountryCode && getCountryContext(sourceCountryCode, targetCountryCode)?.hadSpecificRule === true,
        atsNote:
          countryText?.split("\n").slice(0, 2).join(". ") || "No specific ATS rule mapping.",
      }
    : null;

  // ------------------------------------------------------------------
  // 6. AI qualitative analysis (advisory — failures degrade gracefully)
  // ------------------------------------------------------------------
  let quality: AnalyzerQuality = "degraded";
  let ai: AnalyzerAiAnalysis = {
    summaryAnalysis: "",
    strengths: [],
    issues: [],
    recommendations: [],
    experienceAnalysis: "",
    skillsAnalysis: "",
    projectAnalysis: "",
    keywordObservations: "",
  };
  let aiAvailable = false;

  const llm = runCtx.llm || trackedInvokeLLM;

  try {
    const response = await llm(
      "resume_analyzer",
      {
        messages: [
          { role: "system", content: buildSystemPrompt() },
          {
            role: "user",
            content: buildUserPrompt(contentToText(content), {
              targetRole,
              countryContext: countryText || undefined,
            }),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "resume_analyzer",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summaryAnalysis: { type: "string", description: "Assessment of the professional summary. Say 'Not found in the resume' if absent." },
                strengths: { type: "array", items: { type: "string" }, description: "Genuine strengths present in the resume, max 5." },
                issues: { type: "array", items: { type: "string" }, description: "Genuine issues present in the resume, max 6. No fabricated facts." },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                      area: { type: "string" },
                    },
                    required: ["text", "priority"],
                    additionalProperties: false,
                  },
                  description: "Actionable, grounded recommendations, max 5.",
                },
                experienceAnalysis: { type: "string" },
                skillsAnalysis: { type: "string" },
                projectAnalysis: { type: "string" },
                keywordObservations: { type: "string" },
              },
              required: [
                "summaryAnalysis",
                "strengths",
                "issues",
                "recommendations",
                "experienceAnalysis",
                "skillsAnalysis",
                "projectAnalysis",
                "keywordObservations",
              ],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.2,
      },
      runCtx as TrackedInvokeOptions
    );

    const raw = response.choices?.[0]?.message?.content;
    if (typeof raw === "string" && raw.trim()) {
      const parsed = JSON.parse(raw);
      const validated = validateAiAnalysis(parsed);
      if (aiAnalysisIsUsable(validated)) {
        ai = applyCountryGroundingGuard(validated, content);
        aiAvailable = true;
        quality = "full";
      }
    }
  } catch {
    // AI unavailable or malformed → release credit, keep deterministic-only analysis.
    if (runCtx.userId) {
      runCtx.onCreditRelease?.(buildId);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    quality,
    aiAvailable,
    targetRole,
    countryContext,
    overallScore: deterministic.overallScore,
    categoryScores: deterministic.categoryScores,
    checks: deterministic.checks,
    recommendations: mergeRecommendations(deterministic.recommendations, ai),
    scoreExplanation: deterministic.scoreExplanation,
    summaryAnalysis: ai.summaryAnalysis,
    strengths: ai.strengths,
    issues: ai.issues,
    experienceAnalysis: ai.experienceAnalysis,
    skillsAnalysis: ai.skillsAnalysis,
    projectAnalysis: ai.projectAnalysis,
    keywordObservations: ai.keywordObservations,
  };
}