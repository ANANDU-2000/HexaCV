import { TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  AlignLeft,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  WizardTabIntro,
  EDITOR_CONTROL_CLASS,
  EDITOR_LABEL_CLASS,
} from "./shared";

export interface SummaryTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
  handleRewriteSummary: (force?: boolean) => void;
  isRewritingSummary: boolean;
  feedbackTarget: "summary" | "bullets" | null;
  isFeedbackPending: boolean;
  sendAiFeedback: (rating: "up" | "down") => void;
}

export default function SummaryTab({
  getSectionContent,
  updateSection,
  handleRewriteSummary,
  isRewritingSummary,
  feedbackTarget,
  isFeedbackPending,
  sendAiFeedback,
}: SummaryTabProps) {
  return (
    <TabsContent value="summary" className="space-y-5">
      <WizardTabIntro
        icon={AlignLeft}
        title="Professional Summary"
        description="A brief paragraph highlighting your career goals, key skills, and achievements."
      />
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label htmlFor="edit-summary" className={EDITOR_LABEL_CLASS}>
            Profile Description
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRewriteSummary()}
            disabled={isRewritingSummary}
            className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:text-primary gap-1.5 h-8 font-bold text-xs"
          >
            {isRewritingSummary ? (
              <>
                <span className="w-3 h-3 border-2 border-success border-t-transparent rounded-full animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-success" />
                Rewrite with AI
              </>
            )}
          </Button>
        </div>
        <Textarea
          id="edit-summary"
          placeholder="Write a brief professional summary highlighting your key skills, experience, and achievements..."
          value={getSectionContent("summary").summary || ""}
          onChange={e =>
            updateSection("summary", {
              summary: e.target.value,
              summaryUserEdited: true,
            })
          }
          rows={8}
          className={`${EDITOR_CONTROL_CLASS} leading-relaxed`}
        />
        {feedbackTarget === "summary" && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">
              Was this AI rewrite helpful?
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={isFeedbackPending}
              onClick={() => sendAiFeedback("up")}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Yes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={isFeedbackPending}
              onClick={() => sendAiFeedback("down")}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              No
            </Button>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
