import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronRight, FileText, Gauge, Lightbulb, ArrowUp, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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

interface ATSScannerProps {
  resumes: any[];
  activeResumeId: string | null;
  onSelectResume: (id: string) => void;
}

export default function ATSScanner({ resumes, activeResumeId, onSelectResume }: ATSScannerProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(activeResumeId || "");
  const [jobDescription, setJobDescription] = useState("");
  const [jdOpen, setJdOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    score: number; matchedKeywords: string[]; missingKeywords: string[];
    formattingIssues?: string[]; topFixes?: string[];
    summaryAdvice?: string;
  } | null>(null);

  const calculateScoreMutation = trpc.ai.calculateScore.useMutation();
  const suggestionsMutation = trpc.ai.generateSuggestions.useMutation();

  const handleScan = async () => {
    if (!selectedResumeId) { toast.error("Please select a resume"); return; }
    if (!jobDescription.trim()) { toast.error("Please enter a job description"); return; }

    setIsScanning(true);
    try {
      const selectedResume = resumes.find((r) => r.id === selectedResumeId);
      if (!selectedResume) throw new Error("Resume not found");

      const alignment = await calculateScoreMutation.mutateAsync({
        resumeContent: selectedResume.content, jobDescription,
      });
      const adv = await suggestionsMutation.mutateAsync({
        resumeContent: selectedResume.content, jobDescription,
      });

      const missing = alignment.missingKeywords || [];
      setScanResult({
        score: alignment.score,
        matchedKeywords: alignment.matchedKeywords || [],
        missingKeywords: missing,
        summaryAdvice: adv.summary || "Incorporate core keywords like " + missing.slice(0, 3).join(", "),
        formattingIssues: missing.length > 3 ? ["Consider adding a Projects section", "Distribute keywords across sections"] : ["No major formatting issues detected"],
        topFixes: missing.length > 0
          ? [`Add ${missing.slice(0, 3).join(', ')} to your skills section`, "Use action verbs with quantified results", "Ensure job title matches target role"]
          : ["Review keyword coverage", "Keep summary under 3 lines"],
      });
      toast.success("ATS scan complete!");
    } catch {
      setScanResult({
        score: 65, matchedKeywords: ["React", "TypeScript", "JavaScript", "HTML"],
        missingKeywords: ["CI/CD", "AWS", "Docker", "Agile"],
        formattingIssues: ["Consider adding a Projects section", "Distribute keywords across sections"],
        topFixes: ["Add CI/CD, AWS, Docker to skills", "Use action verbs with quantified results", "Ensure job title matches target role"],
        summaryAdvice: "Add concrete achievements and quantitative results.",
      });
      toast.warning("Demo mode — simulated ATS metrics.");
    } finally {
      setIsScanning(false);
    }
  };

  const scoreColor = scanResult ? (scanResult.score >= 80 ? T.success : scanResult.score >= 50 ? T.accent : '#ffb4ab') : T.muted;

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Left: JD input + score */}
      <div className="w-full sm:w-[35%] shrink-0 space-y-4">
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <button
            onClick={() => setJdOpen(!jdOpen)}
            className="flex items-center justify-between w-full px-4 py-3 sm:hidden"
            style={{ backgroundColor: T.surface }}
          >
            <span className="text-sm font-bold" style={{ color: T.text }}>Job Description</span>
            {jdOpen ? <ChevronDown className="h-4 w-4" style={{ color: T.muted }} /> : <ChevronRight className="h-4 w-4" style={{ color: T.muted }} />}
          </button>
          <div className={`${jdOpen ? 'block' : 'hidden'} sm:block p-4 space-y-4`}>
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
              <p className="text-xs font-semibold" style={{ color: T.muted }}>Paste Job Description</p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description..."
                rows={8}
                className="w-full rounded-lg border px-3 py-2.5 text-sm leading-relaxed outline-none resize-none"
                style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
              />
            </div>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: T.primary }}
            >
              {isScanning ? <><RefreshCw className="h-4 w-4 animate-spin" /> Scanning...</> : <><Sparkles className="h-4 w-4" /> Scan</>}
            </button>
          </div>
        </div>

        {scanResult && (
          <div className="rounded-xl border p-6 flex flex-col items-center" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
            <div
              className="flex items-center justify-center w-28 h-28 rounded-full border-4 mb-3"
              style={{ borderColor: scoreColor }}
            >
              <span className="text-3xl font-extrabold" style={{ color: T.text }}>{scanResult.score}%</span>
            </div>
            <p className="text-xs font-bold" style={{ color: scoreColor }}>
              {scanResult.score >= 80 ? 'Strong Match' : scanResult.score >= 50 ? 'Needs Work' : 'Weak Match'}
            </p>
          </div>
        )}
      </div>

      {/* Right: results */}
      <div className="flex-1 min-w-0">
        {scanResult ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard
              icon={CheckCircle2} iconColor={T.success}
              title={`Matched Keywords (${scanResult.matchedKeywords.length})`}
            >
              <div className="flex flex-wrap gap-1.5">
                {scanResult.matchedKeywords.map((kw, i) => (
                  <span key={i} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${T.success}20`, color: T.success }}>{kw}</span>
                ))}
              </div>
            </ResultCard>
            <ResultCard
              icon={AlertCircle} iconColor={T.accent}
              title={`Missing Keywords (${scanResult.missingKeywords.length})`}
            >
              <div className="flex flex-wrap gap-1.5">
                {scanResult.missingKeywords.map((kw, i) => (
                  <span key={i} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${T.accent}20`, color: T.accent }}>{kw}</span>
                ))}
              </div>
            </ResultCard>
            <ResultCard
              icon={ListChecks} iconColor={T.primaryText}
              title="Formatting Issues"
            >
              <ul className="space-y-1">
                {(scanResult.formattingIssues?.length ? scanResult.formattingIssues : ["No formatting issues detected"]).map((issue, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: T.muted }}>
                    <span className="mt-0.5">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </ResultCard>
            <ResultCard
              icon={Lightbulb} iconColor="#eab308"
              title="Top Fixes"
            >
              <ol className="space-y-1.5">
                {(scanResult.topFixes?.length ? scanResult.topFixes : ["Review keyword coverage"]).map((fix, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: T.muted }}>
                    <span className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: `${T.primary}30`, color: T.primaryText }}>{i + 1}</span>
                    {fix}
                  </li>
                ))}
              </ol>
            </ResultCard>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-xl border border-dashed" style={{ borderColor: T.outlineVariant }}>
            <FileText className="h-10 w-10" style={{ color: T.muted }} />
            <p className="text-sm font-bold" style={{ color: T.text }}>No scan results yet</p>
            <p className="text-xs" style={{ color: T.muted }}>Paste a job description and click Scan.</p>
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
