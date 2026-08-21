import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import {
  Award,
  Trophy,
  Globe,
  Users,
  LayoutList,
  Settings,
  ChevronRight,
} from "lucide-react";
import {
  WizardTabIntro,
} from "./shared";

export interface MoreTabProps {
  setActiveEditTab: (tab: string) => void;
}

export default function MoreTab({
  setActiveEditTab,
}: MoreTabProps) {
  return (
    <TabsContent value="more" className="space-y-5">
      <WizardTabIntro
        icon={LayoutList}
        title="More (optional)"
        description="Add credentials, achievements, languages, references, custom sections, or layout — skip anything you do not need."
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            {
              key: "certifications",
              label: "Credentials",
              icon: Award,
            },
            {
              key: "achievements",
              label: "Achievements",
              icon: Trophy,
            },
            { key: "languages", label: "Languages", icon: Globe },
            {
              key: "references",
              label: "References",
              icon: Users,
            },
            { key: "custom", label: "Custom", icon: LayoutList },
            { key: "layout", label: "Layout", icon: Settings },
          ] as const
        ).map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveEditTab(item.key)}
              className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3 text-left hover:border-primary/50 transition-colors"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                {item.label}
              </span>
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
      <Button
        onClick={() => setActiveEditTab("review")}
        className="w-full min-h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        Continue to Review & Export
      </Button>
    </TabsContent>
  );
}
