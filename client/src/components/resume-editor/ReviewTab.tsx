import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  WizardTabIntro,
} from "./shared";

export interface ReviewTabProps {
  atsSummary: {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
    completenessScore: number;
  };
  setShowDownloadModal: (show: boolean) => void;
}

export default function ReviewTab({
  atsSummary,
  setShowDownloadModal,
}: ReviewTabProps) {
  return (
    <TabsContent value="review" className="space-y-6">
      <WizardTabIntro
        icon={CheckCircle2}
        title="Final Review & Export"
        description="Review your ATS optimization checklist and export your final resume."
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Detailed ATS Score Widget */}
        <Card className="border border-border shadow-sm p-5 space-y-4 bg-muted rounded-xl">
          <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5 border-b border-border pb-2">
            <Sparkles className="w-4 h-4 text-success" />
            ATS Optimization Details
          </h4>

          <div className="flex items-center gap-4">
            {/* Radial Gauge */}
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  className="text-border stroke-current"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  strokeWidth="8"
                ></circle>
                <circle
                  className="text-success stroke-current transition-all duration-1000"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  strokeDasharray="251.2"
                  strokeDashoffset={
                    251.2 * (1 - atsSummary.score / 100)
                  }
                  strokeLinecap="round"
                  strokeWidth="8"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-sm font-extrabold text-foreground">
                  {atsSummary.score}%
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">
                {atsSummary.score >= 70
                  ? "Ready for Applications!"
                  : atsSummary.score >= 40
                    ? "Needs Improvement"
                    : "Urgent Actions Required"}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Keywords: {atsSummary.matchedKeywords.length}{" "}
                matched
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Sections: {atsSummary.completenessScore}% filled
              </p>
            </div>
          </div>

          {/* Keyword list details */}
          <div className="space-y-3 pt-2 border-t border-border text-xs">
            <div>
              <span className="font-bold text-muted-foreground block mb-1">
                Matched Keywords (
                {atsSummary.matchedKeywords.length}):
              </span>
              {atsSummary.matchedKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {atsSummary.matchedKeywords
                    .slice(0, 5)
                    .map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded font-semibold text-[9px]"
                      >
                        {kw}
                      </span>
                    ))}
                  {atsSummary.matchedKeywords.length > 5 && (
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded font-semibold text-[9px]">
                      +{atsSummary.matchedKeywords.length - 5} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">
                  None matched yet. Tailor skills and experience
                  sections.
                </p>
              )}
            </div>

            {atsSummary.missingKeywords.length > 0 && (
              <div>
                <span className="font-bold text-muted-foreground block mb-1">
                  Missing Keywords (
                  {atsSummary.missingKeywords.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {atsSummary.missingKeywords
                    .slice(0, 5)
                    .map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-destructive/10 text-destructive border border-destructive/20 rounded font-semibold text-[9px]"
                      >
                        {kw}
                      </span>
                    ))}
                  {atsSummary.missingKeywords.length > 5 && (
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded font-semibold text-[9px]">
                      +{atsSummary.missingKeywords.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {atsSummary.suggestions.length > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-black text-warning block">
                Suggestions:
              </span>
              <ul className="text-[10px] text-warning list-disc pl-4 space-y-1 font-semibold max-h-24 overflow-y-auto">
                {atsSummary.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Completion Panel */}
        <Card className="border border-border shadow-sm p-6 flex flex-col items-center justify-center text-center bg-muted rounded-xl space-y-4 min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success animate-pulse">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-foreground text-sm">
              All Sections Completed!
            </h4>
            <p className="text-[10px] text-muted-foreground max-w-[240px] font-semibold">
              You have filled in all the core information. Click
              "Finish & Export" to download your ATS-ready resume.
            </p>
          </div>

          <Button
            onClick={() => setShowDownloadModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 h-10 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Finish & Export
          </Button>
        </Card>
      </div>
    </TabsContent>
  );
}
