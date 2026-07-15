import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { useLocation } from 'wouter';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Edit3,
  FileText,
  Linkedin,
  Lock,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Upload,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

import { useAuth } from '@/_core/hooks/useAuth';
import { useResumeStorage } from '@/_core/hooks/useResumeStorage';
import InputShell from '@/components/InputShell';
import ResumeAIGenerator from '@/components/ResumeAIGenerator';
import ResumeEditor from '@/components/ResumeEditor';
import ResumeLinkedInImporter from '@/components/ResumeLinkedInImporter';
import ResumeScratchBuilder from '@/components/ResumeScratchBuilder';
import ResumeUploader from '@/components/ResumeUploader';
import TargetSetup from '@/components/TargetSetup';
import type { TargetSetupData } from '@/components/TargetSetup';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { matchPresetJobByTitle } from '@/lib/jobDescriptions';
import { ensureStandardResumeSections } from '@/lib/resumeSections';
import { cn } from '@/lib/utils';
import { ParsedResume, Resume, ResumeSection } from '@shared/types';

type BuilderMode = 'home' | 'upload' | 'scratch' | 'ai' | 'linkedin';

type TargetProfile = {
  targetRole: string;
  experience: string;
  market: string;
  countryCode: string;
  jobDescription: string;
};

const BUILDER_MODES: Array<{
  mode: Exclude<BuilderMode, 'home'>;
  title: string;
  description: string;
  icon: typeof Upload;
  tone: string;
  recommended?: boolean;
}> = [
  {
    mode: 'upload',
    title: 'Upload Resume',
    description: 'Parse an existing PDF, DOCX, or TXT file.',
    icon: Upload,
    tone: 'from-primary/20 to-primary/5 border-primary/20',
    recommended: true,
  },
  {
    mode: 'scratch',
    title: 'Build from Scratch',
    description: 'Guided form to build section by section.',
    icon: FileText,
    tone: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
  },
  {
    mode: 'ai',
    title: 'AI Generate',
    description: 'Describe your background, AI drafts it.',
    icon: Sparkles,
    tone: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
  },
  {
    mode: 'linkedin',
    title: 'Import from LinkedIn',
    description: 'Paste profile details into a structured resume.',
    icon: Linkedin,
    tone: 'from-sky-500/20 to-sky-500/5 border-sky-500/20',
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
  const [pendingMode, setPendingMode] = useState<Exclude<BuilderMode, 'home'> | null>(null);

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
    if (nextMode === 'home') {
      setActiveResume(null);
      setLocation('/builder');
      return;
    }
    if (!targetProfile) {
      setPendingMode(nextMode);
      startTargetEdit();
      return;
    }
    setActiveResume(null);
    setLocation(`/builder?mode=${nextMode}`);
  };

  const createResumeFromParsed = (parsed: ParsedResume): Resume => {
    const targetCountryCode = targetProfile?.countryCode
      || (targetProfile ? marketToCountryCode(targetProfile.market) : '')
      || parsed.header?.targetCountryCode
      || '';

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

  const saveTargetProfile = (data: TargetSetupData) => {
    setTargetProfile({
      targetRole: data.targetRole,
      experience: data.experience,
      market: data.market,
      countryCode: data.countryCode,
      jobDescription: data.jobDescription,
    });
    setShowTargetPanel(false);

    if (pendingMode) {
      const next = pendingMode;
      setPendingMode(null);
      setActiveResume(null);
      setLocation(`/builder?mode=${next}`);
      return;
    }

    toast.success('Target profile saved.');
  };

  const startTargetEdit = () => {
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
              className="hidden md:inline-flex h-9 rounded-lg bg-white/80 text-xs font-bold dark:bg-white/5"
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
        action={
          <Button
            variant="outline"
            onClick={startTargetEdit}
            className="h-9 rounded-lg bg-white/80 px-3 text-xs font-bold dark:bg-white/5"
          >
            <Target className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden md:inline">{targetProfile ? 'Edit target' : 'Add target'}</span>
            <span className="md:hidden">Target</span>
          </Button>
        }
      />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        {mode === 'home' ? (
          <>
            <section className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                How do you want to start?
              </h1>
              <p className="text-muted-foreground mt-2">
                Choose a method to create your resume
              </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {BUILDER_MODES.map((item) => (
                <ModeCard key={item.mode} item={item} onClick={() => navigateToMode(item.mode)} />
              ))}
            </section>

            {targetProfile && (
              <TargetSummary targetProfile={targetProfile} onEdit={startTargetEdit} />
            )}

            {showTargetPanel && (
              <TargetSetup
                initialRole={targetProfile?.targetRole}
                initialExperience={targetProfile?.experience}
                initialMarket={targetProfile?.market}
                initialCountryCode={targetProfile?.countryCode}
                initialJobDescription={targetProfile?.jobDescription}
                onSave={saveTargetProfile}
                onCancel={() => {
                  setShowTargetPanel(false);
                  setPendingMode(null);
                }}
              />
            )}

            <DraftsList
              resumesList={resumesList}
              isAuthenticated={isAuthenticated}
              onOpen={setActiveResume}
              onDelete={handleDeleteDraft}
              onCreate={() => navigateToMode('scratch')}
            />
          </>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {targetProfile ? (
                  <TargetSummary targetProfile={targetProfile} onEdit={startTargetEdit} inline />
                ) : (
                  <button
                    type="button"
                    onClick={startTargetEdit}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                  >
                    <Target className="h-3.5 w-3.5" />
                    Add target
                  </button>
                )}
              </div>
              <Button variant="ghost" onClick={() => navigateToMode('home')} className="h-8 rounded-lg text-xs font-medium shrink-0">
                Change method
              </Button>
            </div>

            {showTargetPanel && (
              <TargetSetup
                initialRole={targetProfile?.targetRole}
                initialExperience={targetProfile?.experience}
                initialMarket={targetProfile?.market}
                initialCountryCode={targetProfile?.countryCode}
                initialJobDescription={targetProfile?.jobDescription}
                onSave={saveTargetProfile}
                onCancel={() => {
                  setShowTargetPanel(false);
                  setPendingMode(null);
                }}
              />
            )}

            <InputShell
              icon={currentModeConfig && <currentModeConfig.icon className="h-5 w-5" />}
              title={currentModeConfig?.title || ''}
              description={currentModeConfig?.description || ''}
            >
              {mode === 'upload' && (
                <ResumeUploader onParsed={handleResumeLoad} onStartFromScratch={() => navigateToMode('scratch')} />
              )}
              {mode === 'scratch' && (
                <ResumeScratchBuilder
                  onComplete={handleResumeLoad}
                  prefilledRole={targetProfile?.targetRole}
                  prefilledCountryCode={targetProfile?.countryCode || (targetProfile ? marketToCountryCode(targetProfile.market) : '')}
                />
              )}
              {mode === 'ai' && (
                <ResumeAIGenerator
                  onGenerated={handleResumeLoad}
                  prefilledRole={targetProfile?.targetRole || ''}
                  prefilledExperience={targetProfile?.experience || 'Mid'}
                  prefilledMarket={targetProfile?.market || ''}
                  prefilledJobDescription={targetProfile?.jobDescription || ''}
                />
              )}
              {mode === 'linkedin' && <ResumeLinkedInImporter onImported={handleResumeLoad} />}
            </InputShell>
          </section>
        )}
      </main>
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
        {action}
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
  onClick,
}: {
  item: (typeof BUILDER_MODES)[number];
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all hover:bg-surface-elevated hover:border-primary/30 hover:shadow-soft"
    >
      {item.recommended && (
        <Badge className="absolute top-3 right-3 bg-primary/15 text-primary border-primary/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Recommended
        </Badge>
      )}

      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl border bg-gradient-to-br', item.tone)}>
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-snug line-clamp-2 sm:line-clamp-none">
          {item.description}
        </p>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" strokeWidth={1.5} />
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
        'rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/30',
        inline && 'rounded-xl p-4',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-950/40 dark:text-blue-300">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {targetProfile ? targetProfile.targetRole : 'Target profile'}
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
              {targetProfile
                ? `${targetProfile.experience} · ${targetProfile.market}${targetProfile.jobDescription ? ' · job description added' : ''}`
                : 'Optional, but useful for ATS keywords and regional formatting.'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit} className="shrink-0 rounded-lg bg-white/80 text-xs font-bold dark:bg-white/5">
          {targetProfile ? 'Edit' : 'Add'}
        </Button>
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
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-50">Saved drafts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {resumesList.length ? 'Continue editing a resume.' : 'Your created resumes will appear here.'}
          </p>
        </div>
        <Button variant="outline" onClick={onCreate} className="hidden rounded-lg bg-white/80 text-xs font-bold dark:bg-white/5 md:inline-flex">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {resumesList.map((resume) => (
          <Card
            key={resume.id}
            onClick={() => onOpen(resume)}
            className="group cursor-pointer overflow-hidden rounded-xl border-slate-200 bg-white/85 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-white/10 dark:bg-white/5"
          >
            <CardHeader className="p-4 pb-3">
              <CardTitle className="truncate text-base font-extrabold text-slate-900 transition group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
                {resume.title}
              </CardTitle>
              <CardDescription className="text-xs">
                Last edited {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : 'recently'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-slate-950/20">
              <Badge variant="outline" className="rounded-md bg-white text-[10px] font-bold dark:bg-white/5">
                {resume.userId === 'guest' || !isAuthenticated ? 'Local draft' : 'Cloud sync'}
              </Badge>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(resume);
                  }}
                  className="h-8 w-8 rounded-lg"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(event) => onDelete(resume.id, event)}
                  className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}

        {resumesList.length === 0 && (
          <button
            type="button"
            onClick={onCreate}
            className="flex min-h-[160px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-center transition hover:border-blue-300 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10 sm:col-span-2"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900 dark:text-slate-100">Create your first resume</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start from scratch with the guided editor.</p>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
