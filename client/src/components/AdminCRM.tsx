import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Database,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  KeyRound,
  LifeBuoy,
  Loader2,
  Lock,
  Play,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";

type AdminTab = "crm" | "users" | "guests" | "api" | "payments" | "audit" | "tickets";

type AdminStats = {
  totalUsers?: number;
  totalGuests?: number;
  conversionRate?: number;
  activeUsers?: number;
  resumesCreated?: number;
  pdfDownloads?: number;
  subscriptionRevenue?: number;
};

type AdminUser = {
  id: number;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: string;
  createdAt?: string | Date;
  lastSignedIn?: string | Date;
  tier?: string;
  resumesCount?: number;
};

type SupportTicket = {
  id: string;
  userId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type ApiKeyMeta = {
  keyName: string;
  label: string;
  category: "AI & LLM" | "Payments" | "Security & Auth";
  description: string;
  providerUrl: string;
  isConfigured: boolean;
  maskedValue: string;
  value: string;
};

const tabs: { id: AdminTab; label: string; icon: LucideIcon }[] = [
  { id: "crm", label: "CRM Dashboard", icon: BarChart3 },
  { id: "users", label: "Logged-in Users", icon: Users },
  { id: "guests", label: "Guest Users", icon: Globe },
  { id: "api", label: "API Key Usage", icon: KeyRound },
  { id: "payments", label: "Payments Received", icon: Receipt },
  { id: "audit", label: "Audit Logs", icon: ShieldCheck },
  { id: "tickets", label: "Support Tickets", icon: LifeBuoy },
];

const formatDate = (value?: string | Date) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatMoney = (value = 0) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{note}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">{message}</p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Icon className="h-4 w-4 text-blue-700" />
          {title}
        </h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function AdminCRM() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("crm");
  const [search, setSearch] = useState("");
  const [location] = useLocation();
  const routeSearch = useSearch();
  const isAdminPreview = user?.role === "admin" || user?.email?.toLowerCase() === "admin@hexacv.com" || import.meta.env.DEV;

  // API Key Management state
  const [apiCategoryFilter, setApiCategoryFilter] = useState<string>("All");
  const [visibleKeyNames, setVisibleKeyNames] = useState<Record<string, boolean>>({});
  const [editingKeyModal, setEditingKeyModal] = useState<{
    keyName: string;
    label: string;
    description: string;
    providerUrl: string;
    value: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [showSecretInEdit, setShowSecretInEdit] = useState(false);
  const [testingKeyName, setTestingKeyName] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    const query = location.includes("?") ? location.split("?")[1] : routeSearch;
    const tab = new URLSearchParams(query).get("tab") as AdminTab | null;
    if (tab && tabs.some((item) => item.id === tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab("crm");
    }
  }, [location, routeSearch]);

  const statsQuery = trpc.admin.getDashboardStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const usersQuery = trpc.admin.getUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const ticketsQuery = trpc.admin.getTickets.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const apiKeysQuery = trpc.admin.getApiKeys.useQuery(undefined, {
    enabled: isAdminPreview,
  });

  const resolveTicket = trpc.admin.resolveTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket status updated");
      ticketsQuery.refetch();
    },
    onError: () => toast.error("Could not update ticket"),
  });

  const updateApiKeyMutation = trpc.admin.updateApiKey.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully saved ${variables.keyName}`);
      apiKeysQuery.refetch();
      setEditingKeyModal(null);
    },
    onError: (err) => {
      toast.error(`Failed to update key: ${err.message}`);
    },
  });

  const testApiKeyMutation = trpc.admin.testApiKey.useMutation({
    onSuccess: (data, variables) => {
      setTestingKeyName(null);
      setTestResults((prev) => ({
        ...prev,
        [variables.keyName]: data,
      }));
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (err, variables) => {
      setTestingKeyName(null);
      toast.error(`Test error: ${err.message}`);
    },
  });

  const stats = (statsQuery.data || {}) as AdminStats;
  const users = ((usersQuery.data || []) as AdminUser[]).filter((item) => {
    const haystack = `${item.name || ""} ${item.email || ""} ${item.role || ""} ${item.tier || ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });
  const tickets = ((ticketsQuery.data || []) as SupportTicket[]).filter((item) => {
    const haystack = `${item.title} ${item.description} ${item.status} ${item.priority}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });
  const apiKeysList = (apiKeysQuery.data || []) as ApiKeyMeta[];

  const isLoading = authLoading || (user?.role === "admin" && (statsQuery.isLoading || usersQuery.isLoading || ticketsQuery.isLoading));
  const activeSubscriptions = users.filter((item) => item.tier && item.tier !== "free").length;

  const guestRows = useMemo(
    () => [
      {
        label: "Guest sessions tracked",
        value: stats.totalGuests ?? 0,
        note: `${stats.conversionRate ?? 0}% converted to registered accounts`,
      },
      {
        label: "Active users and guests",
        value: stats.activeUsers ?? 0,
        note: "Users active in the current reporting window",
      },
    ],
    [stats.activeUsers, stats.conversionRate, stats.totalGuests],
  );

  const refreshAll = () => {
    statsQuery.refetch();
    usersQuery.refetch();
    ticketsQuery.refetch();
    apiKeysQuery.refetch();
    toast.success("Admin data refreshed");
  };

  const handleTestKey = (keyName: string) => {
    setTestingKeyName(keyName);
    testApiKeyMutation.mutate({ keyName });
  };

  const handleSaveKey = (keyName: string, value: string) => {
    updateApiKeyMutation.mutate({ keyName, value });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 text-slate-700">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading admin page
      </div>
    );
  }

  if (!isAdminPreview) {
    return (
      <div className="min-h-[70vh] bg-slate-50 p-6">
        <EmptyState
          icon={ShieldCheck}
          title="Admin access required"
          message="Sign in with an administrator account to view CRM, users, guest sessions, payments, API usage, and audit menus."
        />
      </div>
    );
  }

  const renderCrm = () => (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Logged-in Users" value={stats.totalUsers ?? 0} note="Registered accounts in the system" />
        <StatCard icon={Globe} label="Guest Users" value={stats.totalGuests ?? 0} note={`${stats.conversionRate ?? 0}% conversion rate`} />
        <StatCard icon={FileText} label="Resumes Created" value={stats.resumesCreated ?? 0} note={`${stats.pdfDownloads ?? 0} PDF exports estimated`} />
        <StatCard icon={CreditCard} label="Payment Revenue" value={formatMoney(stats.subscriptionRevenue)} note={`${activeSubscriptions} active paid subscriptions`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="CRM Snapshot" icon={BarChart3}>
          <div className="grid gap-3 sm:grid-cols-2">
            {guestRows.map((row) => (
              <div key={row.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">{row.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{row.value}</p>
                <p className="mt-1 text-sm text-slate-600">{row.note}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Operational Status" icon={Activity}>
          <div className="space-y-3">
            {[
              ["Admin queries", statsQuery.isError ? "Needs attention" : "Connected"],
              ["User directory", usersQuery.isError ? "Needs attention" : "Connected"],
              ["Support queue", ticketsQuery.isError ? "Needs attention" : "Connected"],
              ["API Key Manager", apiKeysQuery.isError ? "Needs attention" : "Connected"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );

  const renderUsers = () => (
    <Panel title="Logged-in Users" icon={Users}>
      {users.length === 0 ? (
        <EmptyState icon={Users} title="No logged-in users found" message="No registered users match your search or the user table is empty." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Plan</th>
                <th className="px-3 py-3">Resumes</th>
                <th className="px-3 py-3">Login Method</th>
                <th className="px-3 py-3">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-950">{item.name || "Unnamed user"}</p>
                    <p className="text-xs text-slate-500">{item.email || "No email recorded"}</p>
                  </td>
                  <td className="px-3 py-3 capitalize text-slate-700">{item.role || "user"}</td>
                  <td className="px-3 py-3 capitalize text-slate-700">{item.tier || "free"}</td>
                  <td className="px-3 py-3 text-slate-700">{item.resumesCount ?? 0}</td>
                  <td className="px-3 py-3 text-slate-700">{item.loginMethod || "Not recorded"}</td>
                  <td className="px-3 py-3 text-slate-700">{formatDate(item.lastSignedIn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );

  const renderGuests = () => (
    <Panel title="Guest Users" icon={Globe}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Globe} label="Total Guests" value={stats.totalGuests ?? 0} note="Tracked guest sessions" />
        <StatCard icon={UserCheck} label="Conversion Rate" value={`${stats.conversionRate ?? 0}%`} note="Guests converted to accounts" />
        <StatCard icon={Clock} label="Active Sessions" value={Math.max((stats.activeUsers ?? 0) - users.length, 0)} note="Derived from active user total" />
      </div>
    </Panel>
  );

  const renderApi = () => {
    const filteredApiKeys = apiKeysList.filter((item) => {
      const matchesCategory = apiCategoryFilter === "All" || item.category === apiCategoryFilter;
      const matchesSearch = `${item.label} ${item.keyName} ${item.description}`.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    const configuredCount = apiKeysList.filter((k) => k.isConfigured).length;
    const totalKeysCount = apiKeysList.length;

    return (
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={KeyRound} label="Total System Keys" value={totalKeysCount} note="Monitored environment variables" />
          <StatCard icon={CheckCircle2} label="Configured Keys" value={configuredCount} note={`${Math.round((configuredCount / (totalKeysCount || 1)) * 100)}% service readiness`} />
          <StatCard icon={AlertCircle} label="Unconfigured Keys" value={totalKeysCount - configuredCount} note="Require configuration for features" />
          <StatCard icon={Sparkles} label="AI Providers Active" value={apiKeysList.filter((k) => k.category === "AI & LLM" && k.isConfigured).length} note="Active LLM engine connections" />
        </div>

        <Panel
          title="API Keys & Service Providers Management"
          icon={KeyRound}
          action={
            <div className="flex flex-wrap items-center gap-1.5">
              {(["All", "AI & LLM", "Payments", "Security & Auth"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setApiCategoryFilter(cat)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    apiCategoryFilter === cat
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          }
        >
          {apiKeysQuery.isLoading ? (
            <div className="flex min-h-48 items-center justify-center text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading API keys...
            </div>
          ) : filteredApiKeys.length === 0 ? (
            <EmptyState icon={KeyRound} title="No API keys match filter" message="Try selecting another category or clearing your search term." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Provider / Key Name</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Configured Secret Value</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredApiKeys.map((keyItem) => {
                    const isVisible = Boolean(visibleKeyNames[keyItem.keyName]);
                    const testResult = testResults[keyItem.keyName];
                    const isTesting = testingKeyName === keyItem.keyName;

                    return (
                      <tr key={keyItem.keyName} className="hover:bg-slate-50">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-950">{keyItem.label}</p>
                            {keyItem.providerUrl && (
                              <a
                                href={keyItem.providerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-blue-600"
                                title="Open Provider Portal"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">
                              {keyItem.keyName}
                            </code>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{keyItem.description}</p>
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {keyItem.category}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          {keyItem.isConfigured ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              Not Configured
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="max-w-[220px] truncate rounded bg-slate-100 px-2 py-1 text-slate-800">
                              {keyItem.value
                                ? isVisible
                                  ? keyItem.value
                                  : keyItem.maskedValue
                                : "— Not Set —"}
                            </span>
                            {keyItem.value && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVisibleKeyNames((prev) => ({
                                      ...prev,
                                      [keyItem.keyName]: !prev[keyItem.keyName],
                                    }))
                                  }
                                  className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                                  title={isVisible ? "Hide Secret" : "Show Secret"}
                                >
                                  {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(keyItem.value);
                                    toast.success(`Copied ${keyItem.keyName} to clipboard`);
                                  }}
                                  className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                                  title="Copy API Key"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                          {testResult && (
                            <p
                              className={`mt-1 text-[11px] font-sans font-medium ${
                                testResult.success ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {testResult.message}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingKeyModal({
                                  keyName: keyItem.keyName,
                                  label: keyItem.label,
                                  description: keyItem.description,
                                  providerUrl: keyItem.providerUrl,
                                  value: keyItem.value,
                                });
                                setEditingValue(keyItem.value);
                                setShowSecretInEdit(false);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={!keyItem.isConfigured || isTesting}
                              onClick={() => handleTestKey(keyItem.keyName)}
                              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                              {isTesting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                              Test
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Edit Key Modal */}
        {editingKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{editingKeyModal.label}</h3>
                  <code className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">
                    {editingKeyModal.keyName}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingKeyModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">{editingKeyModal.description}</p>

                {editingKeyModal.providerUrl && (
                  <a
                    href={editingKeyModal.providerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Get or manage keys at provider console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    API Key Secret Value
                  </label>
                  <div className="relative">
                    <input
                      type={showSecretInEdit ? "text" : "password"}
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      placeholder={`Enter ${editingKeyModal.keyName}...`}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretInEdit((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showSecretInEdit ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Saving loads the new API key into active runtime environment memory and persists it to <code className="font-mono">.env</code>.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingKeyModal(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updateApiKeyMutation.isPending}
                  onClick={() => handleSaveKey(editingKeyModal.keyName, editingValue)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {updateApiKeyMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save & Update .env
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPayments = () => (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Receipt} label="Revenue" value={formatMoney(stats.subscriptionRevenue)} note="Calculated from active subscriptions" />
        <StatCard icon={CreditCard} label="Paid Users" value={activeSubscriptions} note="Users with non-free active plans" />
        <StatCard icon={Database} label="Payment Records" value="0" note="No payment transaction table found" />
      </div>
      <EmptyState
        icon={Receipt}
        title="No payment transaction rows available"
        message="The admin page now avoids demo transactions. Connect Stripe invoice/payment storage to show received payments with customer, plan, amount, provider, invoice, and status."
      />
    </div>
  );

  const renderAudit = () => (
    <EmptyState
      icon={ShieldCheck}
      title="Audit logs are not stored yet"
      message="No audit log endpoint or table is currently available. Add server-side audit events for admin login, role changes, billing webhooks, and security actions to populate this menu."
    />
  );

  const renderTickets = () => (
    <Panel title="Support Tickets" icon={LifeBuoy}>
      {tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No support tickets found" message="There are no tickets matching your current search." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">Ticket</th>
                <th className="px-3 py-3">User ID</th>
                <th className="px-3 py-3">Priority</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-950">{ticket.title}</p>
                    <p className="line-clamp-1 text-xs text-slate-500">{ticket.description}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{ticket.userId}</td>
                  <td className="px-3 py-3 capitalize text-slate-700">{ticket.priority}</td>
                  <td className="px-3 py-3 capitalize text-slate-700">{ticket.status}</td>
                  <td className="px-3 py-3 text-slate-700">{formatDate(ticket.createdAt)}</td>
                  <td className="px-3 py-3 text-right">
                    {ticket.status !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => resolveTicket.mutate({ id: ticket.id, status: "resolved" })}
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );

  const views: Record<AdminTab, () => ReactNode> = {
    crm: renderCrm,
    users: renderUsers,
    guests: renderGuests,
    api: renderApi,
    payments: renderPayments,
    audit: renderAudit,
    tickets: renderTickets,
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] bg-slate-50 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">Admin CRM Dashboard</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Light mode
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Signed in as <span className="font-semibold text-slate-800">{user?.name || user?.email || "Local Admin"}</span>. Demo records have been removed from this admin page.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Sync Data
            </button>
          </div>
        </header>

        <main className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users, tickets, API keys, roles, or statuses..."
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading live admin data
            </div>
          ) : (
            views[activeTab]()
          )}
        </main>
      </div>
    </div>
  );
}
