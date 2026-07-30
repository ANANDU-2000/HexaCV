import { useState, useEffect } from "react";
import { Route, Switch, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import ATSScanner from "@/components/ATSScanner";
import Marketplace from "@/components/Marketplace";
import OrganizationPortal from "@/components/OrganizationPortal";
import RecruiterPortal from "@/components/RecruiterPortal";
import JobBoard from "@/components/JobBoard";
import AffiliateSystem from "@/components/AffiliateSystem";
import BillingPortal from "@/components/BillingPortal";
import AdminCRM from "@/components/AdminCRM";
import StripeCheckoutSimulation from "@/components/StripeCheckoutSimulation";
import UserSettings from "@/components/UserSettings";
import ResumeBuilderHub from "@/pages/ResumeBuilderHub";
import ResumeUpload from "@/pages/ResumeUpload";
import ResumeScratch from "@/pages/ResumeScratch";
import ResumeAI from "@/pages/ResumeAI";
import ResumeEditorWorkspace from "@/pages/ResumeEditorWorkspace";
import DashboardHome from "@/pages/DashboardHome";
import { FileText, Plus, Zap, Award, Sparkles, Building, Store, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const listResumesQuery = trpc.resume.list.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteResumeMutation = trpc.resume.delete.useMutation();

  const handleDeleteResume = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      await deleteResumeMutation.mutateAsync({ id });
      toast.success("Resume deleted");
      listResumesQuery.refetch();
    } catch (e) {
      toast.error("Failed to delete resume");
    }
  };

  const handleCloneResume = (parsedContent: any) => {
    toast.success("Resume cloned! Opening builder...");
    // Open builder with cloned content
    setLocation("/builder");
  };

  const resumes = listResumesQuery.data || [];
  const activeResume = resumes.find(r => r.id === selectedResumeId) || resumes[0] || null;

  return (
    <DashboardLayout>
      <Switch>
        {/* Dashboard home / overview */}
        <Route path="/dashboard">
          <DashboardHome />
        </Route>

        <Route path="/dashboard/builder/upload">
          <ResumeUpload />
        </Route>
        <Route path="/dashboard/builder/scratch">
          <ResumeScratch />
        </Route>
        <Route path="/dashboard/builder/ai">
          <ResumeAI />
        </Route>
        <Route path="/dashboard/builder/edit">
          <ResumeEditorWorkspace />
        </Route>
        <Route path="/dashboard/builder">
          <ResumeBuilderHub />
        </Route>

        {/* ATS Resume compliance scanner */}
        <Route path="/dashboard/ats">
          <ATSScanner
            resumes={resumes}
            activeResumeId={selectedResumeId}
            onSelectResume={(id) => setSelectedResumeId(id)}
          />
        </Route>

        {/* Template marketplace */}
        <Route path="/dashboard/marketplace">
          <Marketplace
            resumes={resumes}
            onCloneResume={handleCloneResume}
          />
        </Route>

        {/* Job Listings Board */}
        <Route path="/dashboard/jobs">
          <JobBoard activeResume={activeResume} />
        </Route>

        {/* Recruiter hiring pipelines */}
        <Route path="/dashboard/recruiter">
          <RecruiterPortal />
        </Route>

        {/* Affiliate Program tracker */}
        <Route path="/dashboard/affiliate">
          <AffiliateSystem userId={user?.id || 1} />
        </Route>

        {/* Teams and Tenant configurations */}
        <Route path="/dashboard/organization">
          <OrganizationPortal />
        </Route>

        {/* Subscriptions upgrade grid */}
        <Route path="/dashboard/billing">
          <BillingPortal resumesCount={resumes.length} />
        </Route>

        {/* Legacy Stripe sim — only when PAYMENT_PROVIDER=stripe fallback URL is used */}
        <Route path="/dashboard/billing/checkout">
          <StripeCheckoutSimulation />
        </Route>

        {/* Account configurations & User Settings */}
        <Route path="/dashboard/settings">
          <UserSettings />
        </Route>

        {/* Master CRM admin views */}
        <Route path="/dashboard/admin">
          <AdminCRM />
        </Route>
        <Route path="/admin">
          <AdminCRM />
        </Route>
        <Route path="/url">
          <AdminCRM />
        </Route>
      </Switch>
    </DashboardLayout>
  );
}
