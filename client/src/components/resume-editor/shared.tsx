import { type ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";

export const EDITOR_CONTROL_CLASS =
  "rounded-lg border-border bg-muted text-foreground focus-visible:ring-ring text-sm";
export const EDITOR_INPUT_CLASS = `h-10 ${EDITOR_CONTROL_CLASS}`;
export const EDITOR_LABEL_CLASS = "text-xs font-semibold text-muted-foreground";
export const EDITOR_ADD_BUTTON_CLASS =
  "shrink-0 gap-1.5 h-8 text-xs font-semibold border-border hover:bg-muted hover:text-foreground rounded-lg";
export const EDITOR_ENTRY_CARD_CLASS =
  "border border-border p-5 rounded-xl space-y-4 bg-muted hover:border-muted-foreground/40 transition-colors";

export function WizardTabIntro({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-[15px] leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function EditableEntryCard({
  icon: Icon,
  title,
  index,
  count,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}: {
  icon: LucideIcon;
  title: string;
  index: number;
  count: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  return (
    <div className={EDITOR_ENTRY_CARD_CLASS}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-muted-foreground" />
          {title}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground hover:text-foreground"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground hover:text-foreground"
            onClick={onMoveDown}
            disabled={index === count - 1}
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive min-h-11"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
