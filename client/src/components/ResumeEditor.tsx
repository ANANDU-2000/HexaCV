import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, Eye, EyeOff, Edit3, Settings, Undo, Redo, ZoomIn, ZoomOut, 
  Sparkles, CheckCircle2, AlertTriangle, Plus, Trash2, ArrowUp, ArrowDown,
  User, AlignLeft, Code, Briefcase, Folder, GraduationCap, Award, Trophy,
  PanelLeft, PanelLeftClose, Globe, Users, LayoutList, ChevronLeft, ChevronRight,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Resume, TemplateId, ParsedResume, ResumeSection } from '@shared/types';
import { PRESET_JOBS, matchPresetJobByTitle } from '@/lib/jobDescriptions';
import { ensureStandardResumeSections } from '@/lib/resumeSections';
import ResumePreview from './ResumePreview';
import CountryLocationFields from './CountryLocationFields';
import { exportResumeToPDF, exportResumeToDOCX } from '@/lib/pdfExport';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { trpc } from '@/lib/trpc';

const WIZARD_STEPS = [
  { id: 1, label: 'Header', key: 'header', icon: User },
  { id: 2, label: 'Summary', key: 'summary', icon: AlignLeft },
  { id: 3, label: 'Skills', key: 'skills', icon: Code },
  { id: 4, label: 'Experience', key: 'experience', icon: Briefcase },
  { id: 5, label: 'Projects', key: 'projects', icon: Folder },
  { id: 6, label: 'Education', key: 'education', icon: GraduationCap },
  { id: 7, label: 'Credentials', key: 'certifications', icon: Award },
  { id: 8, label: 'Achievements', key: 'achievements', icon: Trophy },
  { id: 9, label: 'Languages', key: 'languages', icon: Globe },
  { id: 10, label: 'References', key: 'references', icon: Users },
  { id: 11, label: 'Custom', key: 'custom', icon: LayoutList },
  { id: 12, label: 'Layout', key: 'layout', icon: Settings },
  { id: 13, label: 'Review & Export', key: 'review', icon: CheckCircle2 },
  { id: 14, label: 'Live Preview', key: 'preview', icon: Eye },
];

const FORM_STEPS = WIZARD_STEPS.slice(0, 12);
const EDITOR_FLOW_STEPS = WIZARD_STEPS.filter((step) => step.key !== 'preview');

interface ResumeEditorProps {
  resume: Resume;
  onUpdate: (resume: Resume) => void;
}

export default function ResumeEditor({ resume, onUpdate }: ResumeEditorProps) {
  const [localResume, setLocalResume] = useState<Resume>(resume);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(resume.templateId as TemplateId);
  const [selectedJob, setSelectedJob] = useState<string>(resume.jobDescriptionId || '');
  const [activeEditTab, setActiveEditTab] = useState<string>('header');
  const [isRewritingSummary, setIsRewritingSummary] = useState<boolean>(false);
  const [rewritingExpId, setRewritingExpId] = useState<string | null>(null);
  const improveSummaryMutation = trpc.ai.improveSummary.useMutation();
  const improveBulletsMutation = trpc.ai.improveBullets.useMutation();

  // Auto-select target job from parsed job title / target role when not already set
  useEffect(() => {
    if (selectedJob) return;
    const headerSec = resume.sections.find(s => s.type === 'header');
    const headerVal = (headerSec?.content.header || {}) as any;
    const matched = matchPresetJobByTitle(headerVal.jobTitle, headerVal.targetRole);
    if (matched) {
      setSelectedJob(matched);
    }
  }, [resume.id]);
  const [zoom, setZoom] = useState<number>(100);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const exportPreviewRef = useRef<HTMLDivElement>(null);

  // Scrollbar and navigation state for horizontal stepper
  const stepperRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollLimits = () => {
    const el = stepperRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < maxScroll - 2);
  };

  useEffect(() => {
    const el = stepperRef.current;
    if (!el) return;
    
    checkScrollLimits();
    const observer = new ResizeObserver(() => {
      checkScrollLimits();
    });
    observer.observe(el);
    el.addEventListener('scroll', checkScrollLimits);
    
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', checkScrollLimits);
    };
  }, []);

  const scrollLeftDirection = () => {
    const el = stepperRef.current;
    if (el) {
      el.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRightDirection = () => {
    const el = stepperRef.current;
    if (el) {
      el.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Auto-scroll active tab into view when activeEditTab changes (with layout delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeEl = stepperRef.current?.querySelector(`[data-step-key="${activeEditTab}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeEditTab]);

  useEffect(() => {
    if (activeEditTab === 'preview' && window.innerWidth < 640 && zoom > 45) {
      setZoom(42);
    }
  }, [activeEditTab, zoom]);

  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [atsRules, setAtsRules] = useState<any>(null);

  const headerContent = (localResume.sections.find(s => s.type === 'header')?.content.header || {}) as any;
  const currentCountry = headerContent.countryCode || '';
  const targetCountry = headerContent.targetCountryCode || '';

  useEffect(() => {
    fetch('/countries')
      .then(res => res.ok ? res.json() : [])
      .then(data => setCountriesList(data))
      .catch(err => console.error('Error fetching countries in ResumeEditor:', err));
  }, []);

  useEffect(() => {
    if (!currentCountry || !targetCountry) {
      setAtsRules(null);
      return;
    }
    fetch(`/country-ats-rules/${currentCountry}/${targetCountry}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setAtsRules(data))
      .catch(err => console.error('Error fetching ATS rules in ResumeEditor:', err));
  }, [currentCountry, targetCountry]);

  // Validation helpers
  const isValidEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      let testUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        testUrl = 'https://' + url;
      }
      new URL(testUrl);
      return true;
    } catch {
      return false;
    }
  };

  const isValidPhone = (phone: string) => {
    if (!phone) return true;
    return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/.test(phone);
  };

  // History stack for Undo/Redo
  const [history, setHistory] = useState<Resume[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep localResume in sync with outside resume (e.g. from parent initial state or undo/redo)
  useEffect(() => {
    setLocalResume(resume);
  }, [resume.id]);

  // Ensure all 10 standard resume sections exist in correct order
  useEffect(() => {
    const normalized = ensureStandardResumeSections(resume);
    const orderChanged = normalized.sections.some(
      (s, i) => s.type !== resume.sections[i]?.type || s.order !== resume.sections[i]?.order
    );
    const missingSection = normalized.sections.length !== resume.sections.length;
    if (orderChanged || missingSection) {
      onUpdate(normalized);
      setLocalResume(normalized);
    }
  }, [resume.id]);

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      setHistory([resume]);
      setHistoryIndex(0);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Debounced helper to push to history
  const pushToHistory = (updated: Resume) => {
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    historyTimeoutRef.current = setTimeout(() => {
      setHistory((prevHistory) => {
        const nextHistory = prevHistory.slice(0, historyIndex + 1);
        const lastEntry = nextHistory[nextHistory.length - 1];
        if (lastEntry && JSON.stringify(lastEntry.sections) === JSON.stringify(updated.sections)) {
          return prevHistory;
        }
        setHistoryIndex(nextHistory.length);
        return [...nextHistory, updated];
      });
    }, 800);
  };

  // Update local resume data immediately and parent data after 1.5s debounce
  const updateResumeData = (updated: Resume) => {
    setLocalResume(updated);
    setAutoSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(updated);
      pushToHistory(updated);
      setAutoSaveStatus('saved');
    }, 1500);
  };

  // Vertical tabs mapping
  const formSections = [
    { id: 'header', label: 'Contact Info', icon: User },
    { id: 'summary', label: 'Summary', icon: AlignLeft },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
  ];

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      const prev = history[nextIndex];
      setLocalResume(prev);
      onUpdate(prev);
      toast.success('Undo successful');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const next = history[nextIndex];
      setLocalResume(next);
      onUpdate(next);
      toast.success('Redo successful');
    }
  };

  const handleExportPDF = async () => {
    const element = exportPreviewRef.current;
    if (!element) {
      toast.error('Failed to prepare resume preview. Please try again.');
      return;
    }
    toast.info('Exporting resume to PDF...');
    try {
      await exportResumeToPDF(element, `${localResume.title || 'resume'}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export PDF.');
    }
  };

  const handleExportDOCX = async () => {
    const element = exportPreviewRef.current;
    if (!element) {
      toast.error('Failed to prepare resume preview. Please try again.');
      return;
    }
    toast.info('Exporting resume to Word document...');
    try {
      await exportResumeToDOCX(element, `${localResume.title || 'resume'}.doc`);
      toast.success('Word document downloaded successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export DOCX.');
    }
  };

  // ATS engine score calculation
  const getResumeTextContent = (): string => {
    let text = '';
    localResume.sections.forEach((sec) => {
      if (!sec.visible) return;
      if (sec.type === 'header' && sec.content.header) {
        const h = sec.content.header;
        text += ` ${h.name} ${h.email} ${h.phone} ${h.location}`;
      } else if (sec.type === 'summary' && sec.content.summary) {
        text += ` ${sec.content.summary}`;
      } else if (sec.type === 'skills' && sec.content.skills) {
        sec.content.skills.forEach(g => {
          text += ` ${g.category} ${g.skills.join(' ')}`;
        });
      } else if (sec.type === 'experience' && sec.content.experiences) {
        sec.content.experiences.forEach(e => {
          text += ` ${e.role} ${e.company} ${e.description.join(' ')}`;
        });
      } else if (sec.type === 'projects' && sec.content.projects) {
        sec.content.projects.forEach(p => {
          text += ` ${p.name} ${p.description} ${p.technologies.join(' ')}`;
        });
      } else if (sec.type === 'education' && sec.content.educations) {
        sec.content.educations.forEach(edu => {
          text += ` ${edu.institution} ${edu.degree} ${edu.field}`;
        });
      } else if (sec.type === 'certifications' && sec.content.certifications) {
        sec.content.certifications.forEach(c => {
          text += ` ${c.name} ${c.issuer}`;
        });
      } else if (sec.type === 'languages' && sec.content.languages) {
        sec.content.languages.forEach(l => {
          text += ` ${l.language} ${l.proficiency}`;
        });
      } else if (sec.type === 'references' && sec.content.references) {
        sec.content.references.forEach(r => {
          text += ` ${r.name} ${r.company} ${r.title} ${r.email}`;
        });
      } else if (sec.type === 'custom' && sec.content.customSections) {
        sec.content.customSections.forEach(s => {
          text += ` ${s.title}`;
          s.items.forEach(i => {
            text += ` ${i.title} ${i.subtitle} ${i.description}`;
          });
        });
      }
    });
    return text.toLowerCase();
  };

  const calculateATSScore = () => {
    const resumeText = getResumeTextContent();
    const activeJob = PRESET_JOBS.find(j => j.id === selectedJob);

    let keywordScore = 0;
    let completenessScore = 0;
    let readabilityScore = 80; // base score

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    // 1. Keyword match - combine job keywords with target country ATS keywords
    const jobKeywords = activeJob ? [...activeJob.keywords] : [];
    let regionalKeywords: string[] = [];
    if (atsRules) {
      const parsedKeywords = typeof atsRules.keywords === 'string'
        ? JSON.parse(atsRules.keywords)
        : atsRules.keywords;
      if (Array.isArray(parsedKeywords)) {
        regionalKeywords = parsedKeywords;
      }
    }
    const allKeywordsToCheck = Array.from(new Set([...jobKeywords, ...regionalKeywords]));

    if (allKeywordsToCheck.length > 0) {
      allKeywordsToCheck.forEach(keyword => {
        if (resumeText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        } else {
          missingKeywords.push(keyword);
        }
      });
      keywordScore = Math.round((matchedKeywords.length / allKeywordsToCheck.length) * 100);
    } else {
      keywordScore = 100; // No keywords to check
    }

    // 2. Completeness score
    const importantSections = ['header', 'summary', 'skills', 'experience', 'education'];
    let filledCount = 0;
    importantSections.forEach(type => {
      const sec = localResume.sections.find(s => s.type === type);
      if (sec && sec.visible) {
        if (type === 'header' && sec.content.header?.name) filledCount++;
        if (type === 'summary' && sec.content.summary) filledCount++;
        if (type === 'skills' && sec.content.skills && sec.content.skills.length > 0) filledCount++;
        if (type === 'experience' && sec.content.experiences && sec.content.experiences.length > 0) filledCount++;
        if (type === 'education' && sec.content.educations && sec.content.educations.length > 0) filledCount++;
      }
    });
    completenessScore = Math.round((filledCount / importantSections.length) * 100);

    // 3. Readability & Formatting
    if (selectedTemplate === 'technical-compact') readabilityScore = 85;
    if (selectedTemplate === 'classic-ats-blue') readabilityScore = 90;

    // 4. Localization Validation & regional hiring alignment checks
    const locationErrors: string[] = [];
    let phoneFormatError = '';

    const headerSec = localResume.sections.find(s => s.type === 'header');
    const headerVal = (headerSec?.content.header || {}) as any;
    const fields = (headerVal.locationFields || {}) as any;
    const targetCode = headerVal.targetCountryCode;
    const currentCode = headerVal.countryCode;

    if (targetCode && countriesList.length > 0) {
      const targetC = countriesList.find(c => c.code === targetCode);
      if (targetC) {
        const expectedFields = targetC.locationFields || [];
        const hasState = expectedFields.some((f: any) => f.key === 'state');
        const hasDistrict = expectedFields.some((f: any) => f.key === 'district');
        const hasEmirate = expectedFields.some((f: any) => f.key === 'emirate');
        const hasCounty = expectedFields.some((f: any) => f.key === 'county');
        const hasPostal = expectedFields.some((f: any) => f.key === 'postalCode');

        if (hasState && !fields.state) {
          locationErrors.push(`Missing State for target country ${targetC.name}.`);
        }
        if (hasDistrict && !fields.district) {
          locationErrors.push(`Missing District for target country ${targetC.name}.`);
        }
        if (hasEmirate && !fields.emirate) {
          locationErrors.push(`Missing Emirate for target country ${targetC.name}.`);
        }
        if (hasCounty && !fields.county) {
          locationErrors.push(`Missing County for target country ${targetC.name}.`);
        }
        if (!fields.city) {
          locationErrors.push(`Missing City for target country ${targetC.name}.`);
        }
        if (hasPostal) {
          if (!fields.postalCode) {
            locationErrors.push(`Missing ${targetC.postalCodeLabel || 'Postal Code'} for target country ${targetC.name}.`);
          } else if (targetC.code === 'US' && !/^\d{5}(-\d{4})?$/.test(fields.postalCode)) {
            locationErrors.push(`ZIP Code format invalid for United States (expected 5 digits).`);
          } else if (targetC.code === 'IN' && !/^\d{6}$/.test(fields.postalCode)) {
            locationErrors.push(`PIN Code format invalid for India (expected 6 digits).`);
          }
        }
      }
    }

    if (currentCode && headerVal.phone && countriesList.length > 0) {
      const currentC = countriesList.find(c => c.code === currentCode);
      if (currentC && currentC.phoneRegex) {
        const num = headerVal.phone;
        const dial = currentC.dialCode;
        const localNum = num.startsWith(dial) ? num.slice(dial.length).trim() : num.trim();
        if (localNum) {
          const regex = new RegExp(currentC.phoneRegex);
          if (!regex.test(localNum)) {
            phoneFormatError = `Phone number doesn't match expected pattern for ${currentC.name}: ${currentC.phoneFormat}`;
          }
        }
      }
    }

    // Apply score deductions for formatting errors
    if (locationErrors.length > 0) {
      readabilityScore = Math.max(50, readabilityScore - 10);
    }
    if (phoneFormatError) {
      readabilityScore = Math.max(50, readabilityScore - 5);
    }

    const overallScore = activeJob || regionalKeywords.length > 0
      ? Math.round(keywordScore * 0.5 + completenessScore * 0.3 + readabilityScore * 0.2)
      : Math.round(completenessScore * 0.7 + readabilityScore * 0.3);

    // Improvement suggestions
    const suggestions: string[] = [];
    if (missingKeywords.length > 0) {
      suggestions.push(`Add missing keywords: ${missingKeywords.slice(0, 4).join(', ')}`);
    }
    if (completenessScore < 100) {
      suggestions.push('Complete empty core sections (Header, Summary, Experience, Education)');
    }
    if (!selectedJob && regionalKeywords.length === 0) {
      suggestions.push('Select a target job description to get tailored keyword suggestions.');
    }

    // Add target country warnings
    locationErrors.forEach(err => suggestions.push(err));
    if (phoneFormatError) {
      suggestions.push(phoneFormatError);
    }

    // Add regional hiring expectations as tips
    if (atsRules?.regionalHiringExpectations) {
      suggestions.push(`Hiring market tips for ${countriesList.find(c => c.code === targetCountry)?.name || targetCountry}: ${atsRules.regionalHiringExpectations}`);
    }
    if (atsRules?.preferredFormatting) {
      suggestions.push(`Preferred layout for ${countriesList.find(c => c.code === targetCountry)?.name || targetCountry}: ${atsRules.preferredFormatting}`);
    }

    return {
      score: overallScore,
      matchedKeywords,
      missingKeywords,
      suggestions,
      completenessScore,
    };
  };

  const atsSummary = calculateATSScore();

  // Handlers for updating specific resume sections
  const updateSection = (type: string, fields: any) => {
    const updatedSections = localResume.sections.map((sec) => {
      if (sec.type === type) {
        return {
          ...sec,
          content: {
            ...sec.content,
            ...fields,
          },
        };
      }
      return sec;
    });
    updateResumeData({ ...localResume, sections: updatedSections });
  };

  const getSectionContent = (type: string): any => {
    return localResume.sections.find((s) => s.type === type)?.content || {};
  };

  // Check section completeness for stepper checklist icons
  const isStepCompleted = (stepKey: string): boolean => {
    switch (stepKey) {
      case 'header': {
        const h = getSectionContent('header').header || {};
        return !!(h.name?.trim() && h.email?.trim());
      }
      case 'summary':
        return !!getSectionContent('summary').summary?.trim();
      case 'skills': {
        const s = getSectionContent('skills').skills || [];
        return s.length > 0 && s.some((g: any) => g.skills && g.skills.length > 0);
      }
      case 'experience': {
        const e = getSectionContent('experience').experiences || [];
        return e.length > 0 && e.some((x: any) => x.company?.trim() && x.role?.trim());
      }
      case 'projects': {
        const p = getSectionContent('projects').projects || [];
        return p.length > 0 && p.some((pr: any) => pr.name?.trim());
      }
      case 'education': {
        const edu = getSectionContent('education').educations || [];
        return edu.length > 0 && edu.some((ed: any) => ed.institution?.trim() && ed.degree?.trim());
      }
      case 'certifications': {
        const cert = getSectionContent('certifications').certifications || [];
        return cert.length > 0 && cert.some((c: any) => c.name?.trim());
      }
      case 'achievements': {
        const ach = getSectionContent('achievements').achievements || [];
        return ach.length > 0;
      }
      case 'languages': {
        const lang = getSectionContent('languages').languages || [];
        return lang.length > 0 && lang.some((l: any) => l.language?.trim());
      }
      case 'references': {
        const ref = getSectionContent('references').references || [];
        return ref.length > 0;
      }
      case 'custom': {
        const cust = getSectionContent('custom').customSections || [];
        return cust.length > 0 && cust.some((c: any) => c.title?.trim());
      }
      case 'layout':
      case 'preview':
      case 'review':
        return true; // Always considered complete
      default:
        return false;
    }
  };

  // Reorder list items (experience, project, education, language, reference, etc.)
  const moveItem = (sectionType: string, index: number, direction: 'up' | 'down') => {
    const content = getSectionContent(sectionType);
    let listKey = '';
    if (sectionType === 'experience') listKey = 'experiences';
    else if (sectionType === 'projects') listKey = 'projects';
    else if (sectionType === 'education') listKey = 'educations';
    else if (sectionType === 'certifications') listKey = 'certifications';
    else if (sectionType === 'languages') listKey = 'languages';
    else if (sectionType === 'references') listKey = 'references';
    else if (sectionType === 'custom') listKey = 'customSections';

    if (!listKey) return;

    const list = [...(content[listKey] || [])];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }

    updateSection(sectionType, { [listKey]: list });
  };

  // Reorder entire sections (e.g. move Skills above Summary)
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sorted = [...localResume.sections].sort((a, b) => a.order - b.order);
    if (direction === 'up' && index > 0) {
      const temp = sorted[index].order;
      sorted[index].order = sorted[index - 1].order;
      sorted[index - 1].order = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const temp = sorted[index].order;
      sorted[index].order = sorted[index + 1].order;
      sorted[index + 1].order = temp;
    }
    
    // Normalize order index
    const updated = sorted
      .sort((a, b) => a.order - b.order)
      .map((sec, idx) => ({ ...sec, order: idx }));

    updateResumeData({ ...localResume, sections: updated });
  };

  const toggleSectionVisibility = (sectionId: string) => {
    const updated = localResume.sections.map((s) => {
      if (s.id === sectionId) {
        return { ...s, visible: !s.visible };
      }
      return s;
    });
    updateResumeData({ ...localResume, sections: updated });
  };

  const handleRewriteSummary = async () => {
    const currentSummary = getSectionContent('summary').summary || '';
    const activeJob = PRESET_JOBS.find(j => j.id === selectedJob);
    const jobDescription = activeJob ? activeJob.description : '';

    if (!jobDescription) {
      toast.error('Please select a Target Job at the top right first to tailor your summary.');
      return;
    }

    if (!currentSummary.trim()) {
      toast.error('Add a professional summary from your resume before rewriting.');
      return;
    }

    setIsRewritingSummary(true);
    try {
      const headerSec = localResume.sections.find(s => s.type === 'header');
      const headerVal = (headerSec?.content.header || {}) as any;
      
      const rewritten = await improveSummaryMutation.mutateAsync({
        currentSummary,
        jobDescription,
        jobTitle: headerVal.jobTitle || headerVal.title || '',
        targetRole: headerVal.targetRole || headerVal.jobTitle || '',
        countryCode: headerVal.countryCode || '',
        targetCountryCode: headerVal.targetCountryCode || ''
      });

      if (rewritten) {
        updateSection('summary', { summary: rewritten });
        toast.success('Summary rewritten and optimized with AI!');
      }
    } catch (err: any) {
      console.error('Error rewriting summary:', err);
      toast.error(err?.message || 'Failed to rewrite summary with AI.');
    } finally {
      setIsRewritingSummary(false);
    }
  };

  const handleRewriteExperienceBullets = async (expIndex: number) => {
    const activeJob = PRESET_JOBS.find(j => j.id === selectedJob);
    const jobDescription = activeJob ? activeJob.description : '';

    if (!jobDescription) {
      toast.error('Please select a Target Job first to tailor experience bullets.');
      return;
    }

    const experiences = getSectionContent('experience').experiences || [];
    const exp = experiences[expIndex];
    if (!exp || !exp.description?.length) {
      toast.error('Add at least one bullet point before rewriting.');
      return;
    }

    const headerSec = localResume.sections.find(s => s.type === 'header');
    const headerVal = (headerSec?.content.header || {}) as any;

    setRewritingExpId(exp.id || String(expIndex));
    try {
      const improved = await improveBulletsMutation.mutateAsync({
        role: exp.role || '',
        company: exp.company || '',
        currentBullets: exp.description,
        jobDescription,
        jobTitle: headerVal.jobTitle || '',
        targetRole: headerVal.targetRole || headerVal.jobTitle || '',
        countryCode: headerVal.countryCode || '',
        targetCountryCode: headerVal.targetCountryCode || '',
      });

      const list = [...experiences];
      list[expIndex] = { ...exp, description: improved };
      updateSection('experience', { experiences: list });
      toast.success('Experience bullets rewritten using your job title and target role.');
    } catch (err: any) {
      console.error('Error rewriting bullets:', err);
      toast.error(err?.message || 'Failed to rewrite experience bullets.');
    } finally {
      setRewritingExpId(null);
    }
  };

  const activeFlowIndex = activeEditTab === 'preview'
    ? EDITOR_FLOW_STEPS.length - 1
    : Math.max(0, EDITOR_FLOW_STEPS.findIndex(s => s.key === activeEditTab));
  const isFinalFlowStep = activeEditTab === 'preview'
    || activeEditTab === EDITOR_FLOW_STEPS[EDITOR_FLOW_STEPS.length - 1].key;

  return (
    <div className="w-full h-full font-sans text-slate-800 dark:text-slate-200 pb-[72px] lg:pb-0">
      {/* Editor workspace */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(430px,560px)] gap-4 h-full min-h-0">
        <div className="w-full flex flex-col gap-2 sm:gap-3 h-full min-h-0">
        {/* Toggle Mode header on mobile, regular title + quick settings on desktop */}
        <div className={cn(
          "glass-panel border border-slate-200 dark:border-white/10 rounded-xl shadow-sm shrink-0 overflow-hidden",
          activeEditTab === 'preview' && "lg:block"
        )}>
          {/* Row 1: Title + Action Buttons */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 group/title">
                  <input 
                    type="text" 
                    value={localResume.title}
                    onChange={(e) => updateResumeData({ ...localResume, title: e.target.value })}
                    className="bg-transparent border-none p-0 m-0 font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight focus:ring-0 focus:outline-none focus:border-b focus:border-slate-350 dark:focus:border-slate-700 w-full max-w-[180px] sm:max-w-[260px] truncate"
                    placeholder="Resume Title"
                  />
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 opacity-50 group-hover/title:opacity-100 transition-opacity shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Auto-saved
                  </span>
                  <span className="text-slate-550">·</span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-550 dark:text-slate-400">
                    {activeEditTab === 'review' ? (
                      "Review & Export"
                    ) : activeEditTab === 'preview' ? (
                      "Live Preview"
                    ) : (
                      `Step ${FORM_STEPS.findIndex(s => s.key === activeEditTab) + 1}/12`
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 dark:border-white/10 rounded-lg bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo">
                <Undo className="w-3.5 h-3.5 text-slate-600 dark:text-slate-350" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 dark:border-white/10 rounded-lg bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
                <Redo className="w-3.5 h-3.5 text-slate-600 dark:text-slate-350" />
              </Button>
            </div>
          </div>
          {/* Row 2: Layout + Target Job */}
          <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100/50 dark:bg-slate-950/20">
            <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-1 px-2.5 shadow-xs">
              <Settings className="w-3 h-3 text-slate-500 dark:text-slate-500 dark:text-slate-400" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">ATS Emerald</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">Target:</span>
              <Select value={selectedJob} onValueChange={(v) => {
                setSelectedJob(v);
                updateResumeData({ ...localResume, jobDescriptionId: v });
              }}>
                <SelectTrigger id="quick-job-select" className="h-8 text-[11px] font-semibold rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 min-w-0 w-full max-w-[210px] shadow-xs">
                  <SelectValue placeholder="Select target job..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200">
                  {PRESET_JOBS.map(j => (
                    <SelectItem key={j.id} value={j.id} className="text-xs text-slate-800 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-white/10 focus:text-slate-900 dark:focus:text-white">{j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Editor Card with guided steps */}
        <Card className="glass-panel border-slate-200 dark:border-white/10 overflow-hidden flex flex-col flex-1 min-h-0 bg-slate-50/80 dark:bg-slate-900/10 shadow-sm p-0 rounded-xl">
          {/* Horizontal Stepper Progress Indicator (Visible only during editor steps 1-12) */}
          {FORM_STEPS.some(s => s.key === activeEditTab) ? (
            <div className="relative group/stepper shrink-0 w-full overflow-hidden">
              {/* Left Scroll Button */}
              <button
                type="button"
                onClick={scrollLeftDirection}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-600 dark:text-slate-350 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm",
                  canScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* Left Gradient Fade Overlay */}
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-100 dark:from-[#0b1326] via-slate-100/70 dark:via-[#0b1326]/70 to-transparent pointer-events-none z-10 transition-opacity duration-300",
                  canScrollLeft ? "opacity-100" : "opacity-0"
                )}
              />

              {/* Scrollable Steps Wrapper */}
              <div
                ref={stepperRef}
                className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth px-8 py-3 bg-slate-100/80 dark:bg-slate-950/40 backdrop-blur-sm border-b border-slate-200/50 dark:border-white/5 select-none"
              >
                {FORM_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = isStepCompleted(step.key);
                  const isActive = activeEditTab === step.key;
                  
                  return (
                    <div key={step.id} className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        data-step-key={step.key}
                        onClick={() => setActiveEditTab(step.key)}
                        className={cn(
                          "flex items-center gap-2 p-1.5 px-3 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer",
                          isActive 
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.02]" 
                            : isDone 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-500/15 dark:hover:bg-emerald-900/15" 
                              : "bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:text-slate-200"
                        )}
                      >
                        <span className={cn(
                          "w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black border",
                          isActive 
                            ? "bg-white/20 border-slate-300 dark:border-white/30 text-white" 
                            : isDone 
                              ? "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-300" 
                              : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                        )}>
                          {isDone ? '✓' : step.id}
                        </span>
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{step.label}</span>
                      </button>
                      {idx < FORM_STEPS.length - 1 && (
                        <div className={cn(
                          "w-4 h-[2px] rounded-full shrink-0",
                          isDone ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/10"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Gradient Fade Overlay */}
              <div
                className={cn(
                  "absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-100 dark:from-[#0b1326] via-slate-100/70 dark:via-[#0b1326]/70 to-transparent pointer-events-none z-10 transition-opacity duration-300",
                  canScrollRight ? "opacity-100" : "opacity-0"
                )}
              />

              {/* Right Scroll Button */}
              <button
                type="button"
                onClick={scrollRightDirection}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-md border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-600 dark:text-slate-350 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm",
                  canScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Premium Phase Tracker for review and mobile preview */
            <div className={cn(
              "items-center justify-center gap-3 py-3 bg-slate-100/80 dark:bg-slate-950/40 border-b border-slate-200/50 dark:border-white/5 select-none text-[11px] font-bold shrink-0 overflow-x-auto px-3",
              activeEditTab === 'preview' ? "hidden lg:flex" : "flex"
            )}>
              <button
                type="button"
                onClick={() => setActiveEditTab('header')}
                className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:opacity-85 transition-opacity"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-[10px] font-black">✓</span>
                <span>1. Resume Editor</span>
              </button>
              <div className="w-8 h-[2px] bg-emerald-500" />
              
              <button
                type="button"
                onClick={() => setActiveEditTab('review')}
                className={cn(
                  "flex items-center gap-2 transition-opacity hover:opacity-85",
                  activeEditTab === 'review' 
                    ? "text-blue-600 dark:text-blue-450" 
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                  activeEditTab === 'review'
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                )}>
                  {activeEditTab === 'review' ? '2' : '✓'}
                </span>
                <span>2. Review & Export</span>
              </button>
              <div className={cn(
                "w-8 h-[2px] lg:hidden",
                activeEditTab === 'preview' ? "bg-emerald-500" : "bg-slate-350 dark:bg-white/10"
              )} />

              <button
                type="button"
                onClick={() => setActiveEditTab('preview')}
                className={cn(
                  "flex items-center gap-2 transition-opacity hover:opacity-85 lg:hidden",
                  activeEditTab === 'preview' 
                    ? "text-blue-600 dark:text-blue-455" 
                    : "text-slate-450 dark:text-slate-400"
                )}
              >
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                  activeEditTab === 'preview'
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                )}>
                  3
                </span>
                <span>3. Live Preview</span>
              </button>
            </div>
          )}
          
          <div className={cn(
            "flex-1 overflow-y-auto h-full min-h-0",
            activeEditTab === 'preview' ? "px-0 py-0 sm:px-5 sm:py-4" : "px-4 sm:px-5 py-4"
          )}>
            <Tabs value={activeEditTab} onValueChange={setActiveEditTab} className="w-full h-full">


                {/* HEADER TAB */}
                <TabsContent value="header" className="space-y-5">
                  <div className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Contact Information</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">Your name, title, and contact details that appear at the top of your resume.</p>
                    </div>
                  </div>
                  <div className="grid resume-editor-grid-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name <span className="text-red-400">*</span></Label>
                      <Input
                        id="edit-name"
                        placeholder="e.g. John Doe"
                        className="h-10 rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500 text-sm"
                        value={getSectionContent('header').header?.name || ''}
                        onChange={(e) => updateSection('header', {
                          header: { ...getSectionContent('header').header, name: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-jobtitle" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Job Title</Label>
                      <Input
                        id="edit-jobtitle"
                        placeholder="e.g. Full-Stack Developer"
                        className="h-10 rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500 text-sm"
                        value={getSectionContent('header').header?.jobTitle || ''}
                        onChange={(e) => updateSection('header', {
                          header: { ...getSectionContent('header').header, jobTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-targetrole" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Role</Label>
                      <Input
                        id="edit-targetrole"
                        placeholder="e.g. Senior Software Engineer"
                        className="h-10 rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500 text-sm"
                        value={getSectionContent('header').header?.targetRole || ''}
                        onChange={(e) => updateSection('header', {
                          header: { ...getSectionContent('header').header, targetRole: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address <span className="text-red-400">*</span></Label>
                      <Input
                        id="edit-email"
                        type="email"
                        placeholder="you@email.com"
                        className={cn("h-10 rounded-lg border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500 text-sm", !isValidEmail(getSectionContent('header').header?.email) && "border-red-500 focus-visible:ring-red-500")}
                        value={getSectionContent('header').header?.email || ''}
                        onChange={(e) => updateSection('header', {
                          header: { ...getSectionContent('header').header, email: e.target.value }
                        })}
                      />
                      {!isValidEmail(getSectionContent('header').header?.email) && (
                        <span className="text-[10px] text-red-500 font-medium block">Please enter a valid email address.</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <CountryLocationFields
                        compact
                        countryCode={getSectionContent('header').header?.countryCode || ''}
                        locationFields={getSectionContent('header').header?.locationFields || {}}
                        phone={getSectionContent('header').header?.phone || ''}
                        targetCountryCode={getSectionContent('header').header?.targetCountryCode || ''}
                        onCountryChange={(code) => updateSection('header', {
                          header: { ...getSectionContent('header').header, countryCode: code }
                        })}
                        onTargetCountryChange={(code) => updateSection('header', {
                          header: { ...getSectionContent('header').header, targetCountryCode: code }
                        })}
                        onLocationFieldChange={(fields) => updateSection('header', {
                          header: { ...getSectionContent('header').header, locationFields: fields }
                        })}
                        onPhoneChange={(phone) => updateSection('header', {
                          header: { ...getSectionContent('header').header, phone }
                        })}
                        onLocationStringChange={(location) => updateSection('header', {
                          header: { ...getSectionContent('header').header, location }
                        })}
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/10 pt-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Social & Website Profiles</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
                        <Input
                          id="edit-linkedin"
                          placeholder="linkedin.com/in/username"
                          className={cn(!isValidUrl(getSectionContent('header').header?.links?.find((l: any) => l.label.toLowerCase() === 'linkedin')?.url) && "border-red-500 focus-visible:ring-red-500")}
                          value={getSectionContent('header').header?.links?.find((l: any) => l.label.toLowerCase() === 'linkedin')?.url || ''}
                          onChange={(e) => {
                            const headerObj = getSectionContent('header').header || {};
                            const linksObj = headerObj.links || [];
                            let updatedLinks = [...linksObj];
                            const linkIdx = updatedLinks.findIndex((l: any) => l.label.toLowerCase() === 'linkedin');
                            if (linkIdx > -1) {
                              if (e.target.value) {
                                updatedLinks[linkIdx] = { ...updatedLinks[linkIdx], url: e.target.value };
                              } else {
                                updatedLinks.splice(linkIdx, 1);
                              }
                            } else if (e.target.value) {
                              updatedLinks.push({ label: 'LinkedIn', url: e.target.value });
                            }
                            updateSection('header', {
                              header: { ...headerObj, links: updatedLinks }
                            });
                          }}
                        />
                        {!isValidUrl(getSectionContent('header').header?.links?.find((l: any) => l.label.toLowerCase() === 'linkedin')?.url) && (
                          <span className="text-[10px] text-red-500 font-medium block">Please enter a valid URL.</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-github">GitHub URL</Label>
                        <Input
                          id="edit-github"
                          placeholder="github.com/username"
                          className={cn(!isValidUrl(getSectionContent('header').header?.links?.find((l: any) => l.label.toLowerCase() === 'github')?.url) && "border-red-500 focus-visible:ring-red-500")}
                          value={getSectionContent('header').header?.links?.find((l: any) => l.label.toLowerCase() === 'github')?.url || ''}
                          onChange={(e) => {
                            const headerObj = getSectionContent('header').header || {};
                            const linksObj = headerObj.links || [];
                            let updatedLinks = [...linksObj];
                            const linkIdx = updatedLinks.findIndex((l: any) => l.label.toLowerCase() === 'github');
                            if (linkIdx > -1) {
                              if (e.target.value) {
                                updatedLinks[linkIdx] = { ...updatedLinks[linkIdx], url: e.target.value };
                              } else {
                                updatedLinks.splice(linkIdx, 1);
                              }
                            } else if (e.target.value) {
                              updatedLinks.push({ label: 'GitHub', url: e.target.value });
                            }
                            updateSection('header', {
                              header: { ...headerObj, links: updatedLinks }
                            });
                          }}
                        />
                        {!isValidUrl(getSectionContent('header').header?.links?.find((l: any) => l.label.toLowerCase() === 'github')?.url) && (
                          <span className="text-[10px] text-red-500 font-medium block">Please enter a valid URL.</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-portfolio">Portfolio Website URL</Label>
                        <Input
                          id="edit-portfolio"
                          placeholder="yourportfolio.com"
                          className={cn(!isValidUrl(getSectionContent('header').header?.links?.find((l: any) => l.label.toLowerCase() === 'portfolio' || l.label.toLowerCase() === 'website')?.url) && "border-red-500 focus-visible:ring-red-500")}
                          value={getSectionContent('header').header?.links?.find((l: any) => l.label.toLowerCase() === 'portfolio' || l.label.toLowerCase() === 'website')?.url || ''}
                          onChange={(e) => {
                            const headerObj = getSectionContent('header').header || {};
                            const linksObj = headerObj.links || [];
                            let updatedLinks = [...linksObj];
                            const linkIdx = updatedLinks.findIndex((l: any) => l.label.toLowerCase() === 'portfolio' || l.label.toLowerCase() === 'website');
                            if (linkIdx > -1) {
                              if (e.target.value) {
                                updatedLinks[linkIdx] = { ...updatedLinks[linkIdx], url: e.target.value };
                              } else {
                                updatedLinks.splice(linkIdx, 1);
                              }
                            } else if (e.target.value) {
                              updatedLinks.push({ label: 'Portfolio', url: e.target.value });
                            }
                            updateSection('header', {
                              header: { ...headerObj, links: updatedLinks }
                            });
                          }}
                        />
                        {!isValidUrl(getSectionContent('header').header?.links?.find((l: any) => l.label.toLowerCase() === 'portfolio' || l.label.toLowerCase() === 'website')?.url) && (
                          <span className="text-[10px] text-red-500 font-medium block">Please enter a valid URL.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* SUMMARY TAB */}
                <TabsContent value="summary" className="space-y-5">
                  <div className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <AlignLeft className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Professional Summary</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">A brief paragraph highlighting your career goals, key skills, and achievements.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="edit-summary" className="text-xs font-semibold text-slate-500 dark:text-slate-500 dark:text-slate-400">Profile Description</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRewriteSummary}
                        disabled={isRewritingSummary}
                        className="bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-200 gap-1.5 h-8 font-bold text-xs"
                      >
                        {isRewritingSummary ? (
                          <>
                            <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            Rewriting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            Rewrite with AI
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id="edit-summary"
                      placeholder="Write a brief professional summary highlighting your key skills, experience, and achievements..."
                      value={getSectionContent('summary').summary || ''}
                      onChange={(e) => updateSection('summary', { summary: e.target.value })}
                      rows={8}
                      className="border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500 rounded-lg text-sm leading-relaxed"
                    />
                  </div>
                </TabsContent>

                {/* SKILLS TAB */}
                <TabsContent value="skills" className="space-y-5">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Code className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Skills & Technologies</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">Group your skills by category for ATS scanners and hiring managers.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5 h-8 text-xs font-semibold border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:bg-white/5 hover:text-white rounded-lg" onClick={() => {
                      const cur = getSectionContent('skills').skills || [];
                      updateSection('skills', { skills: [...cur, { category: '', skills: [] }] });
                    }}>
                      <Plus className="w-3.5 h-3.5" />
                      Add Category
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(getSectionContent('skills').skills || []).map((group: any, idx: number) => (
                      <div key={idx} className="border border-slate-200 dark:border-white/10 p-4 rounded-xl space-y-3 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:border-white/20 transition-colors">
                        <div className="flex justify-between items-center">
                          <Input
                            placeholder="e.g. Languages"
                            value={group.category}
                            className="max-w-xs font-semibold"
                            onChange={(e) => {
                              const list = [...getSectionContent('skills').skills];
                              list[idx].category = e.target.value;
                              updateSection('skills', { skills: list });
                            }}
                          />
                          <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => {
                            const list = (getSectionContent('skills').skills || []).filter((_: any, i: number) => i !== idx);
                            updateSection('skills', { skills: list });
                          }}>
                            Remove
                          </Button>
                        </div>
                        <Input
                          placeholder="Skills comma separated: React, Vue"
                          value={group.skills.join(', ')}
                          onChange={(e) => {
                            const list = [...getSectionContent('skills').skills];
                            list[idx].skills = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                            updateSection('skills', { skills: list });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* EXPERIENCE TAB */}
                <TabsContent value="experience" className="space-y-5">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Work Experience</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">List your roles in reverse chronological order. Include measurable achievements.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5 h-8 text-xs font-semibold border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:bg-white/5 hover:text-white rounded-lg" onClick={() => {
                      const cur = getSectionContent('experience').experiences || [];
                      updateSection('experience', {
                        experiences: [...cur, { id: nanoid(), company: '', role: '', startDate: '', endDate: '', current: false, description: [] }]
                      });
                    }}>
                      <Plus className="w-3.5 h-3.5" />
                      Add Position
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(getSectionContent('experience').experiences || []).map((exp: any, idx: number) => (
                      <div key={exp.id || idx} className="border border-slate-200 dark:border-white/10 p-5 rounded-xl space-y-4 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:border-white/20 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Briefcase className="w-3 h-3 text-slate-500 dark:text-slate-500 dark:text-slate-400" />Position {idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('experience', idx, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('experience', idx, 'down')}
                              disabled={idx === (getSectionContent('experience').experiences || []).length - 1}
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => {
                              const list = (getSectionContent('experience').experiences || []).filter((e: any) => e.id !== exp.id);
                              updateSection('experience', { experiences: list });
                            }}>
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Company Name</Label>
                            <Input
                              value={exp.company}
                              className="border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500 rounded-lg text-sm"
                              onChange={(e) => {
                                const list = [...getSectionContent('experience').experiences];
                                list[idx].company = e.target.value;
                                updateSection('experience', { experiences: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Job Title</Label>
                            <Input
                              value={exp.role}
                              className="border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500 rounded-lg text-sm"
                              onChange={(e) => {
                                const list = [...getSectionContent('experience').experiences];
                                list[idx].role = e.target.value;
                                updateSection('experience', { experiences: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date</Label>
                            <Input
                              value={exp.startDate}
                              className="border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500 rounded-lg text-sm"
                              onChange={(e) => {
                                const list = [...getSectionContent('experience').experiences];
                                list[idx].startDate = e.target.value;
                                updateSection('experience', { experiences: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Date</Label>
                            <Input
                              value={exp.endDate}
                              disabled={exp.current}
                              className="border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500 rounded-lg text-sm"
                              onChange={(e) => {
                                const list = [...getSectionContent('experience').experiences];
                                list[idx].endDate = e.target.value;
                                updateSection('experience', { experiences: list });
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => {
                              const list = [...getSectionContent('experience').experiences];
                              list[idx].current = e.target.checked;
                              if (e.target.checked) list[idx].endDate = 'Present';
                              updateSection('experience', { experiences: list });
                            }}
                            className="w-4 h-4 rounded text-blue-650 focus:ring-blue-500 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Currently Work Here</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs">Description Bullets (one per line)</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={rewritingExpId === (exp.id || String(idx))}
                              onClick={() => handleRewriteExperienceBullets(idx)}
                              className="h-7 text-[10px] font-bold gap-1 bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-200"
                            >
                              {rewritingExpId === (exp.id || String(idx)) ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                  Rewriting...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" />
                                  Rewrite Bullets
                                </>
                              )}
                            </Button>
                          </div>
                          <Textarea
                            value={exp.description.join('\n')}
                            onChange={(e) => {
                              const list = [...getSectionContent('experience').experiences];
                              list[idx].description = e.target.value.split('\n').filter(Boolean);
                              updateSection('experience', { experiences: list });
                            }}
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* PROJECTS TAB */}
                <TabsContent value="projects" className="space-y-5">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Folder className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Projects</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">Showcase personal, open-source, or freelance projects with technologies used.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5 h-8 text-xs font-semibold border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:bg-white/5 hover:text-white rounded-lg" onClick={() => {
                      const cur = getSectionContent('projects').projects || [];
                      updateSection('projects', {
                        projects: [...cur, { id: nanoid(), name: '', description: '', technologies: [], link: '', date: '' }]
                      });
                    }}>
                      <Plus className="w-3.5 h-3.5" />
                      Add Project
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(getSectionContent('projects').projects || []).map((proj: any, idx: number) => (
                      <div key={proj.id || idx} className="border border-slate-200 dark:border-white/10 p-5 rounded-xl space-y-4 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:border-white/20 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Folder className="w-3 h-3 text-slate-500 dark:text-slate-500 dark:text-slate-400" />Project {idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('projects', idx, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('projects', idx, 'down')}
                              disabled={idx === (getSectionContent('projects').projects || []).length - 1}
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => {
                              const list = (getSectionContent('projects').projects || []).filter((p: any) => p.id !== proj.id);
                              updateSection('projects', { projects: list });
                            }}>
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Project Name</Label>
                            <Input
                              value={proj.name}
                              className="border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500 rounded-lg text-sm"
                              onChange={(e) => {
                                const list = [...getSectionContent('projects').projects];
                                list[idx].name = e.target.value;
                                updateSection('projects', { projects: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Date</Label>
                            <Input
                              value={proj.date}
                              onChange={(e) => {
                                const list = [...getSectionContent('projects').projects];
                                list[idx].date = e.target.value;
                                updateSection('projects', { projects: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Technologies (comma-separated)</Label>
                            <Input
                              value={proj.technologies.join(', ')}
                              onChange={(e) => {
                                const list = [...getSectionContent('projects').projects];
                                list[idx].technologies = e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean);
                                updateSection('projects', { projects: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Link URL</Label>
                            <Input
                              value={proj.link}
                              className={cn(!isValidUrl(proj.link) && "border-red-500 focus-visible:ring-red-500")}
                              onChange={(e) => {
                                const list = [...getSectionContent('projects').projects];
                                list[idx].link = e.target.value;
                                updateSection('projects', { projects: list });
                              }}
                            />
                            {!isValidUrl(proj.link) && (
                              <span className="text-[10px] text-red-500 font-medium block">Please enter a valid URL.</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={proj.description}
                            onChange={(e) => {
                              const list = [...getSectionContent('projects').projects];
                              list[idx].description = e.target.value;
                              updateSection('projects', { projects: list });
                            }}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* EDUCATION TAB */}
                <TabsContent value="education" className="space-y-5">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <GraduationCap className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Education</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">Your academic background including degrees, institutions, and graduation dates.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5 h-8 text-xs font-semibold border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:bg-white/5 hover:text-white rounded-lg" onClick={() => {
                      const cur = getSectionContent('education').educations || [];
                      updateSection('education', {
                        educations: [...cur, { id: nanoid(), institution: '', degree: '', field: '', graduationDate: '', gpa: '' }]
                      });
                    }}>
                      <Plus className="w-3.5 h-3.5" />
                      Add Education
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(getSectionContent('education').educations || []).map((edu: any, idx: number) => (
                      <div key={edu.id || idx} className="border border-slate-200 dark:border-white/10 p-5 rounded-xl space-y-4 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:border-white/20 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><GraduationCap className="w-3 h-3 text-slate-500 dark:text-slate-500 dark:text-slate-400" />Education {idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('education', idx, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('education', idx, 'down')}
                              disabled={idx === (getSectionContent('education').educations || []).length - 1}
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => {
                              const list = (getSectionContent('education').educations || []).filter((e: any) => e.id !== edu.id);
                              updateSection('education', { educations: list });
                            }}>
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid resume-editor-grid-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Institution</Label>
                            <Input
                              value={edu.institution}
                              onChange={(e) => {
                                const list = [...getSectionContent('education').educations];
                                list[idx].institution = e.target.value;
                                updateSection('education', { educations: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Degree</Label>
                            <Input
                              value={edu.degree}
                              onChange={(e) => {
                                const list = [...getSectionContent('education').educations];
                                list[idx].degree = e.target.value;
                                updateSection('education', { educations: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Field of Study</Label>
                            <Input
                              value={edu.field}
                              onChange={(e) => {
                                const list = [...getSectionContent('education').educations];
                                list[idx].field = e.target.value;
                                updateSection('education', { educations: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Graduation Date</Label>
                            <Input
                              value={edu.graduationDate}
                              onChange={(e) => {
                                const list = [...getSectionContent('education').educations];
                                list[idx].graduationDate = e.target.value;
                                updateSection('education', { educations: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">GPA</Label>
                            <Input
                              value={edu.gpa}
                              onChange={(e) => {
                                const list = [...getSectionContent('education').educations];
                                list[idx].gpa = e.target.value;
                                updateSection('education', { educations: list });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* CERTIFICATIONS TAB */}
                <TabsContent value="certifications" className="space-y-5">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Award className="w-4.5 h-4.5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Certifications & Credentials</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">Professional certifications, licenses, or credentials you have earned.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5 h-8 text-xs font-semibold border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:bg-white/5 hover:text-white rounded-lg" onClick={() => {
                      const cur = getSectionContent('certifications').certifications || [];
                      updateSection('certifications', {
                        certifications: [...cur, { id: nanoid(), name: '', issuer: '', date: '', link: '' }]
                      });
                    }}>
                      <Plus className="w-3.5 h-3.5" />
                      Add Certification
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(getSectionContent('certifications').certifications || []).map((cert: any, idx: number) => (
                      <div key={cert.id || idx} className="border border-slate-200 dark:border-white/10 p-5 rounded-xl space-y-4 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:border-white/20 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Award className="w-3 h-3 text-slate-500 dark:text-slate-500 dark:text-slate-400" />Certification {idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('certifications', idx, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('certifications', idx, 'down')}
                              disabled={idx === (getSectionContent('certifications').certifications || []).length - 1}
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => {
                              const list = (getSectionContent('certifications').certifications || []).filter((c: any) => c.id !== cert.id);
                              updateSection('certifications', { certifications: list });
                            }}>
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Certification Name</Label>
                            <Input
                              value={cert.name}
                              onChange={(e) => {
                                const list = [...getSectionContent('certifications').certifications];
                                list[idx].name = e.target.value;
                                updateSection('certifications', { certifications: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Issuer</Label>
                            <Input
                              value={cert.issuer}
                              onChange={(e) => {
                                const list = [...getSectionContent('certifications').certifications];
                                list[idx].issuer = e.target.value;
                                updateSection('certifications', { certifications: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Issue Date</Label>
                            <Input
                              value={cert.date}
                              onChange={(e) => {
                                const list = [...getSectionContent('certifications').certifications];
                                list[idx].date = e.target.value;
                                updateSection('certifications', { certifications: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Credential Link</Label>
                            <Input
                              value={cert.link}
                              className={cn(!isValidUrl(cert.link) && "border-red-500 focus-visible:ring-red-500")}
                              onChange={(e) => {
                                const list = [...getSectionContent('certifications').certifications];
                                list[idx].link = e.target.value;
                                updateSection('certifications', { certifications: list });
                              }}
                            />
                            {!isValidUrl(cert.link) && (
                              <span className="text-[10px] text-red-500 font-medium block">Please enter a valid URL.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* LANGUAGES TAB */}
                <TabsContent value="languages" className="space-y-5">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Globe className="w-4.5 h-4.5 text-teal-650 dark:text-teal-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Languages</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">Languages you speak and your proficiency level in each.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5 h-8 text-xs font-semibold border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:bg-white/5 hover:text-white rounded-lg" onClick={() => {
                      const cur = getSectionContent('languages').languages || [];
                      updateSection('languages', {
                        languages: [...cur, { language: '', proficiency: '' }]
                      });
                    }}>
                      <Plus className="w-3.5 h-3.5" />
                      Add Language
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(getSectionContent('languages').languages || []).map((lang: any, idx: number) => (
                      <div key={idx} className="border border-slate-200 dark:border-white/10 p-5 rounded-xl space-y-4 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:border-white/20 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Globe className="w-3 h-3 text-slate-500 dark:text-slate-500 dark:text-slate-400" />Language {idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('languages', idx, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('languages', idx, 'down')}
                              disabled={idx === (getSectionContent('languages').languages || []).length - 1}
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => {
                              const list = (getSectionContent('languages').languages || []).filter((_: any, i: number) => i !== idx);
                              updateSection('languages', { languages: list });
                            }}>
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Language *</Label>
                            <Input
                              value={lang.language}
                              placeholder="e.g. French"
                              onChange={(e) => {
                                const list = [...getSectionContent('languages').languages];
                                list[idx].language = e.target.value;
                                updateSection('languages', { languages: list });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Proficiency</Label>
                            <Input
                              value={lang.proficiency}
                              placeholder="e.g. Professional Working, Native"
                              onChange={(e) => {
                                const list = [...getSectionContent('languages').languages];
                                list[idx].proficiency = e.target.value;
                                updateSection('languages', { languages: list });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(getSectionContent('languages').languages || []).length === 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 italic">No languages added. Add languages to showcase bilingual or multilingual skills.</p>
                    )}
                  </div>
                </TabsContent>

                {/* REFERENCES TAB */}
                <TabsContent value="references" className="space-y-5">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Users className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Professional References</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">People who can vouch for your work quality and character.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5 h-8 text-xs font-semibold border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:bg-white/5 hover:text-white rounded-lg" onClick={() => {
                      const cur = getSectionContent('references').references || [];
                      updateSection('references', {
                        references: [...cur, { id: nanoid(), name: '', company: '', title: '', email: '', phone: '', availableOnRequest: false }]
                      });
                    }}>
                      <Plus className="w-3.5 h-3.5" />
                      Add Reference
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(getSectionContent('references').references || []).map((ref: any, idx: number) => (
                      <div key={ref.id || idx} className="border border-slate-200 dark:border-white/10 p-5 rounded-xl space-y-4 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:border-white/20 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Users className="w-3 h-3 text-slate-500 dark:text-slate-500 dark:text-slate-400" />Reference {idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('references', idx, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('references', idx, 'down')}
                              disabled={idx === (getSectionContent('references').references || []).length - 1}
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => {
                              const list = (getSectionContent('references').references || []).filter((r: any) => r.id !== ref.id);
                              updateSection('references', { references: list });
                            }}>
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pb-1">
                          <input
                            type="checkbox"
                            id={`ref-available-${ref.id}`}
                            checked={ref.availableOnRequest}
                            onChange={(e) => {
                              const list = [...getSectionContent('references').references];
                              list[idx].availableOnRequest = e.target.checked;
                              updateSection('references', { references: list });
                            }}
                            className="w-4 h-4 rounded text-blue-650 focus:ring-blue-500 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                          />
                          <Label htmlFor={`ref-available-${ref.id}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                            Available upon request
                          </Label>
                        </div>

                        {!ref.availableOnRequest && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Name *</Label>
                              <Input
                                value={ref.name}
                                placeholder="e.g. Jane Doe"
                                onChange={(e) => {
                                  const list = [...getSectionContent('references').references];
                                  list[idx].name = e.target.value;
                                  updateSection('references', { references: list });
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Company</Label>
                              <Input
                                value={ref.company}
                                placeholder="e.g. Google"
                                onChange={(e) => {
                                  const list = [...getSectionContent('references').references];
                                  list[idx].company = e.target.value;
                                  updateSection('references', { references: list });
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Title</Label>
                              <Input
                                value={ref.title}
                                placeholder="e.g. Director of Engineering"
                                onChange={(e) => {
                                  const list = [...getSectionContent('references').references];
                                  list[idx].title = e.target.value;
                                  updateSection('references', { references: list });
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Email</Label>
                              <Input
                                type="email"
                                value={ref.email}
                                placeholder="jane.doe@example.com"
                                className={cn(!isValidEmail(ref.email) && "border-red-500 focus-visible:ring-red-500")}
                                onChange={(e) => {
                                  const list = [...getSectionContent('references').references];
                                  list[idx].email = e.target.value;
                                  updateSection('references', { references: list });
                                }}
                              />
                              {!isValidEmail(ref.email) && (
                                <span className="text-[9px] text-red-500 font-semibold block">Invalid email format.</span>
                              )}
                            </div>
                            <div className="space-y-1 col-span-2">
                              <Label className="text-xs">Phone</Label>
                              <Input
                                value={ref.phone}
                                placeholder="e.g. +1 (555) 019-2834"
                                className={cn(!isValidPhone(ref.phone) && "border-red-500 focus-visible:ring-red-500")}
                                onChange={(e) => {
                                  const list = [...getSectionContent('references').references];
                                  list[idx].phone = e.target.value;
                                  updateSection('references', { references: list });
                                }}
                              />
                              {!isValidPhone(ref.phone) && (
                                <span className="text-[9px] text-red-500 font-semibold block">Invalid phone number.</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {(getSectionContent('references').references || []).length === 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 italic">No references added. Add references or select "Available upon request".</p>
                    )}
                  </div>
                </TabsContent>

                {/* CUSTOM SECTIONS TAB */}
                <TabsContent value="custom" className="space-y-5">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <LayoutList className="w-4.5 h-4.5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Custom Sections</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">Add volunteer work, patents, publications, or any other section.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5 h-8 text-xs font-semibold border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:bg-white/5 hover:text-white rounded-lg" onClick={() => {
                      const cur = getSectionContent('custom').customSections || [];
                      updateSection('custom', {
                        customSections: [...cur, { id: nanoid(), title: '', items: [] }]
                      });
                    }}>
                      <Plus className="w-3.5 h-3.5" />
                      Add Custom Section
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {(getSectionContent('custom').customSections || []).map((sect: any, sectIdx: number) => (
                      <div key={sect.id || sectIdx} className="border border-slate-200 dark:border-white/10 p-5 rounded-xl space-y-4 bg-slate-50/50 dark:bg-white/5 hover:border-slate-300 dark:border-white/20 transition-colors">
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex-1 max-w-sm">
                            <Label className="text-xs font-bold text-slate-500">Section Title *</Label>
                            <Input
                              value={sect.title}
                              placeholder="e.g. Volunteer Work, Patents"
                              className="font-bold h-9 mt-1"
                              onChange={(e) => {
                                const list = [...getSectionContent('custom').customSections];
                                list[sectIdx].title = e.target.value;
                                updateSection('custom', { customSections: list });
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2 mt-5">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('custom', sectIdx, 'up')}
                              disabled={sectIdx === 0}
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500 hover:text-slate-700" 
                              onClick={() => moveItem('custom', sectIdx, 'down')}
                              disabled={sectIdx === (getSectionContent('custom').customSections || []).length - 1}
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 h-8 font-bold" onClick={() => {
                              const list = (getSectionContent('custom').customSections || []).filter((s: any) => s.id !== sect.id);
                              updateSection('custom', { customSections: list });
                            }}>
                              Remove
                            </Button>
                          </div>
                        </div>

                        {/* Items in custom section */}
                        <div className="space-y-3 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">Section Items</span>
                            <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:bg-white/5" onClick={() => {
                              const list = [...getSectionContent('custom').customSections];
                              list[sectIdx].items = [...(list[sectIdx].items || []), { id: nanoid(), title: '', subtitle: '', description: '' }];
                              updateSection('custom', { customSections: list });
                            }}>
                              Add Item
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {(sect.items || []).map((item: any, itemIdx: number) => (
                              <div key={item.id || itemIdx} className="border border-slate-200/50 dark:border-white/5 p-3 rounded-md bg-slate-50/50 dark:bg-white/5 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 dark:text-slate-400">Item #{itemIdx + 1}</span>
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-slate-600" 
                                      onClick={() => {
                                        const list = [...getSectionContent('custom').customSections];
                                        const items = [...list[sectIdx].items];
                                        if (itemIdx > 0) {
                                          const tmp = items[itemIdx];
                                          items[itemIdx] = items[itemIdx - 1];
                                          items[itemIdx - 1] = tmp;
                                          list[sectIdx].items = items;
                                          updateSection('custom', { customSections: list });
                                        }
                                      }}
                                      disabled={itemIdx === 0}
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-slate-600" 
                                      onClick={() => {
                                        const list = [...getSectionContent('custom').customSections];
                                        const items = [...list[sectIdx].items];
                                        if (itemIdx < items.length - 1) {
                                          const tmp = items[itemIdx];
                                          items[itemIdx] = items[itemIdx + 1];
                                          items[itemIdx + 1] = tmp;
                                          list[sectIdx].items = items;
                                          updateSection('custom', { customSections: list });
                                        }
                                      }}
                                      disabled={itemIdx === (sect.items || []).length - 1}
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => {
                                      const list = [...getSectionContent('custom').customSections];
                                      list[sectIdx].items = list[sectIdx].items.filter((i: any) => i.id !== item.id);
                                      updateSection('custom', { customSections: list });
                                    }}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-[10px]">Item Title *</Label>
                                    <Input
                                      value={item.title}
                                      placeholder="e.g. Volunteer"
                                      className="h-8 text-xs"
                                      onChange={(e) => {
                                        const list = [...getSectionContent('custom').customSections];
                                        list[sectIdx].items[itemIdx].title = e.target.value;
                                        updateSection('custom', { customSections: list });
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px]">Subtitle / Organization</Label>
                                    <Input
                                      value={item.subtitle}
                                      placeholder="e.g. Red Cross"
                                      className="h-8 text-xs"
                                      onChange={(e) => {
                                        const list = [...getSectionContent('custom').customSections];
                                        list[sectIdx].items[itemIdx].subtitle = e.target.value;
                                        updateSection('custom', { customSections: list });
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Description</Label>
                                  <Textarea
                                    value={item.description || ''}
                                    placeholder="e.g. Managed team of 15 volunteers..."
                                    className="text-xs"
                                    rows={2}
                                    onChange={(e) => {
                                      const list = [...getSectionContent('custom').customSections];
                                      list[sectIdx].items[itemIdx].description = e.target.value;
                                      updateSection('custom', { customSections: list });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(getSectionContent('custom').customSections || []).length === 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 italic">No custom sections added. Add volunteer work, certifications, patents, or publications.</p>
                    )}
                  </div>
                </TabsContent>

                {/* LAYOUT TAB */}
                <TabsContent value="layout" className="space-y-5">
                  <div className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Settings className="w-4.5 h-4.5 text-slate-500 dark:text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Section Order & Visibility</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5">Drag to reorder sections and toggle visibility on your resume.</p>
                    </div>
                  </div>
                  <div className="space-y-2 border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-slate-50/50 dark:bg-white/5">
                    {[...localResume.sections].sort((a, b) => a.order - b.order).map((sec, idx, sortedList) => (
                      <div key={sec.id} className="flex items-center justify-between bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 p-3 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-500 dark:text-slate-400 w-5">#{idx + 1}</span>
                          <span className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-200">
                            {sec.type === 'custom' ? `Custom Sections` : sec.type === 'certifications' ? 'Certifications (Credentials)' : sec.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Toggle visibility */}
                          <div className="flex items-center gap-1.5 mr-2">
                            <input
                              type="checkbox"
                              id={`vis-${sec.id}`}
                              checked={sec.visible}
                              onChange={() => toggleSectionVisibility(sec.id)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5"
                            />
                            <label htmlFor={`vis-${sec.id}`} className="text-xs font-medium text-slate-500 cursor-pointer select-none">
                              {sec.visible ? 'Visible' : 'Hidden'}
                            </label>
                          </div>
                          {/* Move up / down */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-700"
                            onClick={() => moveSection(idx, 'up')}
                            disabled={idx === 0 || sec.type === 'header'} // header is usually locked at top
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-slate-700"
                            onClick={() => moveSection(idx, 'down')}
                            disabled={idx === sortedList.length - 1 || sec.type === 'header'}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* ACHIEVEMENTS TAB */}
                <TabsContent value="achievements" className="space-y-6">
                  {/* Achievements Editor */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">Achievements Highlights</h3>
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs border-slate-200 dark:border-white/10 hover:bg-slate-50/50 dark:bg-white/5" onClick={() => {
                        const cur = getSectionContent('achievements').achievements || [];
                        updateSection('achievements', {
                          achievements: [...cur, '']
                        });
                      }}>
                        Add Achievement
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {(getSectionContent('achievements').achievements || []).map((ach: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            placeholder="e.g. Winner of national hackathon out of 500+ teams"
                            value={ach}
                            onChange={(e) => {
                              const list = [...getSectionContent('achievements').achievements];
                              list[idx] = e.target.value;
                              updateSection('achievements', { achievements: list });
                            }}
                            className="h-10 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus-visible:ring-blue-500"
                          />
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 h-9" onClick={() => {
                            const list = (getSectionContent('achievements').achievements || []).filter((_: any, i: number) => i !== idx);
                            updateSection('achievements', { achievements: list });
                          }}>
                            Remove
                          </Button>
                        </div>
                      ))}
                      {(getSectionContent('achievements').achievements || []).length === 0 && (
                        <p className="text-xs text-slate-550 dark:text-slate-400 italic">No achievements added. Add key milestones to stand out.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* LIVE PREVIEW TAB */}
                <TabsContent value="preview" className="h-full min-h-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-slate-200 bg-white/85 px-3 py-2.5 dark:border-white/10 dark:bg-slate-950/40 sm:rounded-xl sm:border">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                        <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">Live Preview</h3>
                        <p className="hidden sm:block text-xs text-slate-550 dark:text-slate-455 mt-0.5 font-semibold">Inspect your resume before export.</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-center rounded-xl bg-slate-50 p-1 dark:bg-white/5">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" onClick={() => setZoom(Math.max(35, zoom - 10))}>
                        <ZoomOut className="w-3.5 h-3.5 text-slate-600 dark:text-slate-355" />
                      </Button>
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-extrabold px-1 min-w-[34px] text-center">{zoom}%</span>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 bg-white dark:border-white/10 dark:bg-white/5" onClick={() => setZoom(Math.min(150, zoom + 10))}>
                        <ZoomIn className="w-3.5 h-3.5 text-slate-600 dark:text-slate-355" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden flex border-y border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-[#131b2e] sm:rounded-xl sm:border">
                    <ResumePreview resume={localResume} templateId={selectedTemplate} zoom={zoom} contentId="resume-preview-mobile" />
                  </div>
                </TabsContent>

                {/* REVIEW & EXPORT TAB */}
                <TabsContent value="review" className="space-y-6">
                  <div className="flex items-start gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Final Review & Export</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">Review your ATS optimization checklist and export your final resume.</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Detailed ATS Score Widget */}
                    <Card className="border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4 bg-slate-50/50 dark:bg-white/5 rounded-xl">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 border-b border-slate-200 dark:border-white/10 pb-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ATS Optimization Details
                      </h4>
                      
                      <div className="flex items-center gap-4">
                        {/* Radial Gauge */}
                        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle className="text-slate-200 dark:text-white/5 stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8"></circle>
                            <circle className="text-emerald-600 dark:text-emerald-400 stroke-current transition-all duration-1000" cx="50" cy="50" fill="transparent" r="40" 
                              strokeDasharray="251.2" 
                              strokeDashoffset={251.2 * (1 - atsSummary.score / 100)} 
                              strokeLinecap="round" 
                              strokeWidth="8">
                            </circle>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{atsSummary.score}%</span>
                          </div>
                        </div>
                        
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {atsSummary.score >= 70 ? 'Ready for Applications!' : atsSummary.score >= 40 ? 'Needs Improvement' : 'Urgent Actions Required'}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Keywords: {atsSummary.matchedKeywords.length} matched</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Sections: {atsSummary.completenessScore}% filled</p>
                        </div>
                      </div>

                      {/* Keyword list details */}
                      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-400 block mb-1">Matched Keywords ({atsSummary.matchedKeywords.length}):</span>
                          {atsSummary.matchedKeywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {atsSummary.matchedKeywords.slice(0, 5).map((kw, i) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded font-semibold text-[9px]">{kw}</span>
                              ))}
                              {atsSummary.matchedKeywords.length > 5 && (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-550 dark:text-slate-455 border border-slate-200 dark:border-white/10 rounded font-semibold text-[9px]">+{atsSummary.matchedKeywords.length - 5} more</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 dark:text-slate-550 italic">None matched yet. Tailor skills and experience sections.</p>
                          )}
                        </div>
                        
                        {atsSummary.missingKeywords.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-400 block mb-1">Missing Keywords ({atsSummary.missingKeywords.length}):</span>
                            <div className="flex flex-wrap gap-1">
                              {atsSummary.missingKeywords.slice(0, 5).map((kw, i) => (
                                <span key={i} className="px-2 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-455 border border-rose-500/20 rounded font-semibold text-[9px]">{kw}</span>
                              ))}
                              {atsSummary.missingKeywords.length > 5 && (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-550 dark:text-slate-455 border border-slate-200 dark:border-white/10 rounded font-semibold text-[9px]">+{atsSummary.missingKeywords.length - 5} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {atsSummary.suggestions.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-300 block">Suggestions:</span>
                          <ul className="text-[10px] text-amber-700 dark:text-amber-200 list-disc pl-4 space-y-1 font-semibold max-h-24 overflow-y-auto">
                            {atsSummary.suggestions.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>

                    {/* Completion Panel */}
                    <Card className="border border-slate-200 dark:border-white/10 shadow-sm p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-white/5 rounded-xl space-y-4 min-h-[220px]">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-pulse">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">All Sections Completed!</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[240px] font-semibold">
                          You have filled in all the core information. Click "Finish & Export" to download your ATS-ready resume.
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => setShowDownloadModal(true)} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 h-10 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                      >
                        <Sparkles className="w-4 h-4 text-blue-200" />
                        Finish & Export
                      </Button>
                    </Card>
                  </div>
                </TabsContent>
            </Tabs>
          </div>
          
          {/* Wizard Navigation Footer */}
          <div className="hidden sm:block shrink-0 border-t border-slate-200/50 dark:border-white/5">
            {/* Mini progress bar */}
            <div className="h-0.5 bg-slate-50/50 dark:bg-white/5">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out rounded-r-full" 
                style={{ width: `${((activeFlowIndex + 1) / EDITOR_FLOW_STEPS.length) * 100}%` }} 
              />
            </div>
            <div className="bg-slate-100/80 dark:bg-slate-950/40 backdrop-blur-sm px-5 py-3 flex justify-between items-center">
              <Button
                variant="outline"
                disabled={activeEditTab === 'header'}
                onClick={() => {
                  if (activeEditTab === 'preview') {
                    setActiveEditTab('review');
                    return;
                  }
                  if (activeFlowIndex > 0) {
                    setActiveEditTab(EDITOR_FLOW_STEPS[activeFlowIndex - 1].key);
                  }
                }}
                className="border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-350 bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-white font-semibold gap-1.5 px-4 h-9 rounded-lg text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>
              
              <div className="flex items-center gap-1.5">
                {activeEditTab !== 'review' && activeEditTab !== 'preview' ? (
                  FORM_STEPS.map((step) => (
                    <div 
                      key={step.id}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        activeEditTab === step.key 
                          ? "w-4 bg-blue-500" 
                          : isStepCompleted(step.key) 
                            ? "bg-blue-300/60" 
                            : "bg-white/10"
                      )}
                    />
                  ))
                ) : (
                  ['review', 'preview'].map((key) => (
                    <div 
                      key={key}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                        key === 'preview' && "lg:hidden",
                        activeEditTab === key 
                          ? "w-4 bg-blue-500" 
                          : "bg-blue-300/60"
                      )}
                    />
                  ))
                )}
              </div>

              <Button
                onClick={() => {
                  if (isFinalFlowStep) {
                    setShowDownloadModal(true);
                  } else if (activeFlowIndex < EDITOR_FLOW_STEPS.length - 1) {
                    setActiveEditTab(EDITOR_FLOW_STEPS[activeFlowIndex + 1].key);
                  } else {
                    setShowDownloadModal(true);
                  }
                }}
                className={cn(
                  "font-semibold gap-1.5 px-4 h-9 rounded-lg text-xs shadow-sm transition-all",
                  isFinalFlowStep 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 text-white shadow-blue-500/20" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {isFinalFlowStep ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Finish & Export
                  </>
                ) : (
                  <>
                    Next Step
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
        </div>

        <aside className="hidden lg:flex min-h-0 h-full flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-950/30 shadow-sm">
          <div className="shrink-0 flex items-start justify-between gap-3 border-b border-slate-200 dark:border-white/10 px-4 py-3 bg-white/55 dark:bg-white/[0.03] backdrop-blur-sm">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                <Eye className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-tight">Live Preview</h3>
                <p className="text-xs text-slate-550 dark:text-slate-455 mt-0.5 font-semibold">Updates instantly while you edit.</p>
              </div>
            </div>
            <div className="flex gap-1.5 items-center shrink-0">
              <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <ZoomOut className="w-3.5 h-3.5 text-slate-600 dark:text-slate-355" />
              </Button>
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-extrabold px-1 min-w-[36px] text-center">{zoom}%</span>
              <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => setZoom(Math.min(150, zoom + 10))}>
                <ZoomIn className="w-3.5 h-3.5 text-slate-600 dark:text-slate-355" />
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ResumePreview resume={localResume} templateId={selectedTemplate} zoom={zoom} contentId="resume-preview-desktop" />
          </div>
        </aside>
      </div>

      <div
        aria-hidden="true"
        className="fixed left-[-10000px] top-0 h-[1200px] w-[900px] overflow-visible bg-white pointer-events-none"
      >
        <ResumePreview
          resume={localResume}
          templateId={selectedTemplate}
          zoom={100}
          contentRef={exportPreviewRef}
          contentId="resume-pdf-content"
        />
      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <Card className="w-full max-w-2xl border border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden animate-scale-up">
            {/* Header Section */}
            <div className="p-6 md:p-8 flex flex-col items-center text-center relative border-b border-slate-200 dark:border-white/10">
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 dark:hover:text-white text-lg font-bold outline-none"
              >
                ✕
              </button>
              
              <div className="w-20 h-20 mb-4 relative flex items-center justify-center">
                <svg className="w-16 h-16 mx-auto text-emerald-600 dark:text-emerald-400 relative z-10" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset="0" strokeLinecap="round" />
                  <path d="M30 50 L45 65 L70 35" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset="0" />
                </svg>
                <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full -z-0 scale-110 blur-xs"></div>
              </div>
              
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Resume Completed!</h3>
              <p className="text-sm text-slate-550 dark:text-slate-400 mt-1 max-w-md font-semibold">
                Your ATS-optimized resume has been generated and is ready to share.
              </p>
            </div>
            
            {/* Match Summary Card */}
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
                {/* Circular Progress Dial */}
                <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-slate-200 dark:text-white/5 stroke-current" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8"></circle>
                    <circle className="text-emerald-600 dark:text-emerald-400 stroke-current transition-all duration-1000 ease-out" cx="50" cy="50" fill="transparent" r="40" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 * (1 - atsSummary.score / 100)} 
                      strokeLinecap="round" 
                      strokeWidth="8">
                    </circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{atsSummary.score}%</span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Match</span>
                  </div>
                </div>
                
                {/* Metadata text */}
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ATS Optimization Score: {atsSummary.score >= 70 ? 'High' : atsSummary.score >= 40 ? 'Medium' : 'Low'}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <li className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{atsSummary.matchedKeywords.length} matching keywords found.</span>
                    </li>
                    <li className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>All key sections populated accurately.</span>
                    </li>
                  </ul>
                  
                  {atsSummary.matchedKeywords.length > 0 && (
                    <div className="pt-1 flex flex-wrap justify-center sm:justify-start gap-1.5">
                      {atsSummary.matchedKeywords.slice(0, 4).map((kw, i) => (
                        <span key={i} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-md font-semibold text-[10px]">
                          {kw}
                        </span>
                      ))}
                      {atsSummary.matchedKeywords.length > 4 && (
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-550 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-md font-semibold text-[10px]">
                          +{atsSummary.matchedKeywords.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions Section */}
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleExportPDF} 
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold gap-2 h-12 rounded-lg shadow-md transition-all flex items-center justify-center border-none"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Format
                </Button>
                <Button 
                  onClick={handleExportDOCX} 
                  variant="outline"
                  className="w-full border border-slate-200 dark:border-white/10 hover:border-primary text-slate-800 dark:text-slate-200 bg-white/50 hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/8 font-bold gap-2 h-12 rounded-lg transition-all flex items-center justify-center"
                >
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Download MS Word (.docx) Format
                </Button>
              </div>
            </CardContent>
            
            {/* Footer */}
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-200 dark:border-white/10 px-6 py-4 flex justify-between items-center">
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="text-xs font-bold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-blue-400 flex items-center gap-1 bg-transparent border-none outline-none"
              >
                ← Go back to editor
              </button>
              <button 
                onClick={() => {
                  setShowDownloadModal(false);
                  window.location.search = '?mode=upload';
                }}
                className="text-xs font-bold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-blue-400 flex items-center gap-1 bg-transparent border-none outline-none"
              >
                Start a new CV +
              </button>
            </div>
          </Card>
        </div>
      )}
      {/* Mobile Bottom Navigation Bar (Stitch Light theme compliant mockup mapped actions) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/95 text-slate-500 backdrop-blur-xl border-t border-slate-200 shadow-lg flex justify-around items-center px-3 pt-2 pb-3 dark:bg-[#0f172a]/95 dark:text-slate-400 dark:border-white/10 lg:hidden">
        {/* Layout/Templates button */}
        <button 
          type="button"
          onClick={() => {
            setActiveEditTab('layout');
          }}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl gap-1 min-w-[64px] transition-all duration-200 active:scale-95 cursor-pointer border-none bg-transparent",
            activeEditTab === 'layout' 
              ? "text-blue-600 bg-blue-50 font-bold dark:text-blue-400 dark:bg-blue-950/30" 
              : "hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Layout</span>
        </button>

        {/* Editor Button */}
        <button 
          type="button"
          onClick={() => {
            if (activeEditTab === 'layout' || activeEditTab === 'preview' || activeEditTab === 'review') {
              setActiveEditTab('header');
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl gap-1 min-w-[64px] transition-all duration-200 active:scale-95 cursor-pointer border-none bg-transparent",
            activeEditTab !== 'layout' && activeEditTab !== 'preview' && activeEditTab !== 'review'
              ? "text-blue-600 bg-blue-50 font-bold dark:text-blue-400 dark:bg-blue-950/30" 
              : "hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Editor</span>
        </button>

        {/* Preview Button */}
        <button 
          type="button"
          onClick={() => setActiveEditTab('preview')}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl gap-1 min-w-[64px] transition-all duration-200 active:scale-95 cursor-pointer border-none bg-transparent",
            activeEditTab === 'preview'
              ? "text-blue-600 bg-blue-50 font-bold dark:text-blue-400 dark:bg-blue-950/30" 
              : "hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Eye className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Preview</span>
        </button>

        {/* Export Button */}
        <button 
          type="button"
          onClick={() => setActiveEditTab('review')}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl gap-1 min-w-[64px] transition-all duration-200 active:scale-95 cursor-pointer border-none bg-transparent",
            activeEditTab === 'review'
              ? "text-blue-600 bg-blue-50 font-bold dark:text-blue-400 dark:bg-blue-950/30" 
              : "hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Export</span>
        </button>
      </nav>
    </div>
  );
}
