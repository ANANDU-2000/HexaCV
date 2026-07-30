/**
 * C4 — merge AI output without clobbering user-edited fields.
 */

export type MergeSummaryResult = {
  text: string;
  applied: boolean;
  summaryUserEdited: boolean;
  blocked: boolean;
};

export function mergeSummaryAi(
  current: string,
  ai: string,
  userEdited: boolean | undefined,
  force: boolean
): MergeSummaryResult {
  if (userEdited && !force) {
    return {
      text: current,
      applied: false,
      summaryUserEdited: true,
      blocked: true,
    };
  }
  return {
    text: ai,
    applied: true,
    summaryUserEdited: false,
    blocked: false,
  };
}

export type MergeBulletsResult = {
  bullets: string[];
  flags: boolean[];
  appliedCount: number;
  blockedCount: number;
};

export function mergeBulletsAi(
  current: string[],
  ai: string[],
  editedFlags: boolean[] | undefined,
  force: boolean
): MergeBulletsResult {
  const len = Math.max(current.length, ai.length);
  const flagsIn = editedFlags || [];
  const bullets: string[] = [];
  const flags: boolean[] = [];
  let appliedCount = 0;
  let blockedCount = 0;

  for (let i = 0; i < len; i++) {
    const cur = current[i] ?? "";
    const next = ai[i] ?? cur;
    const edited = !!flagsIn[i];
    if (edited && !force) {
      bullets.push(cur);
      flags.push(true);
      if (next !== cur) blockedCount += 1;
    } else {
      bullets.push(next);
      flags.push(false);
      if (next !== cur) appliedCount += 1;
      else if (!edited) appliedCount += 0;
    }
  }

  // Prefer current length when AI returns wrong count and not forcing empty growth
  if (!force && current.length > 0 && ai.length !== current.length) {
    // Keep length of current for protected merge; AI extras ignored when any protected
    const trimmed = bullets.slice(0, current.length);
    const trimmedFlags = flags.slice(0, current.length);
    return {
      bullets: trimmed,
      flags: trimmedFlags,
      appliedCount,
      blockedCount,
    };
  }

  return { bullets, flags, appliedCount, blockedCount };
}

/** Mark flags true where line text changed vs previous. */
export function markBulletEdits(
  previous: string[],
  next: string[],
  previousFlags?: boolean[]
): boolean[] {
  const prevFlags = previousFlags || [];
  return next.map((line, i) => {
    if (i >= previous.length) return true;
    if (line !== previous[i]) return true;
    return !!prevFlags[i];
  });
}
