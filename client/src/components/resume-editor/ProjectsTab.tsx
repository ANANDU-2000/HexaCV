import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Folder,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import {
  WizardTabIntro,
  EditableEntryCard,
  EDITOR_CONTROL_CLASS,
  EDITOR_INPUT_CLASS,
  EDITOR_LABEL_CLASS,
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";

export interface ProjectsTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
  moveItem: (sectionType: string, index: number, direction: "up" | "down") => void;
  isValidUrl: (url: string) => boolean;
}

export default function ProjectsTab({
  getSectionContent,
  updateSection,
  moveItem,
  isValidUrl,
}: ProjectsTabProps) {
  return (
    <TabsContent value="projects" className="space-y-5">
      <WizardTabIntro
        icon={Folder}
        title="Projects"
        description="Showcase personal, open-source, or freelance projects with technologies used."
        action={
          <Button
            variant="outline"
            size="sm"
            className={EDITOR_ADD_BUTTON_CLASS}
            onClick={() => {
              const cur =
                getSectionContent("projects").projects || [];
              updateSection("projects", {
                projects: [
                  ...cur,
                  {
                    id: nanoid(),
                    name: "",
                    description: "",
                    technologies: [],
                    link: "",
                    date: "",
                  },
                ],
              });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Project
          </Button>
        }
      />

      <div className="space-y-4">
        {(getSectionContent("projects").projects || []).map(
          (proj: any, idx: number, projects: any[]) => (
            <EditableEntryCard
              key={proj.id || idx}
              icon={Folder}
              title={`Project ${idx + 1}`}
              index={idx}
              count={projects.length}
              onMoveUp={() => moveItem("projects", idx, "up")}
              onMoveDown={() => moveItem("projects", idx, "down")}
              onDelete={() => {
                const list = (
                  getSectionContent("projects").projects || []
                ).filter((p: any) => p.id !== proj.id);
                updateSection("projects", { projects: list });
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={EDITOR_LABEL_CLASS}>
                    Project Name
                  </Label>
                  <Input
                    value={proj.name}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("projects").projects,
                      ];
                      list[idx].name = e.target.value;
                      updateSection("projects", { projects: list });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    value={proj.date}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("projects").projects,
                      ];
                      list[idx].date = e.target.value;
                      updateSection("projects", { projects: list });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Technologies (comma-separated)
                  </Label>
                  <Input
                    value={proj.technologies.join(", ")}
                    className={EDITOR_INPUT_CLASS}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("projects").projects,
                      ];
                      list[idx].technologies = e.target.value
                        .split(",")
                        .map((t: string) => t.trim())
                        .filter(Boolean);
                      updateSection("projects", { projects: list });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link URL</Label>
                  <Input
                    value={proj.link}
                    className={cn(
                      EDITOR_INPUT_CLASS,
                      !isValidUrl(proj.link) &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                    onChange={e => {
                      const list = [
                        ...getSectionContent("projects").projects,
                      ];
                      list[idx].link = e.target.value;
                      updateSection("projects", { projects: list });
                    }}
                  />
                  {!isValidUrl(proj.link) && (
                    <span className="text-[10px] text-destructive font-medium block">
                      Please enter a valid URL.
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={proj.description}
                  className={EDITOR_CONTROL_CLASS}
                  onChange={e => {
                    const list = [
                      ...getSectionContent("projects").projects,
                    ];
                    list[idx].description = e.target.value;
                    updateSection("projects", { projects: list });
                  }}
                  rows={2}
                />
              </div>
            </EditableEntryCard>
          )
        )}
      </div>
    </TabsContent>
  );
}
