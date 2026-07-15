import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Briefcase, Users, Plus, Search, X, ChevronRight,
  ChevronLeft, MoveHorizontal, ArrowUpRight,
  Building, Star, MessageSquare, Clock, Calendar
} from "lucide-react";

type Candidate = {
  id: string;
  jobId: string;
  applicantName: string;
  applicantEmail: string;
  matchScore: number;
  status: string;
  resumeContent: string;
  createdAt: string;
};

type Job = {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  requirements: string;
  status: string;
  createdAt: string;
};

const PIPELINE_STAGES = ["new", "screening", "interview", "offer"] as const;
type PipelineStage = (typeof PIPELINE_STAGES)[number];

const STAGE_LABELS: Record<PipelineStage, string> = {
  new: "New",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
};

const STAGE_ICONS: Record<PipelineStage, React.ReactNode> = {
  new: <Clock className="w-3.5 h-3.5" />,
  screening: <Search className="w-3.5 h-3.5" />,
  interview: <MessageSquare className="w-3.5 h-3.5" />,
  offer: <Star className="w-3.5 h-3.5" />,
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  new: "border-t-blue-500",
  screening: "border-t-amber-500",
  interview: "border-t-purple-500",
  offer: "border-t-emerald-500",
};

const STAGE_BG: Record<PipelineStage, string> = {
  new: "bg-blue-50/60",
  screening: "bg-amber-50/60",
  interview: "bg-purple-50/60",
  offer: "bg-emerald-50/60",
};

const STAGE_BADGE: Record<PipelineStage, string> = {
  new: "bg-blue-100 text-blue-700",
  screening: "bg-amber-100 text-amber-700",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-emerald-100 text-emerald-700",
};

const NEXT_STAGE: Record<PipelineStage, PipelineStage | null> = {
  new: "screening",
  screening: "interview",
  interview: "offer",
  offer: null,
};

const PREV_STAGE: Record<PipelineStage, PipelineStage | null> = {
  new: null,
  screening: "new",
  interview: "screening",
  offer: "interview",
};

function getStageFromStatus(status: string): PipelineStage {
  const stage = status as PipelineStage;
  if (PIPELINE_STAGES.includes(stage)) return stage;
  if (status === "pending") return "new";
  if (status === "reviewed") return "screening";
  if (status === "shortlisted") return "interview";
  if (status === "rejected") return "new";
  return "new";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-800";
  if (score >= 60) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function extractKeywords(text: string): string[] {
  const techTerms = [
    "React", "Angular", "Vue", "Node", "TypeScript", "JavaScript", "Python",
    "Java", "Go", "Rust", "SQL", "PostgreSQL", "MongoDB", "Redis", "Docker",
    "Kubernetes", "AWS", "GCP", "Azure", "GraphQL", "REST", "API", "CI/CD",
    "Git", "Linux", "HTML", "CSS", "Sass", "Tailwind", "Next.js", "Express",
    "Django", "Flask", "Spring", "FastAPI", "Figma", "Sketch", "Jira",
    "Agile", "Scrum", "Terraform", "Ansible", "Jenkins", "Kafka", "RabbitMQ",
    "Machine Learning", "AI", "Data Science", "TensorFlow", "PyTorch"
  ];
  const lower = text.toLowerCase();
  return techTerms.filter(t => lower.includes(t.toLowerCase()));
}

function hasRecruiterAccess(orgs: { role: string }[], userRole?: string): boolean {
  if (userRole === "admin") return true;
  return orgs.some(o => ["owner", "recruiter", "admin"].includes(o.role));
}

export default function RecruiterPortal() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [drawerCandidate, setDrawerCandidate] = useState<Candidate | null>(null);
  const [mobileStage, setMobileStage] = useState<PipelineStage>("new");
  const [mobileDetailCandidate, setMobileDetailCandidate] = useState<Candidate | null>(null);

  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobReqs, setJobReqs] = useState("");

  const listOrgsQuery = trpc.organization.list.useQuery();
  const listJobsQuery = trpc.recruiter.listJobs.useQuery(
    { orgId: selectedOrgId },
    { enabled: !!selectedOrgId }
  );
  const listAppsQuery = trpc.recruiter.listApplications.useQuery(
    { jobId: selectedJobId },
    { enabled: !!selectedJobId }
  );
  const createJobMutation = trpc.recruiter.createJob.useMutation();
  const updateStatusMutation = trpc.recruiter.updateStatus.useMutation();

  const dragCandidateRef = useRef<string | null>(null);

  useEffect(() => {
    if (listOrgsQuery.data && listOrgsQuery.data.length > 0 && !selectedOrgId) {
      setSelectedOrgId(listOrgsQuery.data[0]?.id || "");
    }
  }, [listOrgsQuery.data]);

  useEffect(() => {
    if (listJobsQuery.data && listJobsQuery.data.length > 0) {
      const currentStillExists = listJobsQuery.data.find(j => j.id === selectedJobId);
      if (!currentStillExists) {
        setSelectedJobId(listJobsQuery.data[0].id);
      }
    } else {
      setSelectedJobId("");
    }
  }, [listJobsQuery.data]);

  const orgs = listOrgsQuery.data || [];
  const isRecruiter = hasRecruiterAccess(orgs, user?.role);

  const currentJob = listJobsQuery.data?.find(j => j.id === selectedJobId);

  const candidates = (listAppsQuery.data || []) as Candidate[];

  const groupedCandidates: Record<PipelineStage, Candidate[]> = {
    new: [], screening: [], interview: [], offer: [],
  };
  for (const c of candidates) {
    const stage = getStageFromStatus(c.status);
    groupedCandidates[stage].push(c);
  }

  const searchedCandidates = searchQuery.trim()
    ? Object.fromEntries(
        Object.entries(groupedCandidates).map(([stage, list]) => [
          stage,
          list.filter(c =>
            c.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.applicantEmail.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        ])
      ) as Record<PipelineStage, Candidate[]>
    : groupedCandidates;

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDesc.trim() || !jobReqs.trim()) {
      toast.error("Please fill in all job listing details");
      return;
    }
    try {
      await createJobMutation.mutateAsync({
        orgId: selectedOrgId,
        title: jobTitle,
        description: jobDesc,
        requirements: jobReqs,
      });
      toast.success(`Job posting "${jobTitle}" successfully published!`);
      listJobsQuery.refetch();
      setCreateJobOpen(false);
      setJobTitle("");
      setJobDesc("");
      setJobReqs("");
    } catch {
      toast.error("Failed to create job posting");
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: appId, status: newStatus });
      listAppsQuery.refetch();
      if (drawerCandidate?.id === appId) {
        setDrawerCandidate(prev => prev ? { ...prev, status: newStatus } : null);
      }
      if (mobileDetailCandidate?.id === appId) {
        setMobileDetailCandidate(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      toast.error("Could not update status");
    }
  };

  const handleDrop = useCallback(
    (stage: PipelineStage) => {
      const appId = dragCandidateRef.current;
      if (!appId) return;
      dragCandidateRef.current = null;
      handleUpdateStatus(appId, stage);
    },
    [selectedJobId]
  );

  const moveToStage = (appId: string, stage: string) => {
    handleUpdateStatus(appId, stage);
  };

  const totalCandidates = candidates.length;

  if (!isRecruiter && listOrgsQuery.isFetched) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
          <Briefcase className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Recruiter Portal</h2>
        <p className="text-slate-500 max-w-md mb-6 leading-relaxed">
          This feature is for recruiter and organization accounts. Upgrade to a
          team or enterprise plan to post jobs, review candidates, and manage
          your hiring pipeline.
        </p>
        <div className="flex gap-3">
          <Button
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            onClick={() => window.location.href = "/dashboard/billing"}
          >
            Upgrade to Team Plan
            <ArrowUpRight className="w-4 h-4 ml-1.5" />
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/dashboard/organization"}>
            <Building className="w-4 h-4 mr-1.5" />
            Create Organization
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-6">
          Need help?{" "}
          <a href="/dashboard/settings" className="text-indigo-600 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">Recruiter Portal</h2>
              <p className="text-[11px] text-slate-500">Hiring pipeline management</p>
            </div>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Recruiter</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {orgs.length > 0 && (
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="w-full md:w-44 bg-white border-slate-300 h-8 text-sm">
                <SelectValue placeholder="Select team..." />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>
                    <Building className="w-3 h-3 inline mr-1.5 text-slate-400" />
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedOrgId && (
            <Dialog open={createJobOpen} onOpenChange={setCreateJobOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-8 gap-1.5 text-xs font-medium">
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Post a Job</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white">
                <form onSubmit={handleCreateJob}>
                  <DialogHeader>
                    <DialogTitle>Post a Job Opening</DialogTitle>
                    <DialogDescription>
                      Create a new job listing to receive candidate applications.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Job Title</label>
                      <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Full-Stack Engineer" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Description</label>
                      <Textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Role responsibilities and environment." required rows={3} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Required Skills / Keywords</label>
                      <Input value={jobReqs} onChange={(e) => setJobReqs(e.target.value)} placeholder="e.g. React, Node.js, SQL, TypeScript" required />
                      <span className="text-[10px] text-slate-500">Separate skills with commas. Used for ATS matching.</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateJobOpen(false)} size="sm">Cancel</Button>
                    <Button type="submit" className="bg-indigo-600 text-white" size="sm">Create Job Listing</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {selectedOrgId && selectedJobId && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates by name or email..."
            className="pl-8 h-8 text-xs bg-white border-slate-300"
          />
        </div>
      )}

      {selectedOrgId ? (
        <>
          {/* Job Selector */}
          {listJobsQuery.data && listJobsQuery.data.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {listJobsQuery.data.map((job: Job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border",
                    job.id === selectedJobId
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-300 hover:border-indigo-300 hover:text-indigo-600"
                  )}
                >
                  {job.title}
                </button>
              ))}
            </div>
          )}

          {selectedJobId && currentJob ? (
            isMobile ? (
              <MobileView
                candidates={searchedCandidates}
                totalCandidates={totalCandidates}
                mobileStage={mobileStage}
                onStageChange={setMobileStage}
                moveToStage={moveToStage}
                mobileDetailCandidate={mobileDetailCandidate}
                onSelectCandidate={setMobileDetailCandidate}
                onCloseDetail={() => setMobileDetailCandidate(null)}
              />
            ) : (
              <DesktopView
                candidates={searchedCandidates}
                drawerCandidate={drawerCandidate}
                onSelectCandidate={setDrawerCandidate}
                moveToStage={moveToStage}
                onDrop={handleDrop}
                dragRef={dragCandidateRef}
              />
            )
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg h-56 flex flex-col items-center justify-center text-center p-8">
              <Users className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Select a Job</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                {listJobsQuery.data?.length === 0
                  ? "No jobs posted yet. Click 'Post a Job' to get started."
                  : "Click on a job above to view its candidate pipeline."}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg h-56 flex flex-col items-center justify-center text-center p-8">
          <Building className="w-10 h-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Select an Organization</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-0.5">
            Choose a team above or create one in the Organization Portal.
          </p>
        </div>
      )}

      {/* Desktop Detail Drawer */}
      {!isMobile && drawerCandidate && (
        <DetailDrawer
          candidate={drawerCandidate}
          onClose={() => setDrawerCandidate(null)}
          moveToStage={moveToStage}
          currentStage={getStageFromStatus(drawerCandidate.status)}
        />
      )}
    </div>
  );
}

function DesktopView({
  candidates,
  drawerCandidate,
  onSelectCandidate,
  moveToStage,
  onDrop,
  dragRef,
}: {
  candidates: Record<PipelineStage, Candidate[]>;
  drawerCandidate: Candidate | null;
  onSelectCandidate: (c: Candidate | null) => void;
  moveToStage: (id: string, stage: string) => void;
  onDrop: (stage: PipelineStage) => void;
  dragRef: React.MutableRefObject<string | null>;
}) {
  return (
    <div className={cn("flex gap-3 transition-all duration-300", drawerCandidate ? "pr-[380px]" : "")}>
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-4 gap-3">
          {PIPELINE_STAGES.map((stage) => {
            const stageCandidates = candidates[stage];
            return (
              <div
                key={stage}
                className={cn(
                  "border-t-2 border-slate-200 bg-white rounded-lg shadow-sm flex flex-col min-h-[250px]",
                  STAGE_COLORS[stage]
                )}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-1", "ring-indigo-400"); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("ring-1", "ring-indigo-400"); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("ring-1", "ring-indigo-400");
                  onDrop(stage);
                }}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("p-0.5 rounded", STAGE_BG[stage])}>{STAGE_ICONS[stage]}</span>
                    <span className="text-xs font-semibold text-slate-700">{STAGE_LABELS[stage]}</span>
                  </div>
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", STAGE_BADGE[stage])}>
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Table column headers */}
                <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-1.5 border-b border-slate-50">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Candidate</span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider text-right">Score</span>
                </div>

                {/* Rows */}
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
                  {stageCandidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mb-1.5">
                        <Users className="w-3 h-3 text-slate-300" />
                      </div>
                      <p className="text-[11px] text-slate-400">No candidates</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {stageCandidates.map((c) => (
                        <DraggableRow
                          key={c.id}
                          candidate={c}
                          onClick={() => onSelectCandidate(c)}
                          isSelected={drawerCandidate?.id === c.id}
                          dragRef={dragRef}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DraggableRow({
  candidate,
  onClick,
  isSelected,
  dragRef,
}: {
  candidate: Candidate;
  onClick: () => void;
  isSelected: boolean;
  dragRef: React.MutableRefObject<string | null>;
}) {
  return (
    <div
      draggable
      onDragStart={() => { dragRef.current = candidate.id; }}
      onClick={onClick}
      className={cn(
        "grid grid-cols-[1fr_auto] gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-slate-50 active:cursor-grabbing",
        isSelected && "bg-indigo-50/60"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className="w-6 h-6 shrink-0">
          <AvatarFallback className="text-[9px] font-semibold bg-indigo-100 text-indigo-700">
            {getInitials(candidate.applicantName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-800 truncate leading-tight">{candidate.applicantName}</p>
          <p className="text-[10px] text-slate-400 truncate leading-tight">{candidate.applicantEmail}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-2.5 h-2.5 text-slate-300" />
            <span className="text-[9px] text-slate-400">{formatDate(candidate.createdAt)}</span>
          </div>
          <div className="flex gap-0.5 mt-0.5 flex-wrap">
            {extractKeywords(candidate.resumeContent).slice(0, 2).map((kw, i) => (
              <span key={i} className="text-[8px] px-1 py-[1px] rounded bg-slate-100 text-slate-400 border border-slate-200 leading-none">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", getScoreBg(candidate.matchScore))}>
          {candidate.matchScore}%
        </span>
      </div>
    </div>
  );
}

function DetailDrawer({
  candidate,
  onClose,
  moveToStage,
  currentStage,
}: {
  candidate: Candidate;
  onClose: () => void;
  moveToStage: (id: string, stage: string) => void;
  currentStage: PipelineStage;
}) {
  const keywords = extractKeywords(candidate.resumeContent);

  return (
    <div className="fixed right-0 top-0 h-full w-[380px] bg-white border-l border-slate-200 shadow-xl z-40 flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs font-bold bg-indigo-100 text-indigo-700">
              {getInitials(candidate.applicantName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{candidate.applicantName}</h3>
            <p className="text-[11px] text-slate-500">{candidate.applicantEmail}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto text-[11px]">
        {/* Score */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0",
              candidate.matchScore >= 80 ? "border-emerald-400 bg-emerald-50 text-emerald-700" :
              candidate.matchScore >= 60 ? "border-amber-400 bg-amber-50 text-amber-700" :
              "border-rose-400 bg-rose-50 text-rose-700"
            )}>
              {candidate.matchScore}%
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">ATS Match Score</p>
              <p className="text-[11px] text-slate-500">
                {candidate.matchScore >= 80 ? "Strong match" :
                 candidate.matchScore >= 60 ? "Moderate match" :
                 "Low match"}
              </p>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Skills Detected</p>
          <div className="flex flex-wrap gap-1">
            {keywords.length > 0 ? keywords.map((kw, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{kw}</span>
            )) : (
              <p className="text-[11px] text-slate-400 italic">No tech keywords detected</p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Timeline</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-slate-600">Applied — {formatDate(candidate.createdAt)}</span>
            </div>
            {candidate.status !== "new" && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="text-[11px] text-slate-600">Moved to {STAGE_LABELS[getStageFromStatus(candidate.status)]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Resume */}
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Resume Content</p>
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 max-h-[200px] overflow-y-auto">
            <pre className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
              {candidate.resumeContent}
            </pre>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Move To</p>
        <div className="flex gap-1.5">
          {PREV_STAGE[currentStage] && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-[11px] border-slate-300"
              onClick={() => moveToStage(candidate.id, PREV_STAGE[currentStage]!)}
            >
              <ChevronLeft className="w-3 h-3 mr-0.5" />
              {STAGE_LABELS[PREV_STAGE[currentStage]!]}
            </Button>
          )}
          {NEXT_STAGE[currentStage] && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-[11px] bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
              onClick={() => moveToStage(candidate.id, NEXT_STAGE[currentStage]!)}
            >
              {STAGE_LABELS[NEXT_STAGE[currentStage]!]}
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileView({
  candidates,
  totalCandidates,
  mobileStage,
  onStageChange,
  moveToStage,
  mobileDetailCandidate,
  onSelectCandidate,
  onCloseDetail,
}: {
  candidates: Record<PipelineStage, Candidate[]>;
  totalCandidates: number;
  mobileStage: PipelineStage;
  onStageChange: (s: PipelineStage) => void;
  moveToStage: (id: string, stage: string) => void;
  mobileDetailCandidate: Candidate | null;
  onSelectCandidate: (c: Candidate | null) => void;
  onCloseDetail: () => void;
}) {
  const stageCandidates = candidates[mobileStage];

  return (
    <>
      {/* Segmented Control */}
      <div className="bg-white rounded-lg border border-slate-200 p-0.5 flex gap-0.5">
        {PIPELINE_STAGES.map((stage) => (
          <button
            key={stage}
            onClick={() => onStageChange(stage)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-medium transition-all",
              mobileStage === stage
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {STAGE_ICONS[stage]}
            <span>{STAGE_LABELS[stage]}</span>
            <span className={cn(
              "text-[9px] px-1 rounded-full",
              mobileStage === stage ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
            )}>
              {candidates[stage].length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-1 pb-4">
        {stageCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-xs font-medium text-slate-500">No candidates here</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Move candidates from a previous stage.</p>
          </div>
        ) : (
          stageCandidates.map((c) => (
            <MobileCandidateCard
              key={c.id}
              candidate={c}
              onClick={() => onSelectCandidate(c)}
              moveToStage={moveToStage}
            />
          ))
        )}
      </div>

      {/* Full-Screen Detail */}
      {mobileDetailCandidate && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
            <button onClick={onCloseDetail} className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <Badge className={cn("text-[10px] px-1.5 py-0", getScoreBg(mobileDetailCandidate.matchScore))}>
              {mobileDetailCandidate.matchScore}% Match
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto text-[11px]">
            <div className="px-3 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="text-xs font-bold bg-indigo-100 text-indigo-700">
                    {getInitials(mobileDetailCandidate.applicantName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{mobileDetailCandidate.applicantName}</h3>
                  <p className="text-[11px] text-slate-500">{mobileDetailCandidate.applicantEmail}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(mobileDetailCandidate.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="px-3 py-3 border-b border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">ATS Score</p>
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0",
                  mobileDetailCandidate.matchScore >= 80 ? "border-emerald-400 bg-emerald-50 text-emerald-700" :
                  mobileDetailCandidate.matchScore >= 60 ? "border-amber-400 bg-amber-50 text-amber-700" :
                  "border-rose-400 bg-rose-50 text-rose-700"
                )}>
                  {mobileDetailCandidate.matchScore}%
                </div>
                <span className="text-[11px] text-slate-500">
                  {mobileDetailCandidate.matchScore >= 80 ? "Strong match" :
                   mobileDetailCandidate.matchScore >= 60 ? "Moderate match" : "Low match"}
                </span>
              </div>
            </div>

            <div className="px-3 py-3 border-b border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1">
                {extractKeywords(mobileDetailCandidate.resumeContent).map((kw, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{kw}</span>
                ))}
              </div>
            </div>

            <div className="px-3 py-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Resume</p>
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 max-h-[240px] overflow-y-auto">
                <pre className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                  {mobileDetailCandidate.resumeContent}
                </pre>
              </div>
            </div>
          </div>

          {/* Sticky Move Actions */}
          <div className="px-3 py-2.5 border-t border-slate-100 bg-white">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Move Candidate</p>
            <div className="flex gap-1.5">
              {PIPELINE_STAGES.filter(s => s !== getStageFromStatus(mobileDetailCandidate.status)).map((stage) => (
                <Button
                  key={stage}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[10px] border-slate-300"
                  onClick={() => {
                    moveToStage(mobileDetailCandidate.id, stage);
                    onCloseDetail();
                  }}
                >
                  {STAGE_ICONS[stage]}
                  <span className="ml-0.5">{STAGE_LABELS[stage]}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileCandidateCard({
  candidate,
  onClick,
  moveToStage,
}: {
  candidate: Candidate;
  onClick: () => void;
  moveToStage: (id: string, stage: string) => void;
}) {
  const currentStage = getStageFromStatus(candidate.status);
  const availableMoves = PIPELINE_STAGES.filter(s => s !== currentStage);

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
      onClick={onClick}
    >
      <div className="p-2.5">
        <div className="flex items-start gap-2.5">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-[10px] font-bold bg-indigo-100 text-indigo-700">
              {getInitials(candidate.applicantName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-800 truncate">{candidate.applicantName}</p>
              <span className={cn("text-[9px] font-bold px-1 py-[1px] rounded shrink-0", getScoreBg(candidate.matchScore))}>
                {candidate.matchScore}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">{candidate.applicantEmail}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-slate-400">{formatDate(candidate.createdAt)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] text-slate-500 hover:text-slate-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoveHorizontal className="w-3 h-3 mr-0.5" />
                    Move
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white min-w-[120px]">
                  {availableMoves.map((stage) => (
                    <DropdownMenuItem
                      key={stage}
                      onClick={(e) => { e.stopPropagation(); moveToStage(candidate.id, stage); }}
                      className="text-xs gap-1.5"
                    >
                      {STAGE_ICONS[stage]}
                      {STAGE_LABELS[stage]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
