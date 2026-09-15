import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import {
  Folder,
  Plus,
} from "lucide-react";
import { nanoid } from "nanoid";
import {
  WizardTabIntro,
  EditableEntryCard,
  EDITOR_ADD_BUTTON_CLASS,
} from "./shared";
import { ProjectFields } from "@/components/resume-sections/fields";

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
              <ProjectFields
                value={proj}
                onChange={patch => {
                  const list = [
                    ...getSectionContent("projects").projects,
                  ];
                  list[idx] = { ...list[idx], ...patch };
                  updateSection("projects", { projects: list });
                }}
                isValidUrl={isValidUrl}
              />
            </EditableEntryCard>
          )
        )}
      </div>
    </TabsContent>
  );
}
