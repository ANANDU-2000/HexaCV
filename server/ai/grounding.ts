/**
 * Shared AI grounding / rewrite rules — single source for C1/C2 prompts.
 * Do not duplicate these strings in orchestrator or aiSuggestions.
 */

/** Full-resume extract / rewrite grounding (pipeline + generate). */
export const AI_GROUNDING_RULES =
  "CRITICAL RULES — you MUST follow all of these:\n" +
  "1. ONLY use facts from the provided source / extract. Do NOT invent achievements, metrics, companies, degrees, tools, or responsibilities.\n" +
  "2. Preserve company names, dates, technologies, and numbers exactly as stated.\n" +
  "3. Do NOT use generic AI filler phrases (e.g. 'results-driven', 'synergy', 'leveraged', 'spearheaded').\n" +
  "4. Tailor wording to the job title and target profile, but never fabricate experience.\n" +
  "5. If a section has no grounded facts, use empty string or empty array.\n" +
  "6. Return empty strings or empty arrays rather than inventing placeholder content.\n";

/** Section rewrite (bullets / summary / projects) — same count, no new facts. */
export const STRICT_REWRITE_RULES =
  "CRITICAL RULES — you MUST follow all of these:\n" +
  "1. ONLY rephrase existing facts from the candidate's content. Do NOT invent achievements, metrics, companies, degrees, tools, or responsibilities.\n" +
  "2. Do NOT add new bullet points. Rewrite only the bullets provided — same count, same underlying facts.\n" +
  "3. Do NOT use generic AI filler phrases (e.g. 'results-driven', 'synergy', 'leveraged', 'spearheaded' unless the original used similar language).\n" +
  "4. Preserve all company names, dates, technologies, and numbers exactly as stated.\n" +
  "5. Tailor wording to the candidate's job title and target role using keywords from the job description, but never fabricate experience.\n" +
  "6. If a bullet cannot be improved without inventing facts, return it nearly unchanged.\n" +
  "7. NEVER add skills, experiences, education, or sentences that are not in the source material.\n" +
  "8. Return empty strings or empty arrays rather than inventing placeholder content.\n";

/** Upload/parse extract — genuine content only. */
export const EXTRACT_PARSE_RULES =
  "GENUINE CONTENT ONLY — never invent achievements, metrics, or duties. " +
  "NO HALLUCINATIONS — empty string/array beats a fabricated field. " +
  "EMPTY OVER INVENTED. Preserve names/dates/titles exactly as stated.\n";
