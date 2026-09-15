import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import {
  Globe,
  Plus,
} from "lucide-react";
import {
  WizardTabIntro,
  EditableEntryCard,
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";
import { LanguageFields } from "@/components/resume-sections/fields";

export interface LanguagesTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
  moveItem: (sectionType: string, index: number, direction: "up" | "down") => void;
}

export default function LanguagesTab({
  getSectionContent,
  updateSection,
  moveItem,
}: LanguagesTabProps) {
  return (
    <TabsContent value="languages" className="space-y-5">
      <WizardTabIntro
        icon={Globe}
        title="Languages"
        description="Languages you speak and your proficiency level in each."
        action={
          <Button
            variant="outline"
            size="sm"
            className={EDITOR_ADD_BUTTON_CLASS}
            onClick={() => {
              const cur =
                getSectionContent("languages").languages || [];
              updateSection("languages", {
                languages: [
                  ...cur,
                  { language: "", proficiency: "" },
                ],
              });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Language
          </Button>
        }
      />

      <div className="space-y-4">
        {(getSectionContent("languages").languages || []).map(
          (lang: any, idx: number, languages: any[]) => (
            <EditableEntryCard
              key={idx}
              icon={Globe}
              title={`Language ${idx + 1}`}
              index={idx}
              count={languages.length}
              onMoveUp={() => moveItem("languages", idx, "up")}
              onMoveDown={() => moveItem("languages", idx, "down")}
              onDelete={() => {
                const list = (
                  getSectionContent("languages").languages || []
                ).filter((_: any, i: number) => i !== idx);
                updateSection("languages", {
                  languages: list,
                });
              }}
            >
              <LanguageFields
                value={lang}
                onChange={patch => {
                  const list = [
                    ...getSectionContent("languages").languages,
                  ];
                  list[idx] = { ...list[idx], ...patch };
                  updateSection("languages", {
                    languages: list,
                  });
                }}
              />
            </EditableEntryCard>
          )
        )}
        {(getSectionContent("languages").languages || []).length ===
          0 && (
          <p className="text-xs text-muted-foreground italic">
            No languages added. Add languages to showcase bilingual
            or multilingual skills.
          </p>
        )}
      </div>
    </TabsContent>
  );
}
