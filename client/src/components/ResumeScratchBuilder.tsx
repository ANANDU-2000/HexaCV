import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import {
  AlignLeft,
  Award,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code,
  FileText,
  Folder,
  Globe,
  GraduationCap,
  LayoutList,
  Plus,
  Trophy,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParsedResume, Experience, Project, Education, Certification, SkillCategory } from '@shared/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import CountryLocationFields from './CountryLocationFields';

interface ResumeScratchBuilderProps {
  onComplete: (data: any) => void;
  prefilledRole?: string;
  prefilledCountryCode?: string;
}

export default function ResumeScratchBuilder({ onComplete, prefilledRole, prefilledCountryCode }: ResumeScratchBuilderProps) {
  const [currentStep, setCurrentStep] = useState<'header' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'achievements' | 'languages' | 'references' | 'custom' | 'review'>('header');

  const [header, setHeader] = useState({
    name: '',
    jobTitle: prefilledRole || '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    countryCode: '',
    targetCountryCode: prefilledCountryCode || '',
    locationFields: {} as Record<string, string>,
  });

  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState<SkillCategory[]>([
    { category: 'Frontend', skills: ['React', 'TypeScript', 'Tailwind CSS'] },
    { category: 'Backend', skills: ['Node.js', 'Express', 'SQL'] }
  ]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementInput, setAchievementInput] = useState('');
  
  const [languages, setLanguages] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [customSections, setCustomSections] = useState<any[]>([]);

  const steps = [
    { id: 'header', label: 'Header', icon: User },
    { id: 'summary', label: 'Summary', icon: AlignLeft },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'languages', label: 'Languages', icon: Globe },
    { id: 'references', label: 'References', icon: Users },
    { id: 'custom', label: 'Custom', icon: LayoutList },
    { id: 'review', label: 'Review', icon: FileText },
  ];

  const handleNextStep = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as any);
    }
  };

  const handlePrevStep = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as any);
    }
  };

  const handleAddExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: nanoid(),
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        current: false,
        description: []
      }
    ]);
  };

  const handleAddProject = () => {
    setProjects([
      ...projects,
      {
        id: nanoid(),
        name: '',
        description: '',
        technologies: [],
        link: '',
        date: ''
      }
    ]);
  };

  const handleAddEducation = () => {
    setEducations([
      ...educations,
      {
        id: nanoid(),
        institution: '',
        degree: '',
        field: '',
        graduationDate: '',
        gpa: ''
      }
    ]);
  };

  const handleAddCertification = () => {
    setCertifications([
      ...certifications,
      {
        id: nanoid(),
        name: '',
        issuer: '',
        date: '',
        link: ''
      }
    ]);
  };

  const handleAddLanguage = () => {
    setLanguages([...languages, { language: '', proficiency: 'Full Professional' }]);
  };

  const handleAddReference = () => {
    setReferences([...references, { id: nanoid(), name: '', company: '', title: '', email: '', phone: '', availableOnRequest: false }]);
  };

  const handleAddCustomSection = () => {
    setCustomSections([...customSections, { id: nanoid(), title: 'Volunteer Work', items: [{ id: nanoid(), title: '', subtitle: '', description: '' }] }]);
  };

  const handleAddCustomItem = (sectIdx: number) => {
    const list = [...customSections];
    list[sectIdx].items.push({ id: nanoid(), title: '', subtitle: '', description: '' });
    setCustomSections(list);
  };

  const handleFinish = () => {
    if (!header.name || !header.email) {
      toast.error('Please complete your name and email in the Header step.');
      setCurrentStep('header');
      return;
    }

    const finalLinks = [
      { label: 'LinkedIn', url: header.linkedin },
      { label: 'GitHub', url: header.github },
      { label: 'Portfolio', url: header.portfolio }
    ].filter(l => l.url);

    const payload = {
      header: {
        name: header.name,
        jobTitle: header.jobTitle,
        email: header.email,
        phone: header.phone,
        location: header.location,
        links: finalLinks,
        countryCode: header.countryCode,
        targetCountryCode: header.targetCountryCode,
        locationFields: header.locationFields,
      },
      summary,
      skills,
      experiences,
      projects,
      educations,
      certifications,
      achievements,
      languages,
      references,
      customSections
    };

    onComplete(payload as any);
  };

  const isStepCompleted = (stepId: string) => {
    switch (stepId) {
      case 'header':
        return !!(header.name.trim() && header.email.trim());
      case 'summary':
        return !!summary.trim();
      case 'skills':
        return skills.length > 0 && skills.some(s => s.skills.length > 0);
      case 'experience':
        return experiences.length > 0 && experiences.some(e => e.company.trim() && e.role.trim());
      case 'projects':
        return projects.length > 0 && projects.some(p => p.name.trim());
      case 'education':
        return educations.length > 0 && educations.some(e => e.institution.trim() && e.degree.trim());
      case 'certifications':
        return certifications.length > 0 && certifications.some(c => c.name.trim());
      case 'achievements':
        return achievements.length > 0;
      case 'languages':
        return languages.length > 0 && languages.some(l => l.language.trim());
      case 'references':
        return references.length > 0;
      case 'custom':
        return customSections.length > 0 && customSections.some(s => s.title.trim());
      case 'review':
        return false;
      default:
        return false;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start text-slate-800 dark:text-slate-200">
      {/* Desktop Sidebar Stepper — Premium */}
      <div className="hidden md:flex md:col-span-3 lg:col-span-3 flex-col gap-1.5 border-r border-slate-200/60 dark:border-white/10 pr-6 sticky top-24">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] pl-4 mb-3">Resume Steps</h3>
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isDone = isStepCompleted(step.id);
          const StepIcon = step.icon;
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id as any)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                  : isDone
                    ? 'text-slate-600 hover:bg-slate-100/50 dark:text-slate-300 dark:hover:bg-white/5'
                    : 'text-slate-400 hover:bg-slate-50/50 dark:text-slate-500 dark:hover:bg-white/5',
              )}
            >
              <span className={cn(
                'flex items-center justify-center w-7 h-7 rounded-lg font-bold shrink-0 text-xs transition-all',
                isActive && 'bg-white/20',
                isDone && 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                !isActive && !isDone && 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500',
              )}>
                {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 leading-none">Step {index + 1}</span>
                <span className="text-xs font-semibold truncate leading-tight mt-0.5">{step.label}</span>
              </div>
              {/* Active indicator */}
              {isActive && <div className="ml-auto w-1 h-8 rounded-full bg-white/30" />}
            </button>
          );
        })}
      </div>

      {/* Mobile Stepper — Premium */}
      <div className="md:hidden rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/40 space-y-4 w-full">
        {/* Step label and percentage */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-extrabold shadow-sm">
              {steps.findIndex(s => s.id === currentStep) + 1}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                {steps.find(s => s.id === currentStep)?.label}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {Math.round(((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100)}%
            </span>
          </div>
        </div>

        {/* Premium gradient progress bar */}
        <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Scrollable step chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isDone = isStepCompleted(step.id);
            const StepIcon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id as any)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap text-xs font-semibold border transition-all duration-200',
                  isActive && 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20',
                  isDone && !isActive && 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-300',
                  !isActive && !isDone && 'bg-white/80 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400',
                )}
              >
                {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content Area */}
      <div className="col-span-1 md:col-span-9 lg:col-span-9 space-y-6 w-full">
        <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden dark:border-white/10 dark:bg-slate-900/30">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/60 p-6 dark:from-slate-900/40 dark:to-slate-900/20 dark:border-white/5">
            <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-700 dark:from-blue-400/10 dark:to-blue-500/5 dark:text-blue-300">
                {(() => {
                  const SectionIcon = steps.find((s) => s.id === currentStep)?.icon || FileText;
                  return <SectionIcon className="h-4 w-4" />;
                })()}
              </div>
              {steps.find((s) => s.id === currentStep)?.label}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1 ml-10">
              {currentStep === 'header' && 'Provide your name, title, contact details, and social links.'}
              {currentStep === 'summary' && 'Write a compelling professional summary.'}
              {currentStep === 'skills' && 'Add categorized skills to make your resume keyword-rich.'}
              {currentStep === 'experience' && 'Detail your work history and achievements.'}
              {currentStep === 'projects' && 'Add significant side projects or work achievements.'}
              {currentStep === 'education' && 'Add your degree, school, and academic achievements.'}
              {currentStep === 'certifications' && 'List relevant certifications and professional courses.'}
              {currentStep === 'achievements' && 'List key quantified achievements.'}
              {currentStep === 'languages' && 'List languages you speak and your proficiency levels.'}
              {currentStep === 'references' && 'Add professional references or mark them available upon request.'}
              {currentStep === 'custom' && 'Create any additional custom sections.'}
              {currentStep === 'review' && 'Verify details before loading into the live resume editor.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Header Step */}
            {currentStep === 'header' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-slide-up">
                  <div>
                    <Label htmlFor="name" className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={header.name}
                      onChange={(e) => setHeader({ ...header, name: e.target.value })}
                      className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle" className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      placeholder="Full Stack Engineer"
                      value={header.jobTitle}
                      onChange={(e) => setHeader({ ...header, jobTitle: e.target.value })}
                      className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={header.email}
                      onChange={(e) => setHeader({ ...header, email: e.target.value })}
                      className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <CountryLocationFields
                      countryCode={header.countryCode}
                      locationFields={header.locationFields}
                      phone={header.phone}
                      targetCountryCode={header.targetCountryCode}
                      location={header.location}
                      onCountryChange={(code) => setHeader({ ...header, countryCode: code })}
                      onTargetCountryChange={(code) => setHeader({ ...header, targetCountryCode: code })}
                      onLocationFieldChange={(fields) => setHeader({ ...header, locationFields: fields })}
                      onPhoneChange={(phone) => setHeader({ ...header, phone })}
                      onLocationStringChange={(location) => setHeader({ ...header, location })}
                    />
                  </div>
                </div>

                {/* Social links */}
                <div className="border-t border-slate-200 dark:border-white/10 pt-5 space-y-4 animate-fade-slide-up">
                  <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-500 dark:text-slate-400">Social and Website Profiles</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="linkedin" className="font-semibold text-slate-700 dark:text-slate-300 text-xs">LinkedIn URL</Label>
                      <Input
                        id="linkedin"
                        placeholder="linkedin.com/in/username"
                        value={header.linkedin}
                        onChange={(e) => setHeader({ ...header, linkedin: e.target.value })}
                        className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="github" className="font-semibold text-slate-700 dark:text-slate-300 text-xs">GitHub URL</Label>
                      <Input
                        id="github"
                        placeholder="github.com/username"
                        value={header.github}
                        onChange={(e) => setHeader({ ...header, github: e.target.value })}
                        className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="portfolio" className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Portfolio URL</Label>
                      <Input
                        id="portfolio"
                        placeholder="yourportfolio.com"
                        value={header.portfolio}
                        onChange={(e) => setHeader({ ...header, portfolio: e.target.value })}
                        className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Step */}
            {currentStep === 'summary' && (
              <div className="space-y-2 animate-fade-slide-up">
                <Label htmlFor="summary" className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Professional Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Detail your professional experience, major achievements, and core skills..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={7}
                  className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-3 mt-1 leading-relaxed text-sm text-slate-800 dark:text-slate-200"
                />
              </div>
            )}

            {/* Skills Step */}
            {currentStep === 'skills' && (
              <div className="space-y-4 animate-fade-slide-up">
                {skills.map((skillGroup, idx) => (
                  <div key={idx} className="border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-slate-50/50 dark:bg-white/5 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center gap-3">
                      <Input
                        placeholder="Category (e.g. Frontend)"
                        value={skillGroup.category}
                        className="max-w-xs font-bold text-slate-900 dark:text-slate-100 rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                        onChange={(e) => {
                          const newSkills = [...skills];
                          newSkills[idx].category = e.target.value;
                          setSkills(newSkills);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                        className="text-slate-500 dark:text-slate-400 hover:text-red-400 rounded-lg h-8 w-8 hover:bg-red-500/10 border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Skills (comma-separated: e.g. React, Vue, HTML, CSS)"
                      value={skillGroup.skills.join(', ')}
                      onChange={(e) => {
                        const newSkills = [...skills];
                        newSkills[idx].skills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setSkills(newSkills);
                      }}
                      rows={2}
                      className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-sm leading-relaxed text-slate-800 dark:text-slate-200"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setSkills([...skills, { category: '', skills: [] }])}
                  className="w-full gap-2 border-2 border-dashed border-slate-300/70 rounded-xl py-5 bg-white/50 text-slate-600 font-semibold hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-950/20 dark:hover:text-blue-300 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Skill Category
                </Button>
              </div>
            )}

            {/* Experience Step */}
            {currentStep === 'experience' && (
              <div className="space-y-5 animate-fade-slide-up">
                {experiences.map((exp, idx) => (
                  <div key={exp.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-5 bg-slate-50/50 dark:bg-white/5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-600 dark:text-slate-350 text-sm">Experience #{idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExperiences(experiences.filter((e) => e.id !== exp.id))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-2.5 h-8 border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5 inline" /> Delete Position
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Company Name *</Label>
                        <Input
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => {
                            const newExp = [...experiences];
                            newExp[idx].company = e.target.value;
                            setExperiences(newExp);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Role / Designation *</Label>
                        <Input
                          placeholder="e.g. Software Engineer"
                          value={exp.role}
                          onChange={(e) => {
                            const newExp = [...experiences];
                            newExp[idx].role = e.target.value;
                            setExperiences(newExp);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Start Date *</Label>
                        <Input
                          placeholder="Jan 2022"
                          value={exp.startDate}
                          onChange={(e) => {
                            const newExp = [...experiences];
                            newExp[idx].startDate = e.target.value;
                            setExperiences(newExp);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">End Date</Label>
                        <Input
                          placeholder="Present"
                          value={exp.endDate}
                          disabled={exp.current}
                          onChange={(e) => {
                            const newExp = [...experiences];
                            newExp[idx].endDate = e.target.value;
                            setExperiences(newExp);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2.5 pt-1">
                      <input
                        type="checkbox"
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => {
                          const newExp = [...experiences];
                          newExp[idx].current = e.target.checked;
                          if (e.target.checked) newExp[idx].endDate = 'Present';
                          setExperiences(newExp);
                        }}
                        className="w-4 h-4 rounded text-blue-650 focus:ring-blue-500 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                      />
                      <label htmlFor={`current-${exp.id}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300">Currently work here</label>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Key Responsibilities (one per line)</Label>
                      <Textarea
                        placeholder="Designed and developed key SaaS dashboard modules&#10;Integrated third-party APIs using Express"
                        value={exp.description.join('\n')}
                        onChange={(e) => {
                          const newExp = [...experiences];
                          newExp[idx].description = e.target.value.split('\n').filter(Boolean);
                          setExperiences(newExp);
                        }}
                        rows={3.5}
                        className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-xs leading-relaxed text-slate-250"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddExperience}
                  className="w-full gap-2 border-2 border-dashed border-slate-300/70 rounded-xl py-5 bg-white/50 text-slate-600 font-semibold hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-950/20 dark:hover:text-blue-300 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Professional Experience
                </Button>
              </div>
            )}

            {/* Projects Step */}
            {currentStep === 'projects' && (
              <div className="space-y-5 animate-fade-slide-up">
                {projects.map((proj, idx) => (
                  <div key={proj.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-5 bg-slate-50/50 dark:bg-white/5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Project #{idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProjects(projects.filter((p) => p.id !== proj.id))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-2.5 h-8"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5 inline" /> Delete Project
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Project Name *</Label>
                        <Input
                          placeholder="My Project"
                          value={proj.name}
                          onChange={(e) => {
                            const newProj = [...projects];
                            newProj[idx].name = e.target.value;
                            setProjects(newProj);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Date / Duration</Label>
                        <Input
                          placeholder="e.g. March 2025"
                          value={proj.date}
                          onChange={(e) => {
                            const newProj = [...projects];
                            newProj[idx].date = e.target.value;
                            setProjects(newProj);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Technologies Used (comma-separated)</Label>
                        <Input
                          placeholder="React, Tailwind, Node.js"
                          value={proj.technologies.join(', ')}
                          onChange={(e) => {
                            const newProj = [...projects];
                            newProj[idx].technologies = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            setProjects(newProj);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Project URL</Label>
                        <Input
                          placeholder="https://github.com/..."
                          value={proj.link}
                          onChange={(e) => {
                            const newProj = [...projects];
                            newProj[idx].link = e.target.value;
                            setProjects(newProj);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Project Description</Label>
                      <Textarea
                        placeholder="Detail what you built, technical challenges, and outcomes..."
                        value={proj.description}
                        onChange={(e) => {
                          const newProj = [...projects];
                          newProj[idx].description = e.target.value;
                          setProjects(newProj);
                        }}
                        rows={3.5}
                        className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddProject}
                  className="w-full gap-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl py-5 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Project Detail
                </Button>
              </div>
            )}

            {/* Education Step */}
            {currentStep === 'education' && (
              <div className="space-y-5 animate-fade-slide-up">
                {educations.map((edu, idx) => (
                  <div key={edu.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-5 bg-slate-50/50 dark:bg-white/5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Education #{idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEducations(educations.filter((e) => e.id !== edu.id))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-2.5 h-8"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5 inline" /> Delete Record
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Institution / College *</Label>
                        <Input
                          placeholder="State University"
                          value={edu.institution}
                          onChange={(e) => {
                            const newEdu = [...educations];
                            newEdu[idx].institution = e.target.value;
                            setEducations(newEdu);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Degree *</Label>
                        <Input
                          placeholder="Bachelor of Science"
                          value={edu.degree}
                          onChange={(e) => {
                            const newEdu = [...educations];
                            newEdu[idx].degree = e.target.value;
                            setEducations(newEdu);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Field of Study *</Label>
                        <Input
                          placeholder="Computer Science"
                          value={edu.field}
                          onChange={(e) => {
                            const newEdu = [...educations];
                            newEdu[idx].field = e.target.value;
                            setEducations(newEdu);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Graduation Date</Label>
                        <Input
                          placeholder="e.g. May 2023"
                          value={edu.graduationDate}
                          onChange={(e) => {
                            const newEdu = [...educations];
                            newEdu[idx].graduationDate = e.target.value;
                            setEducations(newEdu);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">GPA (optional)</Label>
                        <Input
                          placeholder="e.g. 3.8/4.0"
                          value={edu.gpa}
                          onChange={(e) => {
                            const newEdu = [...educations];
                            newEdu[idx].gpa = e.target.value;
                            setEducations(newEdu);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddEducation}
                  className="w-full gap-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl py-5 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Education Background
                </Button>
              </div>
            )}

            {/* Certifications Step */}
            {currentStep === 'certifications' && (
              <div className="space-y-5 animate-fade-slide-up">
                {certifications.map((cert, idx) => (
                  <div key={cert.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-5 bg-slate-50/50 dark:bg-white/5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Certification #{idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCertifications(certifications.filter((c) => c.id !== cert.id))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-2.5 h-8"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5 inline" /> Delete Certification
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Certification Name *</Label>
                        <Input
                          placeholder="AWS Solutions Architect"
                          value={cert.name}
                          onChange={(e) => {
                            const newCert = [...certifications];
                            newCert[idx].name = e.target.value;
                            setCertifications(newCert);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Issuing Organization *</Label>
                        <Input
                          placeholder="Amazon Web Services"
                          value={cert.issuer}
                          onChange={(e) => {
                            const newCert = [...certifications];
                            newCert[idx].issuer = e.target.value;
                            setCertifications(newCert);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Issue Date</Label>
                        <Input
                          placeholder="e.g. Aug 2024"
                          value={cert.date}
                          onChange={(e) => {
                            const newCert = [...certifications];
                            newCert[idx].date = e.target.value;
                            setCertifications(newCert);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Credential URL</Label>
                        <Input
                          placeholder="https://..."
                          value={cert.link}
                          onChange={(e) => {
                            const newCert = [...certifications];
                            newCert[idx].link = e.target.value;
                            setCertifications(newCert);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddCertification}
                  className="w-full gap-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl py-5 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Certification
                </Button>
              </div>
            )}

            {/* Achievements Step */}
            {currentStep === 'achievements' && (
              <div className="space-y-4 animate-fade-slide-up">
                <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Achievements (add major milestones and quantified successes)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={achievementInput}
                    onChange={(e) => setAchievementInput(e.target.value)}
                    placeholder="e.g., Increased system performance by 40% using memory caching."
                    className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (achievementInput.trim()) {
                        setAchievements([...achievements, achievementInput.trim()]);
                        setAchievementInput('');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 rounded-lg"
                  >
                    Add
                  </Button>
                </div>
                <ul className="space-y-2 mt-4">
                  {achievements.map((ach, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 shadow-sm">
                      <span>{ach}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAchievements(achievements.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg px-2 h-7"
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Languages Step */}
            {currentStep === 'languages' && (
              <div className="space-y-4 animate-fade-slide-up">
                {languages.map((lang, idx) => (
                  <div key={idx} className="border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-slate-50/50 dark:bg-white/5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Language #{idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLanguages(languages.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg h-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Language *</Label>
                        <Input
                          placeholder="e.g. Spanish"
                          value={lang.language}
                          onChange={(e) => {
                            const newLangs = [...languages];
                            newLangs[idx].language = e.target.value;
                            setLanguages(newLangs);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Proficiency *</Label>
                        <Input
                          placeholder="e.g. Native, Fluent, Conversational"
                          value={lang.proficiency}
                          onChange={(e) => {
                            const newLangs = [...languages];
                            newLangs[idx].proficiency = e.target.value;
                            setLanguages(newLangs);
                          }}
                          className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddLanguage}
                  className="w-full gap-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl py-5 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Language
                </Button>
              </div>
            )}

            {/* References Step */}
            {currentStep === 'references' && (
              <div className="space-y-4 animate-fade-slide-up">
                {references.map((ref, idx) => (
                  <div key={ref.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-slate-50/50 dark:bg-white/5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Reference #{idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReferences(references.filter((r) => r.id !== ref.id))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg h-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        id={`available-${ref.id}`}
                        checked={ref.availableOnRequest}
                        onChange={(e) => {
                          const newRefs = [...references];
                          newRefs[idx].availableOnRequest = e.target.checked;
                          setReferences(newRefs);
                        }}
                        className="w-4 h-4 rounded text-blue-650 focus:ring-blue-500 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                      />
                      <label htmlFor={`available-${ref.id}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300">Available on request</label>
                    </div>
                    {!ref.availableOnRequest && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Name *</Label>
                          <Input
                            placeholder="e.g. Jane Doe"
                            value={ref.name}
                            onChange={(e) => {
                              const newRefs = [...references];
                              newRefs[idx].name = e.target.value;
                              setReferences(newRefs);
                            }}
                            className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                          />
                        </div>
                        <div>
                          <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Company</Label>
                          <Input
                            placeholder="e.g. Acme Corp"
                            value={ref.company}
                            onChange={(e) => {
                              const newRefs = [...references];
                              newRefs[idx].company = e.target.value;
                              setReferences(newRefs);
                            }}
                            className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                          />
                        </div>
                        <div>
                          <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Title / Position</Label>
                          <Input
                            placeholder="e.g. Engineering Manager"
                            value={ref.title}
                            onChange={(e) => {
                              const newRefs = [...references];
                              newRefs[idx].title = e.target.value;
                              setReferences(newRefs);
                            }}
                            className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                          />
                        </div>
                        <div>
                          <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Email</Label>
                          <Input
                            type="email"
                            placeholder="jane.doe@example.com"
                            value={ref.email}
                            onChange={(e) => {
                              const newRefs = [...references];
                              newRefs[idx].email = e.target.value;
                              setReferences(newRefs);
                            }}
                            className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                          />
                        </div>
                        <div>
                          <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Phone</Label>
                          <Input
                            placeholder="e.g. +1 (555) 019-2834"
                            value={ref.phone}
                            onChange={(e) => {
                              const newRefs = [...references];
                              newRefs[idx].phone = e.target.value;
                              setReferences(newRefs);
                            }}
                            className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddReference}
                  className="w-full gap-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl py-5 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Reference
                </Button>
              </div>
            )}

            {/* Custom Sections Step */}
            {currentStep === 'custom' && (
              <div className="space-y-6 animate-fade-slide-up">
                {customSections.map((sect, sectIdx) => (
                  <div key={sect.id} className="border border-slate-200 dark:border-white/10 rounded-xl p-5 space-y-4 bg-slate-50/50 dark:bg-white/5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="w-full sm:w-2/3">
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Section Title *</Label>
                        <Input
                          placeholder="e.g. Volunteer Work, Publications"
                          value={sect.title}
                          className="font-bold text-slate-900 dark:text-slate-100 rounded-lg mt-1 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                          onChange={(e) => {
                            const list = [...customSections];
                            list[sectIdx].title = e.target.value;
                            setCustomSections(list);
                          }}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomSections(customSections.filter((s) => s.id !== sect.id))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg h-9 mt-4 sm:mt-6 px-3 border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5 inline" /> Delete Section
                      </Button>
                    </div>

                    <div className="space-y-4 pt-2">
                      <Label className="text-xs font-bold text-slate-500 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">Items in Section</Label>
                      {sect.items.map((item: any, itemIdx: number) => (
                        <div key={item.id} className="border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-405">Item #{itemIdx + 1}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const list = [...customSections];
                                list[sectIdx].items = list[sectIdx].items.filter((i: any) => i.id !== item.id);
                                setCustomSections(list);
                              }}
                              className="text-red-400 hover:text-red-300 h-7 w-7 rounded-lg hover:bg-red-500/10 border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Item Title *</Label>
                              <Input
                                placeholder="e.g. Volunteer Coordinator"
                                value={item.title}
                                onChange={(e) => {
                                  const list = [...customSections];
                                  list[sectIdx].items[itemIdx].title = e.target.value;
                                  setCustomSections(list);
                                }}
                                className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                              />
                            </div>
                            <div>
                              <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Subtitle / Organization</Label>
                              <Input
                                placeholder="e.g. Red Cross"
                                value={item.subtitle}
                                onChange={(e) => {
                                  const list = [...customSections];
                                  list[sectIdx].items[itemIdx].subtitle = e.target.value;
                                  setCustomSections(list);
                                }}
                                className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 mt-1 text-slate-800 dark:text-slate-200"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Description</Label>
                            <Textarea
                              placeholder="Describe your role or achievements..."
                              value={item.description}
                              onChange={(e) => {
                                const list = [...customSections];
                                list[sectIdx].items[itemIdx].description = e.target.value;
                                setCustomSections(list);
                              }}
                              rows={2.5}
                              className="rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-xs leading-relaxed text-slate-800 dark:text-slate-200"
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddCustomItem(sectIdx)}
                        className="gap-1.5 rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Item
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={handleAddCustomSection}
                  className="w-full gap-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl py-5 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Section
                </Button>
              </div>
            )}

            {/* Review Step — Premium Dashboard */}
            {currentStep === 'review' && (
              <div className="space-y-6 animate-fade-slide-up">
                {/* Success banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Ready to edit!</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300/70 mt-0.5">
                      Your resume skeleton is complete with all sections filled below.
                    </p>
                  </div>
                </div>

                {/* Summary cards grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Name', value: header.name || 'Not set', icon: User },
                    { label: 'Summary', value: summary ? `${summary.slice(0, 40)}...` : 'Not set', icon: AlignLeft },
                    { label: 'Skills', value: `${skills.reduce((a, s) => a + s.skills.length, 0)} skills`, icon: Code },
                    { label: 'Experience', value: `${experiences.length} positions`, icon: Briefcase },
                    { label: 'Projects', value: `${projects.length} projects`, icon: Folder },
                    { label: 'Education', value: `${educations.length} records`, icon: GraduationCap },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/20">
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2">
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Additional sections badges */}
                <div className="flex flex-wrap gap-2">
                  {certifications.length > 0 && <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">{certifications.length} Certifications</span>}
                  {achievements.length > 0 && <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">{achievements.length} Achievements</span>}
                  {languages.length > 0 && <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">{languages.length} Languages</span>}
                  {references.length > 0 && <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">{references.length} References</span>}
                  {customSections.length > 0 && <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">{customSections.length} Custom</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons — Premium */}
        <div className="flex gap-3 justify-between items-center pt-2">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 'header'}
            className="gap-2 rounded-xl border-slate-200 bg-white/80 px-6 py-5 font-bold text-slate-700 shadow-sm hover:bg-white hover:shadow-md disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep !== 'review' ? (
            <Button
              onClick={handleNextStep}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold gap-2 px-8 py-5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-200"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold gap-2 px-8 py-5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4" />
              Continue to Live Editor
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
