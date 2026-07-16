import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
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
    tone: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/20',
    primary: true,
  },
  {
    mode: 'scratch',
    title: 'Create from scratch',
    description: 'Use guided steps to build a resume section by section.',
    icon: FileText,
    tone: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-500/20',
    primary: true,
  },
  {
    mode: 'ai',
    title: 'Generate with AI',
    description: 'Start with your target role, market, and keywords.',
    icon: Sparkles,
    tone: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-500/20',
  },
  {
    mode: 'linkedin',
    title: 'Import LinkedIn',
    description: 'Paste profile details and convert them into a structured resume.',
    icon: Linkedin,
    tone: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-500/20',
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
        action={
          <Button
            variant="outline"
            onClick={startTargetEdit}
            className="h-9 rounded-lg bg-white/80 px-3 text-xs font-bold dark:bg-white/5"
          >
            <Target className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{targetProfile ? 'Edit target' : 'Add target'}</span>
            <span className="sm:hidden">Target</span>
          </Button>
        }
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        {mode === 'home' ? (
          <>
            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/30 sm:p-7">
                <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  ATS friendly builder
                </Badge>
                <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-normal text-slate-950 dark:text-slate-50 sm:text-4xl">
                  Build, edit, and export your resume from your phone.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-350 sm:text-base">
                  Upload an existing resume or start clean with a guided editor. Every page is designed for quick thumb-friendly edits, preview, and export.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {BUILDER_MODES.filter((item) => item.primary).map((item) => (
                    <ModeCard key={item.mode} item={item} onClick={() => navigateToMode(item.mode)} />
                  ))}
                </div>
              </div>
              <TargetSummary targetProfile={targetProfile} onEdit={startTargetEdit} />
            </section>

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

            <section className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
              <DraftsList
                resumesList={resumesList}
                isAuthenticated={isAuthenticated}
                onOpen={setActiveResume}
                onDelete={handleDeleteDraft}
                onCreate={() => navigateToMode('scratch')}
              />
              <div className="grid gap-3">
                {BUILDER_MODES.filter((item) => !item.primary).map((item) => (
                  <ModeCard key={item.mode} item={item} compact onClick={() => navigateToMode(item.mode)} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/30 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {currentModeConfig && (
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', currentModeConfig.tone)}>
                    <currentModeConfig.icon className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-extrabold text-slate-950 dark:text-slate-50">{currentModeConfig?.title}</h1>
                  <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-350">{currentModeConfig?.description}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigateToMode('home')} className="h-10 rounded-lg bg-white/70 text-sm font-bold dark:bg-white/5">
                Choose another option
              </Button>
            </div>

            {targetProfile ? (
              <TargetSummary targetProfile={targetProfile} onEdit={startTargetEdit} inline />
            ) : (
              <button
                type="button"
                onClick={startTargetEdit}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/70 p-4 text-left text-blue-800 transition hover:bg-blue-50 dark:border-blue-500/30 dark:bg-blue-950/25 dark:text-blue-200"
              >
                <span className="flex items-center gap-3 text-sm font-bold">
                  <Target className="h-4 w-4" />
                  Add target role for better ATS matching
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" />
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
        <nav className="fixed bottom-0 left-0 z-40 grid w-full grid-cols-2 gap-2 border-t border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:hidden">
          <Button onClick={() => navigateToMode('upload')} className="h-12 rounded-xl font-bold">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button variant="outline" onClick={() => navigateToMode('scratch')} className="h-12 rounded-xl bg-white font-bold dark:bg-white/5">
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
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
        'group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
        compact ? 'min-h-[104px]' : 'min-h-[132px]',
      )}
    >
      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border', item.tone)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">{item.title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">{item.description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
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
}) {
  return (
    <Card className="rounded-2xl border-blue-200 bg-white/90 shadow-md backdrop-blur dark:border-blue-500/20 dark:bg-slate-900/60">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-extrabold">
          <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          Target settings
        </CardTitle>
        <CardDescription>Use this to tune resume wording, ATS keywords, and market-specific fields.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="setup-target-role" className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-350">
              Target job title
            </Label>
            <Input
              id="setup-target-role"
              placeholder="Generative AI Engineer"
              value={setupTargetRole}
              onChange={(event) => onRoleChange(event.target.value)}
              className="h-11 rounded-lg bg-white dark:bg-slate-950"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-350">Target market</Label>
            <Select value={setupMarket} onValueChange={onMarketChange}>
              <SelectTrigger className="h-11 rounded-lg bg-white dark:bg-slate-950">
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
          <Label className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-350">Experience level</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {['Fresher', '1-3 yrs', '3-5 yrs', '5-8 yrs', '8+ yrs'].map((experience) => (
              <button
                key={experience}
                type="button"
                onClick={() => onExperienceChange(experience)}
                className={cn(
                  'min-h-11 rounded-lg border px-3 text-xs font-extrabold transition',
                  setupExperience === experience
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-350 dark:hover:bg-white/10',
                )}
              >
                {experience}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-job-desc" className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-350">
            Job description or keywords
          </Label>
          <Textarea
            id="setup-job-desc"
            placeholder="Paste the job description, tools, or skills you want this resume to target."
            value={setupJobDescription}
            onChange={(event) => onJobDescriptionChange(event.target.value)}
            rows={4}
            className="rounded-lg bg-white text-sm leading-6 dark:bg-slate-950"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div />
          <Button variant="outline" onClick={onCancel} className="h-11 rounded-lg bg-white font-bold dark:bg-white/5">
            Cancel
          </Button>
          <Button onClick={onSave} className="h-11 rounded-lg font-bold">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Save target
          </Button>
        </div>
      </CardContent>
    </Card>
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
        <Button variant="outline" onClick={onCreate} className="hidden rounded-lg bg-white/80 text-xs font-bold dark:bg-white/5 sm:inline-flex">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
