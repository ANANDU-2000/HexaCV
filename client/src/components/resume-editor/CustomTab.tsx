import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  LayoutList,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import {
  WizardTabIntro,
  EDITOR_CONTROL_CLASS,
  EDITOR_ADD_BUTTON_CLASS,
  EDITOR_ENTRY_CARD_CLASS,
} from "./shared";

export interface CustomTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
  moveItem: (sectionType: string, index: number, direction: "up" | "down") => void;
}

export default function CustomTab({
  getSectionContent,
  updateSection,
  moveItem,
}: CustomTabProps) {
  return (
    <TabsContent value="custom" className="space-y-5">
      <WizardTabIntro
        icon={LayoutList}
        title="Custom Sections"
        description="Add volunteer work, patents, publications, or any other section."
        action={
          <Button
            variant="outline"
            size="sm"
            className={EDITOR_ADD_BUTTON_CLASS}
            onClick={() => {
              const cur =
                getSectionContent("custom").customSections || [];
              updateSection("custom", {
                customSections: [
                  ...cur,
                  { id: nanoid(), title: "", items: [] },
                ],
              });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Section
          </Button>
        }
      />

      <div className="space-y-6">
        {(getSectionContent("custom").customSections || []).map(
          (sect: any, sectIdx: number) => (
            <div
              key={sect.id || sectIdx}
              className={EDITOR_ENTRY_CARD_CLASS}
            >
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1 max-w-sm">
                  <Label className="text-xs font-bold text-muted-foreground">
                    Section Title *
                  </Label>
                  <Input
                    value={sect.title}
                    placeholder="e.g. Volunteer Work, Patents"
                    className={cn(
                      EDITOR_CONTROL_CLASS,
                      "font-bold h-9 mt-1"
                    )}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("custom")
                          .customSections,
                      ];
                      list[sectIdx].title = e.target.value;
                      updateSection("custom", {
                        customSections: list,
                      });
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 mt-5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      moveItem("custom", sectIdx, "up")
                    }
                    disabled={sectIdx === 0}
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      moveItem("custom", sectIdx, "down")
                    }
                    disabled={
                      sectIdx ===
                      (
                        getSectionContent("custom")
                          .customSections || []
                      ).length -
                        1
                    }
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-8 font-bold"
                    onClick={() => {
                      const list = (
                        getSectionContent("custom")
                          .customSections || []
                      ).filter((s: any) => s.id !== sect.id);
                      updateSection("custom", {
                        customSections: list,
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {/* Items in custom section */}
              <div className="space-y-3 bg-muted border border-border p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Section Items
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-border hover:bg-muted"
                    onClick={() => {
                      const list = [
                        ...getSectionContent("custom")
                          .customSections,
                      ];
                      list[sectIdx].items = [
                        ...(list[sectIdx].items || []),
                        {
                          id: nanoid(),
                          title: "",
                          subtitle: "",
                          description: "",
                        },
                      ];
                      updateSection("custom", {
                        customSections: list,
                      });
                    }}
                  >
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {(sect.items || []).map(
                    (item: any, itemIdx: number) => (
                      <div
                        key={item.id || itemIdx}
                        className="border border-border p-3 rounded-md bg-muted space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            Item #{itemIdx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                const list = [
                                  ...getSectionContent("custom")
                                    .customSections,
                                ];
                                const items = [
                                  ...list[sectIdx].items,
                                ];
                                if (itemIdx > 0) {
                                  const tmp = items[itemIdx];
                                  items[itemIdx] =
                                    items[itemIdx - 1];
                                  items[itemIdx - 1] = tmp;
                                  list[sectIdx].items = items;
                                  updateSection("custom", {
                                    customSections: list,
                                  });
                                }
                              }}
                              disabled={itemIdx === 0}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                const list = [
                                  ...getSectionContent("custom")
                                    .customSections,
                                ];
                                const items = [
                                  ...list[sectIdx].items,
                                ];
                                if (itemIdx < items.length - 1) {
                                  const tmp = items[itemIdx];
                                  items[itemIdx] =
                                    items[itemIdx + 1];
                                  items[itemIdx + 1] = tmp;
                                  list[sectIdx].items = items;
                                  updateSection("custom", {
                                    customSections: list,
                                  });
                                }
                              }}
                              disabled={
                                itemIdx ===
                                (sect.items || []).length - 1
                              }
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => {
                                const list = [
                                  ...getSectionContent("custom")
                                    .customSections,
                                ];
                                list[sectIdx].items = list[
                                  sectIdx
                                ].items.filter(
                                  (i: any) => i.id !== item.id
                                );
                                updateSection("custom", {
                                  customSections: list,
                                });
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px]">
                              Item Title *
                            </Label>
                            <Input
                              value={item.title}
                              placeholder="e.g. Volunteer"
                              className={cn(
                                EDITOR_CONTROL_CLASS,
                                "h-8 text-xs"
                              )}
                              onChange={e => {
                                const list = [
                                  ...getSectionContent("custom")
                                    .customSections,
                                ];
                                list[sectIdx].items[itemIdx].title =
                                  e.target.value;
                                updateSection("custom", {
                                  customSections: list,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">
                              Subtitle / Organization
                            </Label>
                            <Input
                              value={item.subtitle}
                              placeholder="e.g. Red Cross"
                              className={cn(
                                EDITOR_CONTROL_CLASS,
                                "h-8 text-xs"
                              )}
                              onChange={e => {
                                const list = [
                                  ...getSectionContent("custom")
                                    .customSections,
                                ];
                                list[sectIdx].items[
                                  itemIdx
                                ].subtitle = e.target.value;
                                updateSection("custom", {
                                  customSections: list,
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">
                            Description
                          </Label>
                          <Textarea
                            value={item.description || ""}
                            placeholder="e.g. Managed team of 15 volunteers..."
                            className={cn(
                              EDITOR_CONTROL_CLASS,
                              "text-xs"
                            )}
                            rows={2}
                            onChange={e => {
                              const list = [
                                ...getSectionContent("custom")
                                  .customSections,
                              ];
                              list[sectIdx].items[
                                itemIdx
                              ].description = e.target.value;
                              updateSection("custom", {
                                customSections: list,
                              });
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        )}
        {(getSectionContent("custom").customSections || [])
          .length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No custom sections added. Add volunteer work,
            certifications, patents, or publications.
          </p>
        )}
      </div>
    </TabsContent>
  );
}
