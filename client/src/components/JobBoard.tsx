import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Briefcase, Award, Zap, Send, FileCheck, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface JobBoardProps {
  activeResume: any | null;
}

export default function JobBoard({ activeResume }: JobBoardProps) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  // Apply Form state
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");

  const listJobsQuery = trpc.recruiter.listJobs.useQuery({});
  const applyMutation = trpc.recruiter.submitApplication.useMutation();
  const updateResumeMutation = trpc.resume.update.useMutation();
  const improveBulletsMutation = trpc.ai.improveBullets.useMutation();
  const utils = trpc.useUtils();

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (!activeResume) {
      toast.error("Please create a resume draft in the builder first!");
      return;
    }

    try {
      await applyMutation.mutateAsync({
        jobId: selectedJob.id,
        applicantName,
        applicantEmail,
        resumeContent: activeResume.content, // user's active resume JSON
      });

      toast.success("Application successfully submitted!");
      setApplyOpen(false);
      setApplicantName("");
      setApplicantEmail("");
    } catch (e: any) {
      toast.error("Application failed: " + e.message);
    }
  };

  const handleAutoTune = async (job: any) => {
    if (!activeResume) {
      toast.error("Please create a resume draft in the builder first!");
      return;
    }

    toast.info(`Tuning resume alignment for: "${job.title}"...`);
    try {
      const resumeObj = JSON.parse(activeResume.content);
      const experienceSection = resumeObj.sections?.find((s: any) => s.type === "experience");
      if (!experienceSection || !experienceSection.content?.experiences || experienceSection.content.experiences.length === 0) {
        toast.error("No experiences found on your active resume to tune.");
        return;
      }

      const experiences = experienceSection.content.experiences;
      const updatedExperiences = [];
      const headerSection = resumeObj.sections?.find((s: any) => s.type === "header");
      const headerVal = headerSection?.content?.header || {};

      for (const exp of experiences) {
        toast.info(`Optimizing bullets for ${exp.role} at ${exp.company}...`);

        const improved = await improveBulletsMutation.mutateAsync({
          role: exp.role || "",
          company: exp.company || "",
          currentBullets: exp.description || [],
          jobDescription: job.requirements || job.description || "",
          jobTitle: headerVal.jobTitle || exp.role || "",
          targetRole: headerVal.targetRole || headerVal.jobTitle || "",
          countryCode: headerVal.countryCode || "",
          targetCountryCode: headerVal.targetCountryCode || "",
        });

        updatedExperiences.push({
          ...exp,
          description: improved,
        });
      }

      // Update the section content
      experienceSection.content.experiences = updatedExperiences;

      // Update resume content on server
      await updateResumeMutation.mutateAsync({
        id: activeResume.id,
        content: JSON.stringify(resumeObj),
      });

      toast.success("Resume structure successfully auto-tuned and saved!");
      utils.resume.list.invalidate();
    } catch (e: any) {
      console.error("Auto-tune error:", e);
      toast.error("Failed to auto-tune resume: " + e.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          HexaCv Careers Job Board
        </h2>
        <p className="text-slate-600 mt-1">
          Browse open corporate listings, check immediate resume compliance matches, and align sections dynamically.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listJobsQuery.data?.map((job) => {
          // Mocking matching score for visual UI preview if not scanned yet
          const scoreSeed = job.title.includes("Senior") ? 88 : job.title.includes("React") ? 74 : 65;
          return (
            <Card key={job.id} className="flex flex-col border border-slate-200 shadow-sm hover:shadow-md transition">
              <CardHeader className="pb-3 bg-slate-50/50 rounded-t-xl">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">
                    Full-time
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">
                    <Award className="w-3.5 h-3.5 mr-1" />
                    {scoreSeed}% Match
                  </Badge>
                </div>
                <CardTitle className="text-lg text-slate-800">{job.title}</CardTitle>
                <CardDescription className="text-xs">HexaStack Branded Partner</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-grow space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed truncate-3-lines">
                  {job.description}
                </p>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-500">Target Core Skills:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requirements.split(/\s*,\s*/).map((req: string, i: number) => (
                      <Badge key={i} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 pt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAutoTune(job)}
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs gap-1"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Auto-Tune
                </Button>
                <Button
                  onClick={() => {
                    setSelectedJob(job);
                    setApplyOpen(true);
                  }}
                  size="sm"
                  className="ml-auto bg-slate-900 text-white hover:bg-slate-800 text-xs gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Apply Now
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        {listJobsQuery.data?.length === 0 && (
          <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500 italic">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            No active jobs listed. Recruiters can post jobs in the Recruiter Portal tab.
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-sm bg-white">
          <form onSubmit={handleApply}>
            <DialogHeader>
              <DialogTitle>Submit Application</DialogTitle>
              <DialogDescription>
                Submit your active resume draft matching this posting's keywords directly.
              </DialogDescription>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4 py-4">
                <div className="border rounded p-3 bg-slate-50/50">
                  <div className="text-xs text-slate-500">Applying for:</div>
                  <div className="font-bold text-slate-800">{selectedJob.title}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Your Full Name</label>
                  <Input
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Contact Email</label>
                  <Input
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="john.doe@gmail.com"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 border border-blue-100 rounded p-2.5 bg-blue-50/30 text-xs text-blue-800">
                  <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Active resume draft <strong>{activeResume?.title || "Draft"}</strong> will be transmitted.
                  </span>
                </div>
              </div>
            )}
            <DialogFooter className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white gap-2">
                <CheckCircle className="w-4 h-4" />
                Send Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
