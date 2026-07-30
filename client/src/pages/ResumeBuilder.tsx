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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

import { useAuth } from '@/_core/hooks/useAuth';
import { useResumeStorage } from '@/_core/hooks/useResumeStorage';
import ResumeAIGenerator from '@/components/ResumeAIGenerator';
import ResumeEditor from '@/components/ResumeEditor';
import ResumeLinkedInImporter from '@/components/ResumeLinkedInImporter';
import ResumeScratchBuilder from '@/components/ResumeScratchBuilder';
import ResumeUploader from '@/components/ResumeUploader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
    tone: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-700 border-blue-200 dark:from-blue-400/10 dark:to-blue-500/5 dark:text-blue-300 dark:border-blue-500/20',
    primary: true,
  },
  {
    mode: 'scratch',
    title: 'Create from scratch',
    description: 'Use guided steps to build a resume section by section.',
    icon: FileText,
    tone: 'bg-gradient-to-br from-teal-500/10 to-teal-600/5 text-teal-700 border-teal-200 dark:from-teal-400/10 dark:to-teal-500/5 dark:text-teal-300 dark:border-teal-500/20',
    primary: true,
  },
  {
    mode: 'ai',
    title: 'Generate with AI',
    description: 'Start with your target role, market, and keywords.',
    icon: Sparkles,
    tone: 'bg-gradient-to-br from-violet-500/10 to-violet-600/5 text-violet-700 border-violet-200 dark:from-violet-400/10 dark:to-violet-500/5 dark:text-violet-300 dark:border-violet-500/20',
  },
  {
    mode: 'linkedin',
    title: 'Import LinkedIn',
    description: 'Paste profile details and convert them into a structured resume.',
    icon: Linkedin,
    tone: 'bg-gradient-to-br from-sky-500/10 to-sky-600/5 text-sky-700 border-sky-200 dark:from-sky-400/10 dark:to-sky-500/5 dark:text-sky-300 dark:border-sky-500/20',
  },
];

const getModeFromLocation = (location: string): BuilderMode => {
  const [path, queryString] = location.split('?');
  const routeMode = path.split('/').filter(Boolean)[1];
  if (routeMode === 'upload' || routeMode === 'scratch' || routeMode === 'ai' || routeMode === 'linkedin') {
    return routeMode;
  }

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
  const [setupTargetRole, setSetupTargetRole] = useState('');
  const [setupExperience, setSetupExperience] = useState('3-5 yrs');
  const [setupMarket, setSetupMarket] = useState('Global');
  const [setupJobDescription, setSetupJobDescription] = useState('');

  const currentModeConfig = useMemo(
    () => BUILDER_MODES.find((item) => item.mode === mode),
    [mode],
  );

  const fetchResumes = async () => {
    try {
      const list = await storage.listResumes();
      setResumesList(list);
    } catch (error) {
      console.error('Failed to load resumes list:', error);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [activeResume]);

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
      templateId: 'classic-ats-blue',
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
      toast.error(`Failed to save resume: ${error.message}`);
    }
  };

  const handleResumeUpdate = async (updatedResume: Resume) => {
    try {
      const saved = await storage.saveResume(updatedResume);
      setActiveResume(saved);
    } catch (error: any) {
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
      <div className="min-h-screen bg-background text-foreground font-sans glass-bg">
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
              className="hidden sm:inline-flex h-9 rounded-lg bg-white/80 text-xs font-bold dark:bg-white/5"
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
    <div className="min-h-screen bg-background text-foreground font-sans glass-bg">
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
            <div className="relative text-center max-w-3xl mx-auto space-y-5 py-6 sm:py-8">
              {/* Glow behind the badge */}
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.08) 0%, transparent 60%)',
                }}
              />
              {/* Gradient Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(234,88,12,0.08))',
                  border: '1px solid rgba(37,99,235,0.15)',
                  color: '#1e40af',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#ea580c' }} />
                ATS-Friendly Resume Builder
              </div>
              {/* Gradient Heading */}
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-slate-950 dark:text-slate-50">
                Build & Optimize{' '}
                <span className="bg-gradient-to-r from-blue-700 to-orange-500 bg-clip-text text-transparent">
                  Your Resume
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                Create a professional, ATS-optimized resume in minutes. Upload an existing document, generate one with AI, or build it step-by-step.
              </p>
            </div>

            {/* Creation Options Grid (4-columns on desktop) */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-blue-200/60 via-blue-400/40 to-transparent dark:from-blue-800/40 dark:via-blue-600/20" />
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50 shrink-0">Create New Resume</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-blue-200/60 dark:via-blue-600/20 dark:to-blue-800/40" />
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
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur transition-all dark:border-white/10 dark:bg-slate-900/30 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {currentModeConfig && (
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm', currentModeConfig.tone)}>
                    <currentModeConfig.icon className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">{currentModeConfig?.title}</h1>
                  <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{currentModeConfig?.description}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigateToMode('home')} className="h-10 rounded-xl bg-white/80 text-sm font-bold shadow-sm dark:bg-white/5">
                Choose another option
              </Button>
            </div>

            {targetProfile ? (
              <TargetSummary targetProfile={targetProfile} onEdit={startTargetEdit} inline />
            ) : (
              <button
                type="button"
                onClick={startTargetEdit}
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-blue-200/60 bg-blue-50/60 p-5 text-left transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md dark:border-blue-500/20 dark:bg-blue-950/20 dark:hover:border-blue-400/40 dark:hover:bg-blue-950/30"
              >
                <span className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                    <Target className="h-5 w-5" />
                  </div>
                  <span className="text-left">
                    <span className="block text-sm font-extrabold text-blue-800 dark:text-blue-200">Add target role</span>
                    <span className="block text-xs font-medium text-blue-600/70 dark:text-blue-300/70 mt-0.5">Better ATS matching starts here</span>
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-blue-400 transition-transform group-hover:translate-x-1 dark:text-blue-300" />
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
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/70 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 shadow-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <Lightbulb className="h-3.5 w-3.5" />
                </div>
                <span>Tip: Set a target role above to prefill job-specific suggestions across the builder.</span>
              </div>
            )}

            <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white/85 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/35">
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
        <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:hidden">
          <div className="grid grid-cols-4 gap-2">
            {BUILDER_MODES.map((item) => (
              <Button
                key={item.mode}
                variant={item.primary ? 'default' : 'outline'}
                onClick={() => navigateToMode(item.mode)}
                className={cn(
                  'flex flex-col items-center justify-center h-auto py-2.5 rounded-xl gap-1 text-[10px] font-bold leading-tight',
                  item.primary
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white/80 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-slate-300'
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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 shrink-0 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <img src="/icon-192.png" alt="HexaCv Logo" className="h-9 w-9 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-950 dark:text-slate-50">HexaCv</p>
            <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{modeTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {action}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard/settings">
                <button
                  type="button"
                  className="hidden sm:inline max-w-[160px] truncate text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline min-h-11 px-2"
                  aria-label="Open account settings"
                >
                  {user?.name || user?.email || "Account"}
                </button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="h-11 min-w-11 rounded-lg px-3 text-xs font-bold border-slate-300 dark:border-white/10"
              >
                Log out
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-lg px-3 text-xs font-bold border-slate-300 dark:border-white/10"
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
    <div className="relative z-40 flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
      <span className="min-w-0">Guest drafts are saved on this device.</span>
      <Button size="sm" onClick={onSignIn} className="h-7 rounded-lg bg-amber-600 px-2 text-[11px] text-white hover:bg-amber-700">
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
        'group relative flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white/85 p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-blue-500/30 dark:hover:shadow-[0_12px_40px_rgba(184,196,255,0.08)]',
        compact ? 'min-h-[160px] gap-3 p-4' : 'min-h-[260px]',
      )}
    >
      {/* Top gradient accent bar on hover */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-blue-500 to-orange-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

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
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">{item.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>
      </div>

      {/* Bottom CTA — fades in on hover */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
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
        'rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur transition-all duration-300 dark:border-white/10 dark:bg-slate-900/30',
        inline && 'rounded-xl p-4',
        targetProfile && 'border-blue-200/80 dark:border-blue-500/20',
        !targetProfile && 'border-dashed border-slate-300 dark:border-white/10',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all',
            targetProfile
              ? 'border-blue-200 bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-700 dark:border-blue-500/20 dark:from-blue-400/10 dark:to-blue-500/5 dark:text-blue-300'
              : 'border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
          )}>
            {targetProfile ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {targetProfile ? targetProfile.targetRole : 'Target profile'}
            </h2>
            <p className="mt-0.5 text-sm leading-5 text-slate-500 dark:text-slate-400">
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
            'shrink-0 rounded-lg bg-white/80 text-xs font-bold transition-all dark:bg-white/5',
            targetProfile
              ? 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-950/40'
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm pt-8 pb-8 sm:pt-16 animate-fade-slide-up"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-[640px] mx-4 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-700 border border-blue-200 dark:from-blue-400/10 dark:to-blue-500/5 dark:text-blue-300 dark:border-blue-500/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Target settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tune resume wording, ATS keywords, and market-specific fields.</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="setup-target-role" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Target job title
              </Label>
              <Input
                id="setup-target-role"
                placeholder="Generative AI Engineer"
                value={setupTargetRole}
                onChange={(event) => onRoleChange(event.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-white dark:bg-slate-950"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Target market</Label>
              <Select value={setupMarket} onValueChange={onMarketChange}>
                <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-slate-950">
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
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Experience level</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {['Fresher', '1-3 yrs', '3-5 yrs', '5-8 yrs', '8+ yrs'].map((experience) => (
                <button
                  key={experience}
                  type="button"
                  onClick={() => onExperienceChange(experience)}
                  className={cn(
                    'min-h-11 rounded-xl border px-3 text-xs font-extrabold transition',
                    setupExperience === experience
                      ? 'border-blue-600 bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-700 dark:border-blue-400 dark:from-blue-400/10 dark:to-blue-500/5 dark:text-blue-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10',
                  )}
                >
                  {experience}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-job-desc" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Job description or keywords
            </Label>
            <Textarea
              id="setup-job-desc"
              placeholder="Paste the job description, tools, or skills you want this resume to target."
              value={setupJobDescription}
              onChange={(event) => onJobDescriptionChange(event.target.value)}
              rows={4}
              className="rounded-xl border-slate-200 bg-white text-sm leading-6 dark:bg-slate-950"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-white/10">
          <Button variant="outline" onClick={onCancel} className="h-11 rounded-xl bg-white font-bold px-6 dark:bg-white/5">
            {isPending ? 'Skip for now' : 'Cancel'}
          </Button>
          <Button onClick={onSave} className="h-11 rounded-xl font-bold px-6 shadow-lg shadow-blue-500/20">
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
        <div className="flex-1 h-px bg-gradient-to-r from-blue-200/60 via-blue-400/40 to-transparent dark:from-blue-800/40 dark:via-blue-600/20" />
        <div className="flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">Saved drafts</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {resumesList.length ? 'Continue editing a resume.' : 'Your created resumes will appear here.'}
            </p>
          </div>
          <Button variant="outline" onClick={onCreate} className="hidden rounded-xl bg-white/80 text-xs font-bold dark:bg-white/5 sm:inline-flex">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New
          </Button>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-blue-200/60 dark:via-blue-600/20 dark:to-blue-800/40" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {resumesList.map((resume) => (
          <div
            key={resume.id}
            onClick={() => onOpen(resume)}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white/85 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-500/30 dark:hover:shadow-[0_8px_30px_rgba(184,196,255,0.08)]"
          >
            {/* Top gradient accent bar */}
            <div className="h-1 bg-gradient-to-r from-blue-500 to-teal-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Preview strip */}
            <div className="h-20 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center dark:from-slate-800/50 dark:to-slate-900/50">
              <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>

            <div className="p-4">
              <h3 className="truncate text-base font-extrabold text-slate-900 transition group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
                {resume.title}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
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

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 dark:border-white/5 dark:bg-slate-900/20">
              <Badge variant="outline" className="rounded-md bg-white text-[10px] font-bold dark:bg-white/5">
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
                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(event) => onDelete(resume.id, event)}
                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {resumesList.length === 0 && (
          <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200/70 bg-white/50 p-8 text-center transition hover:border-blue-200 hover:bg-blue-50/30 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-blue-500/20 dark:hover:bg-blue-950/10 sm:col-span-2 md:col-span-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-teal-500/5 border border-blue-200 dark:border-blue-500/20">
              <FileText className="h-6 w-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">No drafts yet</p>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500 max-w-xs">
                Start by uploading a resume, building from scratch, or generating one with AI.
              </p>
            </div>
            <Button onClick={onCreate} className="mt-2 rounded-xl font-bold shadow-lg shadow-blue-500/20">
              <Plus className="mr-1.5 h-4 w-4" />
              Create your first resume
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
