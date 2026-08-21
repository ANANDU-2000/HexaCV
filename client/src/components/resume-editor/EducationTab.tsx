import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  GraduationCap,
  Sparkles,
  Plus,
} from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import {
  WizardTabIntro,
  EditableEntryCard,
  EDITOR_INPUT_CLASS,
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";

export interface EducationTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
  moveItem: (sectionType: string, index: number, direction: "up" | "down") => void;
}

export default function EducationTab({
  getSectionContent,
  updateSection,
  moveItem,
}: EducationTabProps) {
  return (
    <TabsContent value="education" className="space-y-5">
      <WizardTabIntro
        icon={GraduationCap}
        title="Education"
        description="Your academic background including degrees, institutions, and graduation dates."
        action={
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className={EDITOR_ADD_BUTTON_CLASS}
              onClick={() => {
                const cur =
                  getSectionContent("education").educations || [];
                const cleaned = cur.map((e: any) => ({
                  ...e,
                  field:
                    (e.field || "").includes("•") ||
                    (e.field || "").length > 80 ||
                    /\b(developed|built|implemented|created|managed|designed|framework|express|node|react|django|api)\b/i.test(
                      e.field || ""
                    )
                      ? ""
                      : e.field,
                }));
                updateSection("education", { educations: cleaned });
                toast.success("Cleaned up Education data!");
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Clean Fields
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={EDITOR_ADD_BUTTON_CLASS}
              onClick={() => {
                const cur =
                  getSectionContent("education").educations || [];
                updateSection("education", {
                  educations: [
                    ...cur,
                    {
                      id: nanoid(),
                      institution: "",
                      degree: "",
                      field: "",
                      graduationDate: "",
                      gpa: "",
                    },
                  ],
                });
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Education
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {(getSectionContent("education").educations || []).map(
          (edu: any, idx: number, educations: any[]) => (
            <EditableEntryCard
              key={edu.id || idx}
              icon={GraduationCap}
              title={`Education ${idx + 1}`}
              index={idx}
              count={educations.length}
              onMoveUp={() => moveItem("education", idx, "up")}
              onMoveDown={() => moveItem("education", idx, "down")}
              onDelete={() => {
                const list = (
                  getSectionContent("education").educations || []
                ).filter((e: any) => e.id !== edu.id);
                updateSection("education", { educations: list });
              }}
            >
              <div className="grid resume-editor-grid-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Institution</Label>
                  <Input
                    value={edu.institution}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("education")
                          .educations,
                      ];
                      list[idx].institution = e.target.value;
                      updateSection("education", {
                        educations: list,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Degree</Label>
                  <Input
                    value={edu.degree}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("education")
                          .educations,
                      ];
                      list[idx].degree = e.target.value;
                      updateSection("education", {
                        educations: list,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Field of Study</Label>
                  <Input
                    value={edu.field}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("education")
                          .educations,
                      ];
                      list[idx].field = e.target.value;
                      updateSection("education", {
                        educations: list,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Graduation Date</Label>
                  <Input
                    value={edu.graduationDate}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("education")
                          .educations,
                      ];
                      list[idx].graduationDate = e.target.value;
                      updateSection("education", {
                        educations: list,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">GPA</Label>
                  <Input
                    value={edu.gpa}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("education")
                          .educations,
                      ];
                      list[idx].gpa = e.target.value;
                      updateSection("education", {
                        educations: list,
                      });
                    }}
                  />
                </div>
              </div>
            </EditableEntryCard>
          )
        )}
      </div>
    </TabsContent>
  );
}
