import { useLocation } from 'wouter';
import { Upload, FileText, Sparkles, ChevronRight } from 'lucide-react';

const T = {
  surface: '#131b33',
  elevated: '#1c2747',
  primary: '#1e40af',
  primaryText: '#b8c4ff',
  accent: '#ea580c',
  text: '#e2e8f0',
  muted: '#94a3b8',
  outlineVariant: '#2a3a5c',
};

const OPTIONS = [
  {
    id: 'upload',
    icon: Upload,
    title: 'Upload Existing Resume',
    desc: 'Import a PDF, DOCX, or TXT file and edit the parsed result.',
    descDesktop: 'Upload your existing resume file. We\'ll parse it and let you edit, enhance, and export it in any template.',
    path: '/dashboard/builder/upload',
  },
  {
    id: 'scratch',
    icon: FileText,
    title: 'Build From Scratch',
    desc: 'Use guided steps to build a resume section by section.',
    descDesktop: 'Start with a blank canvas. Our guided builder walks you through each section — experience, education, skills, and more.',
    path: '/dashboard/builder/scratch',
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: 'Generate with AI',
    desc: 'Tell us your target role and our AI writes it for you.',
    descDesktop: 'Tell us your target role and experience. Our AI writes a tailored, ATS-optimized resume from scratch in seconds.',
    path: '/dashboard/builder/ai',
  },
];

export default function ResumeBuilderHub() {
  const [, setLocation] = useLocation();

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: T.text }}>
          Let's build your resume.
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>
          Choose how you'd like to get started.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => setLocation(opt.path)}
              className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition active:bg-blue-950/20"
              style={{
                borderColor: T.outlineVariant,
                backgroundColor: T.surface,
                borderRadius: '12px',
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: T.elevated }}
              >
                <Icon className="h-5 w-5" style={{ color: T.primaryText }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold" style={{ color: T.text }}>{opt.title}</p>
                <p className="mt-0.5 text-xs" style={{ color: T.muted }}>{opt.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: T.muted }} />
            </button>
          );
        })}
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 sm:gap-8">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => setLocation(opt.path)}
              className="flex flex-col items-start rounded-xl border p-6 text-left transition hover:bg-blue-950/20"
              style={{
                borderColor: T.outlineVariant,
                backgroundColor: T.surface,
                borderRadius: '12px',
                minHeight: '240px',
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: T.elevated }}
              >
                <Icon className="h-5 w-5" style={{ color: T.primaryText }} />
              </div>
              <p className="mt-4 text-base font-extrabold" style={{ color: T.text }}>{opt.title}</p>
              <p className="mt-2 text-sm leading-5" style={{ color: T.muted }}>{opt.descDesktop}</p>
              <div className="mt-auto pt-6">
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ backgroundColor: T.accent }}
                >
                  Get started
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
