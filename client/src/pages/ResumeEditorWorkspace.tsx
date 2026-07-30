import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  ChevronDown, ChevronRight, Download, Edit3, Eye, FileDown, FileText,
  Maximize2, Minimize2, Plus, Save, Sparkles, Trash2, ZoomIn, ZoomOut,
  User, AlignLeft, Code, Briefcase, Folder, GraduationCap, Award, Trophy,
} from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useResumeStorage } from '@/_core/hooks/useResumeStorage';
import ResumePreview from '@/components/ResumePreview';
import { ensureStandardResumeSections } from '@/lib/resumeSections';
import { nanoid } from 'nanoid';
import type { Resume, ResumeSection, Experience, Project, Education, SkillCategory, Certification } from '@shared/types';

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

type SectionType = ResumeSection['type'];

interface SectionDef {
  type: SectionType;
  label: string;
  icon: typeof User;
}

const ALL_SECTIONS: SectionDef[] = [
  { type: 'header', label: 'Header', icon: User },
  { type: 'summary', label: 'Summary', icon: AlignLeft },
  { type: 'skills', label: 'Skills', icon: Code },
  { type: 'experience', label: 'Experience', icon: Briefcase },
  { type: 'projects', label: 'Projects', icon: Folder },
  { type: 'education', label: 'Education', icon: GraduationCap },
  { type: 'certifications', label: 'Certifications', icon: Award },
  { type: 'achievements', label: 'Achievements', icon: Trophy },
];

export default function ResumeEditorWorkspace() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const storage = useResumeStorage();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resume, setResume] = useState<Resume | null>(null);
  const [activeSection, setActiveSection] = useState<SectionType>('header');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'export'>('edit');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [zoom, setZoom] = useState(0.7);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['header']));
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storage.listResumes().then((list) => {
      setResumes(list);
      if (list.length > 0) {
        setResume(list[0]);
      }
    });
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = (updated: Resume) => {
    setResume(updated);
    setSaveStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await storage.saveResume(updated);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
      }
    }, 800);
  };

  const getSection = (type: SectionType) =>
    resume?.sections.find((s) => s.type === type);

  const updateSection = (type: SectionType, content: ResumeSection['content']) => {
    if (!resume) return;
    const updated = {
      ...resume,
      sections: resume.sections.map((s) =>
        s.type === type ? { ...s, content } : s,
      ),
      updatedAt: new Date(),
    };
    scheduleSave(updated);
  };

  const sectionContent = (type: SectionType) => getSection(type)?.content;

  const toggleExpanded = (type: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const addItem = <T,>(type: SectionType, items: T[], setItems: (items: T[]) => void, newItem: T) => {
    setItems([...items, newItem]);
  };

  if (!resume) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <FileText className="h-12 w-12" style={{ color: T.muted }} />
        <p className="text-lg font-bold" style={{ color: T.text }}>No resume selected</p>
        <p className="text-sm" style={{ color: T.muted }}>Create a new resume to get started.</p>
        <button
          onClick={() => setLocation('/dashboard/builder')}
          className="rounded-lg px-4 py-2 text-sm font-bold text-white"
          style={{ backgroundColor: T.accent }}
        >
          Go to Builder
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-4" style={{ backgroundColor: '#0b1326' }}>
      {/* Mobile: top tab bar */}
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        saveStatus={saveStatus}
        onSave={() => resume && storage.saveResume(resume).then(() => setSaveStatus('saved'))}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: left section navigator */}
        <DesktopSectionNav
          sections={ALL_SECTIONS}
          activeSection={activeSection}
          onSelect={setActiveSection}
          resume={resume}
        />

        {/* Desktop: center editor / all mobile tabs */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'edit' && (
            <div className="p-4 sm:p-6">
              {/* Mobile: accordion sections */}
              <div className="sm:hidden space-y-2">
                {ALL_SECTIONS.map((sec) => {
                  const isOpen = expandedSections.has(sec.type);
                  const Icon = sec.icon;
                  return (
                    <div key={sec.type} className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant }}>
                      <button
                        onClick={() => toggleExpanded(sec.type)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left"
                        style={{ backgroundColor: T.surface }}
                      >
                        <Icon className="h-4 w-4" style={{ color: T.primaryText }} />
                        <span className="flex-1 text-sm font-bold" style={{ color: T.text }}>{sec.label}</span>
                        {isOpen ? <ChevronDown className="h-4 w-4" style={{ color: T.muted }} /> : <ChevronRight className="h-4 w-4" style={{ color: T.muted }} />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4" style={{ backgroundColor: T.surface }}>
                          <SectionEditor
                            type={sec.type}
                            content={sectionContent(sec.type)}
                            onChange={(c) => updateSection(sec.type, c)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop: single section */}
              <div className="hidden sm:block">
                <div className="rounded-xl border p-5" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
                  <SectionEditor
                    type={activeSection}
                    content={sectionContent(activeSection)}
                    onChange={(c) => updateSection(activeSection, c)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="relative p-4">
              <ResumePreviewContainer resume={resume} zoom={zoom} previewRef={previewRef} />
            </div>
          )}

          {activeTab === 'export' && (
            <ExportPanel resume={resume} />
          )}
        </div>

        {/* Desktop: right preview pane */}
        <DesktopPreviewPane resume={resume} zoom={zoom} onZoomChange={setZoom} />
      </div>
    </div>
  );
}

function MobileTabBar({
  activeTab, onTabChange, saveStatus, onSave,
}: {
  activeTab: string; onTabChange: (t: 'edit' | 'preview' | 'export') => void;
  saveStatus: string; onSave: () => void;
}) {
  return (
    <div className="sm:hidden flex items-center border-b px-2" style={{ backgroundColor: T.surface, borderColor: T.outlineVariant }}>
      <div className="flex flex-1">
        {([
          { id: 'edit', label: 'Edit', icon: Edit3 },
          { id: 'preview', label: 'Preview', icon: Eye },
          { id: 'export', label: 'Export', icon: FileDown },
        ] as const).map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition"
              style={{
                color: active ? T.primaryText : T.muted,
                borderColor: active ? T.primary : 'transparent',
              }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <button
        onClick={onSave}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
        style={{
          backgroundColor: saveStatus === 'saved' ? 'rgba(22,163,74,0.15)' : T.elevated,
          color: saveStatus === 'saved' ? T.success : T.muted,
        }}
      >
        <Save className="h-3 w-3" />
        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Save' : 'Saved'}
      </button>
    </div>
  );
}

function DesktopSectionNav({
  sections, activeSection, onSelect, resume,
}: {
  sections: SectionDef[]; activeSection: string; onSelect: (t: SectionType) => void; resume: Resume;
}) {
  return (
    <div className="hidden sm:flex sm:w-[200px] lg:w-[240px] flex-col gap-1 p-4 overflow-y-auto shrink-0 border-r" style={{ borderColor: T.outlineVariant }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-2 px-2" style={{ color: T.muted }}>Sections</p>
      {sections.map((sec) => {
        const active = activeSection === sec.type;
        const Icon = sec.icon;
        const s = resume.sections.find((x) => x.type === sec.type);
        const hasContent = s && s.visible;
        return (
          <button
            key={sec.type}
            onClick={() => onSelect(sec.type)}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition"
            style={{
              backgroundColor: active ? T.primary : 'transparent',
              color: active ? '#fff' : hasContent ? T.text : T.muted,
            }}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{sec.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function DesktopPreviewPane({
  resume, zoom, onZoomChange,
}: {
  resume: Resume; zoom: number; onZoomChange: (z: number) => void;
}) {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-l-lg border border-r-0 self-start mt-4"
        style={{ backgroundColor: T.surface, borderColor: T.outlineVariant, color: T.muted }}
      >
        <Eye className="h-4 w-4" />
        <span className="text-xs font-bold">Preview</span>
      </button>
    );
  }
  return (
    <div className="hidden lg:flex flex-col w-[380px] xl:w-[420px] shrink-0 border-l" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: T.outlineVariant }}>
        <p className="text-xs font-bold" style={{ color: T.muted }}>Preview</p>
        <div className="flex items-center gap-1">
          <button onClick={() => onZoomChange(Math.max(0.3, zoom - 0.1))} className="p-1 rounded" style={{ color: T.muted }}><ZoomOut className="h-3.5 w-3.5" /></button>
          <span className="text-xs w-8 text-center" style={{ color: T.muted }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => onZoomChange(Math.min(1.5, zoom + 0.1))} className="p-1 rounded" style={{ color: T.muted }}><ZoomIn className="h-3.5 w-3.5" /></button>
          <button
            onClick={() => {}}
            className="flex items-center gap-1 ml-2 rounded-lg px-2 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: T.accent }}
          >
            <Download className="h-3 w-3" />
            PDF
          </button>
          <button onClick={() => setOpen(false)} className="p-1 rounded" style={{ color: T.muted }}><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex justify-center">
        <ResumePreview resume={resume} zoom={zoom} />
      </div>
    </div>
  );
}

function ResumePreviewContainer({ resume, zoom, previewRef }: { resume: Resume; zoom: number; previewRef: React.RefObject<HTMLDivElement | null> }) {
  const [fs, setFs] = useState(false);
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-3 self-end">
        <button onClick={() => {}} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: T.accent }}>
          <Download className="h-3.5 w-3.5" />
          Export PDF
        </button>
        <button onClick={() => setFs(!fs)} className="p-1.5 rounded" style={{ color: T.muted }}>
          {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
      <div ref={previewRef} className={fs ? 'fixed inset-0 z-50 overflow-y-auto p-4' : ''} style={fs ? { backgroundColor: '#0b1326' } : undefined}>
        <ResumePreview resume={resume} zoom={fs ? 1 : zoom} />
      </div>
    </div>
  );
}

function ExportPanel({ resume }: { resume: Resume }) {
  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h2 className="text-lg font-extrabold" style={{ color: T.text }}>Export Resume</h2>
      <p className="text-sm" style={{ color: T.muted }}>Download your resume in the format you need.</p>
      <div className="space-y-3">
        <ExportOption icon={FileText} label="PDF Document" desc="Standard A4 format, ready to print or share" accent />
        <ExportOption icon={FileText} label="DOCX Document" desc="Editable Word document" />
      </div>
    </div>
  );
}

function ExportOption({ icon: Icon, label, desc, accent }: { icon: typeof FileText; label: string; desc: string; accent?: boolean }) {
  return (
    <button
      className="flex items-center gap-4 w-full rounded-xl border p-4 text-left transition hover:opacity-90"
      style={{
        borderColor: accent ? T.accent : T.outlineVariant,
        backgroundColor: accent ? `${T.accent}15` : T.surface,
      }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: T.elevated }}>
        <Icon className="h-5 w-5" style={{ color: T.primaryText }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color: T.text }}>{label}</p>
        <p className="text-xs" style={{ color: T.muted }}>{desc}</p>
      </div>
      <Download className="h-4 w-4 shrink-0" style={{ color: T.muted }} />
    </button>
  );
}

function SectionEditor({ type, content, onChange }: { type: SectionType; content?: ResumeSection['content']; onChange: (c: ResumeSection['content']) => void }) {
  switch (type) {
    case 'header': return <HeaderEditor content={content} onChange={onChange} />;
    case 'summary': return <SummaryEditor content={content} onChange={onChange} />;
    case 'skills': return <SkillsEditor content={content} onChange={onChange} />;
    case 'experience': return <ExperienceEditor content={content} onChange={onChange} />;
    case 'projects': return <ProjectsEditor content={content} onChange={onChange} />;
    case 'education': return <EducationEditor content={content} onChange={onChange} />;
    case 'certifications': return <CertificationsEditor content={content} onChange={onChange} />;
    case 'achievements': return <AchievementsEditor content={content} onChange={onChange} />;
    default: return null;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold" style={{ color: T.muted }}>{label}</p>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type, multiline, rows }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; multiline?: boolean; rows?: number }) {
  const style: React.CSSProperties = {
    borderColor: T.outlineVariant,
    backgroundColor: T.elevated,
    color: T.text,
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
  };
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows || 3}
        className="w-full resize-none transition"
        style={style}
      />
    );
  }
  return (
    <input
      type={type || 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full transition"
      style={style}
    />
  );
}

function ImproveButton({ onClick, label }: { onClick?: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-80"
      style={{ color: T.primaryText, backgroundColor: 'rgba(30,64,175,0.15)' }}
    >
      <Sparkles className="h-3 w-3" />
      {label || 'Improve with AI'}
    </button>
  );
}

function HeaderEditor({ content, onChange }: { content?: ResumeSection['content']; onChange: (c: ResumeSection['content']) => void }) {
  const h = content?.header || { name: '', email: '', phone: '', location: '', links: [], jobTitle: '', targetRole: '', countryCode: '', locationFields: {}, targetCountryCode: '' };
  const set = (field: string, value: any) => onChange({ ...content, header: { ...h, [field]: value } });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name"><Input value={h.name || ''} onChange={(v) => set('name', v)} placeholder="John Doe" /></Field>
        <Field label="Job Title"><Input value={h.jobTitle || ''} onChange={(v) => set('jobTitle', v)} placeholder="Software Engineer" /></Field>
        <Field label="Email"><Input value={h.email || ''} onChange={(v) => set('email', v)} placeholder="john@example.com" type="email" /></Field>
        <Field label="Phone"><Input value={h.phone || ''} onChange={(v) => set('phone', v)} placeholder="+1 555-0123" /></Field>
        <Field label="Location"><Input value={h.location || ''} onChange={(v) => set('location', v)} placeholder="San Francisco, CA" /></Field>
      </div>
    </div>
  );
}

function SummaryEditor({ content, onChange }: { content?: ResumeSection['content']; onChange: (c: ResumeSection['content']) => void }) {
  const val = content?.summary || '';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Field label="Professional Summary"><div /></Field>
        <ImproveButton />
      </div>
      <textarea
        value={val}
        onChange={(e) => onChange({ ...content, summary: e.target.value })}
        placeholder="Detail your professional experience, major achievements, and core skills..."
        rows={5}
        className="w-full rounded-lg border px-3 py-2.5 text-sm leading-relaxed resize-none outline-none transition"
        style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
      />
    </div>
  );
}

function SkillsEditor({ content, onChange }: { content?: ResumeSection['content']; onChange: (c: ResumeSection['content']) => void }) {
  const skills = content?.skills || [];
  const setSkills = (s: SkillCategory[]) => onChange({ ...content, skills: s });
  return (
    <div className="space-y-4">
      {skills.map((group, idx) => (
        <div key={idx} className="rounded-xl border p-4 space-y-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
          <div className="flex items-center justify-between gap-3">
            <Input value={group.category} onChange={(v) => {
              const next = [...skills]; next[idx] = { ...next[idx], category: v }; setSkills(next);
            }} placeholder="Category" />
            <button onClick={() => setSkills(skills.filter((_, i) => i !== idx))} style={{ color: '#ffb4ab' }}><Trash2 className="h-4 w-4" /></button>
          </div>
          <textarea
            value={group.skills.join(', ')}
            onChange={(e) => {
              const next = [...skills];
              next[idx] = { ...next[idx], skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) };
              setSkills(next);
            }}
            placeholder="Skills (comma-separated)"
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}
          />
        </div>
      ))}
      <button
        onClick={() => setSkills([...skills, { category: '', skills: [] }])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-bold transition hover:opacity-80"
        style={{ borderColor: T.outlineVariant, color: T.muted }}
      >
        <Plus className="h-4 w-4" /> Add Skill Category
      </button>
    </div>
  );
}

function ExperienceEditor({ content, onChange }: { content?: ResumeSection['content']; onChange: (c: ResumeSection['content']) => void }) {
  const experiences = content?.experiences || [];
  const setExperiences = (e: Experience[]) => onChange({ ...content, experiences: e });
  return (
    <div className="space-y-4">
      {experiences.map((exp) => (
        <div key={exp.id} className="rounded-xl border p-4 space-y-4" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: T.text }}>Experience</span>
            <div className="flex items-center gap-1">
              <ImproveButton label="Improve bullets" />
              <button onClick={() => setExperiences(experiences.filter((e) => e.id !== exp.id))} style={{ color: '#ffb4ab' }}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company"><Input value={exp.company} onChange={(v) => setExperiences(experiences.map((e) => e.id === exp.id ? { ...e, company: v } : e))} placeholder="Company" /></Field>
            <Field label="Role"><Input value={exp.role} onChange={(v) => setExperiences(experiences.map((e) => e.id === exp.id ? { ...e, role: v } : e))} placeholder="Role" /></Field>
            <Field label="Start Date"><Input value={exp.startDate} onChange={(v) => setExperiences(experiences.map((e) => e.id === exp.id ? { ...e, startDate: v } : e))} placeholder="Jan 2022" /></Field>
            <Field label="End Date">
              <div className="flex items-center gap-2">
                <Input value={exp.current ? 'Present' : (exp.endDate || '')} onChange={(v) => setExperiences(experiences.map((e) => e.id === exp.id ? { ...e, endDate: v } : e))} placeholder="Present" />
                <label className="flex items-center gap-1 text-xs shrink-0" style={{ color: T.muted }}>
                  <input type="checkbox" checked={exp.current} onChange={(e) => setExperiences(experiences.map((ex) => ex.id === exp.id ? { ...ex, current: e.target.checked, endDate: e.target.checked ? 'Present' : ex.endDate } : ex))} />
                  Current
                </label>
              </div>
            </Field>
          </div>
          <Field label="Responsibilities (one per line)">
            <textarea
              value={exp.description.join('\n')}
              onChange={(e) => setExperiences(experiences.map((ex) => ex.id === exp.id ? { ...ex, description: e.target.value.split('\n').filter(Boolean) } : ex))}
              rows={3}
              placeholder="Designed and developed key features..."
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none"
              style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}
            />
          </Field>
        </div>
      ))}
      <DashedBtn onClick={() => setExperiences([...experiences, { id: nanoid(), company: '', role: '', startDate: '', endDate: '', current: false, description: [] }])}>
        <Plus className="h-4 w-4" /> Add Experience
      </DashedBtn>
    </div>
  );
}

function ProjectsEditor({ content, onChange }: { content?: ResumeSection['content']; onChange: (c: ResumeSection['content']) => void }) {
  const projects = content?.projects || [];
  const setProjects = (p: Project[]) => onChange({ ...content, projects: p });
  return (
    <div className="space-y-4">
      {projects.map((proj) => (
        <div key={proj.id} className="rounded-xl border p-4 space-y-4" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: T.text }}>Project</span>
            <button onClick={() => setProjects(projects.filter((p) => p.id !== proj.id))} style={{ color: '#ffb4ab' }}><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name"><Input value={proj.name} onChange={(v) => setProjects(projects.map((p) => p.id === proj.id ? { ...p, name: v } : p))} placeholder="Project name" /></Field>
            <Field label="Date"><Input value={proj.date || ''} onChange={(v) => setProjects(projects.map((p) => p.id === proj.id ? { ...p, date: v } : p))} placeholder="March 2025" /></Field>
            <Field label="Technologies"><Input value={proj.technologies.join(', ')} onChange={(v) => setProjects(projects.map((p) => p.id === proj.id ? { ...p, technologies: v.split(',').map((s) => s.trim()).filter(Boolean) } : p))} placeholder="React, Node.js" /></Field>
            <Field label="URL"><Input value={proj.link || ''} onChange={(v) => setProjects(projects.map((p) => p.id === proj.id ? { ...p, link: v } : p))} placeholder="https://github.com/..." /></Field>
          </div>
          <Field label="Description">
            <textarea
              value={proj.description}
              onChange={(e) => setProjects(projects.map((p) => p.id === proj.id ? { ...p, description: e.target.value } : p))}
              rows={3} placeholder="Detail what you built..."
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none"
              style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}
            />
          </Field>
        </div>
      ))}
      <DashedBtn onClick={() => setProjects([...projects, { id: nanoid(), name: '', description: '', technologies: [], link: '', date: '' }])}>
        <Plus className="h-4 w-4" /> Add Project
      </DashedBtn>
    </div>
  );
}

function EducationEditor({ content, onChange }: { content?: ResumeSection['content']; onChange: (c: ResumeSection['content']) => void }) {
  const educations = content?.educations || [];
  const setEducations = (e: Education[]) => onChange({ ...content, educations: e });
  return (
    <div className="space-y-4">
      {educations.map((edu) => (
        <div key={edu.id} className="rounded-xl border p-4 space-y-4" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: T.text }}>Education</span>
            <button onClick={() => setEducations(educations.filter((e) => e.id !== edu.id))} style={{ color: '#ffb4ab' }}><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Institution"><Input value={edu.institution} onChange={(v) => setEducations(educations.map((e) => e.id === edu.id ? { ...e, institution: v } : e))} placeholder="University" /></Field>
            <Field label="Degree"><Input value={edu.degree} onChange={(v) => setEducations(educations.map((e) => e.id === edu.id ? { ...e, degree: v } : e))} placeholder="Bachelor of Science" /></Field>
            <Field label="Field"><Input value={edu.field || ''} onChange={(v) => setEducations(educations.map((e) => e.id === edu.id ? { ...e, field: v } : e))} placeholder="Computer Science" /></Field>
            <Field label="Graduation Date"><Input value={edu.graduationDate || ''} onChange={(v) => setEducations(educations.map((e) => e.id === edu.id ? { ...e, graduationDate: v } : e))} placeholder="May 2023" /></Field>
          </div>
        </div>
      ))}
      <DashedBtn onClick={() => setEducations([...educations, { id: nanoid(), institution: '', degree: '', field: '', graduationDate: '', gpa: '' }])}>
        <Plus className="h-4 w-4" /> Add Education
      </DashedBtn>
    </div>
  );
}

function CertificationsEditor({ content, onChange }: { content?: ResumeSection['content']; onChange: (c: ResumeSection['content']) => void }) {
  const certs = content?.certifications || [];
  const setCerts = (c: Certification[]) => onChange({ ...content, certifications: c });
  return (
    <div className="space-y-4">
      {certs.map((cert) => (
        <div key={cert.id} className="rounded-xl border p-4 space-y-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: T.text }}>Certification</span>
            <button onClick={() => setCerts(certs.filter((c) => c.id !== cert.id))} style={{ color: '#ffb4ab' }}><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name"><Input value={cert.name} onChange={(v) => setCerts(certs.map((c) => c.id === cert.id ? { ...c, name: v } : c))} placeholder="AWS Solutions Architect" /></Field>
            <Field label="Issuer"><Input value={cert.issuer} onChange={(v) => setCerts(certs.map((c) => c.id === cert.id ? { ...c, issuer: v } : c))} placeholder="Amazon Web Services" /></Field>
            <Field label="Date"><Input value={cert.date || ''} onChange={(v) => setCerts(certs.map((c) => c.id === cert.id ? { ...c, date: v } : c))} placeholder="Aug 2024" /></Field>
            <Field label="URL"><Input value={cert.link || ''} onChange={(v) => setCerts(certs.map((c) => c.id === cert.id ? { ...c, link: v } : c))} placeholder="https://..." /></Field>
          </div>
        </div>
      ))}
      <DashedBtn onClick={() => setCerts([...certs, { id: nanoid(), name: '', issuer: '', date: '', link: '' }])}>
        <Plus className="h-4 w-4" /> Add Certification
      </DashedBtn>
    </div>
  );
}

function AchievementsEditor({ content, onChange }: { content?: ResumeSection['content']; onChange: (c: ResumeSection['content']) => void }) {
  const achievements = content?.achievements || [];
  const [input, setInput] = useState('');
  const setAchievements = (a: string[]) => onChange({ ...content, achievements: a });
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={input} onChange={setInput} placeholder="e.g. Increased performance by 40%" />
        <button
          onClick={() => { if (input.trim()) { setAchievements([...achievements, input.trim()]); setInput(''); } }}
          className="rounded-lg px-3 py-2 text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: T.primary }}
        >Add</button>
      </div>
      <div className="space-y-2">
        {achievements.map((ach, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
            <span className="text-sm" style={{ color: T.text }}>{ach}</span>
            <button onClick={() => setAchievements(achievements.filter((_, i) => i !== idx))} style={{ color: '#ffb4ab' }}><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashedBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-bold transition hover:opacity-80"
      style={{ borderColor: T.outlineVariant, color: T.muted }}
    >
      {children}
    </button>
  );
}
