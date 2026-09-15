import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
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
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";
import { EducationFields } from "@/components/resume-sections/fields";

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
              <EducationFields
                value={edu}
                onChange={patch => {
                  const list = [
                    ...getSectionContent("education").educations,
                  ];
                  list[idx] = { ...list[idx], ...patch };
                  updateSection("education", {
                    educations: list,
                  });
                }}
              />
            </EditableEntryCard>
          )
        )}
      </div>
    </TabsContent>
  );
}
