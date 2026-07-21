import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import {
  FileText, Zap, Briefcase, Upload, PenLine, Sparkles,
  ChevronRight, Clock, ArrowRight
} from "lucide-react";

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

function StatMini({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-3 flex items-center gap-3"
      style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: T.elevated }}>
        <Icon className="h-4.5 w-4.5" style={{ color: T.primaryText }} />
      </div>
      <div>
        <p className="text-lg font-extrabold" style={{ color: T.text }}>{value}</p>
        <p className="text-xs" style={{ color: T.muted }}>{label}</p>
      </div>
    </div>
  );
}

const RECENT_RESUMES_MOCK = [
  { id: 'r1', name: 'Software Engineer - Google', updated: '2 hours ago' },
  { id: 'r2', name: 'Full Stack Developer', updated: 'Yesterday' },
  { id: 'r3', name: 'Frontend Lead - Stripe', updated: '3 days ago' },
  { id: 'r4', name: 'Product Manager', updated: '1 week ago' },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const listResumesQuery = trpc.resume.list.useQuery(undefined, { enabled: !!user });
  const resumes = listResumesQuery.data || [];

  const stats = [
    { icon: FileText, label: 'Resumes Created', value: resumes.length || 0 },
    { icon: Zap, label: 'ATS Scans Run', value: 12 },
    { icon: Briefcase, label: 'Applications Tracked', value: 5 },
  ];

  const recentResumes = resumes.length > 0
    ? resumes.slice(0, 4).map((r: any) => ({
        id: r.id,
        name: r.title || r.name || 'Untitled Resume',
        updated: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : 'Recently',
      }))
    : RECENT_RESUMES_MOCK;

  const continueResume = resumes[0] || null;

  const quickActions = [
    { icon: Upload, label: 'Upload Resume', desc: 'Import an existing PDF or DOCX', path: '/dashboard/builder/upload' },
    { icon: PenLine, label: 'Build from Scratch', desc: 'Create a resume step by step', path: '/dashboard/builder/scratch' },
    { icon: Sparkles, label: 'Generate with AI', desc: 'Let AI write your resume', path: '/dashboard/builder/ai' },
    { icon: Zap, label: 'Run ATS Scan', desc: 'Check your resume against job descriptions', path: '/dashboard/ats' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: T.text }}>
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>Here is your dashboard overview.</p>
      </div>

      {/* Resume in progress */}
      {continueResume && (
        <button onClick={() => setLocation('/dashboard/builder/edit')}
          className="flex items-center justify-between rounded-xl border p-4 transition hover:opacity-90"
          style={{ borderColor: T.primary, backgroundColor: `${T.primary}15` }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: T.primary }}>
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: T.text }}>Continue editing</p>
              <p className="text-xs" style={{ color: T.primaryText }}>
                {typeof continueResume === 'string' ? continueResume : (continueResume as any)?.title || (continueResume as any)?.name || 'Untitled Resume'}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0" style={{ color: T.primaryText }} />
        </button>
      )}

      {/* Stats row */}
      <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-4'} gap-3`}>
        {stats.map((s) => <StatMini key={s.label} {...s} />)}
        {!isMobile && (
          <div className="rounded-xl border p-3 flex items-center gap-3"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${T.accent}20` }}>
              <Clock className="h-4.5 w-4.5" style={{ color: T.accent }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: T.accent }}>Last login</p>
              <p className="text-xs" style={{ color: T.muted }}>Today, 9:42 AM</p>
            </div>
          </div>
        )}
      </div>

      {isMobile ? (
        /* ── Mobile: Recent Resumes list ── */
        <div className="rounded-xl border" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: T.outlineVariant }}>
            <p className="text-sm font-bold" style={{ color: T.text }}>Recent Resumes</p>
            <button onClick={() => setLocation('/dashboard/builder')} className="text-xs font-bold" style={{ color: T.primaryText }}>
              View all
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: T.outlineVariant }}>
            {recentResumes.map((r: any) => (
              <button key={r.id} onClick={() => setLocation('/dashboard/builder/edit')}
                className="flex items-center justify-between w-full px-4 py-3 text-left transition">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: T.text }}>{r.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.muted }}>{r.updated}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0" style={{ color: T.muted }} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Desktop: two-column layout ── */
        <div className="grid grid-cols-[1fr_320px] gap-5">
          {/* Left: Recent Resumes grid */}
          <div>
            <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>Recent Resumes</h2>
            <div className="grid grid-cols-2 gap-3">
              {recentResumes.map((r: any) => (
                <button key={r.id} onClick={() => setLocation('/dashboard/builder/edit')}
                  className="rounded-xl border p-4 text-left transition hover:opacity-90"
                  style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
                  <div className="flex h-16 w-full items-center justify-center rounded-lg mb-3"
                    style={{ backgroundColor: T.elevated }}>
                    <FileText className="h-6 w-6" style={{ color: T.primaryText }} />
                  </div>
                  <p className="text-sm font-bold truncate" style={{ color: T.text }}>{r.name}</p>
                  <p className="text-xs mt-1" style={{ color: T.muted }}>{r.updated}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div>
            <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <button key={a.label} onClick={() => setLocation(a.path)}
                    className="flex items-center gap-3 rounded-xl border p-3 text-left transition hover:opacity-90"
                    style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: T.elevated }}>
                      <Icon className="h-4.5 w-4.5" style={{ color: T.primaryText }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: T.text }}>{a.label}</p>
                      <p className="text-xs" style={{ color: T.muted }}>{a.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0" style={{ color: T.muted }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
