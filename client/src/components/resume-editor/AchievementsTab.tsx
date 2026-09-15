import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/lib/utils";
import {
  EDITOR_INPUT_CLASS,
} from "./shared";

export interface AchievementsTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
}

export default function AchievementsTab({
  getSectionContent,
  updateSection,
}: AchievementsTabProps) {
  return (
    <TabsContent value="achievements" className="space-y-6">
      {/* Achievements Editor */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
            Achievements Highlights
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs border-border hover:bg-muted"
            onClick={() => {
              const cur =
                getSectionContent("achievements").achievements ||
                [];
              updateSection("achievements", {
                achievements: [...cur, ""],
              });
            }}
          >
            Add Achievement
          </Button>
        </div>

        <div className="space-y-3">
          {(
            getSectionContent("achievements").achievements || []
          ).map((ach: string, idx: number) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                placeholder="e.g. Winner of national hackathon out of 500+ teams"
                value={ach}
                onChange={e => {
                  const list = [
                    ...getSectionContent("achievements")
                      .achievements,
                  ];
                  list[idx] = e.target.value;
                  updateSection("achievements", {
                    achievements: list,
                  });
                }}
                className={cn(EDITOR_INPUT_CLASS, "rounded-xl")}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive h-9"
                onClick={() => {
                  const list = (
                    getSectionContent("achievements")
                      .achievements || []
                  ).filter((_: any, i: number) => i !== idx);
                  updateSection("achievements", {
                    achievements: list,
                  });
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          {(getSectionContent("achievements").achievements || [])
            .length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No achievements added. Add key milestones to stand
              out.
            </p>
          )}
        </div>
      </div>
    </TabsContent>
  );
}
