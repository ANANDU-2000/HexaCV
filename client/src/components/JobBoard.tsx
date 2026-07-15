import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import {
  Briefcase, Search, MapPin, Clock, Building, ArrowLeft,
  ExternalLink, Sparkles, FileText, X, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface JobBoardProps {
  activeResume: any | null;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  status?: string;
  createdAt?: Date;
  organizationId?: string;
}

function computeMatchScore(resume: any | null, job: Job): { score: number; matched: string[]; missing: string[] } | null {
  if (!resume) return null;

  const resumeText = extractResumeText(resume).toLowerCase();
  const keywords = extractKeywords(job);

  if (keywords.length === 0) return { score: 0, matched: [], missing: [] };

  const matched: string[] = [];
  const missing: string[] = [];

  keywords.forEach((kw) => {
    if (resumeText.includes(kw.toLowerCase())) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });

  const score = Math.round((matched.length / keywords.length) * 100);
  return { score, matched, missing };
}

function extractResumeText(resume: any): string {
  try {
    const content = typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content;
    if (content.sections) {
      return content.sections
        .filter((s: any) => s.visible !== false)
        .map((s: any) => {
          if (s.type === 'header' && s.content?.header) {
            const h = s.content.header;
            return [h.name, h.email, h.phone, h.location, h.jobTitle, h.targetRole].filter(Boolean).join(' ');
          }
          if (s.type === 'summary') return s.content?.summary || '';
          if (s.type === 'skills' && s.content?.skills) {
            return s.content.skills.map((g: any) => [g.category, ...(g.skills || [])].join(' ')).join(' ');
          }
          if (s.type === 'experience' && s.content?.experiences) {
            return s.content.experiences.map((e: any) => [e.role, e.company, ...(e.description || [])].join(' ')).join(' ');
          }
          if (s.type === 'education' && s.content?.educations) {
            return s.content.educations.map((e: any) => [e.institution, e.degree, e.field].join(' ')).join(' ');
          }
          return '';
        })
        .join(' ');
    }
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch {
    return '';
  }
}

function extractKeywords(job: Job): string[] {
  const raw = [job.requirements || '', job.description || ''].join(' ');
  const words = raw.split(/[\s,;.]+/).filter(Boolean);

  const techKeywords = [
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust',
    'CSS', 'HTML5', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'AWS', 'GCP', 'Azure',
    'Docker', 'Kubernetes', 'CI/CD', 'Git', 'REST', 'GraphQL', 'API', 'Agile',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'Figma', 'Testing',
    'DevOps', 'Full-Stack', 'Frontend', 'Backend', 'Microservices', 'Cloud',
    'Leadership', 'Communication', 'UI/UX', 'Design', 'Product', 'Analytics',
    'Stakeholder', 'Strategy', 'Research', 'Selenium', 'Performance',
  ];

  const found = new Set<string>();
  words.forEach((w) => {
    const clean = w.replace(/[^a-zA-Z0-9+#]/g, '');
    if (!clean) return;
    const match = techKeywords.find(
      (kw) => kw.toLowerCase() === clean.toLowerCase() || kw.toLowerCase().replace(/[^a-z]/g, '') === clean.toLowerCase()
    );
    if (match) found.add(match);
  });
  return Array.from(found);
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return days + 'd ago';
  if (days < 30) return Math.floor(days / 7) + 'w ago';
  return Math.floor(days / 30) + 'mo ago';
}

function inferLocation(job: Job): string {
  const combined = (job.title + ' ' + job.description).toLowerCase();
  if (combined.includes('remote')) return 'Remote';
  if (combined.includes('hybrid')) return 'Hybrid';
  if (combined.includes('new york') || combined.includes('nyc')) return 'New York, NY';
  if (combined.includes('san francisco') || combined.includes('sf ')) return 'San Francisco, CA';
  if (combined.includes('london')) return 'London, UK';
  if (combined.includes('bangalore') || combined.includes('bengaluru')) return 'Bangalore, India';
  if (combined.includes('mumbai')) return 'Mumbai, India';
  if (combined.includes('berlin')) return 'Berlin, Germany';
  if (combined.includes('singapore')) return 'Singapore';
  return 'Remote / Office';
}

function inferType(job: Job): string {
  const combined = (job.title + ' ' + job.description).toLowerCase();
  if (combined.includes('contract')) return 'Contract';
  if (combined.includes('part-time') || combined.includes('part time')) return 'Part-time';
  if (combined.includes('intern')) return 'Internship';
  return 'Full-time';
}

function inferCompany(job: Job): string {
  const combined = job.title + ' ' + job.description;
  const match = combined.match(/(?:at|for|with)\s+([A-Z][A-Za-z0-9\s&.]+?)(?:\s*[-–—]|\s*\(|\s*\|)/);
  if (match) return match[1].trim();
  return 'Tech Company';
}

const JOB_TYPES = ['All Types', 'Full-time', 'Contract', 'Part-time', 'Internship'];
const LOCATIONS = ['All Locations', 'Remote', 'Hybrid', 'On-site'];

export default function JobBoard({ activeResume }: JobBoardProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const listJobsQuery = trpc.recruiter.listJobs.useQuery({});

  const jobs = listJobsQuery.data || [];

  const hasResume = !!activeResume;

  const filteredJobs = useMemo(() => {
    return jobs.filter((job: Job) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = (job.title + ' ' + job.description + ' ' + (job.requirements || '')).toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (typeFilter !== 'All Types') {
        const inferred = inferType(job);
        if (inferred !== typeFilter) return false;
      }
      if (locationFilter !== 'All Locations') {
        const inferred = inferLocation(job);
        if (locationFilter === 'Remote' && !inferred.toLowerCase().includes('remote')) return false;
        if (locationFilter === 'Hybrid' && !inferred.toLowerCase().includes('hybrid')) return false;
        if (locationFilter === 'On-site' && (inferred.toLowerCase().includes('remote') || inferred.toLowerCase().includes('hybrid'))) return false;
      }
      return true;
    });
  }, [jobs, searchQuery, typeFilter, locationFilter]);

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    if (window.innerWidth < 1024) {
      setShowMobileDetail(true);
    }
  };

  const handleTailorResume = (job: Job) => {
    if (!activeResume) {
      toast.error('Create a resume first to tailor it to this job.');
      return;
    }
    sessionStorage.setItem('pendingJobTailor', JSON.stringify({
      title: job.title,
      description: job.description,
      requirements: job.requirements || '',
    }));
    setLocation('/builder?mode=scratch&tailor=' + encodeURIComponent(job.id));
    toast.success('Job details saved. Opening builder with target setup.');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Job Board</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Browse listings and tailor your resume to each role.
        </p>
      </div>

      {/* Desktop: two-column */}
      <div className="hidden lg:flex gap-6 h-[calc(100vh-220px)] min-h-0">
        {/* Left: filterable list */}
        <div className="w-[400px] shrink-0 flex flex-col border border-border rounded-xl bg-card overflow-hidden">
          {/* Filters */}
          <div className="p-3 border-b border-border space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs..."
                className="h-9 pl-8 text-sm rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 text-xs rounded-lg flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="h-8 text-xs rounded-lg flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                <Briefcase className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground/60">No jobs match your filters.</p>
              </div>
            ) : (
              filteredJobs.map((job: Job) => {
                const match = computeMatchScore(activeResume, job);
                const isSelected = selectedJob?.id === job.id;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleSelectJob(job)}
                    className={cn(
                      'w-full text-left px-4 py-3 transition-colors hover:bg-muted/50',
                      isSelected && 'bg-primary/5 border-l-2 border-primary'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {inferCompany(job)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {inferLocation(job)}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {job.createdAt ? formatTimeAgo(new Date(job.createdAt)) : 'Recently'}
                          </span>
                        </div>
                      </div>
                      {match ? (
                        <Badge
                          className={cn(
                            'shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md',
                            match.score >= 70 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                            match.score >= 40 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                            'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                          )}
                          variant="outline"
                        >
                          {match.score}% Match
                        </Badge>
                      ) : (
                        <span className="text-[9px] text-muted-foreground/50 italic shrink-0 max-w-[100px] text-right leading-tight">
                          No resume
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 min-w-0">
          {selectedJob ? (
            <JobDetailPanel
              job={selectedJob}
              activeResume={activeResume}
              onTailor={handleTailorResume}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center gap-3">
              <Briefcase className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Select a job</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Choose a listing from the left to see details and tailor your resume.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: list only */}
      <div className="lg:hidden space-y-3">
        {/* Search + filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className="h-9 pl-8 text-sm rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs rounded-lg flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="h-8 text-xs rounded-lg flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Jobs list */}
        <div className="space-y-2">
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground/60">No jobs match your filters.</p>
            </div>
          ) : (
            filteredJobs.map((job: Job) => {
              const match = computeMatchScore(activeResume, job);
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => handleSelectJob(job)}
                  className="w-full text-left rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{job.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{inferCompany(job)}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/70">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {inferLocation(job)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {job.createdAt ? formatTimeAgo(new Date(job.createdAt)) : 'Recently'}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Building className="h-2.5 w-2.5" />
                          {inferType(job)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />
                  </div>
                  {match ? (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            match.score >= 70 ? 'bg-emerald-500' : match.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: match.score + '%' }}
                        />
                      </div>
                      <span className={cn(
                        'text-[10px] font-semibold tabular-nums',
                        match.score >= 70 ? 'text-emerald-500' : match.score >= 40 ? 'text-amber-500' : 'text-red-500'
                      )}>
                        {match.score}%
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-[10px] text-muted-foreground/50 italic">
                      Create a resume to see match scores
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile full-screen detail overlay */}
      {showMobileDetail && selectedJob && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 shrink-0">
            <button
              type="button"
              onClick={() => { setShowMobileDetail(false); setSelectedJob(null); }}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-semibold truncate">{selectedJob.title}</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{inferCompany(selectedJob)}</p>
              <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground/70">
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {inferLocation(selectedJob)}
                </span>
                <span className="flex items-center gap-0.5">
                  <Building className="h-2.5 w-2.5" />
                  {inferType(selectedJob)}
                </span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {selectedJob.createdAt ? formatTimeAgo(new Date(selectedJob.createdAt)) : 'Recently'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Description</h4>
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {selectedJob.description || 'No description provided.'}
              </p>
            </div>

            {selectedJob.requirements && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Requirements</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedJob.requirements.split(/[,;]/).map((req, i) => (
                    <span key={i} className="inline-flex rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/80">
                      {req.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Match Score</h4>
              {(() => {
                const match = computeMatchScore(activeResume, selectedJob);
                if (!match) {
                  return (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-center">
                      <FileText className="h-5 w-5 mx-auto text-muted-foreground/40 mb-1" />
                      <p className="text-[10px] text-muted-foreground/60">Create a resume to see how well you match this role.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            match.score >= 70 ? 'bg-emerald-500' : match.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: match.score + '%' }}
                        />
                      </div>
                      <span className={cn(
                        'text-lg font-bold tabular-nums',
                        match.score >= 70 ? 'text-emerald-500' : match.score >= 40 ? 'text-amber-500' : 'text-red-500'
                      )}>
                        {match.score}%
                      </span>
                    </div>
                    {match.missing.length > 0 && (
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground/60">Missing keywords:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.missing.slice(0, 5).map((kw, i) => (
                            <span key={i} className="inline-flex rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-medium">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Sticky bottom button */}
          <div className="shrink-0 border-t border-border bg-card px-4 py-3">
            <Button
              onClick={() => handleTailorResume(selectedJob)}
              disabled={!activeResume}
              className="w-full h-10 rounded-lg text-sm font-semibold gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Tailor My Resume to This Job
            </Button>
            {!activeResume && (
              <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
                Create a resume in the builder first.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function JobDetailPanel({
  job,
  activeResume,
  onTailor,
}: {
  job: Job;
  activeResume: any | null;
  onTailor: (job: Job) => void;
}) {
  const match = computeMatchScore(activeResume, job);

  return (
    <div className="flex flex-col h-full border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">{job.title}</h3>
          <p className="text-sm text-muted-foreground">{inferCompany(job)}</p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {inferLocation(job)}
            </span>
            <span className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {inferType(job)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {job.createdAt ? formatTimeAgo(new Date(job.createdAt)) : 'Recently'}
            </span>
          </div>
        </div>

        {/* Match score */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Match Score</h4>
          {!match ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-center">
              <FileText className="h-6 w-6 mx-auto text-muted-foreground/30 mb-1.5" />
              <p className="text-xs text-muted-foreground/60">
                Create a resume to see how well you match this role.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      match.score >= 70 ? 'bg-emerald-500' : match.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: match.score + '%' }}
                  />
                </div>
                <span className={cn(
                  'text-xl font-bold tabular-nums',
                  match.score >= 70 ? 'text-emerald-500' : match.score >= 40 ? 'text-amber-500' : 'text-red-500'
                )}>
                  {match.score}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Matched
                  </p>
                  {match.matched.length > 0 ? (
                    <div className="flex flex-wrap gap-0.5">
                      {match.matched.slice(0, 6).map((kw, i) => (
                        <span key={i} className="inline-flex rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 text-[9px] font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-muted-foreground/50 italic">None</p>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Missing
                  </p>
                  {match.missing.length > 0 ? (
                    <div className="flex flex-wrap gap-0.5">
                      {match.missing.slice(0, 6).map((kw, i) => (
                        <span key={i} className="inline-flex rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1 py-0.5 text-[9px] font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-muted-foreground/50 italic">None</p>
                  )}
                  {match.missing.length > 6 && (
                    <p className="text-[9px] text-muted-foreground/50">+{match.missing.length - 6} more</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Description</h4>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {job.description || 'No description provided.'}
          </p>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Requirements</h4>
            <div className="flex flex-wrap gap-1">
              {job.requirements.split(/[,;]/).map((req, i) => (
                <span key={i} className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                  {req.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-border bg-card px-5 py-3">
        <Button
          onClick={() => onTailor(job)}
          disabled={!activeResume}
          className="w-full h-10 rounded-lg text-sm font-semibold gap-1.5"
        >
          <Sparkles className="h-4 w-4" />
          Tailor My Resume to This Job
        </Button>
        {!activeResume && (
          <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
            Create a resume in the builder first to tailor it.
          </p>
        )}
      </div>
    </div>
  );
}
