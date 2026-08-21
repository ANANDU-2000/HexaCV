import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Code,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WizardTabIntro,
  EDITOR_INPUT_CLASS,
} from "./shared";

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
            className="shrink-0 gap-1.5 h-8 text-xs font-semibold border-border hover:bg-muted hover:text-foreground rounded-lg"
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
              <div className="flex justify-between items-center">
                <Input
                  placeholder="e.g. Languages"
                  value={group.category}
                  className={cn(EDITOR_INPUT_CLASS, "max-w-xs font-semibold")}
                  onChange={e => {
                    const list = [
                      ...getSectionContent("skills").skills,
                    ];
                    list[idx].category = e.target.value;
                    updateSection("skills", { skills: list });
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive min-h-11"
                  onClick={() => {
                    const list = (
                      getSectionContent("skills").skills || []
                    ).filter((_: any, i: number) => i !== idx);
                    updateSection("skills", { skills: list });
                  }}
                >
                  Remove
                </Button>
              </div>
              <Input
                placeholder="Skills comma separated: React, Vue"
                className={EDITOR_INPUT_CLASS}
                value={group.skills.join(", ")}
                onChange={e => {
                  const list = [
                    ...getSectionContent("skills").skills,
                  ];
                  list[idx].skills = e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean);
                  updateSection("skills", { skills: list });
                }}
              />
            </div>
          )
        )}
      </div>
    </TabsContent>
  );
}
