import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Brain, RefreshCw, ChevronDown, ChevronRight, FileText,
  CheckCircle2, AlertCircle, Lightbulb, ArrowUp, BarChart3,
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
};

interface AnalyzerPanelProps {
  resumes: any[];
  activeResumeId: string | null;
  onSelectResume: (id: string) => void;
}

type AnalysisResult = any; // ResumeAnalysis shape from server

export default function AnalyzerPanel({ resumes, activeResumeId, onSelectResume }: AnalyzerPanelProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(activeResumeId || "");
  const [targetRole, setTargetRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = trpc.ai.analyzeResume.useMutation();

  const handleAnalyze = async () => {
    if (!selectedResumeId) { toast.error("Please select a resume"); return; }

    setIsAnalyzing(true);
    setResult(null);
    try {
      const selectedResume = resumes.find((r) => r.id === selectedResumeId);
      if (!selectedResume) throw new Error("Resume not found");

      const data = await analyzeMutation.mutateAsync({
        resumeId: selectedResumeId,
        targetRole: targetRole.trim() || undefined,
      });

      setResult(data.analysis);
      toast.success("Analysis complete!");
    } catch (err: any) {
      const code = err?.data?.code;
      const msg = err?.message || "";
      if (code === "UNAUTHORIZED" || /sign in/i.test(msg)) {
        toast.error("Please sign in to use the AI Analyzer.");
        return;
      }
      if (code === "PAYMENT_REQUIRED" || /credit/i.test(msg)) {
        toast.error(msg || "Insufficient credits for analysis.");
        return;
      }
      toast.error(msg || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scoreColor = result
    ? result.overallScore >= 80 ? T.success
      : result.overallScore >= 50 ? T.accent
      : '#ffb4ab'
    : T.muted;

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Left: controls + score */}
      <div className="w-full sm:w-[35%] shrink-0 space-y-4">
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: T.muted }}>Select Resume</p>
              <Select value={selectedResumeId} onValueChange={(val) => { setSelectedResumeId(val); onSelectResume(val); }}>
                <SelectTrigger style={{ backgroundColor: T.elevated, borderColor: T.outlineVariant, color: T.text }}>
                  <SelectValue placeholder="Choose resume..." />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: T.muted }}>Target Role (optional)</p>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedResumeId}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: T.primary }}
            >
              {isAnalyzing ? <><RefreshCw className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Brain className="h-4 w-4" /> Analyze Resume</>}
            </button>
          </div>
        </div>

        {result && (
          <div className="rounded-xl border p-6 flex flex-col items-center" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
            <div
              className="flex items-center justify-center w-28 h-28 rounded-full border-4 mb-3"
              style={{ borderColor: scoreColor }}
            >
              <span className="text-3xl font-extrabold" style={{ color: T.text }}>{result.overallScore}%</span>
            </div>
            <p className="text-xs font-bold" style={{ color: scoreColor }}>
              {result.overallScore >= 80 ? 'Strong Resume' : result.overallScore >= 50 ? 'Needs Improvement' : 'Significant Gaps'}
            </p>
            {result.quality === "degraded" && (
              <p className="text-[10px] mt-1" style={{ color: T.muted }}>Score only (AI insights unavailable)</p>
            )}
          </div>
        )}
      </div>

      {/* Right: results */}
      <div className="flex-1 min-w-0">
        {result ? (
          <div className="space-y-4">
            {/* Category scores */}
            <ResultCard icon={BarChart3} iconColor={T.primaryText} title="Category Scores">
              <div className="space-y-2">
                {result.categoryScores.map((cat: any) => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-xs w-28 shrink-0" style={{ color: T.muted }}>{cat.label}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: T.elevated }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${cat.score}%`,
                          backgroundColor: cat.score >= 70 ? T.success : cat.score >= 40 ? T.accent : '#ffb4ab',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold w-8 text-right" style={{ color: T.text }}>{cat.score}</span>
                  </div>
                ))}
              </div>
            </ResultCard>

            {/* Strengths */}
            {result.strengths?.length > 0 && (
              <ResultCard icon={CheckCircle2} iconColor={T.success} title={`Strengths (${result.strengths.length})`}>
                <ul className="space-y-1.5">
                  {result.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: T.muted }}>
                      <span className="mt-0.5 text-green-400">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            )}

            {/* Issues */}
            {result.issues?.length > 0 && (
              <ResultCard icon={AlertCircle} iconColor={T.accent} title={`Issues (${result.issues.length})`}>
                <ul className="space-y-1.5">
                  {result.issues.map((issue: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: T.muted }}>
                      <span className="mt-0.5 text-orange-400">!</span> {issue}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <ResultCard icon={Lightbulb} iconColor="#eab308" title={`Recommendations (${result.recommendations.length})`}>
                <ol className="space-y-1.5">
                  {result.recommendations.map((rec: any, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: T.muted }}>
                      <span className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: `${T.primary}30`, color: T.primaryText }}>{i + 1}</span>
                      <span>
                        {rec.text}
                        {rec.source === "ai" && <span className="ml-1 text-[10px] opacity-60">(AI)</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </ResultCard>
            )}

            {/* AI Analysis sections */}
            {result.summaryAnalysis && (
              <ResultCard icon={FileText} iconColor={T.primaryText} title="Summary Analysis">
                <p className="text-xs leading-relaxed" style={{ color: T.muted }}>{result.summaryAnalysis}</p>
              </ResultCard>
            )}
            {result.experienceAnalysis && (
              <ResultCard icon={FileText} iconColor={T.primaryText} title="Experience Analysis">
                <p className="text-xs leading-relaxed" style={{ color: T.muted }}>{result.experienceAnalysis}</p>
              </ResultCard>
            )}
            {result.skillsAnalysis && (
              <ResultCard icon={FileText} iconColor={T.primaryText} title="Skills Analysis">
                <p className="text-xs leading-relaxed" style={{ color: T.muted }}>{result.skillsAnalysis}</p>
              </ResultCard>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-xl border border-dashed" style={{ borderColor: T.outlineVariant }}>
            <Brain className="h-10 w-10" style={{ color: T.muted }} />
            <p className="text-sm font-bold" style={{ color: T.text }}>No analysis results yet</p>
            <p className="text-xs" style={{ color: T.muted }}>Select a resume and click Analyze.</p>
          </div>
        )}
      </div>
    </div>
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
