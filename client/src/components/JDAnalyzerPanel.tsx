import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Briefcase, RefreshCw, ChevronDown, ChevronRight, FileText,
  CheckCircle2, AlertCircle, Lightbulb, Target, GraduationCap,
  Award, List, Wrench, Users, TrendingUp, MapPin,
} from "lucide-react";
import { toast } from "sonner";

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

type AnalysisResult = any; // JdAnalysis shape from server

export default function JDAnalyzerPanel() {
  const [jobDescription, setJobDescription] = useState("");
  const [targetCountry, setTargetCountry] = useState("");
  const [providedJobTitle, setProvidedJobTitle] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = trpc.ai.analyzeJobDescription.useMutation();

  const handleAnalyze = async () => {
    const trimmed = jobDescription.trim();
    if (!trimmed) { toast.error("Please paste a job description"); return; }
    if (trimmed.length > 100_000) {
      toast.error("Job description exceeds the 100,000 character limit.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    try {
      const data = await analyzeMutation.mutateAsync({
        jobDescription: trimmed,
        targetCountryCode: targetCountry.trim()
          ? targetCountry.trim().toUpperCase().slice(0, 2)
          : undefined,
        providedJobTitle: providedJobTitle.trim() || undefined,
      });
      setResult(data.analysis);
      toast.success("JD analysis complete!");
    } catch (err: any) {
      const code = err?.data?.code;
      const msg = err?.message || "";
      if (code === "UNAUTHORIZED" || /sign in/i.test(msg)) {
        toast.error("Please sign in to use the JD Analyzer.");
        return;
      }
      if (code === "PAYMENT_REQUIRED" || /credit/i.test(msg)) {
        toast.error(msg || "Insufficient credits for JD analysis.");
        return;
      }
      toast.error(msg || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scoreColor = result
    ? result.qualityScore >= 80 ? T.success
      : result.qualityScore >= 50 ? T.accent
      : '#ffb4ab'
    : T.muted;

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Left: input */}
      <div className="w-full sm:w-[35%] shrink-0 space-y-4">
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: T.text }}>Job Description Analyzer</h2>
              <p className="text-xs mt-1" style={{ color: T.muted }}>
                Understand the requirements, skills and ATS keywords in a job description.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: T.muted }}>Job Description</p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={12}
                className="w-full rounded-lg border px-3 py-2.5 text-sm leading-relaxed outline-none resize-none"
                style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
              />
              <p className="text-[10px] text-right" style={{ color: T.muted }}>
                {jobDescription.length.toLocaleString()} / 100,000
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: T.muted }}>Target Country (optional)</p>
              <input
                type="text"
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                placeholder="e.g. US, CA, AE"
                maxLength={2}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: T.muted }}>Job Title (optional)</p>
              <input
                type="text"
                value={providedJobTitle}
                onChange={(e) => setProvidedJobTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: T.primary }}
            >
              {isAnalyzing ? <><RefreshCw className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Briefcase className="h-4 w-4" /> Analyze JD</>}
            </button>
          </div>
        </div>

        {result && (
          <div className="rounded-xl border p-6 flex flex-col items-center" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
            <div
              className="flex items-center justify-center w-28 h-28 rounded-full border-4 mb-3"
              style={{ borderColor: scoreColor }}
            >
              <span className="text-3xl font-extrabold" style={{ color: T.text }}>{result.qualityScore}%</span>
            </div>
            <p className="text-xs font-bold" style={{ color: scoreColor }}>
              {result.qualityScore >= 80 ? 'Complete & Clear' : result.qualityScore >= 50 ? 'Moderately Clear' : 'Sparse / Unclear'}
            </p>
            <p className="text-[10px] mt-2 text-center" style={{ color: T.muted }}>{result.qualityScoreExplanation}</p>
            {result.quality === "degraded" && (
              <p className="text-[10px] mt-1" style={{ color: T.muted }}>Deterministic analysis only (AI insights unavailable)</p>
            )}
          </div>
        )}
      </div>

      {/* Right: results */}
      <div className="flex-1 min-w-0">
        {result ? (
          <div className="space-y-4">
            {/* Job overview */}
            {(result.jobTitle || result.seniority || result.industry || result.domain || result.location || result.workArrangement) && (
              <ResultCard icon={Briefcase} iconColor={T.primaryText} title="Job Overview">
                <JobOverview result={result} />
              </ResultCard>
            )}

            {/* Required skills */}
            {result.requiredSkills?.length > 0 && (
              <ResultCard icon={CheckCircle2} iconColor={T.success} title={`Required Skills (${result.requiredSkills.length})`}>
                <ChipList items={result.requiredSkills} color={T.success} />
              </ResultCard>
            )}

            {/* Preferred skills */}
            {result.preferredSkills?.length > 0 && (
              <ResultCard icon={AlertCircle} iconColor={T.primaryText} title={`Preferred Skills (${result.preferredSkills.length})`}>
                <ChipList items={result.preferredSkills} color={T.primaryText} />
              </ResultCard>
            )}

            {/* Technical requirements */}
            {result.technicalRequirements?.length > 0 && (
              <ResultCard icon={Wrench} iconColor={T.text} title="Technical Requirements">
                <BulletList items={result.technicalRequirements} />
              </ResultCard>
            )}

            {/* Experience */}
            {result.experienceRequirements?.length > 0 && (
              <ResultCard icon={TrendingUp} iconColor={T.success} title="Experience Requirements">
                <BulletList items={result.experienceRequirements} />
              </ResultCard>
            )}

            {/* Education */}
            {result.educationRequirements?.length > 0 && (
              <ResultCard icon={GraduationCap} iconColor={T.text} title="Education Requirements">
                <BulletList items={result.educationRequirements} />
              </ResultCard>
            )}

            {/* Certifications */}
            {result.certifications?.length > 0 && (
              <ResultCard icon={Award} iconColor="#eab308" title="Certifications">
                <ChipList items={result.certifications} color="#eab308" />
              </ResultCard>
            )}

            {/* Responsibilities */}
            {result.responsibilities?.length > 0 && (
              <ResultCard icon={List} iconColor={T.primaryText} title="Responsibilities">
                <BulletList items={result.responsibilities} />
              </ResultCard>
            )}

            {/* Technologies */}
            {result.technologiesFromAi?.length > 0 && (
              <ResultCard icon={Wrench} iconColor={T.text} title="Technologies & Tools">
                <ChipList items={result.technologiesFromAi} color={T.text} />
              </ResultCard>
            )}

            {/* ATS keywords */}
            {result.atsKeywords?.length > 0 && (
              <ResultCard icon={Target} iconColor="#eab308" title={`ATS Keywords (${result.atsKeywords.length})`}>
                <ChipList items={result.atsKeywords} color="#eab308" />
              </ResultCard>
            )}

            {/* Soft skills */}
            {result.softSkills?.length > 0 && (
              <ResultCard icon={Users} iconColor={T.success} title="Soft Skills">
                <ChipList items={result.softSkills} color={T.success} />
              </ResultCard>
            )}

            {/* Important qualifications */}
            {result.importantQualifications?.length > 0 && (
              <ResultCard icon={Lightbulb} iconColor="#eab308" title="Important Qualifications">
                <BulletList items={result.importantQualifications} />
              </ResultCard>
            )}

            {/* Missing / unclear */}
            {result.missingOrUnclearInformation?.length > 0 && (
              <ResultCard icon={AlertCircle} iconColor={T.accent} title="Missing / Unclear Information">
                <BulletList items={result.missingOrUnclearInformation} />
              </ResultCard>
            )}

            {/* Analysis summary */}
            {(result.summary || result.analysis) && (
              <ResultCard icon={FileText} iconColor={T.primaryText} title="Analysis Summary">
                <div className="space-y-2">
                  {result.summary && <p className="text-xs leading-relaxed" style={{ color: T.text }}>{result.summary}</p>}
                  {result.analysis && <p className="text-xs leading-relaxed" style={{ color: T.muted }}>{result.analysis}</p>}
                </div>
              </ResultCard>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-xl border border-dashed" style={{ borderColor: T.outlineVariant }}>
            <Briefcase className="h-10 w-10" style={{ color: T.muted }} />
            <p className="text-sm font-bold" style={{ color: T.text }}>No analysis results yet</p>
            <p className="text-xs" style={{ color: T.muted }}>Paste a job description and click Analyze JD.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function JobOverview({ result }: { result: any }) {
  const rows: Array<{ label: string; value: string | null }> = [
    { label: "Job Title", value: result.jobTitle },
    { label: "Seniority", value: result.seniority },
    { label: "Industry", value: result.industry },
    { label: "Domain", value: result.domain },
    { label: "Location", value: result.location },
    { label: "Work Arrangement", value: result.workArrangement },
  ];
  const present = rows.filter((r) => r.value);
  if (present.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {present.map((r) => (
        <div key={r.label} className="flex items-start gap-2">
          <MapPin className="hidden" />
          <span className="text-xs font-bold shrink-0" style={{ color: T.muted }}>{r.label}:</span>
          <span className="text-xs" style={{ color: T.text }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function ChipList({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${color}20`, color }}>
          {item}
        </span>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-xs flex items-start gap-2" style={{ color: T.muted }}>
          <span className="mt-0.5">•</span> {item}
        </li>
      ))}
    </ul>
  );
}

function ResultCard({ icon: Icon, iconColor, title, children }: { icon: typeof CheckCircle2; iconColor: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3"
        style={{ backgroundColor: T.surface }}
      >
        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: T.text }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
          {title}
        </span>
        {open ? <ChevronDown className="h-4 w-4" style={{ color: T.muted }} /> : <ChevronRight className="h-4 w-4" style={{ color: T.muted }} />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}