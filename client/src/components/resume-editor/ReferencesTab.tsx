import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Users,
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
              <div className="flex items-center space-x-2 pb-1">
                <input
                  type="checkbox"
                  id={`ref-available-${ref.id}`}
                  checked={ref.availableOnRequest}
                  onChange={e => {
                    const list = [
                      ...getSectionContent("references").references,
                    ];
                    list[idx].availableOnRequest = e.target.checked;
                    updateSection("references", {
                      references: list,
                    });
                  }}
                  className="w-4 h-4 rounded text-primary focus:ring-ring border-border bg-muted"
                />
                <Label
                  htmlFor={`ref-available-${ref.id}`}
                  className="text-xs font-semibold text-muted-foreground cursor-pointer"
                >
                  Available upon request
                </Label>
              </div>

              {!ref.availableOnRequest && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name *</Label>
                    <Input
                      value={ref.name}
                      placeholder="e.g. Jane Doe"
                      className={EDITOR_INPUT_CLASS}
                      onChange={e => {
                        const list = [
                          ...getSectionContent("references")
                            .references,
                        ];
                        list[idx].name = e.target.value;
                        updateSection("references", {
                          references: list,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={ref.company}
                      placeholder="e.g. Google"
                      className={EDITOR_INPUT_CLASS}
                      onChange={e => {
                        const list = [
                          ...getSectionContent("references")
                            .references,
                        ];
                        list[idx].company = e.target.value;
                        updateSection("references", {
                          references: list,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={ref.title}
                      placeholder="e.g. Director of Engineering"
                      className={EDITOR_INPUT_CLASS}
                      onChange={e => {
                        const list = [
                          ...getSectionContent("references")
                            .references,
                        ];
                        list[idx].title = e.target.value;
                        updateSection("references", {
                          references: list,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={ref.email}
                      placeholder="jane.doe@example.com"
                      className={cn(
                        EDITOR_INPUT_CLASS,
                        !isValidEmail(ref.email) &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                      onChange={e => {
                        const list = [
                          ...getSectionContent("references")
                            .references,
                        ];
                        list[idx].email = e.target.value;
                        updateSection("references", {
                          references: list,
                        });
                      }}
                    />
                    {!isValidEmail(ref.email) && (
                      <span className="text-[9px] text-destructive font-semibold block">
                        Invalid email format.
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={ref.phone}
                      placeholder="e.g. +1 (555) 019-2834"
                      className={cn(
                        EDITOR_INPUT_CLASS,
                        !isValidPhone(ref.phone) &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                      onChange={e => {
                        const list = [
                          ...getSectionContent("references")
                            .references,
                        ];
                        list[idx].phone = e.target.value;
                        updateSection("references", {
                          references: list,
                        });
                      }}
                    />
                    {!isValidPhone(ref.phone) && (
                      <span className="text-[9px] text-destructive font-semibold block">
                        Invalid phone number.
                      </span>
                    )}
                  </div>
                </div>
              )}
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
