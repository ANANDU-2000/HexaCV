import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Award,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import {
  WizardTabIntro,
  EditableEntryCard,
  EDITOR_INPUT_CLASS,
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">
                  Certification Name
                </Label>
                <Input
                  value={cert.name}
                  className={EDITOR_INPUT_CLASS}
                  onChange={e => {
                    const list = [
                      ...getSectionContent("certifications")
                        .certifications,
                    ];
                    list[idx].name = e.target.value;
                    updateSection("certifications", {
                      certifications: list,
                    });
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Issuer</Label>
                <Input
                  value={cert.issuer}
                  className={EDITOR_INPUT_CLASS}
                  onChange={e => {
                    const list = [
                      ...getSectionContent("certifications")
                        .certifications,
                    ];
                    list[idx].issuer = e.target.value;
                    updateSection("certifications", {
                      certifications: list,
                    });
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Issue Date</Label>
                <Input
                  value={cert.date}
                  className={EDITOR_INPUT_CLASS}
                  onChange={e => {
                    const list = [
                      ...getSectionContent("certifications")
                        .certifications,
                    ];
                    list[idx].date = e.target.value;
                    updateSection("certifications", {
                      certifications: list,
                    });
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Credential Link</Label>
                <Input
                  value={cert.link}
                  className={cn(
                    EDITOR_INPUT_CLASS,
                    !isValidUrl(cert.link) &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                  onChange={e => {
                    const list = [
                      ...getSectionContent("certifications")
                        .certifications,
                    ];
                    list[idx].link = e.target.value;
                    updateSection("certifications", {
                      certifications: list,
                    });
                  }}
                />
                {!isValidUrl(cert.link) && (
                  <span className="text-[10px] text-destructive font-medium block">
                    Please enter a valid URL.
                  </span>
                )}
              </div>
            </div>
          </EditableEntryCard>
        ))}
      </div>
    </TabsContent>
  );
}
