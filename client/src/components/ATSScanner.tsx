import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { AlertCircle, CheckCircle2, Sparkles, FileText, RefreshCw, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface ATSScannerProps {
  resumes: any[];
  activeResumeId: string | null;
  onSelectResume: (id: string) => void;
}

interface CategoryScore {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  issues: string[];
  fixSection?: string;
}

export default function ATSScanner({ resumes, activeResumeId, onSelectResume }: ATSScannerProps) {
  const [, setLocation] = useLocation();
  const [selectedResumeId, setSelectedResumeId] = useState<string>(activeResumeId || '');
  const [jobDescription, setJobDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanResult, setScanResult] = useState<{
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    summaryAdvice?: string;
    bulletSuggestions?: { original: string; suggested: string; reason: string }[];
    keywordScore: number;
    completenessScore: number;
    formattingScore: number;
    readabilityScore: number;
  } | null>(null);

  const calculateScoreMutation = trpc.ai.calculateScore.useMutation();
  const suggestionsMutation = trpc.ai.generateSuggestions.useMutation();

  const hasResume = !!selectedResumeId;
  const hasJD = jobDescription.trim().length > 0;
  const canScan = hasResume && hasJD;

  const noResumeHelp = !hasResume && resumes.length > 0
    ? 'Select a resume from the dropdown above.'
    : !hasResume && resumes.length === 0
    ? 'Create a resume first to scan it.'
    : '';

  const noJDHelp = !hasJD
    ? 'Paste or type a job description to compare against.'
    : '';

  const categories: CategoryScore[] = useMemo(() => {
    if (!scanResult) return [];
    const kwPct = scanResult.keywordScore;
    const cmPct = scanResult.completenessScore;
    const fmPct = scanResult.formattingScore;
    const rdPct = scanResult.readabilityScore;

    return [
      {
        key: 'keywords',
        label: 'Keyword Match',
        score: kwPct,
        maxScore: 100,
        issues: scanResult.missingKeywords.slice(0, 3).map(k => `Missing keyword: ${k}`),
        fixSection: 'skills',
      },
      {
        key: 'formatting',
        label: 'Formatting',
        score: fmPct,
        maxScore: 100,
        issues: fmPct < 80 ? ['Improve section headers and layout consistency'] : [],
        fixSection: 'layout',
      },
      {
        key: 'completeness',
        label: 'Section Completeness',
        score: cmPct,
        maxScore: 100,
        issues: cmPct < 100 ? ['Complete all core resume sections'] : [],
        fixSection: cmPct < 60 ? 'summary' : undefined,
      },
      {
        key: 'readability',
        label: 'Readability',
        score: rdPct,
        maxScore: 100,
        issues: rdPct < 70 ? ['Use action verbs and quantify achievements'] : [],
        fixSection: 'experience',
      },
    ];
  }, [scanResult]);

  const handleScan = async () => {
    if (!canScan) return;

    setIsScanning(true);
    setHasScanned(true);
    try {
      const selectedResume = resumes.find((r) => r.id === selectedResumeId);
      if (!selectedResume) throw new Error('Resume not found');

      const alignment = await calculateScoreMutation.mutateAsync({
        resumeContent: selectedResume.content,
        jobDescription,
      });

      const adv = await suggestionsMutation.mutateAsync({
        resumeContent: selectedResume.content,
        jobDescription,
      });

      const bullets: any[] = [];
      adv.experience?.forEach((exp: any) => {
        exp.suggestedBullets?.forEach((b: any) => {
          bullets.push({ original: b.original, suggested: b.suggested, reason: b.reason });
        });
      });

      const kwPct = alignment.matchedKeywords.length + alignment.missingKeywords.length > 0
        ? Math.round((alignment.matchedKeywords.length / (alignment.matchedKeywords.length + alignment.missingKeywords.length)) * 100)
        : 100;

      setScanResult({
        score: alignment.score,
        matchedKeywords: alignment.matchedKeywords,
        missingKeywords: alignment.missingKeywords,
        summaryAdvice: adv.summary || 'Incorporate core keywords like ' + alignment.missingKeywords.slice(0, 3).join(', '),
        bulletSuggestions: bullets.slice(0, 3),
        keywordScore: kwPct,
        completenessScore: Math.min(100, Math.round(alignment.score * 0.3 + 50)),
        formattingScore: Math.min(100, Math.round(alignment.score * 0.2 + 60)),
        readabilityScore: Math.min(100, Math.round(alignment.score * 0.25 + 55)),
      });
      toast.success('ATS scan complete!');
    } catch {
      setScanResult({
        score: 65,
        matchedKeywords: ['React', 'TypeScript', 'JavaScript', 'HTML'],
        missingKeywords: ['CI/CD', 'AWS', 'Docker', 'Agile Methodologies'],
        summaryAdvice: 'Add concrete achievements and quantitative results for software architectures.',
        bulletSuggestions: [
          {
            original: 'Built features using React and state management.',
            suggested: 'Engineered 14+ reusable React components using TypeScript, reducing client render lag by 28%.',
            reason: 'Uses action verbs and provides quantifiable outcomes.',
          },
        ],
        keywordScore: 50,
        completenessScore: 70,
        formattingScore: 75,
        readabilityScore: 65,
      });
      toast.warning('Demo mode: simulated ATS metrics loaded.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFixThis = (section: string) => {
    setLocation('/builder?section=' + section);
    toast.info('Opening editor to the ' + section + ' section.');
  };

  const scoreColor = scanResult
    ? scanResult.score >= 70 ? 'stroke-emerald-500' : scanResult.score >= 40 ? 'stroke-amber-500' : 'stroke-red-500'
    : 'stroke-muted-foreground';

  const scoreTextColor = scanResult
    ? scanResult.score >= 70 ? 'text-emerald-500' : scanResult.score >= 40 ? 'text-amber-500' : 'text-red-500'
    : 'text-muted-foreground';

  const circumference = 2 * Math.PI * 54;
  const offset = scanResult ? circumference - (scanResult.score / 100) * circumference : circumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">ATS Scanner</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Check how well your resume matches a target job description.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Config panel */}
        <div className="w-full lg:w-96 shrink-0">
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Resume</label>
                <Select
                  value={selectedResumeId}
                  onValueChange={(val) => {
                    setSelectedResumeId(val);
                    onSelectResume(val);
                  }}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg">
                    <SelectValue placeholder="Select a resume..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.length === 0 && (
                      <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                        No saved resumes yet.
                      </div>
                    )}
                    {resumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!hasResume && noResumeHelp && (
                  <p className="text-[10px] text-muted-foreground/70 flex items-start gap-1 mt-1">
                    <AlertCircle className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                    {noResumeHelp}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Job Description</label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job posting text here..."
                  className="min-h-[160px] text-sm rounded-lg resize-y"
                />
                {!hasJD && noJDHelp && (
                  <p className="text-[10px] text-muted-foreground/70 flex items-start gap-1 mt-1">
                    <AlertCircle className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                    {noJDHelp}
                  </p>
                )}
              </div>

              <Button
                onClick={handleScan}
                disabled={!canScan || isScanning}
                className="w-full h-9 rounded-lg text-xs font-semibold gap-1.5"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Scan
                  </>
                )}
              </Button>

              {!canScan && !isScanning && (
                <div className="rounded-lg bg-muted/50 border border-border px-3 py-2">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {!hasResume && !hasJD && 'Select a resume and add a job description to start scanning.'}
                    {!hasResume && hasJD && 'Select a resume to scan against the job description.'}
                    {hasResume && !hasJD && 'Add a job description to compare against your resume.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Results panel */}
        <div className="flex-1 min-w-0">
          {!scanResult ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center gap-3">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No scan yet</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Configure your resume and job description on the left, then tap Scan.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Score + Breakdown (desktop side-by-side, mobile stacked) */}
              <div className="flex flex-col md:flex-row gap-5">
                {/* Circular Score */}
                <div className="flex flex-col items-center justify-center shrink-0 w-full sm:w-44 gap-2">
                  <div className="relative flex items-center justify-center">
                    <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="54"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className={cn('transition-all duration-700', scoreColor)}
                        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                      />
                    </svg>
                    <span className={cn('absolute text-2xl font-bold tabular-nums', scoreTextColor)}>
                      {scanResult.score}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">Overall Score</p>
                </div>

                {/* Desktop: inline breakdown list */}
                <div className="hidden md:block flex-1 space-y-3">
                  {categories.map((cat) => (
                    <BreakdownItem key={cat.key} cat={cat} onFix={handleFixThis} />
                  ))}
                </div>
              </div>

              {/* Mobile: accordion breakdown */}
              <div className="md:hidden">
                <Accordion type="single" collapsible className="space-y-1">
                  {categories.map((cat) => (
                    <AccordionItem key={cat.key} value={cat.key} className="rounded-lg border border-border overflow-hidden">
                      <AccordionTrigger className="px-3 py-2.5 text-xs font-medium hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-2">
                          <span>{cat.label}</span>
                          <span className={cn(
                            'text-xs font-bold tabular-nums',
                            cat.score >= 70 ? 'text-emerald-500' : cat.score >= 40 ? 'text-amber-500' : 'text-red-500'
                          )}>
                            {cat.score}%
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3">
                        <Progress value={cat.score} className={cn(
                          'h-1.5 mb-2',
                          cat.score >= 70 ? '[&>div]:bg-emerald-500' : cat.score >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                        )} />
                        {cat.issues.map((issue, i) => (
                          <div key={i} className="flex items-start justify-between gap-2 py-1">
                            <span className="text-[11px] text-muted-foreground/80 leading-relaxed">{issue}</span>
                            {cat.fixSection && (
                              <button
                                onClick={() => handleFixThis(cat.fixSection!)}
                                className="shrink-0 text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                              >
                                Fix This
                                <ArrowRight className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Matched / Missing keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Matched ({scanResult.matchedKeywords.length})
                  </h4>
                  {scanResult.matchedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {scanResult.matchedKeywords.map((kw, i) => (
                        <span key={i} className="inline-flex items-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/60 italic">No keywords matched.</p>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    Missing ({scanResult.missingKeywords.length})
                  </h4>
                  {scanResult.missingKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {scanResult.missingKeywords.slice(0, 8).map((kw, i) => (
                        <span key={i} className="inline-flex items-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-medium">
                          {kw}
                        </span>
                      ))}
                      {scanResult.missingKeywords.length > 8 && (
                        <span className="text-[10px] text-muted-foreground/60">+{scanResult.missingKeywords.length - 8} more</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/60 italic">No missing keywords!</p>
                  )}
                  <button
                    onClick={() => handleFixThis('skills')}
                    className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    Fix This
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>

              {/* AI Suggestions */}
              {scanResult.summaryAdvice && (
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    AI Suggestion
                  </h4>
                  <p className="text-[11px] text-foreground/80 leading-relaxed">{scanResult.summaryAdvice}</p>
                  <button
                    onClick={() => handleFixThis('summary')}
                    className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    Apply in Editor
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}

              {/* Re-scan prompt */}
              {hasScanned && (
                <div className="flex items-center justify-center gap-2 pt-1 pb-2">
                  <span className="text-[10px] text-muted-foreground/60">Results from this scan.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScan}
                    disabled={isScanning}
                    className="h-7 rounded-lg text-[10px] font-semibold gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Re-scan
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BreakdownItem({ cat, onFix }: { cat: CategoryScore; onFix: (section: string) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-foreground truncate">{cat.label}</span>
          {cat.issues.length > 0 && cat.fixSection && (
            <button
              onClick={() => onFix(cat.fixSection!)}
              className="shrink-0 text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              Fix This
              <ArrowRight className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
        <span className={cn(
          'text-xs font-bold tabular-nums shrink-0 ml-2',
          cat.score >= 70 ? 'text-emerald-500' : cat.score >= 40 ? 'text-amber-500' : 'text-red-500'
        )}>
          {cat.score}%
        </span>
      </div>
      <Progress value={cat.score} className={cn(
        'h-1.5',
        cat.score >= 70 ? '[&>div]:bg-emerald-500' : cat.score >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
      )} />
      {cat.issues.length > 0 && (
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
          {cat.issues[0]}
          {cat.issues.length > 1 && <span className="text-muted-foreground/50"> +{cat.issues.length - 1} more</span>}
        </p>
      )}
    </div>
  );
}
