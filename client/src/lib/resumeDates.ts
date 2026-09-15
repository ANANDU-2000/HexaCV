import type { Experience } from "@shared/types";

/**
 * Parses a free-form resume date string into a comparable timestamp where
 * possible. Supports ISO-ish values ("2024", "2024-05", "2024-05-12") which
 * the resume parser / preview formatting emit. Returns null when the value is
 * not parseable (e.g. "Jan 2022"), so callers skip validation for free text.
 */
export function parseResumeDate(
  value: string | null | undefined
): number | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;

  const iso = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(v);
  if (iso) {
    const [, y, m, d] = iso;
    const year = Number(y);
    const month = m ? Math.min(12, Number(m)) : 1;
    const day = d ? Math.min(31, Number(d)) : 1;
    return Date.UTC(year, month - 1, day);
  }
  return null;
}

/**
 * True when both start and end dates parse and the range is inverted
 * (start later than end). "Present"/"current" end markers are open-ended and
 * never inverted; unparseable free-form values are skipped (returns false) so
 * this is a non-blocking hint, not a hard validator.
 */
export function hasInvertedDateRange(
  startDate?: string,
  endDate?: string
): boolean {
  const end = (endDate || "").trim().toLowerCase();
  if (end === "present" || end === "current") return false;
  const s = parseResumeDate(startDate);
  const e = parseResumeDate(endDate);
  if (s === null || e === null) return false;
  return s > e;
}

/**
 * Patch produced when the "Currently Work Here" toggle changes. Checking sets
 * the "Present" sentinel; unchecking clears ONLY the auto-set sentinel so a
 * date the user typed themselves is never silently wiped.
 */
export function resolveCurrentToggle(
  current: boolean,
  endDate?: string
): Pick<Experience, "current"> &
  Partial<Pick<Experience, "endDate">> {
  if (current) return { current: true, endDate: "Present" };
  return endDate === "Present"
    ? { current: false, endDate: "" }
    : { current: false };
}