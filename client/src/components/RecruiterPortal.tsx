import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Briefcase, Users, Plus, Award, Search, Eye, Send, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

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

export default function RecruiterPortal() {
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobReqs, setJobReqs] = useState("");

  const [messageText, setMessageText] = useState("");

  const listOrgsQuery = trpc.organization.list.useQuery();
  const listJobsQuery = trpc.recruiter.listJobs.useQuery({ orgId: selectedOrgId }, { enabled: !!selectedOrgId });
  const listAppsQuery = trpc.recruiter.listApplications.useQuery({ jobId: selectedJobId }, { enabled: !!selectedJobId });
  const createJobMutation = trpc.recruiter.createJob.useMutation();
  const updateStatusMutation = trpc.recruiter.updateStatus.useMutation();

  useEffect(() => {
    if (listOrgsQuery.data?.length && !selectedOrgId) setSelectedOrgId(listOrgsQuery.data[0].id);
  }, [listOrgsQuery.data]);
  useEffect(() => {
    if (listJobsQuery.data?.length) setSelectedJobId(listJobsQuery.data[0].id);
  }, [listJobsQuery.data]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDesc.trim() || !jobReqs.trim()) { toast.error("Fill all fields"); return; }
    try {
      await createJobMutation.mutateAsync({ orgId: selectedOrgId, title: jobTitle, description: jobDesc, requirements: jobReqs });
      toast.success(`"${jobTitle}" published`);
      listJobsQuery.refetch();
      setCreateOpen(false);
      setJobTitle(""); setJobDesc(""); setJobReqs("");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      listAppsQuery.refetch();
      toast.success(`Status → ${status}`);
    } catch { toast.error("Failed"); }
  };

  const candidates = listAppsQuery.data || [];
  const filtered = candidates.filter((c: any) =>
    c.applicantName?.toLowerCase().includes(search.toLowerCase())
  );
  const stats = {
    candidates: candidates.length,
    openRoles: listJobsQuery.data?.length || 0,
    newMatches: candidates.filter((c: any) => c.matchScore >= 75).length,
  };

  const currentJob = listJobsQuery.data?.find((j: any) => j.id === selectedJobId);

  return (
    <div>
      {/* Mobile: org/job selector bar */}
      <div className="flex items-center gap-2 mb-4 sm:hidden">
        <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
          {(listJobsQuery.data || []).map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <Sheet open={createOpen} onOpenChange={setCreateOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-white" style={{ backgroundColor: T.accent }}><Plus className="h-4 w-4" />Post</button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl p-6" style={{ backgroundColor: T.surface }}>
            <CreateJobForm jobTitle={jobTitle} setJobTitle={setJobTitle} jobDesc={jobDesc} setJobDesc={setJobDesc} jobReqs={jobReqs} setJobReqs={setJobReqs} onSubmit={handleCreateJob} onClose={() => setCreateOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Desktop: left panel (jobs + table) */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Desktop: org/job controls */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {listOrgsQuery.data && (
                <select value={selectedOrgId} onChange={(e) => { setSelectedOrgId(e.target.value); setSelectedJobId(""); }}
                  className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
                  {listOrgsQuery.data.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              )}
              <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
                {(listJobsQuery.data || []).map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <button onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: T.accent }}>
              <Plus className="h-4 w-4" /> Post Role
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            {[{ icon: Users, label: 'Candidates', value: stats.candidates },
              { icon: Briefcase, label: 'Open Roles', value: stats.openRoles },
              { icon: Award, label: 'Top Matches', value: stats.newMatches },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
                <div className="flex items-center gap-2">
                  <s.icon className="h-4 w-4" style={{ color: T.primaryText }} />
                  <span className="text-xs" style={{ color: T.muted }}>{s.label}</span>
                </div>
                <p className="text-xl font-extrabold mt-1" style={{ color: T.text }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.muted }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates..."
              className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm outline-none"
              style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
          </div>

          {/* Mobile: candidate list */}
          <div className="sm:hidden space-y-2">
            {filtered.map((app: any) => (
              <button key={app.id} onClick={() => setSelectedCandidate(selectedCandidate?.id === app.id ? null : app)}
                className="flex items-center gap-3 w-full rounded-xl border p-3 text-left"
                style={{ borderColor: selectedCandidate?.id === app.id ? T.primary : T.outlineVariant, backgroundColor: T.surface }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: T.elevated }}>
                  <User className="h-5 w-5" style={{ color: T.primaryText }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: T.text }}>{app.applicantName}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.muted }}>{currentJob?.title || 'Candidate'}</p>
                </div>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: app.matchScore >= 75 ? `${T.success}20` : `${T.accent}20`, color: app.matchScore >= 75 ? T.success : T.accent }}>
                  {app.matchScore}%
                </span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center text-xs py-8" style={{ color: T.muted }}>No candidates yet</p>}
          </div>

          {/* Desktop: candidate table */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="rounded-xl border" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.outlineVariant}` }}>
                    {['Name', 'Match %', 'Role', 'Status', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: T.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app: any) => (
                    <tr key={app.id}
                      onClick={() => setSelectedCandidate(selectedCandidate?.id === app.id ? null : app)}
                      className="cursor-pointer transition"
                      style={{ backgroundColor: selectedCandidate?.id === app.id ? `${T.primary}15` : 'transparent', borderBottom: `1px solid ${T.outlineVariant}` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: T.elevated }}>
                            <User className="h-4 w-4" style={{ color: T.primaryText }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: T.text }}>{app.applicantName}</p>
                            <p className="text-xs" style={{ color: T.muted }}>{app.applicantEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: app.matchScore >= 75 ? `${T.success}20` : `${T.accent}20`, color: app.matchScore >= 75 ? T.success : T.accent }}>
                          {app.matchScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: T.text }}>{currentJob?.title || '-'}</td>
                      <td className="px-4 py-3">
                        <select value={app.status} onChange={(e) => handleStatus(app.id, e.target.value)}
                          className="rounded-lg border px-2 py-1 text-xs outline-none"
                          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedCandidate(app); }} className="p-1 rounded" style={{ color: T.muted }}>
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-xs" style={{ color: T.muted }}>No applications yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Desktop: candidate detail panel */}
        <div className="hidden sm:block w-[360px] shrink-0">
          {selectedCandidate ? (
            <div className="rounded-xl border p-4 space-y-4 sticky top-4" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: T.elevated }}>
                  <User className="h-6 w-6" style={{ color: T.primaryText }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: T.text }}>{selectedCandidate.applicantName}</p>
                  <p className="text-xs" style={{ color: T.muted }}>{selectedCandidate.applicantEmail}</p>
                </div>
                <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: `${T.primary}30`, color: T.primaryText }}>
                  {selectedCandidate.matchScore}% match
                </span>
              </div>

              <div className="rounded-lg border p-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
                <p className="text-xs font-bold mb-1" style={{ color: T.muted }}>Resume Preview</p>
                <p className="text-xs leading-relaxed font-mono" style={{ color: T.text, maxHeight: '120px', overflowY: 'auto' }}>
                  {selectedCandidate.resumeContent || 'No resume content'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold" style={{ color: T.muted }}>Send Message</p>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write an outreach message..."
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
                />
                <button
                  onClick={() => { if (!messageText.trim()) return; toast.success(`Message sent to ${selectedCandidate.applicantName}`); setMessageText(""); }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ backgroundColor: T.primary }}
                >
                  <Send className="h-4 w-4" /> Send Message
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-2 rounded-xl border border-dashed" style={{ borderColor: T.outlineVariant }}>
              <Users className="h-8 w-8" style={{ color: T.muted }} />
              <p className="text-xs" style={{ color: T.muted }}>Select a candidate</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Create Job Dialog */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-[400px] p-6" style={{ backgroundColor: T.surface }}>
          <CreateJobForm jobTitle={jobTitle} setJobTitle={setJobTitle} jobDesc={jobDesc} setJobDesc={setJobDesc} jobReqs={jobReqs} setJobReqs={setJobReqs} onSubmit={handleCreateJob} onClose={() => setCreateOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CreateJobForm({ jobTitle, setJobTitle, jobDesc, setJobDesc, jobReqs, setJobReqs, onSubmit, onClose }: {
  jobTitle: string; setJobTitle: (v: string) => void;
  jobDesc: string; setJobDesc: (v: string) => void;
  jobReqs: string; setJobReqs: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void; onClose: () => void;
}) {
  const T2 = { surface: '#131b33', elevated: '#1c2747', primary: '#1e40af', text: '#e2e8f0', muted: '#94a3b8', outlineVariant: '#2a3a5c' };
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-lg font-extrabold" style={{ color: T2.text }}>Post a Role</p>
      <div className="space-y-1.5">
        <p className="text-xs font-semibold" style={{ color: T2.muted }}>Job Title</p>
        <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Senior Full-Stack Engineer"
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: T2.outlineVariant, backgroundColor: T2.elevated, color: T2.text }} />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-semibold" style={{ color: T2.muted }}>Description</p>
        <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Detailed responsibilities..."
          rows={4} className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none"
          style={{ borderColor: T2.outlineVariant, backgroundColor: T2.elevated, color: T2.text }} />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-semibold" style={{ color: T2.muted }}>Requirements (comma-separated)</p>
        <input value={jobReqs} onChange={(e) => setJobReqs(e.target.value)} placeholder="React, Node.js, SQL"
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: T2.outlineVariant, backgroundColor: T2.elevated, color: T2.text }} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold"
          style={{ backgroundColor: T2.elevated, color: T2.muted }}>Cancel</button>
        <button type="submit"
          className="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: T2.primary }}>Publish</button>
      </div>
    </form>
  );
}
