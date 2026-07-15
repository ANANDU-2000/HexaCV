import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ShieldAlert, Users, FileText, TrendingUp, Activity,
  Search, ArrowUpDown, ArrowUp, ArrowDown,
  CheckCircle2, XCircle, AlertCircle, Clock,
  DollarSign, HardDrive, Server, RefreshCw, LifeBuoy
} from "lucide-react";

type Tab = "users" | "resumes" | "revenue" | "health";

type SortDir = "asc" | "desc";

function useSort<T extends Record<string, any>>(items: T[], defaultKey: string) {
  const [sortKey, setSortKey] = useState<string>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const toggle = (key: string) => {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);
  return { sorted, sortKey, sortDir, toggle };
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
  return dir === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />;
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "users", label: "Users", icon: <Users className="w-3.5 h-3.5" /> },
  { key: "resumes", label: "Resumes", icon: <FileText className="w-3.5 h-3.5" /> },
  { key: "revenue", label: "Revenue", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { key: "health", label: "System Health", icon: <Activity className="w-3.5 h-3.5" /> },
];

const MOCK_RESUMES = Array.from({ length: 25 }, (_, i) => ({
  id: `res_${i}`,
  title: ["Software Engineer", "Product Manager", "Data Analyst", "Designer", "Marketing Lead"][i % 5],
  userName: ["Alice Chen", "Bob Smith", "Carol Davis", "Dan Wilson", "Eve Brown"][i % 5],
  template: ["Modern", "Classic", "Executive", "Creative", "Minimal"][i % 5],
  sections: Math.floor(Math.random() * 6) + 4,
  matchScore: Math.floor(Math.random() * 60) + 25,
  updatedAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
}));

const MOCK_REVENUE = Array.from({ length: 20 }, (_, i) => ({
  id: `rev_${i}`,
  date: new Date(Date.now() - i * 86400000 * 3).toISOString(),
  plan: ["Free", "Pro", "Team"][i % 3],
  amount: i % 3 === 0 ? 0 : i % 3 === 1 ? 1900 : 9900,
  status: i % 5 === 0 ? "failed" : "paid",
  user: ["Alice Chen", "Bob Smith", "Carol Davis", "Dan Wilson", "Eve Brown"][i % 5],
}));

const MOCK_HEALTH_CHECKS = [
  { id: "db", label: "Database", status: "healthy", detail: "PostgreSQL 15.2 — 2ms latency", icon: <HardDrive className="w-3.5 h-3.5" /> },
  { id: "api", label: "API Server", status: "healthy", detail: "v2.4.1 — uptime 14d 3h", icon: <Server className="w-3.5 h-3.5" /> },
  { id: "auth", label: "Auth Provider", status: "healthy", detail: "OAuth 2.0 — 120 req/s", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { id: "storage", label: "File Storage", status: "healthy", detail: "S3-compatible — 34% used", icon: <HardDrive className="w-3.5 h-3.5" /> },
  { id: "email", label: "Email Service", status: "degraded", detail: "SendGrid — 3% failure rate", icon: <Activity className="w-3.5 h-3.5" /> },
  { id: "cdn", label: "CDN", status: "healthy", detail: "CloudFront — edge 14 regions", icon: <Server className="w-3.5 h-3.5" /> },
];

const HEALTH_STATUS = {
  healthy: { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />, label: "Healthy" },
  degraded: { icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />, label: "Degraded" },
  down: { icon: <XCircle className="w-3.5 h-3.5 text-red-500" />, label: "Down" },
};

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminCRM() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [globalSearch, setGlobalSearch] = useState("");

  const statsQuery = trpc.admin.getDashboardStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const usersQuery = trpc.admin.getUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const ticketsQuery = trpc.admin.getTickets.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const resolveTicketMutation = trpc.admin.resolveTicket.useMutation();

  const stats = (statsQuery.data || {}) as any;
  const dbUsers = (usersQuery.data || []) as any[];
  const tickets = (ticketsQuery.data || []) as any[];

  const searchedUsers = useMemo(
    () => globalSearch ? dbUsers.filter((u: any) => (u.name || "").toLowerCase().includes(globalSearch.toLowerCase()) || (u.email || "").toLowerCase().includes(globalSearch.toLowerCase())) : dbUsers,
    [dbUsers, globalSearch]
  );
  const searchedResumes = useMemo(
    () => globalSearch ? MOCK_RESUMES.filter(r => r.userName.toLowerCase().includes(globalSearch.toLowerCase()) || r.title.toLowerCase().includes(globalSearch.toLowerCase())) : MOCK_RESUMES,
    [globalSearch]
  );
  const searchedRevenue = useMemo(
    () => globalSearch ? MOCK_REVENUE.filter(r => r.user.toLowerCase().includes(globalSearch.toLowerCase()) || r.plan.toLowerCase().includes(globalSearch.toLowerCase())) : MOCK_REVENUE,
    [globalSearch]
  );

  const { sorted: sortedUsers, sortKey: uKey, sortDir: uDir, toggle: uToggle } = useSort(searchedUsers as any, "id");
  const { sorted: sortedResumes, sortKey: rKey, sortDir: rDir, toggle: rToggle } = useSort(searchedResumes as any, "updatedAt");
  const { sorted: sortedRevenue, sortKey: revKey, sortDir: revDir, toggle: revToggle } = useSort(searchedRevenue as any, "date");

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await resolveTicketMutation.mutateAsync({ id: ticketId, status: "resolved" });
      toast.success("Ticket resolved");
      ticketsQuery.refetch();
    } catch {
      toast.error("Could not resolve ticket");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-xs text-slate-500 font-semibold">
        Loading administrative data...
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <Card className="max-w-md w-full border border-red-200 shadow-xl bg-white">
          <div className="bg-gradient-to-br from-red-900 to-red-950 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-50/10 rounded-full blur-xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-50/10 rounded-full blur-xl" />
            <ShieldAlert className="w-14 h-14 mx-auto mb-3 text-red-400 animate-pulse" />
            <h3 className="text-xl font-bold">Access Denied</h3>
            <p className="text-xs text-red-200/80 mt-1 font-medium">Administrator privileges required</p>
          </div>
          <CardContent className="p-6 text-center text-sm text-slate-600">
            You are logged in as <strong className="text-slate-800">{user?.name || "Guest"}</strong>.
            This area is restricted to system administrators.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Admin CRM</h2>
            <p className="text-[11px] text-slate-500">System administration & data management</p>
          </div>
        </div>
        {/* Global Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="pl-8 h-8 text-xs bg-white border-slate-300"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={stats.totalUsers ?? 0} icon={<Users className="w-4 h-4" />} color="text-blue-600" />
        <StatCard label="Active (30d)" value={stats.activeUsers ?? 0} icon={<Activity className="w-4 h-4" />} color="text-emerald-600" />
        <StatCard label="Resumes" value={stats.resumesCreated ?? 0} icon={<FileText className="w-4 h-4" />} color="text-indigo-600" />
        <StatCard label="MRR" value={`$${(stats.subscriptionRevenue ?? 0)}`} icon={<DollarSign className="w-4 h-4" />} color="text-amber-600" />
      </div>

      {/* Tabs */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors shrink-0",
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {activeTab === "users" && (
            <DataTable
              headers={[
                { key: "name", label: "Name", sortable: true },
                { key: "email", label: "Email", sortable: true },
                { key: "tier", label: "Plan", sortable: true },
                { key: "resumesCount", label: "Resumes", sortable: true },
                { key: "role", label: "Role", sortable: true },
              ]}
              rows={sortedUsers.map((u: any) => ({
                id: u.id,
                cells: [
                  <span className="text-xs font-medium text-slate-800">{u.name}</span>,
                  <span className="text-xs text-slate-500">{u.email}</span>,
                  <Badge className={cn(
                    "text-[9px] px-1.5 py-0 font-medium",
                    u.tier === "enterprise" || u.tier === "team" ? "bg-purple-100 text-purple-700" :
                    u.tier === "pro" ? "bg-indigo-100 text-indigo-700" :
                    "bg-slate-100 text-slate-600"
                  )}>{u.tier}</Badge>,
                  <span className="text-xs text-slate-600">{u.resumesCount}</span>,
                  <span className="text-[10px] uppercase font-semibold text-slate-500">{u.role}</span>,
                ],
              }))}
              sortKey={uKey}
              sortDir={uDir}
              onSort={uToggle}
            />
          )}

          {activeTab === "resumes" && (
            <DataTable
              headers={[
                { key: "title", label: "Title", sortable: true },
                { key: "userName", label: "Author", sortable: true },
                { key: "template", label: "Template", sortable: true },
                { key: "sections", label: "Sections", sortable: true },
                { key: "matchScore", label: "ATS Score", sortable: true },
                { key: "updatedAt", label: "Updated", sortable: true },
              ]}
              rows={sortedResumes.map((r) => ({
                id: r.id,
                cells: [
                  <span className="text-xs font-medium text-slate-800">{r.title}</span>,
                  <span className="text-xs text-slate-500">{r.userName}</span>,
                  <span className="text-xs text-slate-600">{r.template}</span>,
                  <span className="text-xs text-slate-600">{r.sections}</span>,
                  <Badge className={cn(
                    "text-[9px] px-1.5 py-0",
                    r.matchScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                    r.matchScore >= 40 ? "bg-amber-100 text-amber-700" :
                    "bg-rose-100 text-rose-700"
                  )}>{r.matchScore}%</Badge>,
                  <span className="text-xs text-slate-500">{formatDate(r.updatedAt)}</span>,
                ],
              }))}
              sortKey={rKey}
              sortDir={rDir}
              onSort={rToggle}
            />
          )}

          {activeTab === "revenue" && (
            <DataTable
              headers={[
                { key: "date", label: "Date", sortable: true },
                { key: "user", label: "Customer", sortable: true },
                { key: "plan", label: "Plan", sortable: true },
                { key: "amount", label: "Amount", sortable: true },
                { key: "status", label: "Status", sortable: true },
              ]}
              rows={sortedRevenue.map((r) => ({
                id: r.id,
                cells: [
                  <span className="text-xs text-slate-500">{formatDate(r.date)}</span>,
                  <span className="text-xs font-medium text-slate-800">{r.user}</span>,
                  <Badge className={cn(
                    "text-[9px] px-1.5 py-0 font-medium",
                    r.plan === "Team" ? "bg-purple-100 text-purple-700" :
                    r.plan === "Pro" ? "bg-indigo-100 text-indigo-700" :
                    "bg-slate-100 text-slate-600"
                  )}>{r.plan}</Badge>,
                  <span className={cn("text-xs font-semibold", r.amount === 0 ? "text-slate-400" : "text-slate-800")}>
                    {r.amount === 0 ? "Free" : formatCurrency(r.amount)}
                  </span>,
                  r.status === "paid"
                    ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Paid</span>
                    : <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="w-3 h-3" /> Failed</span>,
                ],
              }))}
              sortKey={revKey}
              sortDir={revDir}
              onSort={revToggle}
            />
          )}

          {activeTab === "health" && (
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {MOCK_HEALTH_CHECKS.map((check) => {
                  const status = HEALTH_STATUS[check.status as keyof typeof HEALTH_STATUS];
                  return (
                    <div key={check.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                        {check.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{check.label}</p>
                        <p className="text-[10px] text-slate-500 truncate">{check.detail}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-medium">
                        {status.icon}
                        <span className={cn(
                          check.status === "healthy" ? "text-emerald-600" :
                          check.status === "degraded" ? "text-amber-600" : "text-red-600"
                        )}>{status.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tickets Section */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <LifeBuoy className="w-3.5 h-3.5 text-slate-500" />
                  Support Tickets ({tickets.length})
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                        <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="text-right px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-400 italic">No tickets</td>
                        </tr>
                      ) : tickets.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2">
                            <p className="text-xs font-medium text-slate-800">{t.title}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{t.description}</p>
                          </td>
                          <td className="px-3 py-2">
                            <Badge className={cn(
                              "text-[9px] px-1.5 py-0",
                              t.priority === "high" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                            )}>{t.priority}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Badge className={cn(
                              "text-[9px] px-1.5 py-0",
                              t.status === "open" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            )}>{t.status}</Badge>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {t.status === "open" && (
                              <Button size="sm" className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2"
                                onClick={() => handleResolveTicket(t.id)}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                Resolve
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Refresh hint */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <RefreshCw className="w-3 h-3" />
                Data refreshes automatically every 60 seconds
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className={color}>{icon}</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-lg font-extrabold text-slate-800">{value}</span>
      </CardContent>
    </Card>
  );
}

function DataTable({
  headers,
  rows,
  sortKey,
  sortDir,
  onSort,
}: {
  headers: { key: string; label: string; sortable?: boolean }[];
  rows: { id: string; cells: React.ReactNode[] }[];
  sortKey: string;
  sortDir: SortDir;
  onSort: (key: any) => void;
}) {
  return (
    <table className="w-full min-w-[600px]">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/50">
          {headers.map((h) => (
            <th
              key={h.key}
              className={cn(
                "text-left px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider",
                h.sortable && "cursor-pointer hover:text-slate-600 select-none"
              )}
              onClick={() => h.sortable && onSort(h.key)}
            >
              <span className="flex items-center gap-1">
                {h.label}
                {h.sortable && <SortIcon active={sortKey === h.key} dir={sortDir} />}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="px-3 py-8 text-center text-xs text-slate-400 italic">
              No results found.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
              {row.cells.map((cell, i) => (
                <td key={i} className="px-3 py-2.5">{cell}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
