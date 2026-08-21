import { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs } from "@/shared/ui/tabs";
import {
  Download,
  Eye,
  Edit3,
  Settings,
  Undo,
  Redo,
  Sparkles,
  CheckCircle2,
  User,
  AlignLeft,
  Code,
  Briefcase,
  Folder,
  GraduationCap,
  Award,
  Trophy,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Resume } from "@shared/types";
import { PRESET_JOBS, matchPresetJobByTitle } from "@/lib/jobDescriptions";
import { ensureStandardResumeSections } from "@/lib/resumeSections";
import {
  mergeBulletsAi,
  mergeSummaryAi,
} from "@/lib/userEditedMerge";
import ResumePreview from "./ResumePreview";
import ContextualEditor from "./ContextualEditor";
import PreviewToolbar from "./resume-editor/PreviewToolbar";
import HeaderTab from "./resume-editor/HeaderTab";
import SummaryTab from "./resume-editor/SummaryTab";
import SkillsTab from "./resume-editor/SkillsTab";
import ExperienceTab from "./resume-editor/ExperienceTab";
import ProjectsTab from "./resume-editor/ProjectsTab";
import EducationTab from "./resume-editor/EducationTab";
import MoreTab from "./resume-editor/MoreTab";
import CertificationsTab from "./resume-editor/CertificationsTab";
import LanguagesTab from "./resume-editor/LanguagesTab";
import ReferencesTab from "./resume-editor/ReferencesTab";
import CustomTab from "./resume-editor/CustomTab";
import LayoutTab from "./resume-editor/LayoutTab";
import AchievementsTab from "./resume-editor/AchievementsTab";
import PreviewTab from "./resume-editor/PreviewTab";
import ReviewTab from "./resume-editor/ReviewTab";
import { exportResumeToPDF, exportResumeToDOCX } from "@/lib/pdfExport";
import { buildExportFilename } from "@/lib/exportFilename";
import JdKeywordMatch from "@/components/JdKeywordMatch";
import { getDefaultTemplate } from "@/lib/templates";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const MORE_SECTION_KEYS = [
  "certifications",
  "achievements",
  "languages",
  "references",
  "custom",
  "layout",
] as const;

const WIZARD_STEPS = [
  { id: 1, label: "Header", key: "header", icon: User },
  { id: 2, label: "Summary", key: "summary", icon: AlignLeft },
  { id: 3, label: "Skills", key: "skills", icon: Code },
  { id: 4, label: "Experience", key: "experience", icon: Briefcase },
  { id: 5, label: "Projects", key: "projects", icon: Folder },
  { id: 6, label: "Education", key: "education", icon: GraduationCap },
  { id: 7, label: "More", key: "more", icon: LayoutList },
  { id: 8, label: "Review & Export", key: "review", icon: CheckCircle2 },
  { id: 9, label: "Live Preview", key: "preview", icon: Eye },
];

const FORM_STEPS = WIZARD_STEPS.filter(
  step => step.key !== "review" && step.key !== "preview"
);
const EDITOR_FLOW_STEPS = WIZARD_STEPS.filter(step => step.key !== "preview");

function resolveWizardKey(tab: string): string {
  if ((MORE_SECTION_KEYS as readonly string[]).includes(tab)) return "more";
  return tab;
}

interface ResumeEditorProps {
  resume: Resume;
  onUpdate: (resume: Resume) => void;
}

export default function ResumeEditor({ resume, onUpdate }: ResumeEditorProps) {
  const [localResume, setLocalResume] = useState<Resume>(resume);
  const [selectedJob, setSelectedJob] = useState<string>(
    resume.jobDescriptionId || ""
  );
  const [activeEditTab, setActiveEditTab] = useState<string>("header");
  const [isRewritingSummary, setIsRewritingSummary] = useState<boolean>(false);
  const [rewritingExpId, setRewritingExpId] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<
    "summary" | "bullets" | null
  >(null);
  const improveSummaryMutation = trpc.ai.improveSummary.useMutation();
  const improveBulletsMutation = trpc.ai.improveBullets.useMutation();
  const submitEvaluationMutation = trpc.ai.submitEvaluation.useMutation();

  const sendAiFeedback = async (rating: "up" | "down") => {
    try {
      await submitEvaluationMutation.mutateAsync({
        resumeId: localResume.id,
        stage: "rewrite",
        rating,
      });
      toast.success(
        rating === "up" ? "Thanks — feedback recorded." : "Thanks — we'll use this to improve."
      );
      setFeedbackTarget(null);
    } catch (err: any) {
      toast.error(err?.message || "Could not save feedback");
    }
  };

  // Auto-select target job from parsed job title / target role when not already set
  useEffect(() => {
    if (selectedJob) return;
    const headerSec = resume.sections.find(s => s.type === "header");
    const headerVal = (headerSec?.content.header || {}) as any;
    const matched = matchPresetJobByTitle(
      headerVal.jobTitle,
      headerVal.targetRole
    );
    if (matched) {
      setSelectedJob(matched);
    }
  }, [resume.id]);
  const [zoom, setZoom] = useState<number>(100);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving">(
    "saved"
  );
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [contextualSection, setContextualSection] = useState<string | null>(null);
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
    el.addEventListener("scroll", checkScrollLimits);

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", checkScrollLimits);
    };
  }, []);

  const scrollLeftDirection = () => {
    const el = stepperRef.current;
    if (el) {
      el.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRightDirection = () => {
    const el = stepperRef.current;
    if (el) {
      el.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  // Auto-scroll active tab into view when activeEditTab changes (with layout delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeEl = stepperRef.current?.querySelector(
        `[data-step-key="${activeEditTab}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeEditTab]);

  useEffect(() => {
    if (activeEditTab === "preview" && window.innerWidth < 640 && zoom > 45) {
      setZoom(42);
    }
  }, [activeEditTab, zoom]);

  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [atsRules, setAtsRules] = useState<any>(null);

  const headerContent = (localResume.sections.find(s => s.type === "header")
    ?.content.header || {}) as any;
  const currentCountry = headerContent.countryCode || "";
  const targetCountry = headerContent.targetCountryCode || "";

  useEffect(() => {
    fetch("/countries")
      .then(res => (res.ok ? res.json() : []))
      .then(data => setCountriesList(data))
      .catch(err =>
        console.error("Error fetching countries in ResumeEditor:", err)
      );
  }, []);

  useEffect(() => {
    if (!currentCountry || !targetCountry) {
      setAtsRules(null);
      return;
    }
    fetch(`/country-ats-rules/${currentCountry}/${targetCountry}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => setAtsRules(data))
      .catch(err =>
        console.error("Error fetching ATS rules in ResumeEditor:", err)
      );
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
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        testUrl = "https://" + url;
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

  // Ensure all 10 standard resume sections exist in correct order and sanitize education fields
  useEffect(() => {
    const normalized = ensureStandardResumeSections(resume);
    const orderChanged = normalized.sections.some(
      (s, i) =>
        s.type !== resume.sections[i]?.type ||
        s.order !== resume.sections[i]?.order
    );
    const contentChanged =
      JSON.stringify(normalized.sections) !== JSON.stringify(resume.sections);
    if (orderChanged || contentChanged) {
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
      setHistory(prevHistory => {
        const nextHistory = prevHistory.slice(0, historyIndex + 1);
        const lastEntry = nextHistory[nextHistory.length - 1];
        if (
          lastEntry &&
          JSON.stringify(lastEntry.sections) ===
            JSON.stringify(updated.sections)
        ) {
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
    setAutoSaveStatus("saving");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(updated);
      pushToHistory(updated);
      setAutoSaveStatus("saved");
    }, 1500);
  };

  // Vertical tabs mapping
  const formSections = [
    { id: "header", label: "Contact Info", icon: User },
    { id: "summary", label: "Summary", icon: AlignLeft },
    { id: "skills", label: "Skills", icon: Code },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "projects", label: "Projects", icon: Folder },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "certifications", label: "Certifications", icon: Award },
    { id: "achievements", label: "Achievements", icon: Trophy },
  ];

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      const prev = history[nextIndex];
      setLocalResume(prev);
      onUpdate(prev);
      toast.success("Undo successful");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const next = history[nextIndex];
      setLocalResume(next);
      onUpdate(next);
      toast.success("Redo successful");
    }
  };

  // Contextual editor — clicked section in the live preview opens the slide-out.
  const handleSectionSelect = (type: string) => {
    setContextualSection(type);
    setActiveEditTab(type as any);
  };

  const resolveExportName = (ext: "pdf" | "doc") => {
    const header = localResume.sections.find((s) => s.type === "header")?.content
      ?.header as { name?: string } | undefined;
    const targetRole =
      (localResume as any).targetRole ||
      (localResume as any).jobTitle ||
      undefined;
    return buildExportFilename({
      name: header?.name,
      targetRole,
      titleFallback: localResume.title,
      ext,
    });
  };

  const handleExportPDF = async () => {
    const element = exportPreviewRef.current;
    if (!element) {
      toast.error("Failed to prepare resume preview. Please try again.");
      return;
    }
    const filename = resolveExportName("pdf");
    toast.info(`Downloading ${filename}…`);
    try {
      await exportResumeToPDF(element, filename);
      toast.success(`Downloaded ${filename}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF.");
    }
  };

  const handleExportDOCX = async () => {
    const element = exportPreviewRef.current;
    if (!element) {
      toast.error("Failed to prepare resume preview. Please try again.");
      return;
    }
    const filename = resolveExportName("doc");
    toast.info(`Downloading ${filename}…`);
    try {
      await exportResumeToDOCX(element, filename);
      toast.success(`Downloaded ${filename}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export Word document.");
    }
  };

  // ATS engine score calculation
  const getResumeTextContent = (): string => {
    let text = "";
    localResume.sections.forEach(sec => {
      if (!sec.visible) return;
      if (sec.type === "header" && sec.content.header) {
        const h = sec.content.header;
        text += ` ${h.name} ${h.email} ${h.phone} ${h.location}`;
      } else if (sec.type === "summary" && sec.content.summary) {
        text += ` ${sec.content.summary}`;
      } else if (sec.type === "skills" && sec.content.skills) {
        sec.content.skills.forEach(g => {
          text += ` ${g.category} ${g.skills.join(" ")}`;
        });
      } else if (sec.type === "experience" && sec.content.experiences) {
        sec.content.experiences.forEach(e => {
          text += ` ${e.role} ${e.company} ${e.description.join(" ")}`;
        });
      } else if (sec.type === "projects" && sec.content.projects) {
        sec.content.projects.forEach(p => {
          text += ` ${p.name} ${p.description} ${p.technologies.join(" ")}`;
        });
      } else if (sec.type === "education" && sec.content.educations) {
        sec.content.educations.forEach(edu => {
          text += ` ${edu.institution} ${edu.degree} ${edu.field}`;
        });
      } else if (sec.type === "certifications" && sec.content.certifications) {
        sec.content.certifications.forEach(c => {
          text += ` ${c.name} ${c.issuer}`;
        });
      } else if (sec.type === "languages" && sec.content.languages) {
        sec.content.languages.forEach(l => {
          text += ` ${l.language} ${l.proficiency}`;
        });
      } else if (sec.type === "references" && sec.content.references) {
        sec.content.references.forEach(r => {
          text += ` ${r.name} ${r.company} ${r.title} ${r.email}`;
        });
      } else if (sec.type === "custom" && sec.content.customSections) {
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
    let readabilityScore = 90;

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    // 1. Keyword match - combine job keywords with target country ATS keywords
    const jobKeywords = activeJob ? [...activeJob.keywords] : [];
    let regionalKeywords: string[] = [];
    if (atsRules) {
      const parsedKeywords =
        typeof atsRules.keywords === "string"
          ? JSON.parse(atsRules.keywords)
          : atsRules.keywords;
      if (Array.isArray(parsedKeywords)) {
        regionalKeywords = parsedKeywords;
      }
    }
    const allKeywordsToCheck = Array.from(
      new Set([...jobKeywords, ...regionalKeywords])
    );

    if (allKeywordsToCheck.length > 0) {
      allKeywordsToCheck.forEach(keyword => {
        if (resumeText.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        } else {
          missingKeywords.push(keyword);
        }
      });
      keywordScore = Math.round(
        (matchedKeywords.length / allKeywordsToCheck.length) * 100
      );
    } else {
      keywordScore = 100; // No keywords to check
    }

    // 2. Completeness score
    const importantSections = [
      "header",
      "summary",
      "skills",
      "experience",
      "education",
    ];
    let filledCount = 0;
    importantSections.forEach(type => {
      const sec = localResume.sections.find(s => s.type === type);
      if (sec && sec.visible) {
        if (type === "header" && sec.content.header?.name) filledCount++;
        if (type === "summary" && sec.content.summary) filledCount++;
        if (
          type === "skills" &&
          sec.content.skills &&
          sec.content.skills.length > 0
        )
          filledCount++;
        if (
          type === "experience" &&
          sec.content.experiences &&
          sec.content.experiences.length > 0
        )
          filledCount++;
        if (
          type === "education" &&
          sec.content.educations &&
          sec.content.educations.length > 0
        )
          filledCount++;
      }
    });
    completenessScore = Math.round(
      (filledCount / importantSections.length) * 100
    );

    // 3. Readability & Formatting — Classic ATS Blue

    // 4. Localization Validation & regional hiring alignment checks
    const locationErrors: string[] = [];
    let phoneFormatError = "";

    const headerSec = localResume.sections.find(s => s.type === "header");
    const headerVal = (headerSec?.content.header || {}) as any;
    const fields = (headerVal.locationFields || {}) as any;
    const targetCode = headerVal.targetCountryCode;
    const currentCode = headerVal.countryCode;

    if (targetCode && countriesList.length > 0) {
      const targetC = countriesList.find(c => c.code === targetCode);
      if (targetC) {
        const expectedFields = targetC.locationFields || [];
        const hasState = expectedFields.some((f: any) => f.key === "state");
        const hasDistrict = expectedFields.some(
          (f: any) => f.key === "district"
        );
        const hasEmirate = expectedFields.some((f: any) => f.key === "emirate");
        const hasCounty = expectedFields.some((f: any) => f.key === "county");
        const hasPostal = expectedFields.some(
          (f: any) => f.key === "postalCode"
        );

        if (hasState && !fields.state) {
          locationErrors.push(
            `Missing State for target country ${targetC.name}.`
          );
        }
        if (hasDistrict && !fields.district) {
          locationErrors.push(
            `Missing District for target country ${targetC.name}.`
          );
        }
        if (hasEmirate && !fields.emirate) {
          locationErrors.push(
            `Missing Emirate for target country ${targetC.name}.`
          );
        }
        if (hasCounty && !fields.county) {
          locationErrors.push(
            `Missing County for target country ${targetC.name}.`
          );
        }
        if (!fields.city) {
          locationErrors.push(
            `Missing City for target country ${targetC.name}.`
          );
        }
        if (hasPostal) {
          if (!fields.postalCode) {
            locationErrors.push(
              `Missing ${targetC.postalCodeLabel || "Postal Code"} for target country ${targetC.name}.`
            );
          } else if (
            targetC.code === "US" &&
            !/^\d{5}(-\d{4})?$/.test(fields.postalCode)
          ) {
            locationErrors.push(
              `ZIP Code format invalid for United States (expected 5 digits).`
            );
          } else if (
            targetC.code === "IN" &&
            !/^\d{6}$/.test(fields.postalCode)
          ) {
            locationErrors.push(
              `PIN Code format invalid for India (expected 6 digits).`
            );
          }
        }
      }
    }

    if (currentCode && headerVal.phone && countriesList.length > 0) {
      const currentC = countriesList.find(c => c.code === currentCode);
      if (currentC && currentC.phoneRegex) {
        const num = headerVal.phone;
        const dial = currentC.dialCode;
        const localNum = num.startsWith(dial)
          ? num.slice(dial.length).trim()
          : num.trim();
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

    const overallScore =
      activeJob || regionalKeywords.length > 0
        ? Math.round(
            keywordScore * 0.5 +
              completenessScore * 0.3 +
              readabilityScore * 0.2
          )
        : Math.round(completenessScore * 0.7 + readabilityScore * 0.3);

    // Improvement suggestions
    const suggestions: string[] = [];
    if (missingKeywords.length > 0) {
      suggestions.push(
        `Add missing keywords: ${missingKeywords.slice(0, 4).join(", ")}`
      );
    }
    if (completenessScore < 100) {
      suggestions.push(
        "Complete empty core sections (Header, Summary, Experience, Education)"
      );
    }
    if (!selectedJob && regionalKeywords.length === 0) {
      suggestions.push(
        "Select a target job description to get tailored keyword suggestions."
      );
    }

    // Add target country warnings
    locationErrors.forEach(err => suggestions.push(err));
    if (phoneFormatError) {
      suggestions.push(phoneFormatError);
    }

    // Add regional hiring expectations as tips
    if (atsRules?.regionalHiringExpectations) {
      suggestions.push(
        `Hiring market tips for ${countriesList.find(c => c.code === targetCountry)?.name || targetCountry}: ${atsRules.regionalHiringExpectations}`
      );
    }
    if (atsRules?.preferredFormatting) {
      suggestions.push(
        `Preferred layout for ${countriesList.find(c => c.code === targetCountry)?.name || targetCountry}: ${atsRules.preferredFormatting}`
      );
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
    const updatedSections = localResume.sections.map(sec => {
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
    return localResume.sections.find(s => s.type === type)?.content || {};
  };

  // Check section completeness for stepper checklist icons
  const isStepCompleted = (stepKey: string): boolean => {
    switch (stepKey) {
      case "header": {
        const h = getSectionContent("header").header || {};
        return !!(h.name?.trim() && h.email?.trim());
      }
      case "summary":
        return !!getSectionContent("summary").summary?.trim();
      case "skills": {
        const s = getSectionContent("skills").skills || [];
        return (
          s.length > 0 && s.some((g: any) => g.skills && g.skills.length > 0)
        );
      }
      case "experience": {
        const e = getSectionContent("experience").experiences || [];
        return (
          e.length > 0 &&
          e.some((x: any) => x.company?.trim() && x.role?.trim())
        );
      }
      case "projects": {
        const p = getSectionContent("projects").projects || [];
        return p.length > 0 && p.some((pr: any) => pr.name?.trim());
      }
      case "education": {
        const edu = getSectionContent("education").educations || [];
        return (
          edu.length > 0 &&
          edu.some((ed: any) => ed.institution?.trim() && ed.degree?.trim())
        );
      }
      case "certifications": {
        const cert = getSectionContent("certifications").certifications || [];
        return cert.length > 0 && cert.some((c: any) => c.name?.trim());
      }
      case "achievements": {
        const ach = getSectionContent("achievements").achievements || [];
        return ach.length > 0;
      }
      case "languages": {
        const lang = getSectionContent("languages").languages || [];
        return lang.length > 0 && lang.some((l: any) => l.language?.trim());
      }
      case "references": {
        const ref = getSectionContent("references").references || [];
        return ref.length > 0;
      }
      case "custom": {
        const cust = getSectionContent("custom").customSections || [];
        return cust.length > 0 && cust.some((c: any) => c.title?.trim());
      }
      case "more":
        return MORE_SECTION_KEYS.some(k => {
          if (k === "layout") return true;
          return isStepCompleted(k);
        });
      case "layout":
      case "preview":
      case "review":
        return true; // Always considered complete
      default:
        return false;
    }
  };

  // Reorder list items (experience, project, education, language, reference, etc.)
  const moveItem = (
    sectionType: string,
    index: number,
    direction: "up" | "down"
  ) => {
    const content = getSectionContent(sectionType);
    let listKey = "";
    if (sectionType === "experience") listKey = "experiences";
    else if (sectionType === "projects") listKey = "projects";
    else if (sectionType === "education") listKey = "educations";
    else if (sectionType === "certifications") listKey = "certifications";
    else if (sectionType === "languages") listKey = "languages";
    else if (sectionType === "references") listKey = "references";
    else if (sectionType === "custom") listKey = "customSections";

    if (!listKey) return;

    const list = [...(content[listKey] || [])];
    if (direction === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }

    updateSection(sectionType, { [listKey]: list });
  };

  // Reorder entire sections (e.g. move Skills above Summary)
  const moveSection = (index: number, direction: "up" | "down") => {
    const sorted = [...localResume.sections].sort((a, b) => a.order - b.order);
    if (direction === "up" && index > 0) {
      const temp = sorted[index].order;
      sorted[index].order = sorted[index - 1].order;
      sorted[index - 1].order = temp;
    } else if (direction === "down" && index < sorted.length - 1) {
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
    const updated = localResume.sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, visible: !s.visible };
      }
      return s;
    });
    updateResumeData({ ...localResume, sections: updated });
  };

  const handleRewriteSummary = async (force = false) => {
    const summaryContent = getSectionContent("summary");
    const currentSummary = summaryContent.summary || "";
    const activeJob = PRESET_JOBS.find(j => j.id === selectedJob);
    const jobDescription = activeJob ? activeJob.description : "";

    if (!jobDescription) {
      toast.error(
        "Please select a Target Job at the top right first to tailor your summary."
      );
      return;
    }

    if (!currentSummary.trim()) {
      toast.error(
        "Add a professional summary from your resume before rewriting."
      );
      return;
    }

    if (summaryContent.summaryUserEdited && !force) {
      const overwrite = window.confirm(
        "Your summary was edited manually and is protected. Overwrite with AI?"
      );
      if (!overwrite) {
        toast.message("Protected — summary kept (edited by you).");
        return;
      }
      force = true;
    }

    setIsRewritingSummary(true);
    try {
      const headerSec = localResume.sections.find(s => s.type === "header");
      const headerVal = (headerSec?.content.header || {}) as any;

      const rewritten = await improveSummaryMutation.mutateAsync({
        currentSummary,
        jobDescription,
        jobTitle: headerVal.jobTitle || headerVal.title || "",
        targetRole: headerVal.targetRole || headerVal.jobTitle || "",
        countryCode: headerVal.countryCode || "",
        targetCountryCode: headerVal.targetCountryCode || "",
      });

      if (rewritten) {
        const merged = mergeSummaryAi(
          currentSummary,
          rewritten,
          summaryContent.summaryUserEdited,
          force
        );
        if (merged.blocked) {
          toast.message("Protected — summary kept (edited by you).");
          return;
        }
        updateSection("summary", {
          summary: merged.text,
          summaryUserEdited: merged.summaryUserEdited,
        });
        setFeedbackTarget("summary");
        toast.success("Summary rewritten and optimized with AI!");
      }
    } catch (err: any) {
      console.error("Error rewriting summary:", err);
      toast.error(err?.message || "Failed to rewrite summary with AI.");
    } finally {
      setIsRewritingSummary(false);
    }
  };

  const handleRewriteExperienceBullets = async (
    expIndex: number,
    force = false
  ) => {
    const activeJob = PRESET_JOBS.find(j => j.id === selectedJob);
    const jobDescription = activeJob ? activeJob.description : "";

    if (!jobDescription) {
      toast.error(
        "Please select a Target Job first to tailor experience bullets."
      );
      return;
    }

    const experiences = getSectionContent("experience").experiences || [];
    const exp = experiences[expIndex];
    if (!exp || !exp.description?.length) {
      toast.error("Add at least one bullet point before rewriting.");
      return;
    }

    const hasProtected = (exp.descriptionEdited || []).some(Boolean);
    if (hasProtected && !force) {
      const overwrite = window.confirm(
        "Some bullets were edited manually and are protected. Overwrite all with AI?"
      );
      if (!overwrite) {
        toast.message("Protected — your edited bullets were kept.");
        return;
      }
      force = true;
    }

    const headerSec = localResume.sections.find(s => s.type === "header");
    const headerVal = (headerSec?.content.header || {}) as any;

    setRewritingExpId(exp.id || String(expIndex));
    try {
      const improved = await improveBulletsMutation.mutateAsync({
        role: exp.role || "",
        company: exp.company || "",
        currentBullets: exp.description,
        jobDescription,
        jobTitle: headerVal.jobTitle || "",
        targetRole: headerVal.targetRole || headerVal.jobTitle || "",
        countryCode: headerVal.countryCode || "",
        targetCountryCode: headerVal.targetCountryCode || "",
      });

      const merged = mergeBulletsAi(
        exp.description,
        improved,
        exp.descriptionEdited,
        force
      );
      if (merged.blockedCount > 0 && merged.appliedCount === 0) {
        toast.message("Protected — your edited bullets were kept.");
        return;
      }
      if (merged.blockedCount > 0) {
        toast.message(
          `Protected ${merged.blockedCount} edited bullet(s); updated ${merged.appliedCount}.`
        );
      } else {
        toast.success(
          "Experience bullets rewritten using your job title and target role."
        );
      }

      const list = [...experiences];
      list[expIndex] = {
        ...exp,
        description: merged.bullets,
        descriptionEdited: merged.flags,
      };
      updateSection("experience", { experiences: list });
      if (merged.appliedCount > 0 || force) {
        setFeedbackTarget("bullets");
      }
    } catch (err: any) {
      console.error("Error rewriting bullets:", err);
      toast.error(err?.message || "Failed to rewrite experience bullets.");
    } finally {
      setRewritingExpId(null);
    }
  };

  const resolvedTab = resolveWizardKey(activeEditTab);
  const activeFlowIndex =
    activeEditTab === "preview"
      ? EDITOR_FLOW_STEPS.length - 1
      : Math.max(
          0,
          EDITOR_FLOW_STEPS.findIndex(s => s.key === resolvedTab)
        );
  const formStepIndex = Math.max(
    0,
    FORM_STEPS.findIndex(s => s.key === resolvedTab)
  );
  const isFinalFlowStep =
    activeEditTab === "preview" ||
    resolvedTab === EDITOR_FLOW_STEPS[EDITOR_FLOW_STEPS.length - 1].key;

  return (
    <div className="w-full h-full font-sans text-foreground pb-[72px] lg:pb-0">
      {/* Editor workspace */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
        <div className="w-full flex flex-col gap-2 sm:gap-3 h-full min-h-0">
          <JdKeywordMatch
            jobDescription={
              (() => {
                try {
                  const meta = sessionStorage.getItem("hexacv_pipeline_meta");
                  if (!meta) return null;
                  const parsed = JSON.parse(meta) as { targetKeywords?: string[] };
                  // Prefer live JD from target draft
                  const draft = localStorage.getItem("hexacv_target_panel_draft");
                  if (draft) {
                    const d = JSON.parse(draft) as { jobDescription?: string };
                    if (d.jobDescription) return d.jobDescription;
                  }
                  return (parsed.targetKeywords || []).join(" ");
                } catch {
                  return null;
                }
              })()
            }
            resumeText={getResumeTextContent()}
            regionTips={
              (() => {
                try {
                  const draft = localStorage.getItem("hexacv_target_panel_draft");
                  if (!draft) return null;
                  const d = JSON.parse(draft) as { market?: string };
                  if (d.market === "Gulf") {
                    return "Gulf tip: include visa/nationality only if you supplied it.";
                  }
                  if (d.market === "India") {
                    return "India tip: keep structure clear and ATS keywords grounded in your experience.";
                  }
                  return null;
                } catch {
                  return null;
                }
              })()
            }
          />
          {/* Toggle Mode header on mobile, regular title + quick settings on desktop */}
          <div
            className={cn(
              "glass-panel border border-border rounded-xl shadow-sm shrink-0 overflow-hidden",
              activeEditTab === "preview" && "lg:block"
            )}
          >
            {/* Row 1: Title + Action Buttons */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 group/title">
                    <input
                      type="text"
                      value={localResume.title}
                      onChange={e =>
                        updateResumeData({
                          ...localResume,
                          title: e.target.value,
                        })
                      }
                      className="bg-transparent border-none p-0 m-0 font-bold text-foreground text-sm leading-tight focus:ring-0 focus:outline-none focus:border-b focus:border-primary w-full max-w-[180px] sm:max-w-[260px] truncate"
                      placeholder="Resume Title"
                    />
                    <Edit3 className="w-3.5 h-3.5 text-muted-foreground opacity-50 group-hover/title:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Auto-saved
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {activeEditTab === "review"
                        ? "Review & Export"
                        : activeEditTab === "preview"
                          ? "Live Preview"
                          : `Step ${formStepIndex + 1}/${FORM_STEPS.length}`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 border-border rounded-lg bg-card hover:bg-muted"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo"
                >
                  <Undo className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 border-border rounded-lg bg-card hover:bg-muted"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo"
                >
                  <Redo className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
            {/* Row 2: Layout + Target Job */}
            <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 bg-muted">
              <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg py-1 px-2.5 shadow-xs">
                <Settings className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-bold text-foreground">
                  ATS Emerald
                </span>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                  Target:
                </span>
                <Select
                  value={selectedJob}
                  onValueChange={v => {
                    setSelectedJob(v);
                    updateResumeData({ ...localResume, jobDescriptionId: v });
                  }}
                >
                  <SelectTrigger
                    id="quick-job-select"
                    className="h-8 text-[11px] font-semibold rounded-lg border-border bg-card text-foreground min-w-0 w-full max-w-[210px] shadow-xs"
                  >
                    <SelectValue placeholder="Select target job..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {PRESET_JOBS.map(j => (
                      <SelectItem
                        key={j.id}
                        value={j.id}
                        className="text-xs text-foreground focus:bg-muted focus:text-foreground"
                      >
                        {j.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Editor Card with guided steps */}
          <Card className="glass-panel border-border overflow-hidden flex flex-col flex-1 min-h-0 bg-muted shadow-sm p-0 rounded-xl">
            {/* Horizontal Stepper Progress Indicator (Visible only during editor steps 1-12) */}
            {FORM_STEPS.some(s => s.key === activeEditTab) ? (
              <div className="relative group/stepper shrink-0 w-full overflow-hidden">
                {/* Left Scroll Button */}
                <button
                  type="button"
                  onClick={scrollLeftDirection}
                  className={cn(
                    "absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-card/90 shadow-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm",
                    canScrollLeft
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {/* Left Gradient Fade Overlay */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-muted via-muted/70 to-transparent pointer-events-none z-10 transition-opacity duration-300",
                    canScrollLeft ? "opacity-100" : "opacity-0"
                  )}
                />

                {/* Scrollable Steps Wrapper */}
                <div
                  ref={stepperRef}
                  className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth px-8 py-3 bg-muted backdrop-blur-sm border-b border-border select-none"
                >
                  {FORM_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isDone = isStepCompleted(step.key);
                    const isActive =
                      resolvedTab === step.key ||
                      (step.key === "more" &&
                        (MORE_SECTION_KEYS as readonly string[]).includes(
                          activeEditTab
                        ));

                    return (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 shrink-0"
                      >
                        <button
                          type="button"
                          data-step-key={step.key}
                          onClick={() => setActiveEditTab(step.key)}
                          className={cn(
                            "flex items-center gap-2 p-1.5 px-3 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer",
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                              : isDone
                                ? "bg-success/10 text-success border-success/30 hover:bg-success/15"
                                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black border",
                              isActive
                                ? "bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground"
                                : isDone
                                  ? "bg-success/10 border-success/30 text-success"
                                  : "bg-muted border-border text-muted-foreground"
                            )}
                          >
                            {isDone ? "✓" : step.id}
                          </span>
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{step.label}</span>
                        </button>
                        {idx < FORM_STEPS.length - 1 && (
                          <div
                            className={cn(
                              "w-4 h-[2px] rounded-full shrink-0",
                              isDone
                                ? "bg-success"
                                : "bg-border"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right Gradient Fade Overlay */}
                <div
                  className={cn(
                    "absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-muted via-muted/70 to-transparent pointer-events-none z-10 transition-opacity duration-300",
                    canScrollRight ? "opacity-100" : "opacity-0"
                  )}
                />

                {/* Right Scroll Button */}
                <button
                  type="button"
                  onClick={scrollRightDirection}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-card/90 shadow-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm",
                    canScrollRight
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none"
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Premium Phase Tracker for review and mobile preview */
              <div
                className={cn(
                  "items-center justify-center gap-3 py-3 bg-muted border-b border-border select-none text-[11px] font-bold shrink-0 overflow-x-auto px-3",
                  activeEditTab === "preview" ? "hidden lg:flex" : "flex"
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveEditTab("header")}
                  className="flex items-center gap-2 text-success hover:opacity-85 transition-opacity"
                >
                  <span className="w-5 h-5 rounded-full bg-success/10 border border-success/30 flex items-center justify-center text-[10px] font-black">
                    ✓
                  </span>
                  <span>1. Resume Editor</span>
                </button>
                <div className="w-8 h-[2px] bg-success" />

                <button
                  type="button"
                  onClick={() => setActiveEditTab("review")}
                  className={cn(
                    "flex items-center gap-2 transition-opacity hover:opacity-85",
                    activeEditTab === "review"
                      ? "text-primary"
                      : "text-success"
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                      activeEditTab === "review"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-success/10 border-success/30 text-success"
                    )}
                  >
                    {activeEditTab === "review" ? "2" : "✓"}
                  </span>
                  <span>2. Review & Export</span>
                </button>
                <div
                  className={cn(
                    "w-8 h-[2px] lg:hidden",
                    activeEditTab === "preview"
                      ? "bg-success"
                      : "bg-border"
                  )}
                />

                <button
                  type="button"
                  onClick={() => setActiveEditTab("preview")}
                  className={cn(
                    "flex items-center gap-2 transition-opacity hover:opacity-85 lg:hidden",
                    activeEditTab === "preview"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                      activeEditTab === "preview"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    3
                  </span>
                  <span>3. Live Preview</span>
                </button>
              </div>
            )}

            <div
              className={cn(
                "flex-1 overflow-y-auto h-full min-h-0",
                activeEditTab === "preview"
                  ? "px-0 py-0 sm:px-5 sm:py-4"
                  : "px-4 sm:px-5 py-4"
              )}
            >
              <Tabs
                value={activeEditTab}
                onValueChange={setActiveEditTab}
                className="w-full h-full"
              >
                <HeaderTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                  isValidEmail={isValidEmail}
                  isValidUrl={isValidUrl}
                />

                <SummaryTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                  handleRewriteSummary={handleRewriteSummary}
                  isRewritingSummary={isRewritingSummary}
                  feedbackTarget={feedbackTarget}
                  isFeedbackPending={submitEvaluationMutation.isPending}
                  sendAiFeedback={sendAiFeedback}
                />

                <SkillsTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                />

                <ExperienceTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                  moveItem={moveItem}
                  feedbackTarget={feedbackTarget}
                  sendAiFeedback={sendAiFeedback}
                  isFeedbackPending={submitEvaluationMutation.isPending}
                  rewritingExpId={rewritingExpId}
                  handleRewriteExperienceBullets={handleRewriteExperienceBullets}
                />

                <ProjectsTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                  moveItem={moveItem}
                  isValidUrl={isValidUrl}
                />

                <EducationTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                  moveItem={moveItem}
                />

                <MoreTab
                  setActiveEditTab={setActiveEditTab}
                />

                <CertificationsTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                  moveItem={moveItem}
                  isValidUrl={isValidUrl}
                />

                <LanguagesTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                  moveItem={moveItem}
                />

                <ReferencesTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                  moveItem={moveItem}
                  isValidEmail={isValidEmail}
                  isValidPhone={isValidPhone}
                />

                <CustomTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                  moveItem={moveItem}
                />

                <LayoutTab
                  moveSection={moveSection}
                  toggleSectionVisibility={toggleSectionVisibility}
                  localResume={localResume}
                />

                <AchievementsTab
                  getSectionContent={getSectionContent}
                  updateSection={updateSection}
                />

                <PreviewTab
                  localResume={localResume}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  handleSectionSelect={handleSectionSelect}
                />

                <ReviewTab
                  atsSummary={atsSummary}
                  setShowDownloadModal={setShowDownloadModal}
                />
              </Tabs>
            </div>

            {/* Wizard Navigation Footer */}
            <div className="hidden sm:block shrink-0 border-t border-border">
              {/* Mini progress bar */}
              <div className="h-0.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out rounded-r-full"
                  style={{
                    width: `${((activeFlowIndex + 1) / EDITOR_FLOW_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <div className="bg-muted/80 backdrop-blur-sm px-5 py-3 flex justify-between items-center">
                <Button
                  variant="outline"
                  disabled={activeEditTab === "header"}
                  onClick={() => {
                    if (activeEditTab === "preview") {
                      setActiveEditTab("review");
                      return;
                    }
                    if (activeFlowIndex > 0) {
                      setActiveEditTab(
                        EDITOR_FLOW_STEPS[activeFlowIndex - 1].key
                      );
                    }
                  }}
                  className="border-border text-muted-foreground bg-muted hover:bg-muted hover:text-foreground font-semibold gap-1.5 px-4 h-9 rounded-lg text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </Button>

                <div className="flex items-center gap-1.5">
                  {activeEditTab !== "review" && activeEditTab !== "preview"
                    ? FORM_STEPS.map(step => (
                        <div
                          key={step.id}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            activeEditTab === step.key ||
                            (step.key === "more" &&
                              (MORE_SECTION_KEYS as readonly string[]).includes(
                                activeEditTab
                              ))
                              ? "w-4 bg-primary"
                              : isStepCompleted(step.key)
                                ? "bg-primary/40"
                                : "bg-border"
                          )}
                        />
                      ))
                    : ["review", "preview"].map(key => (
                        <div
                          key={key}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            key === "preview" && "lg:hidden",
                            activeEditTab === key
                              ? "w-4 bg-primary"
                              : "bg-primary/40"
                          )}
                        />
                      ))}
                </div>

                <Button
                  onClick={() => {
                    if (isFinalFlowStep) {
                      setShowDownloadModal(true);
                    } else if (activeFlowIndex < EDITOR_FLOW_STEPS.length - 1) {
                      setActiveEditTab(
                        EDITOR_FLOW_STEPS[activeFlowIndex + 1].key
                      );
                    } else {
                      setShowDownloadModal(true);
                    }
                  }}
                  className="font-semibold gap-1.5 px-4 h-9 rounded-lg text-xs shadow-sm transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
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

        <aside className="hidden lg:flex min-h-0 h-full flex-col overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
          <PreviewToolbar
            variant="desktop"
            zoom={zoom}
            onZoomChange={setZoom}
            subtitle="Updates instantly while you edit."
          />
          <div className="flex-1 min-h-0 overflow-hidden">
            <ResumePreview
              resume={localResume}
              templateId={getDefaultTemplate().id}
              zoom={zoom}
              contentId="resume-preview-desktop"
              onSectionSelect={handleSectionSelect}
            />
          </div>
        </aside>
      </div>

      <div
        aria-hidden="true"
        className="fixed left-[-10000px] top-0 h-[1200px] w-[900px] overflow-visible bg-white pointer-events-none"
      >
        <ResumePreview
          resume={localResume}
          templateId={getDefaultTemplate().id}
          zoom={100}
          contentRef={exportPreviewRef}
          contentId="resume-pdf-content"
        />
      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-md p-4 animate-fade-in">
          <Card className="w-full max-w-2xl border border-border shadow-2xl bg-card rounded-2xl overflow-hidden animate-scale-up">
            {/* Header Section */}
            <div className="p-6 md:p-8 flex flex-col items-center text-center relative border-b border-border">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg font-bold outline-none"
              >
                ✕
              </button>

              <div className="w-20 h-20 mb-4 relative flex items-center justify-center">
                <svg
                  className="w-16 h-16 mx-auto text-success relative z-10"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="50"
                    cy="50"
                    fill="none"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  <path
                    d="M30 50 L45 65 L70 35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="100"
                    strokeDashoffset="0"
                  />
                </svg>
                <div className="absolute inset-0 bg-success/10 rounded-full -z-0 scale-110 blur-xs"></div>
              </div>

              <h3 className="text-2xl font-extrabold text-foreground">
                Resume Completed!
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md font-semibold">
                Your ATS-optimized resume has been generated and is ready to
                share.
              </p>
            </div>

            {/* Match Summary Card */}
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="bg-muted border border-border rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
                {/* Circular Progress Dial */}
                <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      className="text-border stroke-current"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="40"
                      strokeWidth="8"
                    ></circle>
                    <circle
                      className="text-success stroke-current transition-all duration-1000 ease-out"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="40"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - atsSummary.score / 100)}
                      strokeLinecap="round"
                      strokeWidth="8"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-bold text-foreground">
                      {atsSummary.score}%
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Match
                    </span>
                  </div>
                </div>

                {/* Metadata text */}
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-4 h-4 text-success" />
                    ATS Optimization Score:{" "}
                    {atsSummary.score >= 70
                      ? "High"
                      : atsSummary.score >= 40
                        ? "Medium"
                        : "Low"}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                      <span>
                        {atsSummary.matchedKeywords.length} matching keywords
                        found.
                      </span>
                    </li>
                    <li className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                      <span>All key sections populated accurately.</span>
                    </li>
                  </ul>

                  {atsSummary.matchedKeywords.length > 0 && (
                    <div className="pt-1 flex flex-wrap justify-center sm:justify-start gap-1.5">
                      {atsSummary.matchedKeywords.slice(0, 4).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-success/10 text-success border border-success/20 rounded-md font-semibold text-[10px]"
                        >
                          {kw}
                        </span>
                      ))}
                      {atsSummary.matchedKeywords.length > 4 && (
                        <span className="px-2.5 py-1 bg-muted text-muted-foreground border border-border rounded-md font-semibold text-[10px]">
                          +{atsSummary.matchedKeywords.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleExportPDF}
                  className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 h-12 rounded-lg shadow-md transition-all flex items-center justify-center border-none"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Format
                </Button>
                <Button
                  onClick={handleExportDOCX}
                  variant="outline"
                  className="w-full sm:flex-1 border border-border hover:border-primary text-foreground bg-card hover:bg-muted font-bold gap-2 h-12 rounded-lg transition-all flex items-center justify-center"
                >
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Download Word (DOCX)
                </Button>
              </div>
            </CardContent>

            {/* Footer */}
            <div className="bg-muted border-t border-border px-6 py-4 flex justify-between items-center">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1 bg-transparent border-none outline-none"
              >
                ← Go back to editor
              </button>
              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  window.location.search = "?mode=upload";
                }}
                className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1 bg-transparent border-none outline-none"
              >
                Start a new CV +
              </button>
            </div>
          </Card>
        </div>
      )}
      {/* Mobile Bottom Navigation Bar (Stitch Light theme compliant mockup mapped actions) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-background/95 text-muted-foreground backdrop-blur-xl border-t border-border shadow-lg flex justify-around items-center px-3 pt-2 pb-3 lg:hidden">
        {/* Layout/Templates button */}
        <button
          type="button"
          onClick={() => {
            setActiveEditTab("layout");
          }}
          className={cn(
            "flex min-h-[44px] flex-col items-center justify-center p-2 rounded-xl gap-1 min-w-[64px] transition-all duration-200 active:scale-95 cursor-pointer border-none bg-transparent",
            activeEditTab === "layout"
              ? "text-primary bg-primary/10 font-bold"
              : "hover:text-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Layout</span>
        </button>

        {/* Editor Button */}
        <button
          type="button"
          onClick={() => {
            if (
              activeEditTab === "layout" ||
              activeEditTab === "preview" ||
              activeEditTab === "review"
            ) {
              setActiveEditTab("header");
            }
          }}
          className={cn(
            "flex min-h-[44px] flex-col items-center justify-center p-2 rounded-xl gap-1 min-w-[64px] transition-all duration-200 active:scale-95 cursor-pointer border-none bg-transparent",
            activeEditTab !== "layout" &&
              activeEditTab !== "preview" &&
              activeEditTab !== "review"
              ? "text-primary bg-primary/10 font-bold"
              : "hover:text-foreground"
          )}
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Editor</span>
        </button>

        {/* Preview Button */}
        <button
          type="button"
          onClick={() => setActiveEditTab("preview")}
          className={cn(
            "flex min-h-[44px] flex-col items-center justify-center p-2 rounded-xl gap-1 min-w-[64px] transition-all duration-200 active:scale-95 cursor-pointer border-none bg-transparent",
            activeEditTab === "preview"
              ? "text-primary bg-primary/10 font-bold"
              : "hover:text-foreground"
          )}
        >
          <Eye className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Preview</span>
        </button>

        {/* Export Button */}
        <button
          type="button"
          onClick={() => setActiveEditTab("review")}
          className={cn(
            "flex min-h-[44px] flex-col items-center justify-center p-2 rounded-xl gap-1 min-w-[64px] transition-all duration-200 active:scale-95 cursor-pointer border-none bg-transparent",
            activeEditTab === "review"
              ? "text-primary bg-primary/10 font-bold"
              : "hover:text-foreground"
          )}
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Export</span>
        </button>
      </nav>

      {/* Contextual editor — slides over the preview when a section is clicked */}
      <ContextualEditor
        resume={localResume}
        sectionType={contextualSection}
        onClose={() => setContextualSection(null)}
        onUpdateSection={updateSection}
        onRewriteSummary={() => void handleRewriteSummary()}
        onRewriteBullets={(idx) => void handleRewriteExperienceBullets(idx)}
        onJumpToEdit={(tab) => {
          setContextualSection(null);
          setActiveEditTab(tab as any);
        }}
        isRewritingSummary={isRewritingSummary}
        rewritingExpId={rewritingExpId}
      />
    </div>
  );
}
