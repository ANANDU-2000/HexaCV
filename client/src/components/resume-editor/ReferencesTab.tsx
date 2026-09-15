import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import {
  Users,
  Plus,
} from "lucide-react";
import { nanoid } from "nanoid";
import {
  WizardTabIntro,
  EditableEntryCard,
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";
import { ReferenceFields } from "@/components/resume-sections/fields";

export interface ReferencesTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
  moveItem: (sectionType: string, index: number, direction: "up" | "down") => void;
  isValidEmail: (email: string) => boolean;
  isValidPhone: (phone: string) => boolean;
}

export default function ReferencesTab({
  getSectionContent,
  updateSection,
  moveItem,
  isValidEmail,
  isValidPhone,
}: ReferencesTabProps) {
  return (
    <TabsContent value="references" className="space-y-5">
      <WizardTabIntro
        icon={Users}
        title="Professional References"
        description="People who can vouch for your work quality and character."
        action={
          <Button
            variant="outline"
            size="sm"
            className={EDITOR_ADD_BUTTON_CLASS}
            onClick={() => {
              const cur =
                getSectionContent("references").references || [];
              updateSection("references", {
                references: [
                  ...cur,
                  {
                    id: nanoid(),
                    name: "",
                    company: "",
                    title: "",
                    email: "",
                    phone: "",
                    availableOnRequest: false,
                  },
                ],
              });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Reference
          </Button>
        }
      />

      <div className="space-y-4">
        {(getSectionContent("references").references || []).map(
          (ref: any, idx: number, references: any[]) => (
            <EditableEntryCard
              key={ref.id || idx}
              icon={Users}
              title={`Reference ${idx + 1}`}
              index={idx}
              count={references.length}
              onMoveUp={() => moveItem("references", idx, "up")}
              onMoveDown={() => moveItem("references", idx, "down")}
              onDelete={() => {
                const list = (
                  getSectionContent("references").references || []
                ).filter((r: any) => r.id !== ref.id);
                updateSection("references", {
                  references: list,
                });
              }}
            >
              <ReferenceFields
                value={ref}
                onChange={patch => {
                  const list = [
                    ...getSectionContent("references").references,
                  ];
                  list[idx] = { ...list[idx], ...patch };
                  updateSection("references", {
                    references: list,
                  });
                }}
                isValidEmail={isValidEmail}
                isValidPhone={isValidPhone}
              />
            </EditableEntryCard>
          )
        )}
        {(getSectionContent("references").references || [])
          .length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No references added. Add references or select "Available
            upon request".
          </p>
        )}
      </div>
    </TabsContent>
  );
}
