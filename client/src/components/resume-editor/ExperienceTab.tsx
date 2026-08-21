import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Briefcase,
  Sparkles,
  Plus,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { nanoid } from "nanoid";
import { markBulletEdits } from "@/lib/userEditedMerge";
import {
  WizardTabIntro,
  EditableEntryCard,
  EDITOR_CONTROL_CLASS,
  EDITOR_INPUT_CLASS,
  EDITOR_LABEL_CLASS,
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={EDITOR_LABEL_CLASS}>
                    Company Name
                  </Label>
                  <Input
                    value={exp.company}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("experience")
                          .experiences,
                      ];
                      list[idx].company = e.target.value;
                      updateSection("experience", {
                        experiences: list,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={EDITOR_LABEL_CLASS}>
                    Job Title
                  </Label>
                  <Input
                    value={exp.role}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("experience")
                          .experiences,
                      ];
                      list[idx].role = e.target.value;
                      updateSection("experience", {
                        experiences: list,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={EDITOR_LABEL_CLASS}>
                    Start Date
                  </Label>
                  <Input
                    value={exp.startDate}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("experience")
                          .experiences,
                      ];
                      list[idx].startDate = e.target.value;
                      updateSection("experience", {
                        experiences: list,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={EDITOR_LABEL_CLASS}>
                    End Date
                  </Label>
                  <Input
                    value={exp.endDate}
                    disabled={exp.current}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("experience")
                          .experiences,
                      ];
                      list[idx].endDate = e.target.value;
                      updateSection("experience", {
                        experiences: list,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={e => {
                    const list = [
                      ...getSectionContent("experience")
                        .experiences,
                    ];
                    list[idx].current = e.target.checked;
                    if (e.target.checked)
                      list[idx].endDate = "Present";
                    updateSection("experience", {
                      experiences: list,
                    });
                  }}
                  className="w-4 h-4 rounded text-primary focus:ring-ring border-border bg-muted"
                />
                <span className={EDITOR_LABEL_CLASS}>
                  Currently Work Here
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">
                    Description Bullets (one per line)
                  </Label>
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
                </div>
                <Textarea
                  value={exp.description.join("\n")}
                  onChange={e => {
                    const list = [
                      ...getSectionContent("experience")
                        .experiences,
                    ];
                    const prev = list[idx];
                    const nextDesc = e.target.value
                      .split("\n")
                      .filter(Boolean);
                    list[idx] = {
                      ...prev,
                      description: nextDesc,
                      descriptionEdited: markBulletEdits(
                        prev.description || [],
                        nextDesc,
                        prev.descriptionEdited
                      ),
                    };
                    updateSection("experience", {
                      experiences: list,
                    });
                  }}
                  rows={3}
                  className={EDITOR_CONTROL_CLASS}
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
              </div>
            </EditableEntryCard>
          )
        )}
      </div>
    </TabsContent>
  );
}
