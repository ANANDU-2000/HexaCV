/**
 * Single home for the `hexacv_target_panel_draft` localStorage draft.
 *
 * Every page that reads/writes the target panel draft (Landing, Targeting,
 * ResumeBuilder, ResumeUploader, ResumeEditor, ContextualEditor) must go
 * through these helpers — no local copies of the key or its get/set logic.
 *
 * Canonical shape (superset of what every consumer needs):
 *   { role, experience, market, jobDescription }
 *
 * `saveTargetDraft` merges the given patch over the stored draft so a partial
 * write (e.g. Landing prefilling just `role`) never wipes other fields.
 */
import type { ParsedResume } from "@shared/types";

export const TARGET_DRAFT_KEY = "hexacv_target_panel_draft";

export type TargetDraft = {
  role?: string;
  experience?: string;
  market?: string;
  jobDescription?: string;
};

export function loadTargetDraft(): TargetDraft | null {
  try {
    const raw = localStorage.getItem(TARGET_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as TargetDraft;
  } catch {
    return null;
  }
}

export function saveTargetDraft(patch: TargetDraft): void {
  try {
    const existing = loadTargetDraft() || {};
    localStorage.setItem(
      TARGET_DRAFT_KEY,
      JSON.stringify({ ...existing, ...patch })
    );
  } catch {
    /* ignore quota */
  }
}

export function clearTargetDraft(): void {
  try {
    localStorage.removeItem(TARGET_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** Auto-detect the target role from a parsed document and store it. */
export function prefillTargetRoleFromParsed(parsed: ParsedResume): void {
  try {
    const detectedRole = (
      parsed?.header?.targetRole ||
      parsed?.header?.jobTitle ||
      ""
    )
      .toString()
      .trim();
    if (!detectedRole) return;
    saveTargetDraft({ role: detectedRole });
  } catch {
    /* ignore */
  }
}
