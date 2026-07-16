import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Briefcase, Users, Plus, Award, CheckCircle, XCircle, Search, Eye } from "lucide-react";
import { toast } from "sonner";

export default function RecruiterPortal() {
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [createJobOpen, setCreateJobOpen] = useState(false);

  // New Job Form State
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobReqs, setJobReqs] = useState("");

  // View Resume State
  const [viewResumeOpen, setViewResumeOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);

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

  useEffect(() => {
    if (listOrgsQuery.data && listOrgsQuery.data.length > 0 && !selectedOrgId) {
      setSelectedOrgId(listOrgsQuery.data[0]?.id || "");
    }
  }, [listOrgsQuery.data]);

  useEffect(() => {
    if (listJobsQuery.data && listJobsQuery.data.length > 0) {
      setSelectedJobId(listJobsQuery.data[0].id);
    } else {
      setSelectedJobId("");
    }
  }, [listJobsQuery.data]);

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
    } catch (e: any) {
      toast.error("Failed to create job posting: " + e.message);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: appId,
        status: newStatus,
      });
      toast.success("Applicant status updated");
      listAppsQuery.refetch();
    } catch (e) {
      toast.error("Could not update status");
    }
  };

  const currentJob = listJobsQuery.data?.find(j => j.id === selectedJobId);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Recruiter Pipeline Portal
          </h2>
          <p className="text-slate-600 mt-1">
            Publish internal vacancies, receive resumes, and screen applicants using automated ATS matching metrics.
          </p>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-3">
          {listOrgsQuery.data && listOrgsQuery.data.length > 0 && (
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="w-56 bg-white border-slate-200">
                <SelectValue placeholder="Select team..." />
              </SelectTrigger>
              <SelectContent>
                {listOrgsQuery.data.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>
                    🏢 {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedOrgId && (
            <Dialog open={createJobOpen} onOpenChange={setCreateJobOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md transition-all gap-2">
                  <Plus className="w-4 h-4" />
                  Post A Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white">
                <form onSubmit={handleCreateJob}>
                  <DialogHeader>
                    <DialogTitle>Post Vacancy</DialogTitle>
                    <DialogDescription>
                      Define a job position and outline keywords for ATS candidate comparisons.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Job Title</label>
                      <Input
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Senior Full-Stack Engineer"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Description</label>
                      <Textarea
                        value={jobDesc}
                        onChange={(e) => setJobDesc(e.target.value)}
                        placeholder="Detailed responsibilities, expectations, and role environment."
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Required Core Keywords (ATS Targets)
                      </label>
                      <Input
                        value={jobReqs}
                        onChange={(e) => setJobReqs(e.target.value)}
                        placeholder="e.g. React, Node.js, SQL, TypeScript, Docker"
                        required
                      />
                      <span className="text-[10px] text-slate-500">
                        Separate skills with commas. The ATS scanner will weight matching metrics against these skills.
                      </span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateJobOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 text-white">Create Job Listing</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {selectedOrgId ? (
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Jobs List Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-4.5 h-4.5 text-blue-600" />
                  Active Positions ({listJobsQuery.data?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {listJobsQuery.data?.map((job) => {
                    const isSelected = job.id === selectedJobId;
                    return (
                      <button
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className={`w-full text-left p-4 hover:bg-slate-50 transition ${
                          isSelected ? "bg-blue-50/70 border-l-4 border-blue-600" : ""
                        }`}
                      >
                        <div className="font-bold text-slate-800 text-sm">{job.title}</div>
                        <div className="text-xs text-slate-500 truncate mt-1">{job.description}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.requirements.split(/\s*,\s*/).slice(0, 3).map((r: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-[9px] px-1 py-0 bg-white">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                  {listJobsQuery.data?.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500 italic">
                      No jobs posted yet. Click 'Post A Job' to start screening candidates.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Applications Leaderboard */}
          <div className="lg:col-span-3">
            {selectedJobId && currentJob ? (
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <CardTitle className="text-lg text-slate-800">{currentJob.title} Applicants</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Candidates ordered by ATS match alignment check compliance
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Match Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listAppsQuery.data?.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div className="font-semibold text-slate-800 text-sm">{app.applicantName}</div>
                            <div className="text-slate-500 text-xs">{app.applicantEmail}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={
                                app.matchScore >= 80 ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                                app.matchScore >= 60 ? "bg-amber-50 border-amber-200 text-amber-800" :
                                "bg-rose-50 border-rose-200 text-rose-800"
                              }>
                                <Award className="w-3 h-3 mr-1" />
                                {app.matchScore}% Match
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={app.status}
                              onValueChange={(val) => handleUpdateStatus(app.id, val)}
                            >
                              <SelectTrigger className="h-8 w-28 bg-white border-slate-200 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedApplication(app);
                                setViewResumeOpen(true);
                              }}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {listAppsQuery.data?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-xs text-slate-500 italic">
                            No applications submitted yet for this role.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl h-80 flex flex-col items-center justify-center text-center p-8">
                <Users className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Select a Job Vacancy</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                  Click on an active position on the left to display candidate application summaries.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl h-80 flex flex-col items-center justify-center text-center p-8">
          <Briefcase className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Setup Organization</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            You must select an organization space or create a new team inside the 'Organization Portal' to post job openings.
          </p>
        </div>
      )}

      {/* View Resume Dialog */}
      <Dialog open={viewResumeOpen} onOpenChange={setViewResumeOpen}>
        {selectedApplication && (
          <DialogContent className="max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle>Resume: {selectedApplication.applicantName}</DialogTitle>
              <DialogDescription>Submitted Email: {selectedApplication.applicantEmail}</DialogDescription>
            </DialogHeader>
            <div className="bg-slate-50 border rounded-lg p-4 max-h-[400px] overflow-y-auto mt-2 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
              {selectedApplication.resumeContent}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => setViewResumeOpen(false)} className="bg-slate-900 text-white">
                Close Preview
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
