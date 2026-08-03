import { Pencil, Trash2 } from "lucide-react";
import ResumePreview from "@/components/ResumePreview";
import type { Resume } from "@shared/types";

const T = {
  surface: "#131b33",
  elevated: "#1c2747",
  primary: "#1e40af",
  primaryText: "#b8c4ff",
  accent: "#ea580c",
  text: "#e2e8f0",
  muted: "#94a3b8",
  outlineVariant: "#2a3a5c",
};

/** A4 page width used by ResumePreview; scale to fit card frame. */
const PREVIEW_PAGE_WIDTH = 794;
const FRAME_WIDTH = 280;
const FRAME_HEIGHT = 360;
const SCALE = FRAME_WIDTH / PREVIEW_PAGE_WIDTH;

interface ResumeHubCardProps {
  resume: Resume;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ResumeHubCard({ resume, onEdit, onDelete }: ResumeHubCardProps) {
  const updatedLabel = resume.updatedAt
    ? new Date(resume.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <article
      className="flex flex-col overflow-hidden rounded-2xl border"
      style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}
    >
      {/* [output-frame] Scaled ResumePreview — same component as editor/export path */}
      <button
        type="button"
        onClick={() => onEdit(resume.id)}
        className="relative w-full overflow-hidden border-b text-left"
        style={{
          height: FRAME_HEIGHT,
          borderColor: T.outlineVariant,
          backgroundColor: T.elevated,
        }}
        aria-label={`Edit ${resume.title || "Untitled resume"}`}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-0 origin-top"
          style={{
            width: PREVIEW_PAGE_WIDTH,
            transform: `translateX(-50%) scale(${SCALE})`,
          }}
        >
          <ResumePreview resume={resume} templateId={resume.templateId} zoom={100} />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{
            background: `linear-gradient(transparent, ${T.elevated})`,
          }}
        />
      </button>

      <div className="flex flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold" style={{ color: T.text }}>
            {resume.title || "Untitled resume"}
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: T.muted }}>
            Updated {updatedLabel}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(resume.id)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: T.primary, color: "#fff" }}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(resume.id)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border transition hover:opacity-90"
            style={{ borderColor: T.outlineVariant, color: T.muted }}
            aria-label={`Delete ${resume.title || "resume"}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
