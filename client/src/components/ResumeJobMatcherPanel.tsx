import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  RefreshCw, FileText, CheckCircle2, AlertCircle, XCircle, HelpCircle,
  GraduationCap, Award, TrendingUp, Target, Users, List, Wrench,
  Briefcase, Star, ArrowUpRight, Globe,
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

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  MATCH: { label: "Match", color: T.success },
  PARTIAL: { label: "Partial", color: T.warn },
  MISSING: { label: "Missing", color: T.danger },
  UNCLEAR: { label: "Unclear", color: T.muted },
};

interface MatcherPanelProps {
  resumes: any[];
  activeResumeId: string | null;
  onSelectResume: (id: string) => void;
}

type MatchResult = any; // ResumeJobMatchResult shape from server

export default function ResumeJobMatcherPanel({ resumes, activeResumeId, onSelectResume }: MatcherPanelProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(activeResumeId || "");
  const [jobDescription, setJobDescription] = useState("");
  const [targetCountry, setTargetCountry] = useState("");
  const [providedJobTitle, setProvidedJobTitle] = useState("");
  const [isMatching, setIsMatching] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const matchMutation = trpc.ai.matchResumeToJob.useMutation();

  const handleMatch = async () => {
    if (!selectedResumeId) { toast.error("Please select a resume"); return; }
    const trimmed = jobDescription.trim();
    if (!trimmed) { toast.error("Please paste a job description"); return; }
    if (trimmed.length > 100_000) {
      toast.error("Job description exceeds the 100,000 character limit.");
      return;
    }

    setIsMatching(true);
    setResult(null);
    try {
      const data = await matchMutation.mutateAsync({
        resumeId: selectedResumeId,
        jobDescription: trimmed,
        targetCountryCode: targetCountry.trim()
          ? targetCountry.trim().toUpperCase().slice(0, 2)
          : undefined,
        providedJobTitle: providedJobTitle.trim() || undefined,
      });
      setResult(data.match);
      toast.success("Resume matched to the job!");
    } catch (err: any) {
      const code = err?.data?.code;
      const msg = err?.message || "";
      if (code === "UNAUTHORIZED" || /sign in/i.test(msg)) {
        toast.error("Please sign in to use the Resume Matcher.");
        return;
      }
      if (code === "PAYMENT_REQUIRED" || /credit/i.test(msg)) {
        toast.error(msg || "Insufficient credits for resume matching.");
        return;
      }
      toast.error(msg || "Matching failed. Please try again.");
    } finally {
      setIsMatching(false);
    }
  };

  // Clamp a score to a valid 0–100 bandwidth for the colored ring.
  const score = result?.overallScore ?? 0;
  const band = result?.scoreBand;
  const scoreColor = !result
    ? T.muted
    : score >= 90 ? T.success
      : score >= 75 ? T.primaryText
        : score >= 60 ? T.warn
          : T.danger;

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
              <h2 className="text-lg font-bold" style={{ color: T.text }}>Resume ↔ Job Description Matcher</h2>
              <p className="text-xs mt-1" style={{ color: T.muted }}>
                Compare a resume against a job description for an evidence-based compatibility score.
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
                rows={10}
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
              onClick={handleMatch}
              disabled={isMatching}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: T.primary }}
            >
              {isMatching ? <><RefreshCw className="h-4 w-4 animate-spin" /> Matching...</> : <><Briefcase className="h-4 w-4" /> Match Resume to Job</>}
            </button>
          </div>
        </div>

        {result && (
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
            <p className="text-xs font-bold" style={{ color: scoreColor }}>{band?.label}</p>
            {band && <p className="text-[10px] mt-0.5" style={{ color: T.muted }}>Range {band.min}–{band.max}</p>}
            <p className="text-[10px] mt-2 text-center" style={{ color: T.muted }}>{result.scoreExplanation}</p>
            {result.countryContext && (
              <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color: T.muted }}>
                <Globe className="h-3 w-3" />
                {result.countryContext.atsNote ||
                  `${result.countryContext.sourceCountryName || result.countryContext.sourceCountryCode || "?"} → ${result.countryContext.targetCountryName || result.countryContext.targetCountryCode || "unspecified"}`}
              </p>
            )}
            {result.quality === "degraded" && (
              <p className="text-[10px] mt-1" style={{ color: T.muted }}>Deterministic matching only (AI insights unavailable)</p>
            )}
          </div>
        )}
      </div>

      {/* Right: results */}
      <div className="flex-1 min-w-0">
        {!result ? null : (
          <div className="space-y-4">
            {/* Category bars */}
            <ResultCard icon={Target} iconColor={T.primaryText} title="Score Breakdown by Category">
              <div className="space-y-3">
                {result.categories.map((c: any) => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold" style={{ color: T.text }}>{c.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: c.applied ? T.primaryText : T.muted }}>
                          {c.applied ? `${c.score}%` : "N/A"}
                        </span>
                        <span className="text-[10px]" style={{ color: T.muted }}>wt {c.weight}%</span>
                      </span>
                    </div>
                    {c.applied && (
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.outlineVariant }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, c.score)}%`, backgroundColor: c.score >= 75 ? T.success : c.score >= 50 ? T.warn : T.danger }} />
                      </div>
                    )}
                    {c.summary && <p className="text-[10px] mt-1" style={{ color: T.muted }}>{c.summary}</p>}
                  </div>
                ))}
              </div>
            </ResultCard>

            {/* Requirement statuses */}
            {result.requirementMatches?.length > 0 && (
              <ResultCard icon={CheckCircle2} iconColor={T.success} title="Requirements Check">
                <div className="space-y-2">
                  {(() => {
                    const shown = result.requirementMatches.slice(0, 40);
                    return shown.map((m: any, i: number) => {
                      const st = STATUS_STYLE[m.status] || STATUS_STYLE.UNCLEAR;
                      return (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <StatusIcon status={m.status} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2">
                              <span className="font-semibold" style={{ color: T.text }}>{m.requirement}</span>
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${st.color}20`, color: st.color }}>
                                {st.label}{m.required ? " · Required" : " · Preferred"}
                              </span>
                            </div>
                            {(m.evidence?.length ?? 0) > 0 && (
                              <ul className="mt-1 space-y-0.5">
                                {m.evidence.slice(0, 2).map((e: string, j: number) => (
                                  <li key={j} className="flex items-start gap-1 text-[10px]" style={{ color: T.muted }}>
                                    <ArrowUpRight className="h-3 w-3 mt-0.5 shrink-0" style={{ color: T.success }} /> {e}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                  {result.requirementMatches.length > 40 && (
                    <p className="text-[10px]" style={{ color: T.muted }}>+ {result.requirementMatches.length - 40} more requirements</p>
                  )}
                </div>
              </ResultCard>
            )}

            {/* Skill coverage: matched / missing required & preferred */}
            {(result.matchedRequiredSkills?.length > 0 || result.missingRequiredSkills?.length > 0) && (
              <ResultCard icon={Wrench} iconColor={T.primaryText} title="Skill Coverage">
                <div className="space-y-3">
                  {result.matchedRequiredSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: T.success }}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Matched required skills
                      </p>
                      <ChipList items={result.matchedRequiredSkills} color={T.success} />
                    </div>
                  )}
                  {result.missingRequiredSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: T.danger }}>
                        <XCircle className="h-3.5 w-3.5" /> Missing required skills
                      </p>
                      <ChipList items={result.missingRequiredSkills} color={T.danger} />
                    </div>
                  )}
                  {result.matchedPreferredSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: T.primaryText }}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Matched preferred skills
                      </p>
                      <ChipList items={result.matchedPreferredSkills} color={T.primaryText} />
                    </div>
                  )}
                  {result.missingPreferredSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: T.warn }}>
                        <AlertCircle className="h-3.5 w-3.5" /> Missing preferred skills
                      </p>
                      <ChipList items={result.missingPreferredSkills} color={T.warn} />
                    </div>
                  )}
                </div>
              </ResultCard>
            )}

            {/* ATS coverage */}
            {result.atsKeywords && (
              <ResultCard icon={Target} iconColor="#eab308" title={`ATS Keywords (${result.atsKeywords.percent}% covered)`}>
                <div className="space-y-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: T.outlineVariant }}>
                    <div className="h-full rounded-full" style={{ width: `${result.atsKeywords.percent}%`, backgroundColor: result.atsKeywords.percent >= 75 ? T.success : result.atsKeywords.percent >= 50 ? T.warn : T.danger }} />
                  </div>
                  {result.atsKeywords.matched?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold mb-1.5" style={{ color: T.success }}>Present in resume ({result.atsKeywords.matched.length})</p>
                      <ChipList items={result.atsKeywords.matched} color={T.success} />
                    </div>
                  )}
                  {result.atsKeywords.missing?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold mb-1.5" style={{ color: T.muted }}>Missing from resume ({result.atsKeywords.missing.length})</p>
                      <ChipList items={result.atsKeywords.missing} color={T.muted} />
                    </div>
                  )}
                </div>
              </ResultCard>
            )}

            {/* Experience */}
            {result.experienceMatch && (
              <ResultCard icon={TrendingUp} iconColor={T.success} title="Experience">
                <SimpleMatch m={result.experienceMatch} />
                {result.experienceMatch.yearsRequired != null && (
                  <p className="text-[10px] mt-1" style={{ color: T.muted }}>
                    Required: {result.experienceMatch.yearsRequired}+ yrs · Demonstrated: {result.experienceMatch.yearsDemonstrated ?? "N/A"} yrs
                  </p>
                )}
              </ResultCard>
            )}

            {/* Education */}
            {result.educationMatch && (
              <ResultCard icon={GraduationCap} iconColor={T.text} title="Education">
                <SimpleMatch m={result.educationMatch} />
              </ResultCard>
            )}

            {/* Certifications */}
            {result.certificationMatch && (
              <ResultCard icon={Award} iconColor="#eab308" title="Certifications">
                <SimpleMatch m={result.certificationMatch} />
              </ResultCard>
            )}

            {/* Responsibilities */}
            {result.responsibilityMatch && (
              <ResultCard icon={List} iconColor={T.primaryText} title="Responsibilities">
                <div className="space-y-2">
                  {(result.responsibilityMatch.matched || []).map((r: any, i: number) => {
                    const st = STATUS_STYLE[r.status] || STATUS_STYLE.UNCLEAR;
                    return (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <StatusIcon status={r.status} />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold" style={{ color: T.text }}>{r.responsibility}</span>
                          <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${st.color}20`, color: st.color }}>{st.label}</span>
                          {(r.evidence?.length ?? 0) > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {r.evidence.slice(0, 2).map((e: string, j: number) => (
                                <li key={j} className="flex items-start gap-1 text-[10px]" style={{ color: T.muted }}>
                                  <ArrowUpRight className="h-3 w-3 mt-0.5 shrink-0" style={{ color: T.success }} /> {e}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {result.responsibilityMatch.notes && (
                    <p className="text-[10px]" style={{ color: T.muted }}>{result.responsibilityMatch.notes}</p>
                  )}
                </div>
              </ResultCard>
            )}

            {/* Soft skills */}
            {result.softSkillMatches?.length > 0 && (
              <ResultCard icon={Users} iconColor={T.success} title="Soft Skills">
                <div className="space-y-2">
                  {result.softSkillMatches.map((s: any, i: number) => {
                    const st = STATUS_STYLE[s.status] || STATUS_STYLE.UNCLEAR;
                    return (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <StatusIcon status={s.status} />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold" style={{ color: T.text }}>{s.softSkill}</span>
                          <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${st.color}20`, color: st.color }}>{st.label}</span>
                          {(s.evidence?.length ?? 0) > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {s.evidence.slice(0, 2).map((e: string, j: number) => (
                                <li key={j} className="flex items-start gap-1 text-[10px]" style={{ color: T.muted }}>
                                  <ArrowUpRight className="h-3 w-3 mt-0.5 shrink-0" style={{ color: T.success }} /> {e}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ResultCard>
            )}

            {/* Role & domain alignment */}
            {(result.roleAlignment || result.domainAlignment) && (
              <ResultCard icon={Briefcase} iconColor={T.primaryText} title="Role & Domain Alignment">
                <div className="space-y-2 text-xs">
                  {result.roleAlignment && (
                    <p><span className="font-bold" style={{ color: T.muted }}>Role: </span>
                      <span className="font-semibold" style={{ color: T.text }}>{result.roleAlignment}</span></p>
                  )}
                  {result.roleAlignmentSummary && (
                    <p className="text-[10px]" style={{ color: T.muted }}>{result.roleAlignmentSummary}</p>
                  )}
                  {result.domainAlignment && (
                    <p><span className="font-bold" style={{ color: T.muted }}>Domain: </span>
                      <span className="font-semibold" style={{ color: T.text }}>{result.domainAlignment.status}</span>
                      {result.domainAlignment.summary && <span className="ml-1 text-[10px]" style={{ color: T.muted }}>— {result.domainAlignment.summary}</span>}
                    </p>
                  )}
                </div>
              </ResultCard>
            )}

            {/* Strengths */}
            {result.strengths?.length > 0 && (
              <ResultCard icon={Star} iconColor={T.success} title="Strengths">
                <BulletList items={result.strengths} />
              </ResultCard>
            )}

            {/* Gaps */}
            {result.gaps?.length > 0 && (
              <ResultCard icon={AlertCircle} iconColor={T.accent} title="Gaps to Close">
                <div className="space-y-2">
                  {result.gaps.map((g: any, i: number) => {
                    const st = STATUS_STYLE[g.status] || STATUS_STYLE.UNCLEAR;
                    return (
                      <div key={i} className="rounded-lg border p-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-bold text-xs" style={{ color: T.text }}>{g.requirement}</span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${st.color}20`, color: st.color }}>
                            {g.required ? "Required" : "Preferred"}
                          </span>
                        </div>
                        {g.impact && <p className="text-[10px] mt-1" style={{ color: T.muted }}>{g.impact}</p>}
                      </div>
                    );
                  })}
                </div>
              </ResultCard>
            )}

            {/* Notes & explanation */}
            {result.explanation && (
              <ResultCard icon={FileText} iconColor={T.primaryText} title="Why This Score">
                <p className="text-xs leading-relaxed" style={{ color: T.text }}>{result.explanation}</p>
              </ResultCard>
            )}
            {result.notes?.length > 0 && (
              <ResultCard icon={FileText} iconColor={T.text} title="Notes">
                <BulletList items={result.notes} />
              </ResultCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const color = (STATUS_STYLE[status] || STATUS_STYLE.UNCLEAR).color;
  if (status === "MATCH") return <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />;
  if (status === "PARTIAL") return <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />;
  if (status === "MISSING") return <XCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />;
  return <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />;
}

function SimpleMatch({ m }: { m: any }) {
  return (
    <div className="space-y-2 text-xs">
      {m.jdRequirement?.length > 0 && (
        <p>
          <span className="font-bold" style={{ color: T.muted }}>JD asks: </span>
          {m.jdRequirement.join(" · ")}
        </p>
      )}
      <p className="flex items-center gap-1.5">
        <StatusIcon status={m.status} />
        <span style={{ color: T.text }}>{(STATUS_STYLE[m.status] || STATUS_STYLE.UNCLEAR).label}</span>
      </p>
      {m.evidence?.length > 0 && (
        <ul className="space-y-0.5">
          {m.evidence.slice(0, 2).map((e: string, i: number) => (
            <li key={i} className="flex items-start gap-1 text-[10px]" style={{ color: T.muted }}>
              <ArrowUpRight className="h-3 w-3 mt-0.5 shrink-0" style={{ color: T.success }} /> {e}
            </li>
          ))}
        </ul>
      )}
      {m.notes && <p className="text-[10px]" style={{ color: T.muted }}>{m.notes}</p>}
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