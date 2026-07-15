import { useState } from 'react';
import { Sparkles, Check, X, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  original: string;
  suggested: string;
  accepted: boolean;
  rejected: boolean;
}

interface AISuggestionsPanelProps {
  open: boolean;
  onClose: () => void;
}

const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: '1',
    original: 'Responsible for managing a team of developers and delivering projects on time.',
    suggested: 'Led a cross-functional team of 5 developers to deliver 3 major projects ahead of schedule, improving delivery velocity by 30%.',
    accepted: false,
    rejected: false,
  },
  {
    id: '2',
    original: 'Worked on frontend development using React and TypeScript.',
    suggested: 'Architected and implemented a component-based UI layer using React 18 and TypeScript, reducing page load time by 40%.',
    accepted: false,
    rejected: false,
  },
  {
    id: '3',
    original: 'Helped with backend API development and database management.',
    suggested: 'Designed and deployed 12 RESTful APIs on Node.js/Express with PostgreSQL, handling 50K+ daily requests at 99.9% uptime.',
    accepted: false,
    rejected: false,
  },
];

export default function AISuggestionsPanel({ open, onClose }: AISuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const acceptOne = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, accepted: true, rejected: false } : s)),
    );
  };

  const rejectOne = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, accepted: false, rejected: true } : s)),
    );
  };

  const acceptAll = () => {
    setSuggestions((prev) =>
      prev.map((s) => ({ ...s, accepted: true, rejected: false })),
    );
  };

  const pendingCount = suggestions.filter((s) => !s.accepted && !s.rejected).length;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:bg-transparent lg:static"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          'fixed lg:sticky top-0 right-0 z-50 h-full w-full max-w-sm border-l border-border bg-background shadow-xl transition-transform duration-300 lg:h-auto lg:max-w-none lg:shadow-none lg:border-0',
          open ? 'translate-x-0' : 'translate-x-full lg:hidden',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">AI Suggestions</h3>
              <Badge variant="secondary" className="text-[10px] font-medium ml-1">
                {pendingCount} pending
              </Badge>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Lightbulb className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No suggestions yet</p>
                <p className="text-xs text-muted-foreground">
                  Select text in your resume and ask AI for suggestions.
                </p>
              </div>
            ) : (
              suggestions.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    'rounded-xl border p-3 transition-all',
                    s.accepted
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-950/10'
                      : s.rejected
                        ? 'border-slate-200 bg-slate-50/50 opacity-60 dark:border-white/5 dark:bg-white/5'
                        : 'border-border bg-card',
                  )}
                >
                  <div className="space-y-2">
                    <div className="rounded-lg bg-muted/50 p-2.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Original
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {s.original}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      className="flex w-full items-center gap-1 text-xs text-primary font-medium"
                    >
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 transition-transform',
                          expandedId === s.id && 'rotate-180',
                        )}
                      />
                      Suggested rewrite
                    </button>

                    {expandedId === s.id && (
                      <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5">
                        <p className="text-xs text-foreground leading-relaxed">
                          {s.suggested}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      {!s.accepted && !s.rejected && (
                        <>
                          <button
                            type="button"
                            onClick={() => rejectOne(s.id)}
                            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => acceptOne(s.id)}
                            className="flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <Check className="h-3 w-3" />
                            Accept
                          </button>
                        </>
                      )}
                      {s.accepted && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 text-[10px]">
                          <Check className="h-3 w-3 mr-0.5" />
                          Accepted
                        </Badge>
                      )}
                      {s.rejected && (
                        <Badge className="bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-border text-[10px]">
                          Dismissed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {suggestions.length > 0 && pendingCount > 0 && (
            <div className="border-t border-border px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={acceptAll}
                className="w-full text-xs font-medium"
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Accept all ({pendingCount})
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
