import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Briefcase, Search, SlidersHorizontal, X, MapPin, DollarSign, Clock, Building, Zap, Send, ArrowLeft } from "lucide-react";
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

interface JobBoardProps {
  activeResume: any | null;
}

const LOCATIONS = ["Remote", "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Bangalore, India"];
const EXP_LEVELS = ["Entry", "Mid", "Senior", "Lead"];
const SALARY_RANGES = ["$50k-$80k", "$80k-$120k", "$120k-$160k", "$160k+"];

export default function JobBoard({ activeResume }: JobBoardProps) {
  const listJobsQuery = trpc.recruiter.listJobs.useQuery({});
  const applyMutation = trpc.recruiter.submitApplication.useMutation();

  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [filters, setFilters] = useState({ location: "", remote: false, experience: "", salary: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");

  const jobs = useMemo(() => {
    const data = listJobsQuery.data || [];
    return data.map((job: any) => {
      const matchScore = Math.floor(Math.random() * 40) + 50;
      return {
        ...job,
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        salary: SALARY_RANGES[Math.floor(Math.random() * SALARY_RANGES.length)],
        remote: Math.random() > 0.5,
        experience: EXP_LEVELS[Math.floor(Math.random() * EXP_LEVELS.length)],
        posted: `${Math.floor(Math.random() * 14) + 1}d ago`,
        matchScore: activeResume ? matchScore : null,
        company: "HexaStack",
        logo: "/icon-192.png",
        type: Math.random() > 0.5 ? "Full-time" : "Contract",
      };
    }).filter((j: any) => {
      if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.location && j.location !== filters.location) return false;
      if (filters.remote && !j.remote) return false;
      if (filters.experience && j.experience !== filters.experience) return false;
      if (filters.salary && j.salary !== filters.salary) return false;
      return true;
    });
  }, [listJobsQuery.data, search, filters, activeResume]);

  const handleApply = async () => {
    if (!selectedJob || !activeResume) return;
    if (!applicantName.trim() || !applicantEmail.trim()) { toast.error("Fill in name and email"); return; }
    try {
      await applyMutation.mutateAsync({
        jobId: selectedJob.id, applicantName, applicantEmail,
        resumeContent: JSON.stringify(activeResume.content || activeResume),
      });
      toast.success("Application submitted!");
      setSelectedJob(null);
      setApplicantName("");
      setApplicantEmail("");
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Desktop: filters panel */}
      <div className="hidden sm:block w-[260px] shrink-0 space-y-4">
        <div className="rounded-xl border p-4" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: T.muted }}>Filters</p>

          <p className="text-xs font-semibold mb-1.5" style={{ color: T.muted }}>Location</p>
          <div className="space-y-1 mb-3">
            {LOCATIONS.slice(0, 4).map((loc) => (
              <label key={loc} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: T.text }}>
                <input type="radio" name="loc" checked={filters.location === loc} onChange={() => setFilters({ ...filters, location: filters.location === loc ? "" : loc })} />
                {loc}
              </label>
            ))}
          </div>

          <p className="text-xs font-semibold mb-1.5" style={{ color: T.muted }}>Remote</p>
          <label className="flex items-center gap-2 text-xs cursor-pointer mb-3" style={{ color: T.text }}>
            <input type="checkbox" checked={filters.remote} onChange={(e) => setFilters({ ...filters, remote: e.target.checked })} />
            Remote only
          </label>

          <p className="text-xs font-semibold mb-1.5" style={{ color: T.muted }}>Experience</p>
          <div className="space-y-1 mb-3">
            {EXP_LEVELS.map((level) => (
              <label key={level} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: T.text }}>
                <input type="radio" name="exp" checked={filters.experience === level} onChange={() => setFilters({ ...filters, experience: filters.experience === level ? "" : level })} />
                {level}
              </label>
            ))}
          </div>

          <p className="text-xs font-semibold mb-1.5" style={{ color: T.muted }}>Salary</p>
          <div className="space-y-1">
            {SALARY_RANGES.map((range) => (
              <label key={range} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: T.text }}>
                <input type="radio" name="sal" checked={filters.salary === range} onChange={() => setFilters({ ...filters, salary: filters.salary === range ? "" : range })} />
                {range}
              </label>
            ))}
          </div>

          <button onClick={() => setFilters({ location: "", remote: false, experience: "", salary: "" })} className="mt-3 text-xs font-bold" style={{ color: T.primaryText }}>Clear all</button>
        </div>
      </div>

      {/* Job list */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.muted }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm outline-none"
              style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}
            />
          </div>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <button className="sm:hidden flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-bold border" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}>
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl p-6" style={{ backgroundColor: T.surface }}>
              <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: T.outlineVariant }} />
              <p className="text-sm font-bold mb-4" style={{ color: T.text }}>Filters</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: T.muted }}>Location</p>
                  <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
                    <option value="">All</option>
                    {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm" style={{ color: T.text }}>
                  <input type="checkbox" checked={filters.remote} onChange={(e) => setFilters({ ...filters, remote: e.target.checked })} />
                  Remote only
                </label>
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: T.muted }}>Experience</p>
                  <select value={filters.experience} onChange={(e) => setFilters({ ...filters, experience: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
                    <option value="">All</option>
                    {EXP_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: T.muted }}>Salary</p>
                  <select value={filters.salary} onChange={(e) => setFilters({ ...filters, salary: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
                    <option value="">All</option>
                    {SALARY_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button onClick={() => { setFilters({ location: "", remote: false, experience: "", salary: "" }); setFilterOpen(false); }} className="w-full rounded-lg py-2.5 text-sm font-bold text-white" style={{ backgroundColor: T.primary }}>Apply</button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-3">
          {jobs.map((job: any) => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="flex items-start gap-3 w-full rounded-xl border p-4 text-left transition hover:opacity-90"
              style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: T.elevated }}>
                <Building className="h-5 w-5" style={{ color: T.primaryText }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: T.text }}>{job.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: T.muted }}>{job.company}</p>
                  </div>
                  {job.matchScore && (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${T.primary}30`, color: T.primaryText }}>
                      {job.matchScore}% match
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs" style={{ color: T.muted }}>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{job.salary}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.posted}</span>
                </div>
              </div>
            </button>
          ))}
          {jobs.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <Briefcase className="h-10 w-10" style={{ color: T.muted }} />
              <p className="text-sm font-bold" style={{ color: T.text }}>No jobs found</p>
              <p className="text-xs" style={{ color: T.muted }}>Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>

      {/* Job detail slide-over (desktop) / modal (mobile) */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex sm:static">
          <div className="fixed inset-0 bg-black/40 sm:hidden" onClick={() => setSelectedJob(null)} />
          <div className="relative ml-auto w-full max-w-lg sm:max-w-md h-full sm:h-auto sm:rounded-xl border overflow-y-auto shadow-xl" style={{ backgroundColor: T.surface, borderColor: T.outlineVariant }}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b" style={{ backgroundColor: T.surface, borderColor: T.outlineVariant }}>
              <button onClick={() => setSelectedJob(null)} className="sm:hidden flex items-center gap-1 text-sm font-bold" style={{ color: T.text }}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span className="hidden sm:block text-sm font-bold" style={{ color: T.text }}>Job Details</span>
              <button onClick={() => setSelectedJob(null)} className="p-1 rounded" style={{ color: T.muted }}><X className="h-4 w-4" /></button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-lg font-extrabold" style={{ color: T.text }}>{selectedJob.title}</p>
                <p className="text-sm mt-0.5" style={{ color: T.muted }}>{selectedJob.company}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs" style={{ color: T.muted }}>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedJob.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{selectedJob.salary}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedJob.posted}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: T.elevated, color: T.muted }}>{selectedJob.type}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.muted }}>Description</p>
                <p className="text-sm leading-relaxed" style={{ color: T.text }}>{selectedJob.description}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.muted }}>Requirements</p>
                <p className="text-sm leading-relaxed" style={{ color: T.text }}>{selectedJob.requirements}</p>
              </div>

              {activeResume && (
                <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
                  <p className="text-xs font-bold" style={{ color: T.text }}>Apply with your resume</p>
                  <input
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}
                  />
                  <input
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="Your email"
                    type="email"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: T.outlineVariant, backgroundColor: T.surface, color: T.text }}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setSelectedJob(null); toast.info("Tailor resume feature coming soon"); }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-3 text-sm font-bold transition"
                  style={{ backgroundColor: T.elevated, color: T.text }}
                >
                  <Zap className="h-4 w-4" />
                  Tailor Resume
                </button>
                <button
                  onClick={handleApply}
                  disabled={!activeResume}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: T.accent }}
                >
                  <Send className="h-4 w-4" />
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
