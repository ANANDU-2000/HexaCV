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
  PanelRightOpen, PanelRightClose, ChevronDown, X, Loader2, Globe, Users, LayoutList, ChevronLeft, ChevronRight,
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
import AISuggestionsPanel from './AISuggestionsPanel';
import ExportPreview from './ExportPreview';

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

const TEMPLATES = [
  { id: 'classic-ats-blue', name: 'Classic ATS Blue', color: 'bg-blue-500' },
  { id: 'modern-clean', name: 'Modern Clean', color: 'bg-emerald-500' },
  { id: 'technical-compact', name: 'Technical Compact', color: 'bg-slate-700' },
  { id: 'creative-bold', name: 'Creative Bold', color: 'bg-violet-500' },
] as const;

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
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [showExportView, setShowExportView] = useState(false);
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

  const handleExportPDF = () => {
    setShowExportView(true);
  };

  const handleSaveToDashboard = async (_resume?: Resume) => {
    onUpdate(localResume);
    toast.success('Resume saved to dashboard!');
  };

  const handleExportDone = () => {
    setShowExportView(false);
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
    <>
      {showExportView ? (
        <ExportPreview
          resume={localResume}
          onBack={handleExportDone}
          onSaveToDashboard={handleSaveToDashboard}
        />
      ) : (
      <div className="flex h-full flex-col bg-background text-foreground">
      {/* ===== TOOLBAR ===== */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-1.5 sm:px-4 shrink-0">
        {/* Left: Undo/Redo + Save status */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
            <Redo className="h-4 w-4" />
          </Button>
          <span className="flex items-center gap-1.5 ml-1 text-[10px] font-medium text-muted-foreground">
            <span className={cn('w-1.5 h-1.5 rounded-full', autoSaveStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400')} />
            {autoSaveStatus === 'saving' ? 'Saving...' : 'All changes saved'}
          </span>
        </div>

        {/* Center: Resume title (editable) */}
        <input
          type="text"
          value={localResume.title}
          onChange={(e) => updateResumeData({ ...localResume, title: e.target.value })}
          className="hidden md:block bg-transparent border-none text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-0 max-w-[240px] truncate"
          placeholder="Untitled Resume"
        />

        {/* Right: AI Suggestions + Export */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
            className={cn('h-8 rounded-lg gap-1.5 text-xs font-medium', aiPanelOpen && 'bg-primary/10 text-primary')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden md:inline">AI Suggestions</span>
          </Button>
          <Button size="sm" onClick={handleExportPDF} className="h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
            <Download className="h-3.5 w-3.5 mr-1" />
            <span className="hidden md:inline">Export PDF</span>
            <span className="md:hidden">PDF</span>
          </Button>
        </div>
      </div>

      {/* ===== MOBILE TAB SWITCHER ===== */}
      <div className="flex border-b border-border md:hidden shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('edit')}
          className={cn('flex-1 py-2.5 text-xs font-semibold text-center transition-colors', mobileTab === 'edit' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground')}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={cn('flex-1 py-2.5 text-xs font-semibold text-center transition-colors', mobileTab === 'preview' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground')}
        >
          Preview
        </button>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel: Form-based section editor */}
        <div className={cn('flex-1 min-w-0 overflow-y-auto', mobileTab === 'preview' && 'hidden md:block')}>
          {/* Mobile section list / Desktop accordion */}
          <div className="p-3 sm:p-4 space-y-2">
            {formSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeEditTab === section.id;
              const isDone = isStepCompleted(section.id);

              return (
                <div key={section.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveEditTab(isActive ? '' : section.id)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg',
                        isDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground',
                      )}>
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{section.label}</span>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isActive && 'rotate-180')} />
                  </button>

                  {isActive && (
                    <div className="border-t border-border px-4 py-4 space-y-4">
                      {/* Section editors */}
                      {section.id === 'header' && (
                        (() => {
                          const h = headerContent;
                          return (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-muted-foreground">Full Name *</Label>
                                  <Input value={h.name || ''} onChange={(e) => { const hd = { ...headerContent, name: e.target.value }; updateSection('header', { header: hd }); }} placeholder="John Doe" className="h-9 text-sm rounded-lg" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-muted-foreground">Email *</Label>
                                  <Input value={h.email || ''} onChange={(e) => { const hd = { ...headerContent, email: e.target.value }; updateSection('header', { header: hd }); }} placeholder="john@example.com" type="email" className="h-9 text-sm rounded-lg" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                                  <Input value={h.phone || ''} onChange={(e) => { const hd = { ...headerContent, phone: e.target.value }; updateSection('header', { header: hd }); }} placeholder="+1 (555) 123-4567" className="h-9 text-sm rounded-lg" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium text-muted-foreground">Location</Label>
                                  <Input value={h.location || ''} onChange={(e) => { const hd = { ...headerContent, location: e.target.value }; updateSection('header', { header: hd }); }} placeholder="San Francisco, CA" className="h-9 text-sm rounded-lg" />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Job Title</Label>
                                <Input value={h.jobTitle || ''} onChange={(e) => { const hd = { ...headerContent, jobTitle: e.target.value }; updateSection('header', { header: hd }); }} placeholder="Software Engineer" className="h-9 text-sm rounded-lg" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Links (one per line, format: label|url)</Label>
                                <Textarea value={(h.links || []).map((l) => `${l.label}|${l.url}`).join('\n')} onChange={(e) => { const hd = { ...headerContent, links: e.target.value.split('\n').filter(Boolean).map(line => { const [label, url] = line.split('|'); return { label: label?.trim() || '', url: url?.trim() || '' }; }) }; updateSection('header', { header: hd }); }} rows={2} className="text-sm rounded-lg" placeholder="LinkedIn|https://linkedin.com/in/..." />
                              </div>
                            </div>
                          );
                        })()
                      )}

                      {section.id === 'summary' && (
                        <div className="space-y-2">
                          <Textarea value={getSectionContent('summary').summary || ''} onChange={(e) => updateSection('summary', { summary: e.target.value })} rows={4} className="text-sm rounded-lg leading-relaxed" placeholder="Professional summary highlighting your key achievements and career goals..." />
                          <Button variant="ghost" size="sm" onClick={handleRewriteSummary} disabled={isRewritingSummary} className="text-xs gap-1.5">
                            {isRewritingSummary ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            {isRewritingSummary ? 'Rewriting...' : 'Rewrite with AI'}
                          </Button>
                        </div>
                      )}

                      {section.id === 'skills' && (
                        <div className="space-y-3">
                          {(() => { const skills = getSectionContent('skills').skills || []; return skills.map((group: any, idx: number) => (
                            <div key={idx} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <Input value={group.category || ''} onChange={(e) => { const s = [...skills]; s[idx] = { ...s[idx], category: e.target.value }; updateSection('skills', { skills: s }); }} placeholder="Category" className="h-8 text-xs rounded-lg max-w-[160px]" />
                                <button type="button" onClick={() => { const s = skills.filter((_: any, i: number) => i !== idx); updateSection('skills', { skills: s }); }} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                              <Textarea value={group.skills.join(', ')} onChange={(e) => { const s = [...skills]; s[idx] = { ...s[idx], skills: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) }; updateSection('skills', { skills: s }); }} rows={2} className="text-xs rounded-lg" placeholder="React, TypeScript, Tailwind CSS" />
                            </div>
                          )); })()}
                          <Button variant="outline" size="sm" onClick={() => { const s = getSectionContent('skills').skills || []; updateSection('skills', { skills: [...s, { category: '', skills: [] }] }); }} className="w-full gap-1.5 text-xs border-dashed">
                            <Plus className="h-3.5 w-3.5" />
                            Add skill category
                          </Button>
                        </div>
                      )}

                      {section.id === 'experience' && (
                        <div className="space-y-3">
                          {(() => { const exps = getSectionContent('experience').experiences || []; return exps.map((exp: any, idx: number) => (
                            <div key={exp.id || idx} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-muted-foreground">Experience #{idx + 1}</span>
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={() => moveItem('experience', idx, 'up')} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                                  <button type="button" onClick={() => moveItem('experience', idx, 'down')} disabled={idx === exps.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                                  <button type="button" onClick={() => { const e = exps.filter((_: any, i: number) => i !== idx); updateSection('experience', { experiences: e }); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={exp.company || ''} onChange={(e) => { const list = [...exps]; list[idx] = { ...list[idx], company: e.target.value }; updateSection('experience', { experiences: list }); }} placeholder="Company" className="h-8 text-xs rounded-lg" />
                                <Input value={exp.role || ''} onChange={(e) => { const list = [...exps]; list[idx] = { ...list[idx], role: e.target.value }; updateSection('experience', { experiences: list }); }} placeholder="Role" className="h-8 text-xs rounded-lg" />
                                <Input value={exp.startDate || ''} onChange={(e) => { const list = [...exps]; list[idx] = { ...list[idx], startDate: e.target.value }; updateSection('experience', { experiences: list }); }} placeholder="Start date" className="h-8 text-xs rounded-lg" />
                                <Input value={exp.endDate || ''} onChange={(e) => { const list = [...exps]; list[idx] = { ...list[idx], endDate: e.target.value }; updateSection('experience', { experiences: list }); }} placeholder="End date" disabled={exp.current} className="h-8 text-xs rounded-lg" />
                              </div>
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <input type="checkbox" checked={exp.current || false} onChange={(e) => { const list = [...exps]; list[idx] = { ...list[idx], current: e.target.checked, endDate: e.target.checked ? 'Present' : list[idx].endDate }; updateSection('experience', { experiences: list }); }} className="rounded" />
                                Currently work here
                              </label>
                              <Textarea value={exp.description?.join('\n') || ''} onChange={(e) => { const list = [...exps]; list[idx] = { ...list[idx], description: e.target.value.split('\n').filter(Boolean) }; updateSection('experience', { experiences: list }); }} rows={3} className="text-xs rounded-lg leading-relaxed" placeholder="One bullet point per line" />
                              <Button variant="ghost" size="sm" onClick={() => handleRewriteExperienceBullets(idx)} disabled={rewritingExpId === (exp.id || String(idx))} className="text-xs gap-1.5">
                                {rewritingExpId === (exp.id || String(idx)) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                Rewrite bullets
                              </Button>
                            </div>
                          )); })()}
                          <Button variant="outline" size="sm" onClick={() => { const e = getSectionContent('experience').experiences || []; updateSection('experience', { experiences: [...e, { id: nanoid(), company: '', role: '', startDate: '', endDate: '', current: false, description: [] }] }); }} className="w-full gap-1.5 text-xs border-dashed">
                            <Plus className="h-3.5 w-3.5" />
                            Add experience
                          </Button>
                        </div>
                      )}

                      {section.id === 'education' && (
                        <div className="space-y-3">
                          {(() => { const edus = getSectionContent('education').educations || []; return edus.map((edu: any, idx: number) => (
                            <div key={edu.id || idx} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-muted-foreground">Education #{idx + 1}</span>
                                <button type="button" onClick={() => { const e = edus.filter((_: any, i: number) => i !== idx); updateSection('education', { educations: e }); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={edu.institution || ''} onChange={(e) => { const list = [...edus]; list[idx] = { ...list[idx], institution: e.target.value }; updateSection('education', { educations: list }); }} placeholder="Institution" className="h-8 text-xs rounded-lg" />
                                <Input value={edu.degree || ''} onChange={(e) => { const list = [...edus]; list[idx] = { ...list[idx], degree: e.target.value }; updateSection('education', { educations: list }); }} placeholder="Degree" className="h-8 text-xs rounded-lg" />
                                <Input value={edu.field || ''} onChange={(e) => { const list = [...edus]; list[idx] = { ...list[idx], field: e.target.value }; updateSection('education', { educations: list }); }} placeholder="Field of study" className="h-8 text-xs rounded-lg" />
                                <Input value={edu.graduationDate || ''} onChange={(e) => { const list = [...edus]; list[idx] = { ...list[idx], graduationDate: e.target.value }; updateSection('education', { educations: list }); }} placeholder="Graduation date" className="h-8 text-xs rounded-lg" />
                              </div>
                            </div>
                          )); })()}
                          <Button variant="outline" size="sm" onClick={() => { const e = getSectionContent('education').educations || []; updateSection('education', { educations: [...e, { id: nanoid(), institution: '', degree: '', field: '', graduationDate: '', gpa: '' }] }); }} className="w-full gap-1.5 text-xs border-dashed">
                            <Plus className="h-3.5 w-3.5" />
                            Add education
                          </Button>
                        </div>
                      )}

                      {section.id === 'certifications' && (
                        <div className="space-y-3">
                          {(() => { const certs = getSectionContent('certifications').certifications || []; return certs.map((cert: any, idx: number) => (
                            <div key={cert.id || idx} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-muted-foreground">Certification #{idx + 1}</span>
                                <button type="button" onClick={() => { const c = certs.filter((_: any, i: number) => i !== idx); updateSection('certifications', { certifications: c }); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={cert.name || ''} onChange={(e) => { const list = [...certs]; list[idx] = { ...list[idx], name: e.target.value }; updateSection('certifications', { certifications: list }); }} placeholder="Certification name" className="h-8 text-xs rounded-lg" />
                                <Input value={cert.issuer || ''} onChange={(e) => { const list = [...certs]; list[idx] = { ...list[idx], issuer: e.target.value }; updateSection('certifications', { certifications: list }); }} placeholder="Issuer" className="h-8 text-xs rounded-lg" />
                              </div>
                            </div>
                          )); })()}
                          <Button variant="outline" size="sm" onClick={() => { const c = getSectionContent('certifications').certifications || []; updateSection('certifications', { certifications: [...c, { id: nanoid(), name: '', issuer: '', date: '', link: '' }] }); }} className="w-full gap-1.5 text-xs border-dashed">
                            <Plus className="h-3.5 w-3.5" />
                            Add certification
                          </Button>
                        </div>
                      )}

                      {section.id === 'achievements' && (
                        <div className="space-y-2">
                          {(() => { const ach = getSectionContent('achievements').achievements || []; return ach.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">No achievements added yet.</p>
                          ) : ach.map((a: string, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 p-2.5">
                              <span className="text-xs text-foreground">{a}</span>
                              <button type="button" onClick={() => { const list = ach.filter((_: string, i: number) => i !== idx); updateSection('achievements', { achievements: list }); }} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-3 w-3" /></button>
                            </div>
                          )); })()}
                          <div className="flex gap-2">
                            <Input id="ach-input" placeholder="Add an achievement..." className="h-9 text-xs rounded-lg flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { const val = (e.target as HTMLInputElement).value.trim(); if (val) { const a = getSectionContent('achievements').achievements || []; updateSection('achievements', { achievements: [...a, val] }); (e.target as HTMLInputElement).value = ''; } } }} />
                          </div>
                        </div>
                      )}

                      {section.id === 'projects' && (
                        <div className="space-y-3">
                          {(() => { const projs = getSectionContent('projects').projects || []; return projs.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">No projects added.</p>
                          ) : projs.map((proj: any, idx: number) => (
                            <div key={proj.id || idx} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">Project #{idx + 1}</span>
                                <button type="button" onClick={() => { const p = projs.filter((_: any, i: number) => i !== idx); updateSection('projects', { projects: p }); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                              <Input value={proj.name || ''} onChange={(e) => { const list = [...projs]; list[idx] = { ...list[idx], name: e.target.value }; updateSection('projects', { projects: list }); }} placeholder="Project name" className="h-8 text-xs rounded-lg" />
                              <Textarea value={proj.description || ''} onChange={(e) => { const list = [...projs]; list[idx] = { ...list[idx], description: e.target.value }; updateSection('projects', { projects: list }); }} rows={2} className="text-xs rounded-lg" placeholder="Brief description" />
                            </div>
                          )); })()}
                          <Button variant="outline" size="sm" onClick={() => { const p = getSectionContent('projects').projects || []; updateSection('projects', { projects: [...p, { id: nanoid(), name: '', description: '', technologies: [], link: '', date: '' }] }); }} className="w-full gap-1.5 text-xs border-dashed">
                            <Plus className="h-3.5 w-3.5" />
                            Add project
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Live Preview with template switcher + zoom */}
        <div className={cn('hidden md:flex flex-col border-l border-border', mobileTab === 'edit' && 'hidden md:flex')}>
          {/* Template switcher */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 overflow-x-auto shrink-0">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id as TemplateId)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-all',
                  selectedTemplate === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                <span className={cn('h-3 w-3 rounded', t.color)} />
                {t.name}
              </button>
            ))}
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div ref={exportPreviewRef}>
              <ResumePreview resume={{ ...localResume, templateId: selectedTemplate }} zoom={zoom} />
            </div>
          </div>

          {/* Zoom control */}
          <div className="flex items-center justify-center gap-2 border-t border-border px-3 py-2 shrink-0">
            <button type="button" onClick={() => setZoom(Math.max(50, zoom - 10))} className="text-muted-foreground hover:text-foreground transition-colors" disabled={zoom <= 50}>
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-medium text-muted-foreground min-w-[32px] text-center tabular-nums">{zoom}%</span>
            <button type="button" onClick={() => setZoom(Math.min(150, zoom + 10))} className="text-muted-foreground hover:text-foreground transition-colors" disabled={zoom >= 150}>
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* AI Suggestions Slide-over Panel */}
        <AISuggestionsPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
      </div>
      </div>
      )}
    </>
  );
}