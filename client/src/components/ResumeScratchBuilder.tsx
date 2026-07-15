import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ParsedResume, Experience, Education } from '@shared/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import {
  User,
  AlignLeft,
  Briefcase,
  GraduationCap,
  Code,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ResumeScratchBuilderProps {
  onComplete: (data: any) => void;
  prefilledRole?: string;
  prefilledCountryCode?: string;
}

interface SkillFormItem {
  category: string;
  skillsText: string;
}

const sections = [
  { id: 'contact', label: 'Contact Info', icon: User },
  { id: 'summary', label: 'Summary', icon: AlignLeft },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Code },
] as const;

export default function ResumeScratchBuilder({ onComplete }: ResumeScratchBuilderProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
  });

  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<SkillFormItem[]>([{ category: '', skillsText: '' }]);
  const [openSection, setOpenSection] = useState<string>('contact');
  const [mobileStep, setMobileStep] = useState(0);

  const currentSectionId = isMobile ? sections[mobileStep].id : openSection;
  const currentIndex = sections.findIndex(s => s.id === currentSectionId);
  const isLast = currentIndex === sections.length - 1;

  const isSectionComplete = (id: string) => {
    switch (id) {
      case 'contact': return !!(contactInfo.name.trim() && contactInfo.email.trim());
      case 'summary': return !!summary.trim();
      case 'experience': return experiences.length > 0 && experiences.some(e => e.company.trim() && e.role.trim());
      case 'education': return educations.length > 0 && educations.some(e => e.institution.trim() && e.degree.trim());
      case 'skills': return skills.length > 0 && skills.some(s => s.category.trim() && s.skillsText.trim());
      default: return false;
    }
  };

  const handlePrev = () => {
    if (isMobile) {
      if (mobileStep > 0) setMobileStep(mobileStep - 1);
    } else {
      const idx = sections.findIndex(s => s.id === openSection);
      if (idx > 0) setOpenSection(sections[idx - 1].id);
    }
  };

  const handleNext = () => {
    if (isMobile) {
      if (mobileStep < sections.length - 1) setMobileStep(mobileStep + 1);
    } else {
      const idx = sections.findIndex(s => s.id === openSection);
      if (idx < sections.length - 1) setOpenSection(sections[idx + 1].id);
    }
  };

  const handleFinish = () => {
    if (!contactInfo.name.trim() || !contactInfo.email.trim()) {
      toast.error('Please fill in your name and email.');
      return;
    }

    const payload: ParsedResume = {
      header: {
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        location: contactInfo.location,
        links: contactInfo.linkedin ? [{ label: 'LinkedIn', url: contactInfo.linkedin }] : [],
      },
      summary,
      skills: skills
        .filter(s => s.category.trim())
        .map(s => ({
          category: s.category,
          skills: s.skillsText.split(',').map(x => x.trim()).filter(Boolean),
        })),
      experiences,
      projects: [],
      educations,
      certifications: [],
    };

    onComplete(payload);
  };

  const renderContactInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={contactInfo.name}
            onChange={e => setContactInfo({ ...contactInfo, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={contactInfo.email}
            onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="+1 (555) 000-0000"
            value={contactInfo.phone}
            onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="New York, NY"
            value={contactInfo.location}
            onChange={e => setContactInfo({ ...contactInfo, location: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="linkedin">LinkedIn URL</Label>
          <Input
            id="linkedin"
            placeholder="linkedin.com/in/username"
            value={contactInfo.linkedin}
            onChange={e => setContactInfo({ ...contactInfo, linkedin: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-2">
      <Label htmlFor="summary">Professional Summary</Label>
      <Textarea
        id="summary"
        placeholder="Write a compelling professional summary..."
        value={summary}
        onChange={e => setSummary(e.target.value)}
        rows={5}
      />
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-4">
      {experiences.map((exp, idx) => (
        <div key={exp.id} className="border border-border rounded-lg p-4 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Experience #{idx + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => setExperiences(experiences.filter(e => e.id !== exp.id))}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                placeholder="Company name"
                value={exp.company}
                onChange={e => {
                  const upd = [...experiences];
                  upd[idx].company = e.target.value;
                  setExperiences(upd);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                placeholder="Job title"
                value={exp.role}
                onChange={e => {
                  const upd = [...experiences];
                  upd[idx].role = e.target.value;
                  setExperiences(upd);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                placeholder="Jan 2022"
                value={exp.startDate}
                onChange={e => {
                  const upd = [...experiences];
                  upd[idx].startDate = e.target.value;
                  setExperiences(upd);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                placeholder="Present"
                value={exp.endDate || ''}
                disabled={exp.current}
                onChange={e => {
                  const upd = [...experiences];
                  upd[idx].endDate = e.target.value;
                  setExperiences(upd);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`current-${exp.id}`}
              checked={exp.current}
              onChange={e => {
                const upd = [...experiences];
                upd[idx].current = e.target.checked;
                if (e.target.checked) upd[idx].endDate = 'Present';
                setExperiences(upd);
              }}
              className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary"
            />
            <Label htmlFor={`current-${exp.id}`} className="text-sm">Currently work here</Label>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe your responsibilities (one per line)..."
              value={exp.description.join('\n')}
              onChange={e => {
                const upd = [...experiences];
                upd[idx].description = e.target.value.split('\n').filter(Boolean);
                setExperiences(upd);
              }}
              rows={3}
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() => setExperiences([...experiences, { id: nanoid(), company: '', role: '', startDate: '', endDate: '', current: false, description: [] }])}
        className="w-full gap-2 border-dashed"
      >
        <Plus className="w-4 h-4" />
        Add another
      </Button>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-4">
      {educations.map((edu, idx) => (
        <div key={edu.id} className="border border-border rounded-lg p-4 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Education #{idx + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => setEducations(educations.filter(e => e.id !== edu.id))}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input
                placeholder="University name"
                value={edu.institution}
                onChange={e => {
                  const upd = [...educations];
                  upd[idx].institution = e.target.value;
                  setEducations(upd);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Degree</Label>
              <Input
                placeholder="Bachelor of Science"
                value={edu.degree}
                onChange={e => {
                  const upd = [...educations];
                  upd[idx].degree = e.target.value;
                  setEducations(upd);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Field of Study</Label>
              <Input
                placeholder="Computer Science"
                value={edu.field}
                onChange={e => {
                  const upd = [...educations];
                  upd[idx].field = e.target.value;
                  setEducations(upd);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Graduation Date</Label>
              <Input
                placeholder="May 2023"
                value={edu.graduationDate}
                onChange={e => {
                  const upd = [...educations];
                  upd[idx].graduationDate = e.target.value;
                  setEducations(upd);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>GPA</Label>
              <Input
                placeholder="3.8/4.0"
                value={edu.gpa || ''}
                onChange={e => {
                  const upd = [...educations];
                  upd[idx].gpa = e.target.value;
                  setEducations(upd);
                }}
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() => setEducations([...educations, { id: nanoid(), institution: '', degree: '', field: '', graduationDate: '', gpa: '' }])}
        className="w-full gap-2 border-dashed"
      >
        <Plus className="w-4 h-4" />
        Add another
      </Button>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-4">
      {skills.map((skill, idx) => (
        <div key={idx} className="border border-border rounded-lg p-4 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Category #{idx + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => setSkills(skills.filter((_, i) => i !== idx))}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input
              placeholder="e.g. Frontend"
              value={skill.category}
              onChange={e => {
                const upd = [...skills];
                upd[idx].category = e.target.value;
                setSkills(upd);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Skills (comma-separated)</Label>
            <Textarea
              placeholder="React, TypeScript, Tailwind CSS"
              value={skill.skillsText}
              onChange={e => {
                const upd = [...skills];
                upd[idx].skillsText = e.target.value;
                setSkills(upd);
              }}
              rows={2}
            />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() => setSkills([...skills, { category: '', skillsText: '' }])}
        className="w-full gap-2 border-dashed"
      >
        <Plus className="w-4 h-4" />
        Add another
      </Button>
    </div>
  );

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'contact': return renderContactInfo();
      case 'summary': return renderSummary();
      case 'experience': return renderExperience();
      case 'education': return renderEducation();
      case 'skills': return renderSkills();
      default: return null;
    }
  };

  if (isMobile) {
    const SectionIcon = sections[mobileStep].icon;
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SectionIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{sections[mobileStep].label}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(((mobileStep + 1) / sections.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${((mobileStep + 1) / sections.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          {renderSectionContent(sections[mobileStep].id)}
        </div>
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={mobileStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {isLast ? (
            <Button onClick={handleFinish}>
              Finish
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isOpen = openSection === section.id;
        const complete = isSectionComplete(section.id);
        const Icon = section.icon;
        return (
          <div key={section.id} className="border border-border rounded-lg overflow-hidden transition-all duration-300">
            <button
              onClick={() => setOpenSection(isOpen ? null : section.id)}
              className="flex items-center justify-between w-full px-6 py-4 bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">{section.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {complete && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="p-6 border-t border-border bg-background space-y-4">
                {renderSectionContent(section.id)}
              </div>
            </div>
          </div>
        );
      })}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={openSection === sections[0].id}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        {openSection === sections[sections.length - 1].id ? (
          <Button onClick={handleFinish}>
            Finish
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
