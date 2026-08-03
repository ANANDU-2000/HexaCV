/**
 * V6 pre-auth draft capture — survives signup/login redirect via sessionStorage.
 */
export const ENTRY_DRAFT_KEY = "hexacv_entry_draft";

export type EntryDraftSource = "upload" | "paste" | "scratch";

export type EntryDraft = {
  id: string;
  source: EntryDraftSource;
  filename?: string;
  rawText?: string;
  parsed?: unknown;
  sectionsFound?: string[];
  name?: string;
  createdAt: string;
};

export function createDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function saveEntryDraft(draft: EntryDraft): void {
  try {
    sessionStorage.setItem(ENTRY_DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    console.warn("[entryDraft] save failed:", e);
  }
}

export function loadEntryDraft(): EntryDraft | null {
  try {
    const raw = sessionStorage.getItem(ENTRY_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EntryDraft;
  } catch {
    return null;
  }
}

export function clearEntryDraft(): void {
  try {
    sessionStorage.removeItem(ENTRY_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** Best-effort name + section labels from parsed resume JSON. */
export function summarizeParsed(parsed: any): {
  name?: string;
  sectionsFound: string[];
} {
  const sectionsFound: string[] = [];
  if (!parsed || typeof parsed !== "object") {
    return { sectionsFound };
  }
  const name =
    parsed?.header?.name ||
    parsed?.personalInfo?.name ||
    parsed?.name ||
    undefined;
  if (parsed.summary || parsed.professionalSummary) sectionsFound.push("Summary");
  if (Array.isArray(parsed.experiences) && parsed.experiences.length) {
    sectionsFound.push("Experience");
  }
  if (Array.isArray(parsed.experience) && parsed.experience.length) {
    sectionsFound.push("Experience");
  }
  if (Array.isArray(parsed.education) && parsed.education.length) {
    sectionsFound.push("Education");
  }
  if (Array.isArray(parsed.skills) && parsed.skills.length) {
    sectionsFound.push("Skills");
  }
  if (Array.isArray(parsed.projects) && parsed.projects.length) {
    sectionsFound.push("Projects");
  }
  return {
    name: typeof name === "string" ? name : undefined,
    sectionsFound: Array.from(new Set(sectionsFound)),
  };
}
