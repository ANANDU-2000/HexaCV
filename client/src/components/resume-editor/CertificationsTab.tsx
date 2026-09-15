import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import {
  Award,
  Plus,
} from "lucide-react";
import { nanoid } from "nanoid";
import {
  WizardTabIntro,
  EditableEntryCard,
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";
import { CertificationFields } from "@/components/resume-sections/fields";

export interface CertificationsTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
  moveItem: (sectionType: string, index: number, direction: "up" | "down") => void;
  isValidUrl: (url: string) => boolean;
}

export default function CertificationsTab({
  getSectionContent,
  updateSection,
  moveItem,
  isValidUrl,
}: CertificationsTabProps) {
  return (
    <TabsContent value="certifications" className="space-y-5">
      <WizardTabIntro
        icon={Award}
        title="Certifications & Credentials"
        description="Professional certifications, licenses, or credentials you have earned."
        action={
          <Button
            variant="outline"
            size="sm"
            className={EDITOR_ADD_BUTTON_CLASS}
            onClick={() => {
              const cur =
                getSectionContent("certifications")
                  .certifications || [];
              updateSection("certifications", {
                certifications: [
                  ...cur,
                  {
                    id: nanoid(),
                    name: "",
                    issuer: "",
                    date: "",
                    link: "",
                  },
                ],
              });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Certification
          </Button>
        }
      />

      <div className="space-y-4">
        {(
          getSectionContent("certifications").certifications || []
        ).map((cert: any, idx: number, certifications: any[]) => (
          <EditableEntryCard
            key={cert.id || idx}
            icon={Award}
            title={`Certification ${idx + 1}`}
            index={idx}
            count={certifications.length}
            onMoveUp={() => moveItem("certifications", idx, "up")}
            onMoveDown={() =>
              moveItem("certifications", idx, "down")
            }
            onDelete={() => {
              const list = (
                getSectionContent("certifications")
                  .certifications || []
              ).filter((c: any) => c.id !== cert.id);
              updateSection("certifications", {
                certifications: list,
              });
            }}
          >
            <CertificationFields
              value={cert}
              onChange={patch => {
                const list = [
                  ...getSectionContent("certifications")
                    .certifications,
                ];
                list[idx] = { ...list[idx], ...patch };
                updateSection("certifications", {
                  certifications: list,
                });
              }}
              isValidUrl={isValidUrl}
            />
          </EditableEntryCard>
        ))}
      </div>
    </TabsContent>
  );
}
