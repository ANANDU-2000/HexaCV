/**
 * PHASE 10 — AI Cover Letter Generator panel.
 *
 * Mirrors ResumeOptimizerPanel.tsx structure (Phase 9). Session-based only:
 * NO auto-modify of the stored resume, NO new DB table. The generated letter is
 * ephemeral and kept in component state.
 */
import { useState, useCallback } from "react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  Mail,
  FileText,
  Copy,
  RotateCcw,
  Pencil,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Building2,
  User,
  Globe,
  Palette,
  AlignLeft,
  Info,
} from "lucide-react";

// ---------------------------------------------------------------------------
// T Palette — mirrors Tokens CSS variables exactly
// ---------------------------------------------------------------------------
const T = {
  surface: "#131b33",
  elevated: "#1c2747",
  primary: "#1e40af",
  primaryText: "#b8c4ff",
  accent: "#ea580c",
  text: "#e2e8f0",
  muted: "#94a3b8",
  outlineVariant: "#2a3a5c",
  success: "#16a34a",
  warn: "#d97706",
  danger: "#ef4444",
} as const;

// ---------------------------------------------------------------------------
// Tone / Length helpers
// ---------------------------------------------------------------------------
const TONES = [
  { value: "professional", label: "Professional", desc: "Formal, polished tone" },
  { value: "confident", label: "Confident", desc: "Self-assured without arrogance" },
  { value: "concise", label: "Concise", desc: "Direct and to the point" },
  { value: "warm", label: "Warm", desc: "Friendly, personable tone" },
] as const;

const LENGTHS = [
  { value: "short", label: "Short (150–220 words)" },
  { value: "standard", label: "Standard (250–400 words)" },
  { value: "detailed", label: "Detailed (400–550 words)" },
] as const;

const QUALITY_COLORS: Record<string, string> = {
  Excellent: T.success,
  Strong: "#22c55e",
  Good: T.warn,
  "Needs Work": T.danger,
  Incomplete: T.muted,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type CoverLetterPanelProps = {
  resumes: any[];
  activeResumeId: string | null;
  onSelectResume: (id: string) => void;
};

export default function CoverLetterPanel({
  resumes,
  activeResumeId,
  onSelectResume,
}: CoverLetterPanelProps) {
  // --- Resume selector — initialized from the dashboard-shared selection ---
  const [resumeId, setResumeId] = useState<string | null>(activeResumeId || null);

  // --- Inputs ---
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hiringManagerName, setHiringManagerName] = useState("");
  const [targetCountryCode, setTargetCountryCode] = useState("");
  const [tone, setTone] = useState<string>("professional");
  const [length, setLength] = useState<string>("standard");
  const [additionalContext, setAdditionalContext] = useState("");

  // --- Result ---
  const [result, setResult] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editableText, setEditableText] = useState("");

  // --- Mutation ---
  const generateMutation = trpc.ai.generateCoverLetter.useMutation({
    onSuccess: (data: any) => {
      setResult(data.result);
      setEditableText(data.result.fullText || "");
      setEditMode(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate cover letter.");
    },
  });

  const canGenerate =
    resumeId && jobDescription.trim().length > 0 && !generateMutation.isPending;

  const handleGenerate = useCallback(() => {
    if (!resumeId || !jobDescription.trim()) {
      toast.error("Please select a resume and enter a job description.");
      return;
    }
    generateMutation.mutate({
      resumeId,
      jobDescription: jobDescription.trim(),
      companyName: companyName.trim() || undefined,
      hiringManagerName: hiringManagerName.trim() || undefined,
      targetCountryCode: targetCountryCode.trim() || undefined,
      tone: tone as any,
      length: length as any,
      additionalContext: additionalContext.trim() || undefined,
    });
  }, [
    resumeId,
    jobDescription,
    companyName,
    hiringManagerName,
    targetCountryCode,
    tone,
    length,
    additionalContext,
    generateMutation,
  ]);

  const handleCopy = useCallback(() => {
    const text = editMode ? editableText : result?.fullText || "";
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Cover letter copied to clipboard.");
    }
  }, [result, editableText, editMode]);

  const handleReset = useCallback(() => {
    setResult(null);
    setEditMode(false);
    setEditableText("");
    setJobDescription("");
    setCompanyName("");
    setHiringManagerName("");
    setTargetCountryCode("");
    setTone("professional");
    setLength("standard");
    setAdditionalContext("");
  }, []);

  const handleRegenerate = useCallback(() => {
    // Re-run the mutation with the current (unchanged) inputs — do not reset.
    setResult(null);
    setEditMode(false);
    generateMutation.mutate({
      resumeId: resumeId as string,
      jobDescription: jobDescription.trim(),
      companyName: companyName.trim() || undefined,
      hiringManagerName: hiringManagerName.trim() || undefined,
      targetCountryCode: targetCountryCode.trim() || undefined,
      tone: tone as any,
      length: length as any,
      additionalContext: additionalContext.trim() || undefined,
    });
  }, [
    resumeId,
    jobDescription,
    companyName,
    hiringManagerName,
    targetCountryCode,
    tone,
    length,
    additionalContext,
    generateMutation,
  ]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: T.text,
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            <Mail size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>
              AI Cover Letter Generator
            </h2>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
              Factual, grounded, professional letters from your resume and a target job description
            </p>
          </div>
        </div>
        {result && (
          <button
            onClick={handleReset}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${T.outlineVariant}`,
              background: "transparent",
              color: T.muted,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <ArrowLeft size={14} /> Start Over
          </button>
        )}
      </div>

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: result ? "1fr 380px" : "1fr",
          gap: 20,
        }}
      >
        {/* Left: Result */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            {/* Quality bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: T.elevated,
                borderRadius: 10,
                border: `1px solid ${T.outlineVariant}`,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                  background: QUALITY_COLORS[result.qualityBand?.label] || T.muted,
                }}
              >
                {result.qualityScore}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                  {result.qualityBand?.label || "Pending"}
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>
                  {result.wordCount} words &middot; {result.quality} quality
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 7,
                    border: `1px solid ${T.outlineVariant}`,
                    background: T.elevated,
                    color: T.primaryText,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Copy size={13} /> Copy
                </button>
                <button
                  onClick={() => {
                    if (editMode) {
                      setEditableText(result.fullText || "");
                      setEditMode(false);
                    } else {
                      setEditableText(result.fullText || "");
                      setEditMode(true);
                    }
                  }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 7,
                    border: `1px solid ${T.outlineVariant}`,
                    background: editMode ? T.primary : T.elevated,
                    color: editMode ? "#fff" : T.primaryText,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Pencil size={13} /> {editMode ? "Done Editing" : "Edit"}
                </button>
                <button
                  onClick={handleRegenerate}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 7,
                    border: `1px solid ${T.outlineVariant}`,
                    background: T.elevated,
                    color: T.primaryText,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <RotateCcw size={13} /> Regenerate
                </button>
              </div>
            </div>

            {/* Letter text */}
            {editMode ? (
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                style={{
                  minHeight: 480,
                  padding: 20,
                  borderRadius: 10,
                  border: `1px solid ${T.outlineVariant}`,
                  background: T.surface,
                  color: T.text,
                  fontSize: 14,
                  lineHeight: 1.75,
                  resize: "vertical",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                }}
              />
            ) : (
              <div
                style={{
                  padding: 24,
                  borderRadius: 10,
                  border: `1px solid ${T.outlineVariant}`,
                  background: T.surface,
                  fontSize: 14,
                  lineHeight: 1.85,
                  whiteSpace: "pre-wrap",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  color: T.text,
                  minHeight: 480,
                }}
              >
                {result.fullText || (
                  <span style={{ color: T.muted, fontStyle: "italic" }}>
                    No letter content available (quality: {result.quality}).
                  </span>
                )}
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(217,119,6,0.08)",
                  border: `1px solid ${T.warn}33`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: T.warn,
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <AlertTriangle size={13} /> Generation Warnings
                </div>
                {result.warnings.map((w: string, i: number) => (
                  <div key={i} style={{ fontSize: 12, color: T.muted, marginBottom: 3 }}>
                    &bull; {w}
                  </div>
                ))}
              </div>
            )}

            {/* Evidence used */}
            {result.evidenceUsed.length > 0 && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(22,163,74,0.06)",
                  border: `1px solid ${T.success}33`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: T.success,
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <CheckCircle size={13} /> Evidence Referenced
                </div>
                {result.evidenceUsed.map((e: string, i: number) => (
                  <div key={i} style={{ fontSize: 12, color: T.muted, marginBottom: 3 }}>
                    &bull; {e}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right sidebar: inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Resume selector */}
          <Section>
            <Label icon={<FileText size={14} />}>Resume</Label>
            {resumes.length === 0 ? (
              <Muted>No resumes found. Create one first.</Muted>
            ) : (
              <select
                value={resumeId || ""}
                onChange={(e) => {
                  const id = e.target.value || "";
                  setResumeId(id || null);
                  onSelectResume(id);
                }}
                style={selectStyle}
              >
                <option value="">Select a resume…</option>
                {resumes.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.title || r.id}
                  </option>
                ))}
              </select>
            )}
          </Section>

          {/* Job Description */}
          <Section>
            <Label icon={<AlignLeft size={14} />}>Job Description *</Label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here (up to 100k characters)…"
              rows={8}
              style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
            />
            <div style={{ fontSize: 11, color: T.muted, textAlign: "right" }}>
              {jobDescription.length.toLocaleString()} / 100,000
            </div>
          </Section>

          {/* Company & Hiring Manager */}
          <Section>
            <Label icon={<Building2 size={14} />}>Company Name</Label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              style={inputStyle}
              maxLength={300}
            />
          </Section>
          <Section>
            <Label icon={<User size={14} />}>Hiring Manager</Label>
            <input
              value={hiringManagerName}
              onChange={(e) => setHiringManagerName(e.target.value)}
              placeholder="e.g. Jane Smith"
              style={inputStyle}
              maxLength={300}
            />
          </Section>

          {/* Country */}
          <Section>
            <Label icon={<Globe size={14} />}>Target Country</Label>
            <input
              value={targetCountryCode}
              onChange={(e) => setTargetCountryCode(e.target.value)}
              placeholder="e.g. US, IN, GB"
              style={inputStyle}
              maxLength={10}
            />
          </Section>

          {/* Tone & Length */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Section>
              <Label icon={<Palette size={14} />}>Tone</Label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                style={selectStyle}
              >
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Section>
            <Section>
              <Label icon={<AlignLeft size={14} />}>Length</Label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                style={selectStyle}
              >
                {LENGTHS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Section>
          </div>

          {/* Additional Context */}
          <Section>
            <Label icon={<Info size={14} />}>Additional Context</Label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Optional: verifiable facts about your experience not captured in your resume…"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
              maxLength={5000}
            />
            <div style={{ fontSize: 11, color: T.muted, textAlign: "right" }}>
              {additionalContext.length.toLocaleString()} / 5,000
            </div>
          </Section>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              background: canGenerate
                ? `linear-gradient(135deg, ${T.primary}, ${T.accent})`
                : T.outlineVariant,
              color: canGenerate ? "#fff" : T.muted,
              fontSize: 15,
              fontWeight: 600,
              cursor: canGenerate ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.2s",
              opacity: canGenerate ? 1 : 0.6,
            }}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Mail size={18} /> Generate Cover Letter
              </>
            )}
          </button>

          {/* Info blurb */}
          <div
            style={{
              fontSize: 12,
              color: T.muted,
              lineHeight: 1.6,
              padding: "10px 14px",
              borderRadius: 8,
              background: T.surface,
              border: `1px solid ${T.outlineVariant}`,
            }}
          >
            This generator makes exactly <strong>one</strong> AI call per generation and
            reuses your existing resume data deterministically. Every fact in the letter
            is grounded in your resume or additional context — the AI never invents
            metrics, employers, or credentials. Each generation costs one build credit.
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny helpers for consistent section styling
// ---------------------------------------------------------------------------
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {children}
    </div>
  );
}

function Label({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color: T.primaryText,
      }}
    >
      {icon} {children}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: T.muted }}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Shared input/select styles
// ---------------------------------------------------------------------------
const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: `1px solid ${T.outlineVariant}`,
  background: T.surface,
  color: T.text,
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "auto" as const,
};
