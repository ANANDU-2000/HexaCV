/** Filename: FirstName_LastName_TargetRole.pdf — PLAN.md §8 */

function sanitizePart(value: string): string {
  return (value || "")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

export function buildExportFilename(params: {
  name?: string | null;
  targetRole?: string | null;
  titleFallback?: string | null;
  ext: "pdf" | "doc" | "docx";
}): string {
  const nameParts = (params.name || "").trim().split(/\s+/).filter(Boolean);
  const first = sanitizePart(nameParts[0] || "");
  const last = sanitizePart(nameParts.slice(1).join("_") || "");
  const role = sanitizePart(params.targetRole || "");
  const bits = [first, last, role].filter(Boolean);
  if (bits.length === 0) {
    const fallback = sanitizePart(params.titleFallback || "resume") || "resume";
    return `${fallback}.${params.ext}`;
  }
  return `${bits.join("_")}.${params.ext}`;
}
