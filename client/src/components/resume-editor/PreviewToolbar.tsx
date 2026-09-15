import { Eye, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 35;
const ZOOM_MAX = 150;
const ZOOM_STEP = 10;

export type PreviewToolbarVariant = "mobile" | "desktop";

export interface PreviewToolbarProps {
  zoom: number;
  onZoomChange: (next: number) => void;
  subtitle: string;
  variant: PreviewToolbarVariant;
}

export function clampPreviewZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

export default function PreviewToolbar({
  zoom,
  onZoomChange,
  subtitle,
  variant,
}: PreviewToolbarProps) {
  const isMobile = variant === "mobile";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        isMobile
          ? "rounded-t-xl border-b border-border bg-card/85 px-3 py-2.5 sm:rounded-xl sm:border"
          : "shrink-0 items-start border-b border-border px-4 py-3 bg-card/55 backdrop-blur-sm"
      )}
    >
      <div
        className={cn(
          "flex min-w-0 gap-2.5",
          isMobile ? "items-center" : "items-start gap-3"
        )}
      >
        <div
          className={cn(
            "rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0",
            isMobile ? "w-8 h-8" : "w-9 h-9"
          )}
        >
          <Eye
            className={cn(
              "text-primary",
              isMobile ? "w-4 h-4" : "w-4.5 h-4.5"
            )}
          />
        </div>
        <div className="min-w-0">
          <h3
            className={cn(
              "font-bold text-foreground leading-tight",
              isMobile ? "text-sm truncate" : "text-[15px]"
            )}
          >
            Live Preview
          </h3>
          <p
            className={cn(
              "text-xs text-muted-foreground mt-0.5 font-semibold",
              isMobile && "hidden sm:block"
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex gap-1.5 items-center",
          isMobile ? "rounded-xl bg-muted p-1" : "shrink-0"
        )}
      >
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-11 w-11 border-border bg-card",
            isMobile ? "rounded-lg" : "hover:bg-muted"
          )}
          onClick={() => onZoomChange(clampPreviewZoom(zoom - ZOOM_STEP))}
          aria-label="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
        <span
          className={cn(
            "text-[11px] text-foreground font-extrabold px-1 text-center",
            isMobile ? "min-w-[34px]" : "min-w-[36px]"
          )}
        >
          {zoom}%
        </span>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-11 w-11 border-border bg-card",
            isMobile ? "rounded-lg" : "hover:bg-muted"
          )}
          onClick={() => onZoomChange(clampPreviewZoom(zoom + ZOOM_STEP))}
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
