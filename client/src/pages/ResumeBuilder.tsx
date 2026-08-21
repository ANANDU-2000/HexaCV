import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Lightbulb,
  Linkedin,
  Lock,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Layers,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

import { useAuth } from '@/_core/hooks/useAuth';
import { useResumeStorage } from '@/_core/hooks/useResumeStorage';
import ResumeAIGenerator from '@/components/ResumeAIGenerator';
import ResumeEditor from '@/components/ResumeEditor';
import { getDefaultTemplate } from '@/lib/templates';
import ResumeLinkedInImporter from '@/components/ResumeLinkedInImporter';
import ResumeScratchBuilder from '@/components/ResumeScratchBuilder';
import ResumeUploader from '@/components/ResumeUploader';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { matchPresetJobByTitle } from '@/lib/jobDescriptions';
import { ensureStandardResumeSections } from '@/lib/resumeSections';
import { cn } from '@/lib/utils';
import { ParsedResume, Resume, ResumeSection } from '@shared/types';

type BuilderMode = 'home' | 'upload' | 'scratch' | 'ai' | 'linkedin';

type TargetProfile = {
  targetRole: string;
  experience: string;
  market: string;
  jobDescription: string;
};

const BUILDER_MODES: Array<{
  mode: Exclude<BuilderMode, 'home'>;
  title: string;
  description: string;
  icon: typeof Upload;
  tone: string;
  primary?: boolean;
}> = [
  {
    mode: 'upload',
    title: 'Upload resume',
    description: 'Import a PDF, DOCX, or TXT file and edit the parsed result.',
    icon: Upload,
    tone: 'bg-primary/10 text-primary border-primary/20',
    primary: true,
  },
  {
    mode: 'scratch',
    title: 'Create from scratch',
    description: 'Use guided steps to build a resume section by section.',
    icon: FileText,
    tone: 'bg-primary/10 text-primary border-primary/20',
    primary: true,
  },
  {
    mode: 'ai',
    title: 'Generate with AI',
    description: 'Start with your target role, market, and keywords.',
    icon: Sparkles,
    tone: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    mode: 'linkedin',
    title: 'Import LinkedIn',
    description: 'Paste profile details and convert them into a structured resume.',
    icon: Linkedin,
    tone: 'bg-primary/10 text-primary border-primary/20',
  },
];

const getModeFromLocation = (location: string): BuilderMode => {
  const [path, queryFromLocation] = location.split('?');
  const routeMode = path.split('/').filter(Boolean)[1];
  if (routeMode === 'upload' || routeMode === 'scratch' || routeMode === 'ai' || routeMode === 'linkedin') {
    return routeMode;
  }

  // wouter's useLocation is pathname-only; also read window search for ?mode=
  const queryString =
    queryFromLocation ||
    (typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : '');
  const queryMode = new URLSearchParams(queryString || '').get('mode');
  if (queryMode === 'upload' || queryMode === 'scratch' || queryMode === 'ai' || queryMode === 'linkedin') {
    return queryMode;
  }

  return 'home';
};

const marketToCountryCode = (market: string) => {
  if (market === 'India') return 'IN';
  if (market === 'Gulf') return 'AE';
  if (market === 'US') return 'US';
  if (market === 'Global') return 'GB';
  return '';
};

const countryCodeToMarket = (code: string) => {
  const c = code.trim().toUpperCase();
  if (c === 'IN') return 'India';
  if (['AE', 'SA', 'QA', 'KW', 'OM', 'BH'].includes(c)) return 'Gulf';
  if (c === 'US') return 'US';
  return 'Global';
};

const TARGET_DRAFT_KEY = 'hexacv_target_panel_draft';

type TargetDraft = {
  role: string;
  experience: string;
  market: string;
  jobDescription: string;
};

function loadTargetDraft(): TargetDraft | null {
  try {
    const raw = localStorage.getItem(TARGET_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TargetDraft;
  } catch {
    return null;
  }
}

function saveTargetDraft(draft: TargetDraft) {
  try {
    localStorage.setItem(TARGET_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
}

function clearTargetDraft() {
  try {
    localStorage.removeItem(TARGET_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** Soft heuristic: pasted text that looks like a resume (email + date ranges), not a JD. */
function looksLikeResumeNotJd(text: string): boolean {
  const t = text.trim();
  if (t.length < 120) return false;
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(t);
  const dateHits = (t.match(/\b(19|20)\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi) || []).length;
  return hasEmail && dateHits >= 2;
}

export default function ResumeBuilder() {
  const { isAuthenticated } = useAuth();
  const storage = useResumeStorage();
  const [location, setLocation] = useLocation();

  const mode = getModeFromLocation(location);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [resumesList, setResumesList] = useState<Resume[]>([]);
  const [targetProfile, setTargetProfile] = useState<TargetProfile | null>(null);
  const [showTargetPanel, setShowTargetPanel] = useState(false);
  const [pendingMode, setPendingMode] = useState<BuilderMode | null>(null);

  const initialDraft = typeof window !== 'undefined' ? loadTargetDraft() : null;
  const [setupTargetRole, setSetupTargetRole] = useState(initialDraft?.role || '');
  const [setupExperience, setSetupExperience] = useState(initialDraft?.experience || '3-5 yrs');
  const [setupMarket, setSetupMarket] = useState(initialDraft?.market || 'Global');
  const [setupJobDescription, setSetupJobDescription] = useState(initialDraft?.jobDescription || '');

  const currentModeConfig = useMemo(
    () => BUILDER_MODES.find((item) => item.mode === mode),
    [mode],
  );

  const fetchResumes = async () => {
    try {
      const list = await storage.listResumes();
      setResumesList(list);
      return list;
    } catch (error) {
      console.error('Failed to load resumes list:', error);
      return [] as Resume[];
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [activeResume]);

  // Deep-link: /builder?id=X opens that resume in the live editor (DashboardHome edit redirects here).
  // Also: ?role= & ?country= prefill TargetPanel fields (SEO example pages).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resumeId = params.get('id');
    const roleParam = params.get('role');
    const countryParam = params.get('country');
    if (roleParam && roleParam.trim()) {
      setSetupTargetRole(roleParam.trim());
    }
    if (countryParam && countryParam.trim()) {
      setSetupMarket(countryCodeToMarket(countryParam));
    }
    if (roleParam || countryParam) {
      setShowTargetPanel(true);
    }

    if (!resumeId) return;

    let cancelled = false;
    (async () => {
      const list = await fetchResumes();
      if (cancelled) return;
      const matched = list.find((r) => r.id === resumeId);
      if (matched) {
        setActiveResume(matched);
      } else {
        toast.message('That draft was not found. Pick one from your list.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location]);

  // Persist in-progress TargetPanel fields so refresh does not lose a pasted JD.
  useEffect(() => {
    saveTargetDraft({
      role: setupTargetRole,
      experience: setupExperience,
      market: setupMarket,
      jobDescription: setupJobDescription,
    });
  }, [setupTargetRole, setupExperience, setupMarket, setupJobDescription]);

  const navigateToMode = (nextMode: BuilderMode) => {
    setActiveResume(null);
    setLocation(nextMode === 'home' ? '/builder' : `/builder/${nextMode}`);
  };

  const createResumeFromParsed = (parsed: ParsedResume): Resume => {
    const targetCountryCode = targetProfile
      ? marketToCountryCode(targetProfile.market)
      : parsed.header?.targetCountryCode || '';

    const sections: ResumeSection[] = [
      {
        id: nanoid(),
        type: 'header',
        order: 1,
        visible: true,
        content: {
          header: {
            name: parsed.header?.name || '',
            email: parsed.header?.email || '',
            phone: parsed.header?.phone || '',
            location: parsed.header?.location || '',
            links: parsed.header?.links || [],
            jobTitle: targetProfile?.targetRole || parsed.header?.jobTitle || '',
            targetRole: targetProfile?.targetRole || parsed.header?.targetRole || parsed.header?.jobTitle || '',
            countryCode: parsed.header?.countryCode || '',
            locationFields: parsed.header?.locationFields || {},
            targetCountryCode,
          },
        },
      },
      { id: nanoid(), type: 'summary', order: 2, visible: true, content: { summary: parsed.summary || '' } },
      { id: nanoid(), type: 'skills', order: 3, visible: true, content: { skills: parsed.skills || [] } },
      { id: nanoid(), type: 'experience', order: 4, visible: true, content: { experiences: parsed.experiences || [] } },
      { id: nanoid(), type: 'projects', order: 5, visible: true, content: { projects: parsed.projects || [] } },
      { id: nanoid(), type: 'education', order: 6, visible: true, content: { educations: parsed.educations || [] } },
      { id: nanoid(), type: 'certifications', order: 7, visible: true, content: { certifications: parsed.certifications || [] } },
      { id: nanoid(), type: 'achievements', order: 8, visible: true, content: { achievements: parsed.achievements || [] } },
      { id: nanoid(), type: 'languages', order: 9, visible: true, content: { languages: parsed.languages || [] } },
      { id: nanoid(), type: 'references', order: 10, visible: true, content: { references: parsed.references || [] } },
    ];

    const matchedJobId = matchPresetJobByTitle(
      targetProfile?.targetRole || parsed.header?.jobTitle,
      targetProfile?.targetRole || parsed.header?.targetRole || parsed.header?.jobTitle,
    );

    return ensureStandardResumeSections({
      id: nanoid(),
      userId: isAuthenticated ? 'user' : 'guest',
      title: parsed.header?.name ? `${parsed.header.name}'s Resume` : 'Untitled Resume',
      templateId: getDefaultTemplate().id,
      jobDescriptionId: matchedJobId || undefined,
      sections,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const handleResumeLoad = async (parsed: ParsedResume) => {
    if (!isAuthenticated && resumesList.length >= 3) {
      toast.error('Guest limit reached. Sign in to save unlimited resumes.');
      return;
    }

    try {
      const saved = await storage.saveResume(createResumeFromParsed(parsed));
      setActiveResume(saved);
      toast.success('Resume draft is ready to edit.');
    } catch (error: any) {
      if (String(error?.message) === 'GUEST_LIMIT_REACHED') {
        toast.error('Guest limit reached. Sign in to save unlimited resumes.');
        return;
      }
      toast.error(`Failed to save resume: ${error.message}`);
    }
  };

  // V6: consume pipeline result stashed by Targeting screen
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fromPipeline') !== '1') return;
    try {
      const raw = sessionStorage.getItem('hexacv_pipeline_result');
      if (!raw) return;
      const payload = JSON.parse(raw) as {
        result: ParsedResume & { _pipelineMeta?: unknown };
        role?: string;
        region?: string;
      };
      sessionStorage.removeItem('hexacv_pipeline_result');
      if (payload.role) setSetupTargetRole(payload.role);
      if (payload.region === 'Gulf' || payload.region === 'India') {
        setSetupMarket(payload.region);
      }
      if (payload.role) {
        setTargetProfile({
          targetRole: payload.role,
          experience: setupExperience,
          market:
            payload.region === 'Gulf' || payload.region === 'India'
              ? payload.region
              : setupMarket,
          jobDescription: (payload as { jd?: string }).jd || setupJobDescription,
        });
      }
      // Strip meta before save; stash flags for Review
      const { _pipelineMeta, ...resumePayload } = payload.result as any;
      if (_pipelineMeta) {
        try {
          sessionStorage.setItem(
            'hexacv_pipeline_meta',
            JSON.stringify(_pipelineMeta)
          );
        } catch {
          /* ignore */
        }
      }
      void handleResumeLoad(resumePayload as ParsedResume);
    } catch (e) {
      console.warn('Failed to load pipeline result', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleResumeUpdate = async (updatedResume: Resume) => {
    try {
      const saved = await storage.saveResume(updatedResume);
      setActiveResume(saved);
    } catch (error: any) {
      if (String(error?.message) === 'GUEST_LIMIT_REACHED') {
        toast.error('Guest limit reached. Sign in to save unlimited resumes.');
        return;
      }
      toast.error(`Failed to save updates: ${error.message}`);
    }
  };

  const handleDeleteDraft = async (id: string, event: MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm('Delete this draft?')) return;

    try {
      await storage.deleteResume(id);
      toast.success('Draft deleted.');
      fetchResumes();
    } catch {
      toast.error('Failed to delete draft.');
    }
  };

  const handleModeSelect = (nextMode: BuilderMode) => {
    if (!targetProfile) {
      setPendingMode(nextMode);
      setShowTargetPanel(true);
    } else {
      navigateToMode(nextMode);
    }
  };

  const saveTargetProfile = () => {
    if (!setupTargetRole.trim()) {
      toast.error('Enter a target job title first.');
      return;
    }

    setTargetProfile({
      targetRole: setupTargetRole.trim(),
      experience: setupExperience,
      market: setupMarket,
      jobDescription: setupJobDescription,
    });
    setShowTargetPanel(false);
    clearTargetDraft();
    toast.success('Target profile saved.');

    if (pendingMode) {
      const next = pendingMode;
      setPendingMode(null);
      navigateToMode(next);
    }
  };

  const cancelTargetPanel = () => {
    setShowTargetPanel(false);
    if (pendingMode) {
      const next = pendingMode;
      setPendingMode(null);
      navigateToMode(next);
    }
  };

  const startTargetEdit = () => {
    setSetupTargetRole(targetProfile?.targetRole || setupTargetRole);
    setSetupExperience(targetProfile?.experience || setupExperience);
    setSetupMarket(targetProfile?.market || setupMarket);
    setSetupJobDescription(targetProfile?.jobDescription || setupJobDescription);
    setShowTargetPanel(true);
  };

  if (activeResume) {
    return (
      <div className="min-h-screen bg-background font-sans text-foreground">
        {!isAuthenticated && (
          <GuestBanner onSignIn={() => setLocation('/login?convert=true')} />
        )}
        <BuilderHeader
          modeTitle="Live editor"
          onBack={() => {
            setActiveResume(null);
            navigateToMode('home');
          }}
          action={
            <Button
              variant="outline"
              onClick={() => {
                setActiveResume(null);
                navigateToMode('home');
              }}
              className="hidden h-9 rounded-lg border-border bg-card text-xs font-bold sm:inline-flex"
            >
              View drafts
            </Button>
          }
        />
        <main className="h-[calc(100vh-64px)] w-full px-2 py-2 sm:px-4 sm:py-3">
          <ResumeEditor resume={activeResume} onUpdate={handleResumeUpdate} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {!isAuthenticated && resumesList.length > 0 && (
        <GuestBanner onSignIn={() => setLocation('/login?convert=true')} />
      )}

      <BuilderHeader
        modeTitle={currentModeConfig?.title || 'Resume editor'}
        onBack={() => (mode === 'home' ? setLocation('/') : navigateToMode('home'))}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        {mode === 'home' ? (
          <div className="space-y-12 sm:space-y-16">
            {/* Hero Section — Premium */}
            <div className="relative mx-auto max-w-3xl space-y-5 py-6 text-center sm:py-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent-warm" strokeWidth={1.75} />
                ATS-Friendly Resume Builder
              </div>
              <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                Build & Optimize{' '}
                <span className="text-accent-warm">
                  Your Resume
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Create a professional, ATS-optimized resume in minutes. Upload an existing document, generate one with AI, or build it step-by-step.
              </p>
            </div>

            {/* Creation Options Grid (4-columns on desktop) */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <h2 className="shrink-0 font-display text-lg font-semibold text-foreground">Create New Resume</h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {BUILDER_MODES.map((item) => (
                  <ModeCard key={item.mode} item={item} onClick={() => navigateToMode(item.mode)} />
                ))}
              </div>
            </div>

            {/* Target Panel Modal/Settings */}
            {showTargetPanel && (
              <div className="animate-fade-slide-up">
                <TargetPanel
                  setupTargetRole={setupTargetRole}
                  setupExperience={setupExperience}
                  setupMarket={setupMarket}
                  setupJobDescription={setupJobDescription}
                  onRoleChange={setSetupTargetRole}
                  onExperienceChange={setSetupExperience}
                  onMarketChange={setSetupMarket}
                  onJobDescriptionChange={setSetupJobDescription}
                  onCancel={cancelTargetPanel}
                  onSave={saveTargetProfile}
                  isPending={!!pendingMode}
                />
              </div>
            )}

            {/* Saved Drafts List */}
            <DraftsList
                resumesList={resumesList}
                isAuthenticated={isAuthenticated}
                onOpen={setActiveResume}
                onDelete={handleDeleteDraft}
                onCreate={() => navigateToMode('scratch')}
              />
          </div>
        ) : (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {currentModeConfig && (
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border', currentModeConfig.tone)}>
                    <currentModeConfig.icon className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h1 className="font-display text-xl font-semibold text-foreground">{currentModeConfig?.title}</h1>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{currentModeConfig?.description}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigateToMode('home')} className="h-10 rounded-xl bg-card text-sm font-bold">
                Choose another option
              </Button>
            </div>

            {targetProfile ? (
              <TargetSummary targetProfile={targetProfile} onEdit={startTargetEdit} inline />
            ) : (
              <button
                type="button"
                onClick={startTargetEdit}
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-left transition-all duration-300 hover:border-primary hover:bg-primary/10"
              >
                <span className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <span className="text-left">
                    <span className="block text-sm font-extrabold text-primary">Add target role</span>
                    <span className="mt-0.5 block text-xs font-medium text-primary/70">Better ATS matching starts here</span>
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </button>
            )}

            {showTargetPanel && (
              <TargetPanel
                setupTargetRole={setupTargetRole}
                setupExperience={setupExperience}
                setupMarket={setupMarket}
                setupJobDescription={setupJobDescription}
                onRoleChange={setSetupTargetRole}
                onExperienceChange={setSetupExperience}
                onMarketChange={setSetupMarket}
                onJobDescriptionChange={setSetupJobDescription}
                onCancel={() => setShowTargetPanel(false)}
                onSave={saveTargetProfile}
              />
            )}

            {!targetProfile && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground shadow-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--warning)]/10 text-[color:var(--warning)]">
                  <Lightbulb className="h-3.5 w-3.5" />
                </div>
                <span>Tip: Set a target role above to prefill job-specific suggestions across the builder.</span>
              </div>
            )}

            <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {mode === 'upload' && (
                  <ResumeUploader onParsed={handleResumeLoad} onStartFromScratch={() => navigateToMode('scratch')} />
                )}
                {mode === 'scratch' && (
                  <ResumeScratchBuilder
                    onComplete={handleResumeLoad}
                    prefilledRole={targetProfile?.targetRole}
                    prefilledCountryCode={targetProfile ? marketToCountryCode(targetProfile.market) : ''}
                  />
                )}
                {mode === 'ai' && (
                  <ResumeAIGenerator
                    onGenerated={handleResumeLoad}
                    prefilledRole={targetProfile?.targetRole || ''}
                    prefilledExperience={targetProfile?.experience || setupExperience}
                    prefilledMarket={targetProfile?.market || setupMarket}
                    prefilledJobDescription={targetProfile?.jobDescription || setupJobDescription}
                  />
                )}
                {mode === 'linkedin' && <ResumeLinkedInImporter onImported={handleResumeLoad} />}
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {mode === 'home' && (
        <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur sm:hidden">
          <div className="grid grid-cols-4 gap-2">
            {BUILDER_MODES.map((item) => (
              <Button
                key={item.mode}
                variant={item.primary ? 'default' : 'outline'}
                onClick={() => navigateToMode(item.mode)}
                className={cn(
                  'flex h-auto flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[10px] font-bold leading-tight',
                  item.primary
                    ? 'bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title.split(' ')[0]}</span>
              </Button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

function BuilderHeader({
  modeTitle,
  onBack,
  action,
}: {
  modeTitle: string;
  onBack: () => void;
  action?: ReactNode;
}) {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/92 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 shrink-0 rounded-full" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary" aria-hidden="true">
            <Layers className="h-4 w-4 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-primary">HexaCv</p>
            <p className="truncate text-xs font-semibold text-muted-foreground">{modeTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {action}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard/settings">
                <button
                  type="button"
                  className="hidden min-h-11 max-w-[160px] truncate px-2 text-xs font-semibold text-foreground hover:underline sm:inline"
                  aria-label="Open account settings"
                >
                  {user?.name || user?.email || "Account"}
                </button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="h-11 min-w-11 rounded-lg border-border px-3 text-xs font-bold"
              >
                Log out
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-lg border-border px-3 text-xs font-bold"
              >
                Log in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function GuestBanner({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="relative z-40 flex items-center justify-center gap-2 border-b border-[color:var(--warning)]/20 bg-[color:var(--warning)]/10 px-3 py-2 text-center text-xs font-bold text-foreground">
      <AlertTriangle className="h-4 w-4 shrink-0 text-[color:var(--warning)]" />
      <span className="min-w-0">Guest drafts are saved on this device.</span>
      <Button size="sm" onClick={onSignIn} className="h-7 rounded-lg bg-accent-warm px-2 text-[11px] text-white hover:bg-accent-warm/90">
        <Lock className="mr-1 h-3 w-3" />
        Sign in
      </Button>
    </div>
  );
}

function ModeCard({
  item,
  compact = false,
  onClick,
}: {
  item: (typeof BUILDER_MODES)[number];
  compact?: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary',
        compact ? 'min-h-[160px] gap-3 p-4' : 'min-h-[260px]',
      )}
    >
      {/* Top gradient accent bar on hover */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Gradient icon container */}
      <div className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
        item.tone,
        compact && 'h-10 w-10'
      )}>
        <Icon className={cn('h-5 w-5', compact && 'h-4 w-4')} />
      </div>

      {/* Text content */}
      <div className="flex-1">
        <h3 className="font-display text-base font-semibold text-foreground">{item.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      </div>

      {/* Bottom CTA — fades in on hover */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
        Get started
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

function TargetSummary({
  targetProfile,
  onEdit,
  inline = false,
}: {
  targetProfile: TargetProfile | null;
  onEdit: () => void;
  inline?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-sm',
        inline && 'rounded-xl p-4',
        targetProfile && 'border-primary/30',
        !targetProfile && 'border-dashed',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all',
            targetProfile
              ? 'border-primary/20 bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground'
          )}>
            {targetProfile ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-foreground">
              {targetProfile ? targetProfile.targetRole : 'Target profile'}
            </h2>
            <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
              {targetProfile
                ? `${targetProfile.experience} · ${targetProfile.market}${targetProfile.jobDescription ? ' · Job description added' : ''}`
                : 'Optional — improves ATS keyword matching and regional formatting.'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className={cn(
            'shrink-0 rounded-lg bg-card text-xs font-bold transition-all',
            targetProfile
              ? 'border-primary/20 text-primary hover:bg-primary/10'
              : ''
          )}
        >
          {targetProfile ? 'Edit target' : 'Add target'}
        </Button>
      </div>
    </div>
  );
}

function TargetPanel({
  setupTargetRole,
  setupExperience,
  setupMarket,
  setupJobDescription,
  onRoleChange,
  onExperienceChange,
  onMarketChange,
  onJobDescriptionChange,
  onCancel,
  onSave,
  isPending = false,
}: {
  setupTargetRole: string;
  setupExperience: string;
  setupMarket: string;
  setupJobDescription: string;
  onRoleChange: (value: string) => void;
  onExperienceChange: (value: string) => void;
  onMarketChange: (value: string) => void;
  onJobDescriptionChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isPending?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[color:var(--ink)]/50 pt-8 pb-8 backdrop-blur-sm sm:pt-16 animate-fade-slide-up"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="mx-4 w-full max-w-[640px] rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Target settings</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Tune resume wording, ATS keywords, and market-specific fields.</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close target settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="setup-target-role" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Target job title
              </Label>
              <Input
                id="setup-target-role"
                placeholder="Generative AI Engineer"
                value={setupTargetRole}
                onChange={(event) => onRoleChange(event.target.value)}
                className="h-11 rounded-xl border-border bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Target market</Label>
              <Select value={setupMarket} onValueChange={onMarketChange}>
                <SelectTrigger className="h-11 rounded-xl bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Global', 'India', 'Gulf', 'US'].map((market) => (
                    <SelectItem key={market} value={market}>
                      {market}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Experience level</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {['Fresher', '1-3 yrs', '3-5 yrs', '5-8 yrs', '8+ yrs'].map((experience) => (
                <button
                  key={experience}
                  type="button"
                  onClick={() => onExperienceChange(experience)}
                  className={cn(
                    'min-h-11 rounded-xl border px-3 text-xs font-extrabold transition',
                    setupExperience === experience
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted',
                  )}
                >
                  {experience}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-job-desc" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Job description or keywords
            </Label>
            <Textarea
              id="setup-job-desc"
              placeholder="Paste the job description, tools, or skills you want this resume to target."
              value={setupJobDescription}
              onChange={(event) => onJobDescriptionChange(event.target.value)}
              rows={4}
              className="rounded-xl border-border bg-card text-sm leading-6"
            />
            {looksLikeResumeNotJd(setupJobDescription) && (
              <p className="text-xs leading-relaxed text-[color:var(--warning)]">
                This looks more like a resume than a job posting (email plus date ranges). You can still continue.
                Pasting the employer JD usually produces better role targeting.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onCancel} className="h-11 rounded-xl bg-card px-6 font-bold">
            {isPending ? 'Skip for now' : 'Cancel'}
          </Button>
          <Button onClick={onSave} className="h-11 rounded-xl bg-primary px-6 font-bold text-primary-foreground">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isPending ? 'Save & Continue' : 'Save target'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DraftsList({
  resumesList,
  isAuthenticated,
  onOpen,
  onDelete,
  onCreate,
}: {
  resumesList: Resume[];
  isAuthenticated: boolean;
  onOpen: (resume: Resume) => void;
  onDelete: (id: string, event: MouseEvent) => void;
  onCreate: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <div className="flex shrink-0 items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Saved drafts</h2>
            <p className="text-sm text-muted-foreground">
              {resumesList.length ? 'Continue editing a resume.' : 'Your created resumes will appear here.'}
            </p>
          </div>
          <Button variant="outline" onClick={onCreate} className="hidden rounded-xl bg-card text-xs font-bold sm:inline-flex">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New
          </Button>
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {resumesList.map((resume) => (
          <div
            key={resume.id}
            onClick={() => onOpen(resume)}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary"
          >
            <div className="h-1 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="flex h-20 items-center justify-center bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>

            <div className="p-4">
              <h3 className="truncate text-base font-extrabold text-foreground transition group-hover:text-primary">
                {resume.title}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {resume.updatedAt
                  ? (() => {
                      try {
                        return `Edited ${formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })}`;
                      } catch {
                        return new Date(resume.updatedAt).toLocaleDateString();
                      }
                    })()
                  : 'Recently'}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2.5">
              <Badge variant="outline" className="rounded-md bg-card text-[10px] font-bold">
                {resume.userId === 'guest' || !isAuthenticated ? 'Local' : 'Cloud'}
              </Badge>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(resume);
                  }}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(event) => onDelete(resume.id, event)}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {resumesList.length === 0 && (
          <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center transition hover:border-primary/40 hover:bg-primary/5 sm:col-span-2 md:col-span-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-base font-extrabold text-foreground">No drafts yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Start by uploading a resume, building from scratch, or generating one with AI.
              </p>
            </div>
            <Button onClick={onCreate} className="mt-2 rounded-xl bg-primary font-bold text-primary-foreground">
              <Plus className="mr-1.5 h-4 w-4" />
              Create your first resume
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
