import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Loader2, Sparkles, ChevronDown, ChevronUp, Lightbulb, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useResumeStorage } from '@/_core/hooks/useResumeStorage';
import { useAuth } from '@/_core/hooks/useAuth';
import { ensureStandardResumeSections } from '@/lib/resumeSections';
import { nanoid } from 'nanoid';

const T = {
  surface: '#131b33',
  elevated: '#1c2747',
  primary: '#1e40af',
  primaryText: '#b8c4ff',
  accent: '#ea580c',
  text: '#e2e8f0',
  muted: '#94a3b8',
  outlineVariant: '#2a3a5c',
  success: '#16a34a',
};

const EXP_LEVELS = ['Entry', 'Mid', 'Senior'];
const MARKETS = ['Global', 'India', 'Gulf', 'US'];

const TIPS = [
  'Include specific technologies, tools, and frameworks you have worked with.',
  'Mention notable companies, team sizes, and the scale of projects you handled.',
  'Quantify achievements where possible — e.g., "served 10K+ users" or "reduced load time by 40%".',
];

export default function ResumeAI() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const storage = useResumeStorage();

  const [jobTitle, setJobTitle] = useState('');
  const [expLevel, setExpLevel] = useState('Mid');
  const [market, setMarket] = useState('Global');
  const [background, setBackground] = useState('');
  const [tipsOpen, setTipsOpen] = useState(true);

  const generateMutation = trpc.ai.generateFullResume.useMutation();

  const handleGenerate = async () => {
    if (!jobTitle.trim()) {
      toast.error('Please enter a target job title.');
      return;
    }
    if (!background.trim()) {
      toast.error('Please describe your background.');
      return;
    }

    try {
      const data = await generateMutation.mutateAsync({
        jobTitle: jobTitle.trim(),
        experienceLevel: expLevel,
        market,
        experienceDetails: background.trim(),
        jobDescription: '',
      });

      const parsed = {
        header: data.header || {},
        summary: data.summary || '',
        skills: data.skills || [],
        experiences: data.experiences || [],
        projects: data.projects || [],
        educations: data.educations || [],
        certifications: data.certifications || [],
        ...data,
      };

      const sections = [
        {
          id: nanoid(), type: 'header' as const, order: 1, visible: true,
          content: { header: { name: parsed.header?.name || '', email: parsed.header?.email || '', phone: parsed.header?.phone || '', location: parsed.header?.location || '', links: parsed.header?.links || [], jobTitle: jobTitle, targetRole: jobTitle, countryCode: '', locationFields: {}, targetCountryCode: '' } },
        },
        { id: nanoid(), type: 'summary' as const, order: 2, visible: true, content: { summary: parsed.summary || '' } },
        { id: nanoid(), type: 'skills' as const, order: 3, visible: true, content: { skills: parsed.skills || [] } },
        { id: nanoid(), type: 'experience' as const, order: 4, visible: true, content: { experiences: parsed.experiences || [] } },
        { id: nanoid(), type: 'projects' as const, order: 5, visible: true, content: { projects: parsed.projects || [] } },
        { id: nanoid(), type: 'education' as const, order: 6, visible: true, content: { educations: parsed.educations || [] } },
        { id: nanoid(), type: 'certifications' as const, order: 7, visible: true, content: { certifications: parsed.certifications || [] } },
        { id: nanoid(), type: 'achievements' as const, order: 8, visible: true, content: { achievements: parsed.achievements || [] } },
        { id: nanoid(), type: 'languages' as const, order: 9, visible: true, content: { languages: parsed.languages || [] } },
        { id: nanoid(), type: 'references' as const, order: 10, visible: true, content: { references: [] } },
      ];

      const resume = ensureStandardResumeSections({
        id: nanoid(),
        userId: isAuthenticated ? 'user' : 'guest',
        title: `${jobTitle} Resume`,
        templateId: 'classic-ats-blue' as const,
        sections,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await storage.saveResume(resume);
      toast.success('Resume generated successfully!');
      setLocation('/dashboard/builder/edit');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate resume.');
    }
  };

  return (
    <div className="flex gap-6 items-start">
      {/* Main form */}
      <div className="flex-1 min-w-0 max-w-[720px]">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: T.text }}>
            Generate your resume with AI.
          </h1>
          <p className="mt-1 text-sm" style={{ color: T.muted }}>
            Describe your background and let our AI build a tailored resume.
          </p>
        </div>

        <div
          className="rounded-xl border p-5 sm:p-6"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Job Title *">
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Generative AI Engineer"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition"
                  style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
                />
              </Field>

              <Field label="Experience Level">
                <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: T.outlineVariant }}>
                  {EXP_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setExpLevel(level)}
                      className="flex-1 py-2.5 text-sm font-semibold transition"
                      style={{
                        backgroundColor: expLevel === level ? T.primary : 'transparent',
                        color: expLevel === level ? '#fff' : T.muted,
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Target Market">
                <div className="relative">
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    className="w-full appearance-none rounded-lg border px-3 py-2.5 pr-8 text-sm outline-none transition"
                    style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
                  >
                    {MARKETS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.muted }} />
                </div>
              </Field>
            </div>

            <Field label="Tell us about your background *">
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="e.g. 5 years of experience building React apps, worked at Google and Stripe, designed high-performance billing system, proficient in GraphQL. Led a team of 4 engineers and delivered 3 major product launches."
                rows={6}
                className="w-full rounded-lg border px-3 py-2.5 text-sm leading-relaxed outline-none resize-none transition"
                style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
              />
            </Field>

            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
                style={{ backgroundColor: T.accent }}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Writing your resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Resume
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: tips panel */}
      <div className="hidden lg:block w-[220px] shrink-0 sticky top-4 self-start">
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}
        >
          <button
            onClick={() => setTipsOpen(!tipsOpen)}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: T.primaryText }}>
              <Lightbulb className="h-3.5 w-3.5" />
              Tips
            </span>
            {tipsOpen ? <ChevronUp className="h-3.5 w-3.5" style={{ color: T.muted }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: T.muted }} />}
          </button>
          {tipsOpen && (
            <div className="space-y-3">
              {TIPS.map((tip, i) => (
                <p key={i} className="text-xs leading-relaxed" style={{ color: T.muted }}>
                  {tip}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{label}</p>
      {children}
    </div>
  );
}
