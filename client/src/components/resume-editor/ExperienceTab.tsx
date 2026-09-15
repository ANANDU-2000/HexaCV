import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import {
  Briefcase,
  Sparkles,
  Plus,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { nanoid } from "nanoid";
import {
  WizardTabIntro,
  EditableEntryCard,
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";
import { ExperienceFields } from "@/components/resume-sections/fields";

export interface ExperienceTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
  moveItem: (sectionType: string, index: number, direction: "up" | "down") => void;
  feedbackTarget: "summary" | "bullets" | null;
  isFeedbackPending: boolean;
  sendAiFeedback: (rating: "up" | "down") => void;
  rewritingExpId: string | null;
  handleRewriteExperienceBullets: (idx: number) => void;
}

export default function ExperienceTab({
  getSectionContent,
  updateSection,
  moveItem,
  feedbackTarget,
  isFeedbackPending,
  sendAiFeedback,
  rewritingExpId,
  handleRewriteExperienceBullets,
}: ExperienceTabProps) {
  return (
    <TabsContent value="experience" className="space-y-5">
      <WizardTabIntro
        icon={Briefcase}
        title="Work Experience"
        description="List your roles in reverse chronological order. Include measurable achievements."
        action={
          <Button
            variant="outline"
            size="sm"
            className={EDITOR_ADD_BUTTON_CLASS}
            onClick={() => {
              const cur =
                getSectionContent("experience").experiences || [];
              updateSection("experience", {
                experiences: [
                  ...cur,
                  {
                    id: nanoid(),
                    company: "",
                    role: "",
                    startDate: "",
                    endDate: "",
                    current: false,
                    description: [],
                  },
                ],
              });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Position
          </Button>
        }
      />

      <div className="space-y-4">
        {(getSectionContent("experience").experiences || []).length ===
          0 && (
          <p className="text-xs text-muted-foreground italic">
            No positions yet. Add your first role to start your work
            history.
          </p>
        )}
        {(getSectionContent("experience").experiences || []).map(
          (exp: any, idx: number, experiences: any[]) => (
            <EditableEntryCard
              key={exp.id || idx}
              icon={Briefcase}
              title={`Position ${idx + 1}`}
              index={idx}
              count={experiences.length}
              onMoveUp={() => moveItem("experience", idx, "up")}
              onMoveDown={() => moveItem("experience", idx, "down")}
              onDelete={() => {
                const list = (
                  getSectionContent("experience").experiences || []
                ).filter((e: any) => e.id !== exp.id);
                updateSection("experience", {
                  experiences: list,
                });
              }}
            >
              <ExperienceFields
                value={exp}
                onChange={patch => {
                  const list = [
                    ...getSectionContent("experience").experiences,
                  ];
                  list[idx] = { ...list[idx], ...patch };
                  updateSection("experience", {
                    experiences: list,
                  });
                }}
                trackBulletEdits
                descriptionLabelAction={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      rewritingExpId === (exp.id || String(idx))
                    }
                    onClick={() =>
                      handleRewriteExperienceBullets(idx)
                    }
                    className="h-7 text-[10px] font-bold gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:text-primary"
                  >
                    {rewritingExpId === (exp.id || String(idx)) ? (
                      <>
                        <span className="w-3 h-3 border-2 border-success border-t-transparent rounded-full animate-spin" />
                        Rewriting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Rewrite Bullets
                      </>
                    )}
                  </Button>
                }
              />
              {feedbackTarget === "bullets" &&
                rewritingExpId === null && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-muted-foreground">
                    Was this AI rewrite helpful?
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={isFeedbackPending}
                    onClick={() => sendAiFeedback("up")}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={isFeedbackPending}
                    onClick={() => sendAiFeedback("down")}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    No
                  </Button>
                </div>
              )}
            </EditableEntryCard>
          )
        )}
      </div>
    </TabsContent>
  );
}
