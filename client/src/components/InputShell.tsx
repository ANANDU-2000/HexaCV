import { useState, type ReactNode } from 'react';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ResumePreview from '@/components/ResumePreview';
import { cn } from '@/lib/utils';
import type { Resume } from '@shared/types';

interface InputShellProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  resume?: Resume | null;
}

export default function InputShell({
  icon,
  title,
  description,
  children,
  resume,
}: InputShellProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 items-start">
        <div className="min-w-0 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
              {icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {children}
        </div>

        <div className="hidden lg:block sticky top-20">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {resume ? (
              <div className="p-4">
                <ResumePreview resume={resume} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Eye className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Your preview will appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fill in the details and generate your resume to see a live preview.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {resume && (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className={cn(
            'fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg transition-all hover:shadow-xl lg:hidden',
          )}
        >
          <Eye className="h-4 w-4" />
          <span className="text-sm font-semibold">Preview</span>
        </button>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" showCloseButton>
          {resume && <ResumePreview resume={resume} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
