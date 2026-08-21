import type { Resume } from "@shared/types";
import { TabsContent } from "@/shared/ui/tabs";
import ResumePreview from "../ResumePreview";
import PreviewToolbar from "./PreviewToolbar";
import { getDefaultTemplate } from "@/lib/templates";

export interface PreviewTabProps {
  localResume: Resume;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  handleSectionSelect: (type: string) => void;
}

export default function PreviewTab({
  localResume,
  zoom,
  onZoomChange,
  handleSectionSelect,
}: PreviewTabProps) {
  return (
    <TabsContent value="preview" className="h-full min-h-0 flex flex-col gap-3">
      <PreviewToolbar
        variant="mobile"
        zoom={zoom}
        onZoomChange={onZoomChange}
        subtitle="Inspect your resume before export."
      />
      <div className="flex-1 min-h-0 overflow-hidden flex border-y border-border bg-muted sm:rounded-xl sm:border">
        <ResumePreview
          resume={localResume}
          templateId={getDefaultTemplate().id}
          zoom={zoom}
          contentId="resume-preview-mobile"
          onSectionSelect={handleSectionSelect}
        />
      </div>
    </TabsContent>
  );
}
