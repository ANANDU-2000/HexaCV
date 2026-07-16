import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, User, AlignLeft, Code, Briefcase, Folder, GraduationCap } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useResumeStorage } from '@/_core/hooks/useResumeStorage';
import { useAuth } from '@/_core/hooks/useAuth';
import { ensureStandardResumeSections } from '@/lib/resumeSections';
import CountryLocationFields from '@/components/CountryLocationFields';
import type { SkillCategory, Experience, Project, Education } from '@shared/types';

const T = {
  surface: '#131b33',
  elevated: '#1c2747',
  primary: '#1e40af',
  primaryText: '#b8c4ff',
  accent: '#ea580c',
  text: '#e2e8f0',
  muted: '#94a3b8',
  border: '#1e293b',
  outlineVariant: '#2a3a5c',
  success: '#16a34a',
};

type SectionId = 'header' | 'summary' | 'skills' | 'experience' | 'projects' | 'education';

interface StepDef {
  id: SectionId;
  label: string;
  icon: typeof User;
}

const STEPS: StepDef[] = [
  { id: 'header', label: 'Header', icon: User },
  { id: 'summary', label: 'Summary', icon: AlignLeft },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'education', label: 'Education', icon: GraduationCap },
];

export default function ResumeScratch() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const storage = useResumeStorage();

  const [currentStep, setCurrentStep] = useState<SectionId>('header');

  const [header, setHeader] = useState({
    name: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    countryCode: '',
    targetCountryCode: '',
    locationFields: {} as Record<string, string>,
  });

  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState<SkillCategory[]>([
    { category: 'Frontend', skills: ['React', 'TypeScript', 'Tailwind CSS'] },
    { category: 'Backend', skills: ['Node.js', 'Express', 'SQL'] },
  ]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const isLastStep = stepIndex === STEPS.length - 1;
  const isFirstStep = stepIndex === 0;

  const goNext = () => {
    if (!isLastStep) {
      setCurrentStep(STEPS[stepIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[stepIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isStepComplete = (id: SectionId) => {
    switch (id) {
      case 'header': return !!(header.name.trim() && header.email.trim());
      case 'summary': return !!summary.trim();
      case 'skills': return skills.length > 0 && skills.some((s) => s.skills.length > 0);
      case 'experience': return experiences.length > 0 && experiences.some((e) => e.company.trim() && e.role.trim());
      case 'projects': return projects.length > 0 && projects.some((p) => p.name.trim());
      case 'education': return educations.length > 0 && educations.some((e) => e.institution.trim() && e.degree.trim());
    }
  };

  const handleFinish = async () => {
    if (!header.name || !header.email) {
      toast.error('Please complete your name and email in the Header step.');
      setCurrentStep('header');
      return;
    }

    const links = [
      { label: 'LinkedIn', url: header.linkedin },
      { label: 'GitHub', url: header.github },
      { label: 'Portfolio', url: header.portfolio },
    ].filter((l) => l.url);

    const parsed = {
      header: {
        name: header.name,
        jobTitle: header.jobTitle,
        email: header.email,
        phone: header.phone,
        location: header.location,
        links,
        countryCode: header.countryCode,
        targetCountryCode: header.targetCountryCode,
        locationFields: header.locationFields,
        targetRole: '',
      },
      summary,
      skills,
      experiences,
      projects,
      educations,
      certifications: [],
      achievements: [],
      languages: [],
      references: [],
    };

    try {
      const resume = ensureStandardResumeSections({
        id: nanoid(),
        userId: isAuthenticated ? 'user' : 'guest',
        title: header.name ? `${header.name}'s Resume` : 'Untitled Resume',
        templateId: 'classic-ats-blue' as const,
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      resume.sections = [
        {
          id: nanoid(), type: 'header' as const, order: 1, visible: true,
          content: { header: parsed.header },
        },
        { id: nanoid(), type: 'summary' as const, order: 2, visible: true, content: { summary: parsed.summary } },
        { id: nanoid(), type: 'skills' as const, order: 3, visible: true, content: { skills: parsed.skills } },
        { id: nanoid(), type: 'experience' as const, order: 4, visible: true, content: { experiences: parsed.experiences } },
        { id: nanoid(), type: 'projects' as const, order: 5, visible: true, content: { projects: parsed.projects } },
        { id: nanoid(), type: 'education' as const, order: 6, visible: true, content: { educations: parsed.educations } },
        { id: nanoid(), type: 'certifications' as const, order: 7, visible: true, content: { certifications: [] } },
        { id: nanoid(), type: 'achievements' as const, order: 8, visible: true, content: { achievements: [] } },
        { id: nanoid(), type: 'languages' as const, order: 9, visible: true, content: { languages: [] } },
        { id: nanoid(), type: 'references' as const, order: 10, visible: true, content: { references: [] } },
      ];

      await storage.saveResume(resume);
      toast.success('Resume created! Opening editor...');
      setLocation('/dashboard/builder/edit');
    } catch (err: any) {
      toast.error(`Failed to save resume: ${err.message}`);
    }
  };

  return (
    <div className="pb-safe">
      {/* Mobile: sticky top progress bar */}
      <div className="sticky top-0 z-30 -mx-4 -mt-4 px-4 pt-4 pb-3 sm:hidden" style={{ backgroundColor: T.surface }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{ color: T.muted }}>
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <span className="text-xs font-bold" style={{ color: T.primaryText }}>
            {Math.round(((stepIndex + 1) / STEPS.length) * 100)}%
          </span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{
                backgroundColor: i <= stepIndex ? T.primary : T.elevated,
              }}
            />
          ))}
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STEPS.map((s) => {
            const active = currentStep === s.id;
            const done = isStepComplete(s.id);
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border whitespace-nowrap transition-all"
                style={{
                  backgroundColor: active ? T.primary : done ? 'rgba(30,64,175,0.3)' : T.elevated,
                  borderColor: active ? T.primary : T.outlineVariant,
                  color: active || done ? '#fff' : T.muted,
                }}
              >
                {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-8 mt-4 sm:mt-0">
        {/* Desktop: left sidebar stepper */}
        <div className="hidden sm:flex sm:w-[220px] lg:w-[260px] flex-col gap-1 shrink-0 sticky top-4 self-start">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 px-3" style={{ color: T.muted }}>Sections</p>
          {STEPS.map((s) => {
            const active = currentStep === s.id;
            const done = isStepComplete(s.id);
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all"
                style={{
                  backgroundColor: active ? '#1e40af' : 'transparent',
                }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.2)' : done ? 'rgba(30,64,175,0.3)' : T.elevated,
                    color: active || done ? '#fff' : T.muted,
                  }}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: active ? '#fff' : T.muted }}>Step {STEPS.indexOf(s) + 1}</p>
                  <p className="text-sm font-semibold" style={{ color: active ? '#fff' : T.text }}>{s.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Form panel */}
        <div className="flex-1 min-w-0 max-w-3xl">
          <div
            className="rounded-xl border p-5 sm:p-6"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}
          >
            {/* Header */}
            {currentStep === 'header' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name *">
                    <Input value={header.name} onChange={(v) => setHeader({ ...header, name: v })} placeholder="John Doe" />
                  </Field>
                  <Field label="Job Title">
                    <Input value={header.jobTitle} onChange={(v) => setHeader({ ...header, jobTitle: v })} placeholder="Full Stack Engineer" />
                  </Field>
                  <Field label="Email Address *">
                    <Input value={header.email} onChange={(v) => setHeader({ ...header, email: v })} placeholder="john@example.com" type="email" />
                  </Field>
                  <div className="sm:col-span-2">
                    <CountryLocationFields
                      countryCode={header.countryCode}
                      locationFields={header.locationFields}
                      phone={header.phone}
                      targetCountryCode={header.targetCountryCode}
                      onCountryChange={(code) => setHeader({ ...header, countryCode: code })}
                      onTargetCountryChange={(code) => setHeader({ ...header, targetCountryCode: code })}
                      onLocationFieldChange={(fields) => setHeader({ ...header, locationFields: fields })}
                      onPhoneChange={(phone) => setHeader({ ...header, phone })}
                      onLocationStringChange={(location) => setHeader({ ...header, location })}
                    />
                  </div>
                </div>
                <div className="border-t pt-5 space-y-4" style={{ borderColor: T.outlineVariant }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.muted }}>Social & Website Profiles</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="LinkedIn URL">
                      <Input value={header.linkedin} onChange={(v) => setHeader({ ...header, linkedin: v })} placeholder="linkedin.com/in/username" />
                    </Field>
                    <Field label="GitHub URL">
                      <Input value={header.github} onChange={(v) => setHeader({ ...header, github: v })} placeholder="github.com/username" />
                    </Field>
                    <Field label="Portfolio URL">
                      <Input value={header.portfolio} onChange={(v) => setHeader({ ...header, portfolio: v })} placeholder="yourportfolio.com" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            {currentStep === 'summary' && (
              <div className="space-y-2">
                <Field label="Professional Summary">
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Detail your professional experience, major achievements, and core skills..."
                    rows={7}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm leading-relaxed outline-none resize-none transition"
                    style={{
                      borderColor: T.outlineVariant,
                      backgroundColor: T.elevated,
                      color: T.text,
                    }}
                  />
                </Field>
              </div>
            )}

            {/* Skills */}
            {currentStep === 'skills' && (
              <div className="space-y-4">
                {skills.map((group, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border p-4 space-y-3"
                    style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <input
                        value={group.category}
                        onChange={(e) => {
                          const next = [...skills];
                          next[idx].category = e.target.value;
                          setSkills(next);
                        }}
                        placeholder="Category (e.g. Frontend)"
                        className="flex-1 rounded-lg border px-3 py-2 text-sm font-bold outline-none"
                        style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}
                      />
                      <button
                        onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition"
                        style={{ color: '#ffb4ab' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={group.skills.join(', ')}
                      onChange={(e) => {
                        const next = [...skills];
                        next[idx].skills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setSkills(next);
                      }}
                      placeholder="Skills (comma-separated: e.g. React, Vue, HTML, CSS)"
                      rows={2}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                      style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}
                    />
                  </div>
                ))}
                <DashedButton onClick={() => setSkills([...skills, { category: '', skills: [] }])}>
                  <Plus className="h-4 w-4" />
                  Add Skill Category
                </DashedButton>
              </div>
            )}

            {/* Experience */}
            {currentStep === 'experience' && (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="rounded-xl border p-4 space-y-4"
                    style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: T.text }}>Experience</span>
                      <button
                        onClick={() => setExperiences(experiences.filter((e) => e.id !== exp.id))}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-xs font-semibold transition"
                        style={{ color: '#ffb4ab' }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Company Name *">
                        <Input value={exp.company} onChange={(v) => {
                          const next = experiences.map((e) => e.id === exp.id ? { ...e, company: v } : e);
                          setExperiences(next);
                        }} placeholder="Company" />
                      </Field>
                      <Field label="Role *">
                        <Input value={exp.role} onChange={(v) => {
                          const next = experiences.map((e) => e.id === exp.id ? { ...e, role: v } : e);
                          setExperiences(next);
                        }} placeholder="Software Engineer" />
                      </Field>
                      <Field label="Start Date *">
                        <Input value={exp.startDate} onChange={(v) => {
                          const next = experiences.map((e) => e.id === exp.id ? { ...e, startDate: v } : e);
                          setExperiences(next);
                        }} placeholder="Jan 2022" />
                      </Field>
                      <Field label="End Date">
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={exp.current ? 'Present' : exp.endDate}
                            disabled={exp.current}
                            onChange={(e) => {
                              const next = experiences.map((ex) => ex.id === exp.id ? { ...ex, endDate: e.target.value } : ex);
                              setExperiences(next);
                            }}
                            placeholder="Present"
                            className="flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none disabled:opacity-50"
                            style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}
                          />
                          <label className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: T.muted }}>
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => {
                                const next = experiences.map((ex) => ex.id === exp.id ? { ...ex, current: e.target.checked, endDate: e.target.checked ? 'Present' : ex.endDate } : ex);
                                setExperiences(next);
                              }}
                              className="rounded"
                            />
                            Current
                          </label>
                        </div>
                      </Field>
                    </div>
                    <Field label="Key Responsibilities (one per line)">
                      <textarea
                        value={exp.description.join('\n')}
                        onChange={(e) => {
                          const next = experiences.map((ex) => ex.id === exp.id ? { ...ex, description: e.target.value.split('\n').filter(Boolean) } : ex);
                          setExperiences(next);
                        }}
                        rows={3}
                        placeholder="Designed and developed key SaaS dashboard modules&#10;Integrated third-party APIs using Express"
                        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none"
                        style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}
                      />
                    </Field>
                  </div>
                ))}
                <DashedButton onClick={() => setExperiences([...experiences, {
                  id: nanoid(), company: '', role: '', startDate: '', endDate: '', current: false, description: [],
                }])}>
                  <Plus className="h-4 w-4" />
                  Add Experience
                </DashedButton>
              </div>
            )}

            {/* Projects */}
            {currentStep === 'projects' && (
              <div className="space-y-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="rounded-xl border p-4 space-y-4"
                    style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: T.text }}>Project</span>
                      <button
                        onClick={() => setProjects(projects.filter((p) => p.id !== proj.id))}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-xs font-semibold transition"
                        style={{ color: '#ffb4ab' }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Project Name *">
                        <Input value={proj.name} onChange={(v) => {
                          const next = projects.map((p) => p.id === proj.id ? { ...p, name: v } : p);
                          setProjects(next);
                        }} placeholder="My Project" />
                      </Field>
                      <Field label="Date">
                        <Input value={proj.date || ''} onChange={(v) => {
                          const next = projects.map((p) => p.id === proj.id ? { ...p, date: v } : p);
                          setProjects(next);
                        }} placeholder="March 2025" />
                      </Field>
                      <Field label="Technologies">
                        <Input value={proj.technologies.join(', ')} onChange={(v) => {
                          const next = projects.map((p) => p.id === proj.id ? { ...p, technologies: v.split(',').map((s) => s.trim()).filter(Boolean) } : p);
                          setProjects(next);
                        }} placeholder="React, Tailwind, Node.js" />
                      </Field>
                      <Field label="Project URL">
                        <Input value={proj.link || ''} onChange={(v) => {
                          const next = projects.map((p) => p.id === proj.id ? { ...p, link: v } : p);
                          setProjects(next);
                        }} placeholder="https://github.com/..." />
                      </Field>
                    </div>
                    <Field label="Description">
                      <textarea
                        value={proj.description}
                        onChange={(e) => {
                          const next = projects.map((p) => p.id === proj.id ? { ...p, description: e.target.value } : p);
                          setProjects(next);
                        }}
                        rows={3}
                        placeholder="Detail what you built, technical challenges, and outcomes..."
                        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none"
                        style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}
                      />
                    </Field>
                  </div>
                ))}
                <DashedButton onClick={() => setProjects([...projects, {
                  id: nanoid(), name: '', description: '', technologies: [], link: '', date: '',
                }])}>
                  <Plus className="h-4 w-4" />
                  Add Project
                </DashedButton>
              </div>
            )}

            {/* Education */}
            {currentStep === 'education' && (
              <div className="space-y-4">
                {educations.map((edu) => (
                  <div
                    key={edu.id}
                    className="rounded-xl border p-4 space-y-4"
                    style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: T.text }}>Education</span>
                      <button
                        onClick={() => setEducations(educations.filter((e) => e.id !== edu.id))}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-xs font-semibold transition"
                        style={{ color: '#ffb4ab' }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Institution *">
                        <Input value={edu.institution} onChange={(v) => {
                          const next = educations.map((e) => e.id === edu.id ? { ...e, institution: v } : e);
                          setEducations(next);
                        }} placeholder="State University" />
                      </Field>
                      <Field label="Degree *">
                        <Input value={edu.degree} onChange={(v) => {
                          const next = educations.map((e) => e.id === edu.id ? { ...e, degree: v } : e);
                          setEducations(next);
                        }} placeholder="Bachelor of Science" />
                      </Field>
                      <Field label="Field of Study">
                        <Input value={edu.field || ''} onChange={(v) => {
                          const next = educations.map((e) => e.id === edu.id ? { ...e, field: v } : e);
                          setEducations(next);
                        }} placeholder="Computer Science" />
                      </Field>
                      <Field label="Graduation Date">
                        <Input value={edu.graduationDate || ''} onChange={(v) => {
                          const next = educations.map((e) => e.id === edu.id ? { ...e, graduationDate: v } : e);
                          setEducations(next);
                        }} placeholder="May 2023" />
                      </Field>
                    </div>
                  </div>
                ))}
                <DashedButton onClick={() => setEducations([...educations, {
                  id: nanoid(), institution: '', degree: '', field: '', graduationDate: '', gpa: '',
                }])}>
                  <Plus className="h-4 w-4" />
                  Add Education
                </DashedButton>
              </div>
            )}
          </div>

          {/* Mobile: sticky bottom nav bar */}
          <div className="sticky bottom-0 z-30 -mx-4 -mb-4 px-4 pb-4 pt-3 sm:hidden" style={{ backgroundColor: T.surface }}>
            <div className="flex items-center gap-3">
              {!isFirstStep && (
                <button
                  onClick={goBack}
                  className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-3 text-sm font-bold flex-1 transition"
                  style={{ color: T.muted, backgroundColor: T.elevated }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              {isFirstStep && <div className="flex-1" />}
              {isLastStep ? (
                <button
                  onClick={handleFinish}
                  className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-3 text-sm font-bold text-white flex-1 transition hover:opacity-90"
                  style={{ backgroundColor: T.accent }}
                >
                  Finish
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-3 text-sm font-bold text-white flex-1 transition hover:opacity-90"
                  style={{ backgroundColor: T.primary }}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop: persistent footer */}
          <div className="hidden sm:flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: T.outlineVariant }}>
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold transition"
              style={{ color: isFirstStep ? T.muted : T.text, backgroundColor: T.elevated, opacity: isFirstStep ? 0.4 : 1 }}
              disabled={isFirstStep}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {isLastStep ? (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: T.accent }}
              >
                Finish
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: T.primary }}
              >
                Save & Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
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

function Input({ value, onChange, placeholder, type }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type || 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition"
      style={{ borderColor: '#2a3a5c', backgroundColor: '#1c2747', color: '#e2e8f0' }}
    />
  );
}

function DashedButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-bold transition hover:opacity-80"
      style={{ borderColor: '#2a3a5c', color: '#94a3b8', backgroundColor: '#131b33' }}
    >
      {children}
    </button>
  );
}
