import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FloatingLabelTextarea } from "@/shared/ui/floating-field";
import { Plus, Sparkles, Trash2, X, ExternalLink, Lightbulb } from "lucide-react";
import type { Resume } from "@shared/types";
import { markBulletEdits } from "@/lib/userEditedMerge";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  header: "Contact Info",
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements",
  languages: "Languages",
  references: "References",
  custom: "Custom",
};

/** Regional AI tip, sourced from the targeting draft (same source as JdKeywordMatch). */
function regionTip(): string | null {
  try {
    const raw = localStorage.getItem("hexacv_target_panel_draft");
    if (!raw) return null;
    const d = JSON.parse(raw) as { market?: string };
    if (d.market === "Gulf") {
      return "In the Gulf, mention visa status only if you actually supplied it.";
    }
    if (d.market === "India") {
      return "For India, keep the structure clear and ATS keywords grounded in your experience.";
    }
    return null;
  } catch {
    return null;
  }
}

type ContextualEditorProps = {
  resume: Resume;
  sectionType: string | null;
  onClose: () => void;
  onUpdateSection: (type: string, fields: any) => void;
  onRewriteSummary: () => void;
  onRewriteBullets: (expIndex: number) => void;
  onJumpToEdit: (tab: string) => void;
  isRewritingSummary?: boolean;
  rewritingExpId?: string | null;
};

/**
 * Contextual editor — Flow A step 6 / wireframe.
 * Slides out over the live preview when a section is clicked, offering inline
 * editing, an AI rewrite action, and a regional tip.
 */
export default function ContextualEditor({
  resume,
  sectionType,
  onClose,
  onUpdateSection,
  onRewriteSummary,
  onRewriteBullets,
  onJumpToEdit,
  isRewritingSummary,
  rewritingExpId,
}: ContextualEditorProps) {
  const [selExpIdx, setSelExpIdx] = useState(0);
  useEffect(() => setSelExpIdx(0), [sectionType]);

  if (!sectionType) return null;

  const label = SECTION_LABELS[sectionType] || sectionType;
  const tip = regionTip();
  const sec = resume.sections.find((s) => s.type === sectionType);
  const content = sec?.content || {};

  const renderBody = () => {
    switch (sectionType) {
      case "summary":
        return (
          <div className="space-y-3">
            <FloatingLabelTextarea
              label="Professional summary"
              value={content.summary || ""}
              onChange={(e) =>
                onUpdateSection("summary", {
                  summary: e.target.value,
                  summaryUserEdited: true,
                })
              }
              rows={7}
              className="text-sm"
            />
            <Button
              variant="outline"
              className="min-h-11 w-full rounded-xl"
              disabled={isRewritingSummary || !(content.summary || "").trim()}
              onClick={onRewriteSummary}
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              {isRewritingSummary ? "Rewriting…" : "AI Rewrite: Strengthen"}
            </Button>
          </div>
        );

      case "skills": {
        const groups = content.skills || [];
        return (
          <div className="space-y-3">
            {groups.map((g: any, gi: number) => (
              <div key={gi} className="rounded-xl border border-border bg-card p-3 space-y-2">
                <Input
                  placeholder="Category (e.g. Languages)"
                  value={g.category || ""}
                  className="h-11 rounded-lg"
                  onChange={(e) => {
                    const list = [...groups];
                    list[gi] = { ...g, category: e.target.value };
                    onUpdateSection("skills", { skills: list });
                  }}
                />
                <div className="flex items-start gap-2">
                  <Input
                    placeholder="React, Vue, SQL…"
                    value={(g.skills || []).join(", ")}
                    className="h-11 rounded-lg"
                    onChange={(e) => {
                      const list = [...groups];
                      list[gi] = {
                        ...g,
                        skills: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean),
                      };
                      onUpdateSection("skills", { skills: list });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${g.category || "skills"} group`}
                    className="h-11 w-11 shrink-0 rounded-lg text-destructive"
                    onClick={() =>
                      onUpdateSection(
                        "skills",
                        { skills: groups.filter((_: any, i: number) => i !== gi) }
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="min-h-11 w-full rounded-xl"
              onClick={() =>
                onUpdateSection("skills", {
                  skills: [...groups, { category: "", skills: [] }],
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add category
            </Button>
          </div>
        );
      }

      case "experience": {
        const exps = content.experiences || [];
        if (exps.length === 0) {
          return (
            <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              No positions yet — add them in the full editor.
            </div>
          );
        }
        const idx = Math.min(selExpIdx, exps.length - 1);
        const exp = exps[idx];
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {exps.map((e: any, i: number) => (
                <button
                  key={e.id || i}
                  type="button"
                  onClick={() => setSelExpIdx(i)}
                  className={cn(
                    "min-h-11 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    i === idx
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {e.role || e.company || `Position ${i + 1}`}
                </button>
              ))}
            </div>
            <FloatingLabelTextarea
              label={`Bullets — ${exp.role || "position"} (one per line)`}
              value={(exp.description || []).join("\n")}
              onChange={(e) => {
                const next = e.target.value.split("\n").filter(Boolean);
                const list = [...exps];
                list[idx] = {
                  ...exp,
                  description: next,
                  descriptionEdited: markBulletEdits(
                    exp.description || [],
                    next,
                    exp.descriptionEdited
                  ),
                };
                onUpdateSection("experience", { experiences: list });
              }}
              rows={6}
              className="text-sm"
            />
            <Button
              variant="outline"
              className="min-h-11 w-full rounded-xl"
              disabled={rewritingExpId === (exp.id || String(idx)) || !(exp.description || []).length}
              onClick={() => onRewriteBullets(idx)}
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              {rewritingExpId === (exp.id || String(idx))
                ? "Rewriting…"
                : "AI Rewrite: Strengthen Verbs"}
            </Button>
          </div>
        );
      }

      default:
        return (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            This section is edited in the full editor where you have more room.
            Use the button below to jump straight to it.
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Edit ${label}`}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-background shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contextual editor
            </p>
            <h2 className="font-display truncate text-lg font-semibold text-foreground">{label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">{renderBody()}</div>

        {tip && (
          <div className="mx-4 mb-3 flex items-start gap-2.5 rounded-xl border border-[color:var(--warning)]/40 bg-card p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warning)]" strokeWidth={1.75} />
            <p className="text-xs leading-relaxed text-foreground">
              <span className="font-semibold">AI Tip: </span>
              {tip}
            </p>
          </div>
        )}

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-3">
          <span className="text-xs text-muted-foreground">
            Edits save automatically.
          </span>
          <Button
            variant="ghost"
            className="min-h-11 rounded-xl text-primary"
            onClick={() => onJumpToEdit(sectionType)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in full editor
          </Button>
        </footer>
      </aside>
    </div>
  );
}
