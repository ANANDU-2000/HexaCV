// ============================================================================
// Resume example landing data (SEO pages: /resume-examples/:country/:role)
// ============================================================================
// Grounded positioning: example bullets are illustrative rewrites of real
// experience patterns. No invented metrics, no fake percentages.
// ============================================================================

import { PRESET_JOBS } from '@/lib/jobDescriptions';
import { DEFAULT_ATS_RULES, GENERIC_ATS_RULE } from '@shared/countriesData';
import type { JobDescription } from '@shared/types';

export interface FocusCountry {
  code: string; // lowercase ISO 3166-1 alpha-2, used in URLs
  name: string;
}

export const FOCUS_COUNTRIES: FocusCountry[] = [
  { code: 'ae', name: 'United Arab Emirates' },
  { code: 'sa', name: 'Saudi Arabia' },
  { code: 'in', name: 'India' },
];

export interface ResumeExampleRoute {
  country: string;
  role: string;
  path: string;
}

export interface ResumeExample {
  country: string;
  countryName: string;
  roleSlug: string;
  job: JobDescription;
  atsNotes: string[];
  exampleBullets: string[];
  builderHref: string;
}

/** "Full-Stack Developer" -> "full-stack-developer" */
export function slugifyRole(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** All country x role combinations (8 roles x 3 countries = 24 routes). */
export function getAllResumeExampleRoutes(): ResumeExampleRoute[] {
  const routes: ResumeExampleRoute[] = [];
  for (const country of FOCUS_COUNTRIES) {
    for (const job of PRESET_JOBS) {
      const role = slugifyRole(job.title);
      routes.push({
        country: country.code,
        role,
        path: `/resume-examples/${country.code}/${role}`,
      });
    }
  }
  return routes;
}

/**
 * ATS guidance for a target country. Prefers a DEFAULT_ATS_RULES entry whose
 * targetCountryCode matches (case-insensitive); falls back to GENERIC_ATS_RULE
 * (covers SA and IN, which have no dedicated target rule today).
 */
function getAtsNotes(countryCode: string): string[] {
  const match = DEFAULT_ATS_RULES.find(
    (rule) => rule.targetCountryCode.toLowerCase() === countryCode.toLowerCase()
  );
  const rule = match ?? GENERIC_ATS_RULE;
  return [rule.preferredFormatting, rule.regionalHiringExpectations];
}

/**
 * Illustrative grounded bullets derived from the preset's keywords.
 * These model how a real bullet reads after a grounded rewrite: plain wording,
 * no invented percentages, every claim traceable to actual experience.
 */
function buildExampleBullets(job: JobDescription, countryName: string): string[] {
  const [k1, k2, k3, k4] = job.keywords;
  const bullets = [
    `Delivered ${k1} and ${k2} work as part of day-to-day ${job.title} responsibilities, described in plain, verifiable wording.`,
    `Built and maintained features using ${k3}${k4 ? ` and ${k4}` : ''}, matching the skills that ${job.title} openings in ${countryName} typically list.`,
    `Collaborated with teammates on ${k1} tasks and documented outcomes honestly, without inflating scope or seniority.`,
    `Aligned resume wording with ${job.title} hiring expectations in ${countryName}, keeping every claim traceable to real experience.`,
  ];
  return bullets;
}

/** Resolve a country + role slug into full example page data. Null if invalid. */
export function getResumeExample(
  country: string,
  roleSlug: string
): ResumeExample | null {
  const focusCountry = FOCUS_COUNTRIES.find(
    (c) => c.code === country.toLowerCase()
  );
  if (!focusCountry) return null;

  const job = PRESET_JOBS.find((j) => slugifyRole(j.title) === roleSlug);
  if (!job) return null;

  return {
    country: focusCountry.code,
    countryName: focusCountry.name,
    roleSlug,
    job,
    atsNotes: getAtsNotes(focusCountry.code),
    exampleBullets: buildExampleBullets(job, focusCountry.name),
    builderHref: `/builder?role=${encodeURIComponent(job.title)}&country=${focusCountry.code.toUpperCase()}`,
  };
}
