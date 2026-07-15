import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home, ShieldAlert, Search, ArrowRight,
  Compass, FileText, Zap, Briefcase, Users,
  Gift, Building, CreditCard, User
} from "lucide-react";

const SEARCH_ROUTES = [
  { icon: FileText, label: "Resume Builder", path: "/builder" },
  { icon: Zap, label: "ATS Scanner", path: "/dashboard/ats" },
  { icon: Briefcase, label: "Job Board", path: "/dashboard/jobs" },
  { icon: Users, label: "Recruiter Portal", path: "/dashboard/recruiter" },
  { icon: Gift, label: "Affiliate Program", path: "/dashboard/affiliate" },
  { icon: Building, label: "Organization", path: "/dashboard/organization" },
  { icon: CreditCard, label: "Billing", path: "/dashboard/billing" },
  { icon: User, label: "Settings", path: "/dashboard/settings" },
];

export default function NotFound() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = searchQuery.trim()
    ? SEARCH_ROUTES.filter(r => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : SEARCH_ROUTES;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border-slate-200 bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-10 pb-8 text-center">
          {/* 404 */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-100 rounded-full blur-sm" />
              <div className="relative w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
                <Compass className="w-9 h-9 text-indigo-400" />
              </div>
            </div>
          </div>

          <h1 className="text-6xl font-extrabold tracking-tight text-indigo-400 mb-2 select-none">
            404
          </h1>

          <p className="text-base font-medium text-slate-700 mb-1">
            This page took a different career path
          </p>
          <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved to a new role.
          </p>

          {isAuthenticated ? (
            <>
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-5 text-sm gap-2 mb-4 w-full"
              >
                <Home className="w-4 h-4" />
                Back to Dashboard
              </Button>

              {/* Search */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Jump to a section..."
                  className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
                />
              </div>
              <div className="max-h-[180px] overflow-y-auto space-y-0.5">
                {filtered.map((r) => (
                  <button
                    key={r.path}
                    onClick={() => setLocation(r.path)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <r.icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="flex-1">{r.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No matching sections</p>
                )}
              </div>
            </>
          ) : (
            <Button
              onClick={() => setLocation("/")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-5 text-sm gap-2 w-full"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function Forbidden({ 
  title,
  message,
  actionLabel,
  actionPath,
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionPath?: string;
}) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border-slate-200 bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-10 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full blur-sm" />
              <div className="relative w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                <ShieldAlert className="w-9 h-9 text-red-400" />
              </div>
            </div>
          </div>

          <h1 className="text-6xl font-extrabold tracking-tight text-red-400 mb-2 select-none">
            403
          </h1>

          <p className="text-base font-medium text-slate-700 mb-1">
            {title || "You don't have access to this area"}
          </p>
          <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
            {message || "This section requires specific permissions. Contact your team administrator if you need access."}
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setLocation(isAuthenticated ? "/dashboard" : "/")}
              className="bg-slate-800 hover:bg-slate-900 text-white h-9 px-5 text-sm gap-2 w-full"
            >
              <Home className="w-4 h-4" />
              {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
            </Button>
            {actionLabel && actionPath && (
              <Button
                variant="outline"
                onClick={() => setLocation(actionPath)}
                className="h-9 text-sm gap-2 border-slate-300 w-full"
              >
                {actionLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
