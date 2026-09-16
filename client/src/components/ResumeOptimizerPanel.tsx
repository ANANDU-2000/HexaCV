import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  RefreshCw, FileText, CheckCircle2, AlertCircle, XCircle, HelpCircle,
  GraduationCap, Stars, Sparkles, Target, Briefcase, ArrowUpRight,
  Globe, Clipboard, Wand2, TrendingUp, AlertTriangle, Lightbulb, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

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
  warn: '#d97706',
  danger: '#ef4444',
};

const SECTION_CHIPS: { value: OptimizerSection; label: string }[] = [
  { value: "all", label: "Overall" },
  { value: "summary", label: "Summary" },
  { value: "experience", label: "Experience" },
  { value: "projects", label: "Projects" },
  { value: "skills", label: "Skills" },
  { value: "education", label: "Education" },
];

const PRIORITY_STYLE: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: T.danger },
  medium: { label: "Medium", color: T.warn },
  low: { label: "Low", color: T.muted },
  undefined: { label: "Medium", color: T.warn },
};

interface OptimizerPanelProps {
  resumes: any[];
  activeResumeId: string | null;
  onSelectResume: (id: string) => void;
}

type OptimizerSection = "summary" | "experience" | "projects" | "skills" | "education" | "all";
type OptimizerResult = any;

export default function ResumeOptimizerPanel({ resumes, activeResumeId, onSelectResume }: OptimizerPanelProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(activeResumeId || "");
  const [jobDescription, setJobDescription] = useState("");
  const [targetCountry, setTargetCountry] = useState("");
  const [providedJobTitle, setProvidedJobTitle] = useState("");
  const [selectedSections, setSelectedSections] = useState<OptimizerSection[]>(["all"]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizerResult | null>(null);

  const optimizerMutation = trpc.ai.optimizeResume.useMutation();

  const toggleSection = (value: OptimizerSection) => {
    setSelectedSections(prev => {
      const next = new Set<OptimizerSection>(prev);
      if (value === "all") return ["all"];
      if (next.has("all")) { next.delete("all"); return ["all"]; }
      next.has(value) ? next.delete(value) : next.add(value);
      return Array.from(next).length === 0 ? ["all"] : Array.from(next);
    });
  };

  const handleOptimize = async () => {
    if (!selectedResumeId) { toast.error("Please select a resume"); return; }
    const trimmed = jobDescription.trim();
    if (!trimmed) { toast.error("Please paste a job description"); return; }
    if (trimmed.length > 100_000) {
      toast.error("Job description exceeds the 100,000 character limit.");
      return;
    }

    setIsOptimizing(true);
    setResult(null);
    try {
      const data = await optimizerMutation.mutateAsync({
        resumeId: selectedResumeId,
        jobDescription: trimmed,
        targetCountryCode: targetCountry.trim()
          ? targetCountry.trim().toUpperCase().slice(0, 2)
          : undefined,
        providedJobTitle: providedJobTitle.trim() || undefined,
        sections: selectedSections.includes("all") ? undefined : selectedSections,
      });
      setResult(data.result);
      toast.success("Resume optimized!");
    } catch (err: any) {
      const code = err?.data?.code;
      const msg = err?.message || "";
      if (code === "UNAUTHORIZED" || /sign in/i.test(msg)) {
        toast.error("Please sign in to use the Resume Optimizer.");
        return;
      }
      if (code === "PAYMENT_REQUIRED" || /credit/i.test(msg)) {
        toast.error(msg || "Insufficient credits for resume optimization.");
        return;
      }
      toast.error(msg || "Optimization failed. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Could not copy — select and copy the text manually.");
    }
  };

  const score = result?.optimizationScore ?? 0;
  const band = result?.scoreBand;
  const scoreColor = !result
    ? T.muted
    : score >= 90 ? T.success
      : score >= 75 ? T.primaryText
        : score >= 60 ? T.warn
          : T.danger;
  const bandLabel = band?.label || (score >= 90 ? "Highly Aligned" : score >= 75 ? "Strong" : score >= 60 ? "Moderate" : score >= 40 ? "Significant" : "Major");

  const ringStyle = {
    background: `conic-gradient(${scoreColor} ${Math.min(100, Math.max(0, score)) * 3.6}deg, ${T.outlineVariant} 0deg)`,
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left: input */}
      <div className="w-full xl:w-[36%] shrink-0 space-y-4">
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: T.text }}>
                <Wand2 className="h-4 w-4" style={{ color: T.accent }} /> AI Resume Optimizer
              </h2>
              <p className="text-xs mt-1" style={{ color: T.muted }}>
                Evidence-based resume optimization against a job description — with hands-on rewrite guidance.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: T.muted }}>Resume</p>
              <Select value={selectedResumeId} onValueChange={(id) => { setSelectedResumeId(id); onSelectResume(id); }}>
                <SelectTrigger className="w-full text-sm" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: T.elevated, borderColor: T.outlineVariant }}>
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title || "Untitled resume"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: T.muted }}>Job Description</p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={9}
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

            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: T.muted }}>Focus Sections</p>
              <div className="flex flex-wrap gap-1.5">
                {SECTION_CHIPS.map((s) => {
                  const active = selectedSections.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleSection(s.value)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
                      style={{
                        border: `1px solid ${active ? T.accent : T.outlineVariant}`,
                        backgroundColor: active ? `${T.accent}20` : T.elevated,
                        color: active ? T.accent : T.muted,
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: T.accent }}
            >
              {isOptimizing ? <><RefreshCw className="h-4 w-4 animate-spin" /> Optimizing...</> : <><Wand2 className="h-4 w-4" /> Optimize Resume</>}
            </button>
          </div>
        </div>
      </div>

      {/* Right: results */}
      <div className="flex-1 min-w-0">
        {!result ? null : (
          <div className="space-y-4">
            {/* Score */}
            <div className="rounded-xl border p-6 flex flex-col items-center" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
              <div
                className="flex items-center justify-center w-28 h-28 rounded-full p-1 mb-3"
                style={ringStyle}
              >
                <div
                  className="flex items-center justify-center w-full h-full rounded-full"
                  style={{ backgroundColor: T.surface }}
                >
                  <span className="text-3xl font-extrabold" style={{ color: T.text }}>{score}%</span>
                </div>
              </div>
              <p className="text-xs font-bold" style={{ color: scoreColor }}>{bandLabel}</p>
              {band && <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>Range {band.min}–{band.max}</p>}
              {result.scoreExplanation && (
                <p className="text-[10px] mt-2 text-center" style={{ color: T.muted }}>{result.scoreExplanation}</p>
              )}
              {result.countryContext && (
                <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: T.muted }}>
                  <Globe className="h-3 w-3" />
                  {result.countryContext.atsNote ||
                    `${result.countryContext.sourceCountryName || result.countryContext.sourceCountryCode || "?"} → ${result.countryContext.targetCountryName || result.countryContext.targetCountryCode || "unspecified"}`}
                </p>
              )}
              {result.quality === "degraded" && (
                <p className="text-[10px] mt-1" style={{ color: T.muted }}>Deterministic optimization only (AI insights unavailable)</p>
              )}
            </div>

            {/* Summary */}
            {result.summary && (
              <ResultCard icon={FileText} iconColor={T.primaryText} title="Summary">
                <p className="text-xs leading-relaxed" style={{ color: T.text }}>{result.summary}</p>
              </ResultCard>
            )}

            {/* Section findings */}
            {result.sectionFindings?.length > 0 && (
              <ResultCard icon={Target} iconColor={T.accent} title="Section Findings">
                <div className="space-y-3">
                  {result.sectionFindings.map((f: any, i: number) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold" style={{ color: T.text }}>{f.label}</span>
                        <span className="font-bold" style={{ color: f.score >= 75 ? T.success : f.score >= 50 ? T.warn : T.danger }}>
                          {f.score}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.outlineVariant }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, f.score)}%`, backgroundColor: f.score >= 75 ? T.success : f.score >= 50 ? T.warn : T.danger }} />
                      </div>
                      {f.summary && <p className="text-[10px] mt-1" style={{ color: T.muted }}>{f.summary}</p>}
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}

            {/* Requirements / missing */}
            {result.missingRequirements?.length > 0 && (
              <ResultCard icon={XCircle} iconColor={T.danger} title={`Missing Requirements (${result.missingRequirements.length})`}>
                <ChipList items={result.missingRequirements} color={T.danger} />
              </ResultCard>
            )}

            {/* Keyword opportunities */}
            {result.keywordOpportunities?.length > 0 && (
              <ResultCard icon={ListChecks} iconColor={T.accent} title="ATS Keyword Opportunities">
                <div className="space-y-2.5">
                  {result.keywordOpportunities.map((k: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 mt-0.5"
                        style={{ backgroundColor: k.required ? `${T.danger}20` : `${T.warn}20`, color: k.required ? T.danger : T.warn }}
                      >
                        {k.required ? "Required" : "Preferred"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold" style={{ color: T.text }}>{k.keyword}</span>
                        <span className="ml-1 text-[10px]" style={{ color: T.muted }}>
                          {k.foundInResume ? "· found in resume" : "· not in resume"}
                        </span>
                        {k.note && <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>{k.note}</p>}
                        {k.question && <p className="text-[10px] mt-0.5 italic" style={{ color: T.muted }}>“{k.question}”</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}

            {/* User questions */}
            {result.userQuestions?.length > 0 && (
              <ResultCard icon={HelpCircle} iconColor={T.primaryText} title="Questions To Ask Yourself">
                <div className="space-y-2.5">
                  {result.userQuestions.map((q: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: T.warn }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs" style={{ color: T.text }}>{q.question}</p>
                        {q.relatedRequirement && (
                          <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>Re: {q.relatedRequirement}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <ResultCard icon={Target} iconColor={T.primaryText} title={`Recommendations (${result.recommendations.length})`}>
                <div className="space-y-3">
                  {result.recommendations.slice(0, 24).map((rec: any, i: number) => {
                    const p = PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.undefined;
                    return (
                      <div key={i} className="rounded-lg border p-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-bold text-xs" style={{ color: T.text }}>{rec.issue}</span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                            {p.label}
                          </span>
                        </div>
                        {rec.reason && <p className="text-[10px] mt-1" style={{ color: T.muted }}>{rec.reason}</p>}
                        {rec.relatedRequirement && (
                          <p className="text-[10px] mt-1" style={{ color: T.muted }}><span className="font-bold">JD:</span> {rec.relatedRequirement}</p>
                        )}
                        {rec.expectedBenefit && (
                          <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: T.success }}>
                            <TrendingUp className="h-3 w-3" /> {rec.expectedBenefit}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ResultCard>
            )}

            {/* Safe rewrites */}
            {result.safeRewrites?.length > 0 && (
              <ResultCard icon={Sparkles} iconColor={T.accent} title={`Safe Rewrites (${result.safeRewrites.length})`}>
                <div className="space-y-4">
                  {result.safeRewrites.map((rw: any, i: number) => (
                    <div key={rw.id || i} className="rounded-lg border overflow-hidden" style={{ borderColor: T.outlineVariant }}>
                      <div className="p-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-bold text-xs" style={{ color: T.text }}>{rw.issue}</span>
                          {rw.section && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: `${T.accent}20`, color: T.accent }}>
                              {rw.section}
                            </span>
                          )}
                          {rw.safeToApply ? (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1" style={{ backgroundColor: `${T.success}20`, color: T.success }}>
                              <CheckCircle2 className="h-3 w-3" /> Safe
                            </span>
                          ) : (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1" style={{ backgroundColor: `${T.warn}20`, color: T.warn }}>
                              <AlertCircle className="h-3 w-3" /> Needs your input
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] font-bold mb-1" style={{ color: T.muted }}>Current</p>
                          <p className="text-xs rounded-lg border p-2" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}>
                            {rw.currentText}
                          </p>
                        </div>

                        {rw.suggestedText && (
                          <div>
                            <p className="text-[10px] font-bold mb-1" style={{ color: T.muted }}>Suggested</p>
                            <p className="text-xs rounded-lg border p-2" style={{ borderColor: `${T.success}40`, backgroundColor: `${T.success}0d`, color: T.text }}>
                              {rw.suggestedText}
                            </p>
                          </div>
                        )}

                        {rw.why && (
                          <p className="text-[10px]" style={{ color: T.muted }}>
                            <span className="font-bold" style={{ color: T.primaryText }}>Why: </span>{rw.why}
                          </p>
                        )}
                        {rw.jdAlignment && (
                          <p className="text-[10px]" style={{ color: T.muted }}>
                            <span className="font-bold" style={{ color: T.accent }}>JD Alignment: </span>{rw.jdAlignment}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => copyToClipboard(rw.suggestedText || rw.currentText)}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition hover:opacity-90"
                          style={{ borderColor: `${T.accent}50`, color: T.accent }}
                        >
                          <Clipboard className="h-3.5 w-3.5" /> Copy suggested text
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}

            {/* Strengths */}
            {result.strengths?.length > 0 && (
              <ResultCard icon={CheckCircle2} iconColor={T.success} title="Strengths">
                <div className="space-y-1.5">
                  {result.strengths.map((s: string, i: number) => (
                    <p key={i} className="text-xs flex items-start gap-2" style={{ color: T.muted }}>
                      <ArrowUpRight className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: T.success }} /> {s}
                    </p>
                  ))}
                </div>
              </ResultCard>
            )}

            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <ResultCard icon={AlertTriangle} iconColor={T.warn} title="Warnings">
                <div className="space-y-1.5">
                  {result.warnings.map((w: string, i: number) => (
                    <p key={i} className="text-xs flex items-start gap-2" style={{ color: T.muted }}>
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: T.warn }} /> {w}
                    </p>
                  ))}
                </div>
              </ResultCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ icon: Icon, iconColor, title, children }: { icon: any; iconColor: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: T.outlineVariant }}>
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: T.text }}>{title}</h3>
      </div>
      <div className="p-4">{children}</div>
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
