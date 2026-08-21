import type { Resume } from "@shared/types";
import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import {
  Settings,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  WizardTabIntro,
} from "./shared";

export interface LayoutTabProps {
  moveSection: (index: number, direction: "up" | "down") => void;
  toggleSectionVisibility: (sectionId: string) => void;
  localResume: Resume;
}

export default function LayoutTab({
  moveSection,
  toggleSectionVisibility,
  localResume,
}: LayoutTabProps) {
  return (
    <TabsContent value="layout" className="space-y-5">
      <WizardTabIntro
        icon={Settings}
        title="Section Order & Visibility"
        description="Drag to reorder sections and toggle visibility on your resume."
      />
      <div className="space-y-2 border border-border rounded-xl p-4 bg-muted">
        {[...localResume.sections]
          .sort((a, b) => a.order - b.order)
          .map((sec, idx, sortedList) => (
            <div
              key={sec.id}
              className="flex items-center justify-between bg-card border border-border p-3 rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">
                  #{idx + 1}
                </span>
                <span className="text-sm font-semibold capitalize text-foreground">
                  {sec.type === "custom"
                    ? `Custom Sections`
                    : sec.type === "certifications"
                      ? "Certifications (Credentials)"
                      : sec.type}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Toggle visibility */}
                <div className="flex items-center gap-1.5 mr-2">
                  <input
                    type="checkbox"
                    id={`vis-${sec.id}`}
                    checked={sec.visible}
                    onChange={() => toggleSectionVisibility(sec.id)}
                    className="w-4 h-4 rounded text-success focus:ring-success border-border bg-muted"
                  />
                  <label
                    htmlFor={`vis-${sec.id}`}
                    className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                  >
                    {sec.visible ? "Visible" : "Hidden"}
                  </label>
                </div>
                {/* Move up / down */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => moveSection(idx, "up")}
                  disabled={idx === 0 || sec.type === "header"} // header is usually locked at top
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => moveSection(idx, "down")}
                  disabled={
                    idx === sortedList.length - 1 ||
                    sec.type === "header"
                  }
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
      </div>
    </TabsContent>
  );
}
