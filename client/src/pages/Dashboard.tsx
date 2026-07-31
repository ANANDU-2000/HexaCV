import { useState } from "react";
import { Redirect, Route, Switch } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import ATSScanner from "@/components/ATSScanner";
import AffiliateSystem from "@/components/AffiliateSystem";
import BillingPortal from "@/components/BillingPortal";
import AdminCRM from "@/components/AdminCRM";
import UserSettings from "@/components/UserSettings";
import DashboardHome from "@/pages/DashboardHome";
import { useAuth } from "@/_core/hooks/useAuth";

/** Preserve ?id= when retiring /dashboard/builder/edit → /builder */
function RedirectBuilderEdit() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const to = id ? `/builder?id=${encodeURIComponent(id)}` : "/builder";
  return <Redirect to={to} />;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const listResumesQuery = trpc.resume.list.useQuery(undefined, {
    enabled: !!user,
  });

  const resumes = listResumesQuery.data || [];

  return (
    <DashboardLayout>
      <Switch>
        {/* Dashboard home / overview */}
        <Route path="/dashboard">
          <DashboardHome />
        </Route>

        {/* STEP 6: hub retired — redirect bookmarked /dashboard/builder/* → /builder/* */}
        <Route path="/dashboard/builder/upload">
          <Redirect to="/builder/upload" />
        </Route>
        <Route path="/dashboard/builder/scratch">
          <Redirect to="/builder/scratch" />
        </Route>
        <Route path="/dashboard/builder/ai">
          <Redirect to="/builder/ai" />
        </Route>
        <Route path="/dashboard/builder/edit">
          <RedirectBuilderEdit />
        </Route>
        <Route path="/dashboard/builder">
          <Redirect to="/builder" />
        </Route>

        {/* ATS Resume compliance scanner */}
        <Route path="/dashboard/ats">
          <ATSScanner
            resumes={resumes}
            activeResumeId={selectedResumeId}
            onSelectResume={(id) => setSelectedResumeId(id)}
          />
        </Route>

        {/* Affiliate Program tracker */}
        <Route path="/dashboard/affiliate">
          <AffiliateSystem userId={user?.id || 1} />
        </Route>

        {/* Subscriptions upgrade grid */}
        <Route path="/dashboard/billing">
          <BillingPortal resumesCount={resumes.length} />
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
