import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import {
  Code,
  Plus,
} from "lucide-react";
import {
  WizardTabIntro,
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";
import { SkillCategoryFields } from "@/components/resume-sections/fields";

export interface SkillsTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
}

export default function SkillsTab({
  getSectionContent,
  updateSection,
}: SkillsTabProps) {
  return (
    <TabsContent value="skills" className="space-y-5">
      <WizardTabIntro
        icon={Code}
        title="Skills & Technologies"
        description="Group your skills by category for ATS scanners and hiring managers."
        action={
          <Button
            variant="outline"
            size="sm"
            className={EDITOR_ADD_BUTTON_CLASS}
            onClick={() => {
              const cur = getSectionContent("skills").skills || [];
              updateSection("skills", {
                skills: [...cur, { category: "", skills: [] }],
              });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </Button>
        }
      />

      <div className="space-y-3">
        {(getSectionContent("skills").skills || []).map(
          (group: any, idx: number) => (
            <div
              key={idx}
              className="border border-border p-4 rounded-xl space-y-3 bg-muted hover:border-muted-foreground/40 transition-colors"
            >
              <SkillCategoryFields
                value={group}
                onChange={patch => {
                  const list = [
                    ...getSectionContent("skills").skills,
                  ];
                  list[idx] = { ...list[idx], ...patch };
                  updateSection("skills", { skills: list });
                }}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive min-h-11 shrink-0"
                    onClick={() => {
                      const list = (
                        getSectionContent("skills").skills || []
                      ).filter((_: any, i: number) => i !== idx);
                      updateSection("skills", { skills: list });
                    }}
                  >
                    Remove
                  </Button>
                }
              />
            </div>
          )
        )}
      </div>
    </TabsContent>
  );
}
