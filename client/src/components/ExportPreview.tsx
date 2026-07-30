import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { Resume } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { exportResumeToPDF } from '@/lib/pdfExport';
import { PRESET_JOBS, matchPresetJobByTitle } from '@/lib/jobDescriptions';
import ResumePreview from './ResumePreview';
import {
  ArrowLeft, Download, LayoutGrid,
  CheckCircle2, AlertTriangle, FileText,
  ZoomIn, ZoomOut, Bookmark, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const EXPORT_TEMPLATES = [
  { id: 'classic-ats-blue', name: 'Classic ATS Blue', description: 'Single-column, ATS-friendly layout with blue accents', thumbColor: 'bg-blue-500' },
  { id: 'minimal-executive', name: 'Minimal Executive', description: 'Clean minimalist design with emerald accents', thumbColor: 'bg-emerald-500' },
  { id: 'modern-sidebar-lite', name: 'Modern Sidebar Lite', description: 'Two-column with sidebar for skills and contact', thumbColor: 'bg-slate-700' },
  { id: 'technical-compact', name: 'Technical Compact', description: 'Compact layout optimized for dense technical content', thumbColor: 'bg-violet-500' },
  { id: 'crystalline-professional', name: 'Crystalline Professional', description: 'Dark mode resume with crystalline blue tones and orange accents', thumbColor: 'bg-blue-950' },
] as const;

const PROGRESS_STEPS = [
  { label: 'Preparing layout...', pct: 10 },
  { label: 'Rendering pages...', pct: 35 },
  { label: 'Generating PDF...', pct: 60 },
  { label: 'Compressing...', pct: 85 },
  { label: 'Done!', pct: 100 },
];

type ExportPhase = 'idle' | 'generating' | 'complete' | 'error';

interface ATSResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  hasJobDescription: boolean;
}

interface ExportPreviewProps {
  resume: Resume;
  onBack: () => void;
  onSaveToDashboard: (resume: Resume) => void;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function ExportPreview({ resume, onBack, onSaveToDashboard }: ExportPreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(resume.templateId || 'classic-ats-blue');
  const [zoom, setZoom] = useState(85);
  const [phase, setPhase] = useState<ExportPhase>('idle');
  const [progressPct, setProgressPct] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const exportContentRef = useRef<HTMLDivElement>(null);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [pinchZoom, setPinchZoom] = useState<number | null>(null);
  const touchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  const headerContent = useMemo(() => {
    const h = resume.sections.find(s => s.type === 'header')?.content?.header || {};
    return h;
  }, [resume]);

  const selectedJob = useMemo(() => {
    if (resume.jobDescriptionId) {
      return PRESET_JOBS.find(j => j.id === resume.jobDescriptionId) || null;
    }
    const h = headerContent;
    const targetRole = (h as any).targetRole || (h as any).jobTitle || '';
    if (!targetRole) return null;
    const id = matchPresetJobByTitle(targetRole, targetRole);
    return id ? PRESET_JOBS.find(j => j.id === id) || null : null;
  }, [resume.jobDescriptionId, headerContent]);

  const computedAts = useMemo(() => {
    return computeATSScore(resume, selectedJob);
  }, [resume, selectedJob]);

  useEffect(() => {
    setAtsResult(computedAts);
  }, [computedAts]);

  const zoomValue = pinchZoom ?? zoom;

  const handleZoomIn = () => setZoom(z => Math.min(150, z + 10));
  const handleZoomOut = () => setZoom(z => Math.max(40, z - 10));

  useEffect(() => {
    if (window.innerWidth < 640) {
      setZoom(42);
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchRef.current = { startDist: dist, startZoom: zoomValue };
    }
  }, [zoomValue]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchRef.current.startDist;
      const newZoom = Math.max(30, Math.min(200, Math.round(touchRef.current.startZoom * scale)));
      setPinchZoom(newZoom);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pinchZoom !== null) {
      setZoom(pinchZoom);
      setPinchZoom(null);
    }
    touchRef.current = null;
  }, [pinchZoom]);

  const handleExport = useCallback(async () => {
    if (phase === 'generating') return;
    setPhase('generating');
    setProgressPct(0);
    setProgressLabel('');

    try {
      for (const step of PROGRESS_STEPS) {
        setProgressPct(step.pct);
        setProgressLabel(step.label);
        await delay(350);
      }

      const element = exportContentRef.current;
      if (!element) throw new Error('Preview element not found');
      await exportResumeToPDF(element, (resume.title || 'resume') + '.pdf');

      setProgressPct(100);
      setProgressLabel('Done!');
      setPhase('complete');
      toast.success('PDF downloaded successfully!');

      await delay(1500);
      setPhase('idle');
      setProgressPct(0);
      setProgressLabel('');
    } catch (err) {
      console.error(err);
      setPhase('error');
      toast.error('Failed to export PDF. Please try again.');
      await delay(2000);
      setPhase('idle');
      setProgressPct(0);
      setProgressLabel('');
    }
  }, [phase, resume.title]);

  const handleSaveToDashboard = useCallback(async () => {
    setSaving(true);
    try {
      await onSaveToDashboard(resume);
      toast.success('Resume saved to dashboard!');
    } catch {
      toast.error('Failed to save resume.');
    } finally {
      setSaving(false);
    }
  }, [resume, onSaveToDashboard]);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Desktop: 3-column layout */}
      <div className="hidden md:flex flex-1 min-h-0">
        {/* Left rail: Template thumbnails */}
        <aside className="w-56 shrink-0 border-r border-border overflow-y-auto">
          <div className="p-3 space-y-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">Templates</h3>
            {EXPORT_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id)}
                className={cn(
                  'w-full text-left rounded-lg border p-3 transition-all relative',
                  selectedTemplate === t.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn('h-8 w-6 rounded shrink-0', t.thumbColor)} />
                  <div className="min-w-0">
                    <p className={cn(
                      'text-xs font-semibold truncate',
                      selectedTemplate === t.id ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {t.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 leading-tight mt-0.5 line-clamp-2">
                      {t.description}
                    </p>
                  </div>
                </div>
                {selectedTemplate === t.id && (
                  <div className="absolute inset-0 rounded-lg ring-1 ring-primary/30 pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Center: Full-size print preview */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div
            className="flex-1 overflow-auto bg-muted/30"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex justify-center items-start p-4 min-h-full">
              <div ref={exportContentRef}>
                <ResumePreview
                  resume={{ ...resume, templateId: selectedTemplate }}
                  templateId={selectedTemplate}
                  zoom={zoomValue}
                  contentId="export-preview-content"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 border-t border-border px-3 py-2 shrink-0">
            <button type="button" onClick={handleZoomOut} className="text-muted-foreground hover:text-foreground transition-colors" disabled={zoomValue <= 40}>
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-medium text-muted-foreground min-w-[36px] text-center tabular-nums">{Math.round(zoomValue)}%</span>
            <button type="button" onClick={handleZoomIn} className="text-muted-foreground hover:text-foreground transition-colors" disabled={zoomValue >= 150}>
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </main>

        {/* Right rail: ATS score */}
        <aside className="w-72 shrink-0 border-l border-border overflow-y-auto">
          <AtsPanel atsResult={atsResult} />
        </aside>
      </div>

      {/* Mobile layout */}
      <div className="flex md:hidden flex-1 min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 rounded-lg text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Edit
          </Button>
          <h3 className="text-xs font-semibold text-foreground truncate mx-2">Review & Export</h3>
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1">
                <LayoutGrid className="h-3.5 w-3.5" />
                Customize
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl max-h-[70vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-sm font-semibold">Customize</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6 space-y-5">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Template</h4>
                  <div className="space-y-1.5">
                    {EXPORT_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setSelectedTemplate(t.id); setMobileSheetOpen(false); }}
                        className={cn(
                          'w-full text-left rounded-lg border p-3 transition-all flex items-center gap-3',
                          selectedTemplate === t.id ? 'border-primary bg-primary/5' : 'border-border'
                        )}
                      >
                        <div className={cn('h-8 w-6 rounded shrink-0', t.thumbColor)} />
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-xs font-semibold', selectedTemplate === t.id ? 'text-foreground' : 'text-muted-foreground')}>
                            {t.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 leading-tight mt-0.5">{t.description}</p>
                        </div>
                        {selectedTemplate === t.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
                <AtsPanelMobile atsResult={atsResult} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <main
          className="flex-1 overflow-auto bg-muted/30"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-center items-start p-2 min-h-full">
            <div ref={exportContentRef}>
              <ResumePreview
                resume={{ ...resume, templateId: selectedTemplate }}
                templateId={selectedTemplate}
                zoom={zoomValue}
                contentId="export-preview-content-mobile"
              />
            </div>
          </div>
        </main>

        <div className="absolute bottom-20 right-3 z-10">
          <div className="flex items-center gap-1 rounded-full bg-background/90 backdrop-blur border border-border px-2.5 py-1 shadow-sm">
            <button type="button" onClick={handleZoomOut} className="text-muted-foreground hover:text-foreground" disabled={zoomValue <= 40}>
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="text-[10px] font-medium text-muted-foreground min-w-[30px] text-center tabular-nums">{Math.round(zoomValue)}%</span>
            <button type="button" onClick={handleZoomIn} className="text-muted-foreground hover:text-foreground" disabled={zoomValue >= 150}>
              <ZoomIn className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-border bg-card px-3 sm:px-5 py-3">
        {phase === 'generating' && (
          <div className="mb-3 space-y-1">
            <Progress value={progressPct} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground text-right tabular-nums">{progressLabel}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="h-9 rounded-lg text-xs hidden md:inline-flex">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Edit
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            {phase === 'error' && (
              <span className="text-[11px] text-destructive font-medium mr-1">Export failed. Try again.</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToDashboard}
              disabled={saving || phase === 'generating'}
              className="h-9 rounded-lg text-xs hidden md:inline-flex"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Bookmark className="h-3.5 w-3.5 mr-1" />
              )}
              {saving ? 'Saving...' : 'Save to Dashboard'}
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={phase === 'generating'}
              className={cn(
                'h-9 rounded-lg text-xs font-semibold px-4',
                phase === 'complete' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {phase === 'generating' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : phase === 'complete' ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Downloaded
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden md:inline">Download PDF</span>
                  <span className="md:hidden">PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- ATS Computation ----

function getResumeTextContent(resume: Resume): string {
  let text = '';
  resume.sections.forEach((sec) => {
    if (!sec.visible) return;
    if (sec.type === 'header' && sec.content.header) {
      const h = sec.content.header;
      text += ' ' + h.name + ' ' + h.email + ' ' + h.phone + ' ' + h.location;
    } else if (sec.type === 'summary' && sec.content.summary) {
      text += ' ' + sec.content.summary;
    } else if (sec.type === 'skills' && sec.content.skills) {
      sec.content.skills.forEach(g => { text += ' ' + g.category + ' ' + g.skills.join(' '); });
    } else if (sec.type === 'experience' && sec.content.experiences) {
      sec.content.experiences.forEach(e => { text += ' ' + e.role + ' ' + e.company + ' ' + e.description.join(' '); });
    } else if (sec.type === 'projects' && sec.content.projects) {
      sec.content.projects.forEach(p => { text += ' ' + p.name + ' ' + p.description + ' ' + p.technologies.join(' '); });
    } else if (sec.type === 'education' && sec.content.educations) {
      sec.content.educations.forEach(edu => { text += ' ' + edu.institution + ' ' + edu.degree + ' ' + edu.field; });
    } else if (sec.type === 'certifications' && sec.content.certifications) {
      sec.content.certifications.forEach(c => { text += ' ' + c.name + ' ' + c.issuer; });
    } else if (sec.type === 'languages' && sec.content.languages) {
      sec.content.languages.forEach(l => { text += ' ' + l.language + ' ' + l.proficiency; });
    } else if (sec.type === 'references' && sec.content.references) {
      sec.content.references.forEach(r => { text += ' ' + r.name + ' ' + r.company + ' ' + r.title + ' ' + r.email; });
    } else if (sec.type === 'custom' && sec.content.customSections) {
      sec.content.customSections.forEach(s => {
        text += ' ' + s.title;
        s.items.forEach(i => { text += ' ' + i.title + ' ' + i.subtitle + ' ' + i.description; });
      });
    }
  });
  return text.toLowerCase();
}

function computeATSScore(resume: Resume, selectedJob: typeof PRESET_JOBS[number] | null): ATSResult {
  const resumeText = getResumeTextContent(resume);

  let keywordScore = 0;
  let completenessScore = 0;
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const hasJD = !!selectedJob;

  const jobKeywords = selectedJob ? [...selectedJob.keywords] : [];
  if (jobKeywords.length > 0) {
    jobKeywords.forEach(keyword => {
      if (resumeText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });
    keywordScore = Math.round((matchedKeywords.length / jobKeywords.length) * 100);
  } else {
    keywordScore = 100;
  }

  const importantSections = ['header', 'summary', 'skills', 'experience', 'education'];
  let filledCount = 0;
  importantSections.forEach(type => {
    const sec = resume.sections.find(s => s.type === type);
    if (sec && sec.visible) {
      if (type === 'header' && sec.content.header?.name) filledCount++;
      else if (type === 'summary' && sec.content.summary) filledCount++;
      else if (type === 'skills' && sec.content.skills && sec.content.skills.length > 0) filledCount++;
      else if (type === 'experience' && sec.content.experiences && sec.content.experiences.length > 0) filledCount++;
      else if (type === 'education' && sec.content.educations && sec.content.educations.length > 0) filledCount++;
    }
  });
  completenessScore = Math.round((filledCount / importantSections.length) * 100);

  const readabilityScore = 80;
  const overallScore = hasJD
    ? Math.round(keywordScore * 0.5 + completenessScore * 0.3 + readabilityScore * 0.2)
    : Math.round(completenessScore * 0.7 + readabilityScore * 0.3);

  const suggestions: string[] = [];
  if (missingKeywords.length > 0) {
    suggestions.push('Add missing keywords: ' + missingKeywords.slice(0, 4).join(', '));
  }
  if (completenessScore < 100) {
    suggestions.push('Complete empty core sections (Header, Summary, Experience, Education)');
  }
  if (!hasJD) {
    suggestions.push('Add a job description to get tailored keyword matching.');
  }

  return {
    score: overallScore,
    matchedKeywords,
    missingKeywords,
    suggestions,
    hasJobDescription: hasJD,
  };
}

// ---- ATS Panel Components ----

function AtsPanel({ atsResult }: { atsResult: ATSResult | null }) {
  if (!atsResult) return null;

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ATS Compatibility</h3>

      {!atsResult.hasJobDescription ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-center space-y-2">
          <FileText className="h-6 w-6 mx-auto text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add a job description in the editor to see your ATS compatibility score.
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            ATS scores help you understand how well your resume matches target roles.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Match Score</span>
              <span className={cn(
                'text-lg font-bold tabular-nums',
                atsResult.score >= 70 ? 'text-emerald-500' : atsResult.score >= 40 ? 'text-amber-500' : 'text-red-500'
              )}>
                {atsResult.score}%
              </span>
            </div>
            <Progress value={atsResult.score} className={cn(
              'h-2',
              atsResult.score >= 70 ? '[&>div]:bg-emerald-500' : atsResult.score >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
            )} />
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-muted-foreground">Matched Keywords</h4>
            {atsResult.matchedKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {atsResult.matchedKeywords.map(k => (
                  <span key={k} className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-medium">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {k}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground/60 italic">No keywords matched yet.</p>
            )}
          </div>

          {atsResult.missingKeywords.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground">Flagged Issues</h4>
              <div className="space-y-1">
                {atsResult.missingKeywords.slice(0, 4).map(k => (
                  <div key={k} className="flex items-start gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>Missing keyword: {k}</span>
                  </div>
                ))}
                {atsResult.missingKeywords.length > 4 && (
                  <p className="text-[10px] text-muted-foreground/60 pl-5">+{atsResult.missingKeywords.length - 4} more missing keywords</p>
                )}
              </div>
            </div>
          )}

          {atsResult.suggestions.filter(s => !s.startsWith('Add missing')).length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-semibold text-muted-foreground">Suggestions</h4>
              {atsResult.suggestions.filter(s => !s.startsWith('Add missing')).slice(0, 2).map((s, i) => (
                <p key={i} className="text-[10px] text-muted-foreground/80 leading-relaxed">{s}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AtsPanelMobile({ atsResult }: { atsResult: ATSResult | null }) {
  if (!atsResult) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ATS Compatibility</h4>

      {!atsResult.hasJobDescription ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-center space-y-2">
          <FileText className="h-5 w-5 mx-auto text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add a job description in the editor to see your ATS compatibility score.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className={cn(
              'text-2xl font-bold tabular-nums',
              atsResult.score >= 70 ? 'text-emerald-500' : atsResult.score >= 40 ? 'text-amber-500' : 'text-red-500'
            )}>
              {atsResult.score}%
            </span>
            <div className="flex-1">
              <Progress value={atsResult.score} className={cn(
                'h-2',
                atsResult.score >= 70 ? '[&>div]:bg-emerald-500' : atsResult.score >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
              )} />
            </div>
          </div>
          {atsResult.missingKeywords.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Flagged issues:</p>
              {atsResult.missingKeywords.slice(0, 3).map(k => (
                <p key={k} className="text-[10px] text-muted-foreground flex items-start gap-1">
                  <AlertTriangle className="h-2.5 w-2.5 mt-0.5 shrink-0 text-amber-500" />
                  Missing keyword: {k}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
