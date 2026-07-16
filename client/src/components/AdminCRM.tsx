import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Users, CreditCard, DollarSign, LifeBuoy, Search, MoreHorizontal,
  ShieldAlert, Eye, Edit3, UserX, Activity, Ticket, BarChart3,
  X, ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";

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
  warning: '#d97706',
  danger: '#dc2626',
};

type Tab = 'users' | 'subscriptions' | 'tickets' | 'health';

const USERS_MOCK = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', plan: 'Pro', status: 'Active', signup: 'Jan 12, 2026', role: 'user' },
  { id: '2', name: 'Bob Chen', email: 'bob@example.com', plan: 'Free', status: 'Active', signup: 'Mar 5, 2026', role: 'user' },
  { id: '3', name: 'Carol Davis', email: 'carol@example.com', plan: 'Enterprise', status: 'Active', signup: 'Nov 20, 2025', role: 'admin' },
  { id: '4', name: 'Dan Wilson', email: 'dan@example.com', plan: 'Pro', status: 'Suspended', signup: 'Feb 18, 2026', role: 'user' },
  { id: '5', name: 'Eve Martinez', email: 'eve@example.com', plan: 'Free', status: 'Inactive', signup: 'Apr 2, 2026', role: 'user' },
  { id: '6', name: 'Frank Lee', email: 'frank@example.com', plan: 'Pro', status: 'Active', signup: 'Jun 8, 2026', role: 'user' },
  { id: '7', name: 'Grace Kim', email: 'grace@example.com', plan: 'Enterprise', status: 'Active', signup: 'Oct 15, 2025', role: 'user' },
  { id: '8', name: 'Hank Patel', email: 'hank@example.com', plan: 'Free', status: 'Active', signup: 'Jul 1, 2026', role: 'user' },
  { id: '9', name: 'Ivy Brown', email: 'ivy@example.com', plan: 'Pro', status: 'Suspended', signup: 'May 22, 2026', role: 'user' },
  { id: '10', name: 'Jack Thompson', email: 'jack@example.com', plan: 'Free', status: 'Active', signup: 'Apr 14, 2026', role: 'user' },
];

const RECENT_ACTIVITY = [
  { id: 'a1', user: 'Alice Johnson', action: 'Upgraded to Pro', time: '2 min ago' },
  { id: 'a2', user: 'Bob Chen', action: 'Created new resume', time: '8 min ago' },
  { id: 'a3', user: 'Dan Wilson', action: 'Account suspended', time: '1 hr ago' },
  { id: 'a4', user: 'Grace Kim', action: 'Ran ATS scan', time: '3 hr ago' },
  { id: 'a5', user: 'Eve Martinez', action: 'Deleted account', time: '5 hr ago' },
];

const TICKETS_MOCK = [
  { id: 't1', user: 'Alice Johnson', subject: 'Billing issue', priority: 'High', status: 'Open', date: 'Jul 14' },
  { id: 't2', user: 'Hank Patel', subject: 'Can not export PDF', priority: 'Medium', status: 'Open', date: 'Jul 15' },
  { id: 't3', user: 'Frank Lee', subject: 'Feature request: dark mode', priority: 'Low', status: 'Resolved', date: 'Jul 12' },
];

const SUBS_MOCK = [
  { id: 's1', user: 'Alice Johnson', plan: 'Pro', amount: '$29/mo', status: 'Active', renews: 'Aug 15, 2026' },
  { id: 's2', user: 'Carol Davis', plan: 'Enterprise', amount: '$99/mo', status: 'Active', renews: 'Aug 1, 2026' },
  { id: 's3', user: 'Frank Lee', plan: 'Pro', amount: '$29/mo', status: 'Active', renews: 'Sep 8, 2026' },
  { id: 's4', user: 'Grace Kim', plan: 'Enterprise', amount: '$99/mo', status: 'Active', renews: 'Oct 15, 2026' },
];

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: any; label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div className="rounded-xl border p-4 flex items-start gap-3"
      style={{ borderColor: accent ? `${accent}30` : T.outlineVariant, backgroundColor: T.surface }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: accent ? `${accent}15` : T.elevated }}>
        <Icon className="h-5 w-5" style={{ color: accent || T.primaryText }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: T.muted }}>{label}</p>
        <p className="text-xl font-extrabold mt-0.5" style={{ color: T.text }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: T.muted }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ── Mobile: simplified read-only summary ── */
function MobileAdmin() {
  const [selectedUser, setSelectedUser] = useState<typeof USERS_MOCK[0] | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold" style={{ color: T.text }}>Admin</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Total Users" value="1,284" sub="+32 this week" />
        <StatCard icon={CreditCard} label="Active Subs" value="847" />
        <StatCard icon={DollarSign} label="MRR" value="$14,280" sub="↗ 8.3%" accent={T.success} />
        <StatCard icon={LifeBuoy} label="Open Tickets" value="3" accent={T.warning} />
      </div>

      <div className="rounded-xl border" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: T.outlineVariant }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Recent Activity</p>
        </div>
        <div className="divide-y" style={{ borderColor: T.outlineVariant }}>
          {RECENT_ACTIVITY.map((a) => (
            <div key={a.id} className="px-4 py-3">
              <p className="text-sm font-bold" style={{ color: T.text }}>{a.user}</p>
              <p className="text-xs" style={{ color: T.muted }}>{a.action} · {a.time}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: T.outlineVariant }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Users</p>
        </div>
        <div className="divide-y" style={{ borderColor: T.outlineVariant }}>
          {USERS_MOCK.map((u) => (
            <button key={u.id} onClick={() => setSelectedUser(u)}
              className="flex items-center justify-between w-full px-4 py-3 text-left transition"
              style={{ backgroundColor: 'transparent' }}>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: T.text }}>{u.name}</p>
                <p className="text-xs truncate" style={{ color: T.muted }}>{u.email}</p>
              </div>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ml-2"
                style={{
                  backgroundColor: u.status === 'Active' ? `${T.success}20` : u.status === 'Suspended' ? `${T.danger}20` : T.outlineVariant,
                  color: u.status === 'Active' ? T.success : u.status === 'Suspended' ? T.danger : T.muted,
                }}>
                {u.status}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Read-only user detail sheet */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-xl p-5" style={{ backgroundColor: T.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: T.text }}>{selectedUser.name}</h3>
              <button onClick={() => setSelectedUser(null)}><X className="h-4 w-4" style={{ color: T.muted }} /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="font-bold" style={{ color: T.muted }}>Email: </span><span style={{ color: T.text }}>{selectedUser.email}</span></div>
              <div><span className="font-bold" style={{ color: T.muted }}>Plan: </span><span style={{ color: T.text }}>{selectedUser.plan}</span></div>
              <div><span className="font-bold" style={{ color: T.muted }}>Status: </span><span style={{ color: selectedUser.status === 'Active' ? T.success : T.danger }}>{selectedUser.status}</span></div>
              <div><span className="font-bold" style={{ color: T.muted }}>Joined: </span><span style={{ color: T.text }}>{selectedUser.signup}</span></div>
            </div>
            <div className="mt-4 rounded-lg border p-3 text-center"
              style={{ borderColor: `${T.warning}40`, backgroundColor: `${T.warning}10` }}>
              <p className="text-xs font-medium" style={{ color: T.warning }}>Open on desktop to edit</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Desktop: full CRM ── */
function DesktopAdmin() {
  const [tab, setTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [menuUser, setMenuUser] = useState<string | null>(null);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = [...USERS_MOCK]
    .filter((u) => {
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (planFilter !== 'all' && u.plan !== planFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const statsData = [
    { icon: Users, label: 'Total Users', value: '1,284', sub: '+32 this week' },
    { icon: CreditCard, label: 'Active Subs', value: '847', sub: '66% conversion' },
    { icon: DollarSign, label: 'MRR', value: '$14,280', sub: '↗ 8.3% MoM', accent: T.success },
    { icon: LifeBuoy, label: 'Open Tickets', value: '3', sub: '2 high priority', accent: T.warning },
    { icon: BarChart3, label: 'Avg. Session', value: '14m 32s', sub: '↘ 2% WoW', accent: T.danger },
  ];

  const renderUserTable = () => (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
      {/* Filters bar */}
      <div className="flex items-center gap-3 p-3 border-b flex-wrap" style={{ borderColor: T.outlineVariant }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.muted }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
          <option value="all">All Plans</option>
          <option value="Free">Free</option>
          <option value="Pro">Pro</option>
          <option value="Enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: T.elevated }}>
              {['Name', 'Email', 'Plan', 'Status', 'Signup Date', ''].map((h) => (
                <th key={h} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${h ? 'cursor-pointer select-none' : ''}`}
                  style={{ color: T.muted }} onClick={() => h && h !== 'Actions' && h !== '' && handleSort(h.toLowerCase().replace(' ', ''))}>
                  <span className="flex items-center gap-1">
                    {h}
                    {h && <ArrowUpDown className="h-3 w-3" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: T.outlineVariant }}>
            {filtered.map((u) => (
              <tr key={u.id} className="transition" style={{ backgroundColor: 'transparent' }}>
                <td className="px-4 py-3">
                  <p className="font-bold text-sm" style={{ color: T.text }}>{u.name}</p>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: T.muted }}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: u.plan === 'Enterprise' ? `${T.primary}20` : u.plan === 'Pro' ? `${T.success}20` : T.outlineVariant,
                      color: u.plan === 'Enterprise' ? T.primaryText : u.plan === 'Pro' ? T.success : T.muted,
                    }}>
                    {u.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: u.status === 'Active' ? `${T.success}20` : u.status === 'Suspended' ? `${T.danger}20` : T.outlineVariant,
                      color: u.status === 'Active' ? T.success : u.status === 'Suspended' ? T.danger : T.muted,
                    }}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: T.muted }}>{u.signup}</td>
                <td className="px-4 py-3 text-right relative">
                  <button onClick={() => setMenuUser(menuUser === u.id ? null : u.id)}
                    className="rounded-lg p-1.5 transition" style={{ color: T.muted }}>
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuUser === u.id && (
                    <div className="absolute right-4 top-10 z-10 w-40 rounded-xl border shadow-lg overflow-hidden"
                      style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
                      {['Edit', 'Suspend', 'Impersonate'].map((action) => (
                        <button key={action} onClick={() => { setMenuUser(null); toast.info(`${action} ${u.name} (simulated)`); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-left transition"
                          style={{ color: action === 'Suspend' ? T.danger : T.text }}>
                          {action === 'Edit' ? <Edit3 className="h-3.5 w-3.5" /> : action === 'Suspend' ? <UserX className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 text-xs" style={{ color: T.muted, borderTop: `1px solid ${T.outlineVariant}` }}>
        {filtered.length} user{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: T.elevated }}>
            {['User', 'Plan', 'Amount', 'Status', 'Renews'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: T.muted }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: T.outlineVariant }}>
          {SUBS_MOCK.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-bold text-sm" style={{ color: T.text }}>{s.user}</td>
              <td className="px-4 py-3"><span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: s.plan === 'Enterprise' ? `${T.primary}20` : `${T.success}20`, color: s.plan === 'Enterprise' ? T.primaryText : T.success }}>{s.plan}</span></td>
              <td className="px-4 py-3 text-sm" style={{ color: T.text }}>{s.amount}</td>
              <td className="px-4 py-3"><span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${T.success}20`, color: T.success }}>{s.status}</span></td>
              <td className="px-4 py-3 text-sm" style={{ color: T.muted }}>{s.renews}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTickets = () => (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: T.elevated }}>
            {['User', 'Subject', 'Priority', 'Status', 'Date', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: T.muted }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: T.outlineVariant }}>
          {TICKETS_MOCK.map((t) => (
            <tr key={t.id}>
              <td className="px-4 py-3 font-bold text-sm" style={{ color: T.text }}>{t.user}</td>
              <td className="px-4 py-3 text-sm" style={{ color: T.text }}>{t.subject}</td>
              <td className="px-4 py-3"><span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: t.priority === 'High' ? `${T.danger}20` : t.priority === 'Medium' ? `${T.warning}20` : T.outlineVariant,
                  color: t.priority === 'High' ? T.danger : t.priority === 'Medium' ? T.warning : T.muted,
                }}>{t.priority}</span></td>
              <td className="px-4 py-3"><span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: t.status === 'Open' ? `${T.warning}20` : `${T.success}20`,
                  color: t.status === 'Open' ? T.warning : T.success,
                }}>{t.status}</span></td>
              <td className="px-4 py-3 text-sm" style={{ color: T.muted }}>{t.date}</td>
              <td className="px-4 py-3 text-right">
                {t.status === 'Open' && (
                  <button onClick={() => toast.success('Ticket resolved (simulated)')}
                    className="rounded-lg px-3 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: T.primary }}>Resolve</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderHealth = () => (
    <div className="rounded-xl border p-5" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
      <div className="space-y-4">
        {[
          { label: 'API Response Time', value: '142ms', status: 'Good' },
          { label: 'Uptime (30d)', value: '99.97%', status: 'Good' },
          { label: 'Error Rate', value: '0.12%', status: 'Good' },
          { label: 'Database Connections', value: '23 / 100', status: 'Good' },
          { label: 'Memory Usage', value: '68%', status: 'Warning' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border p-3"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated }}>
            <span className="text-sm font-bold" style={{ color: T.text }}>{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: T.text }}>{item.value}</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: item.status === 'Good' ? `${T.success}20` : `${T.warning}20`,
                  color: item.status === 'Good' ? T.success : T.warning,
                }}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tabContent: Record<Tab, () => React.ReactNode> = {
    users: renderUserTable,
    subscriptions: renderSubscriptions,
    tickets: renderTickets,
    health: renderHealth,
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: T.text }}>Admin CRM</h1>
        <p className="mt-1 text-sm" style={{ color: T.muted }}>
          Manage users, subscriptions, support tickets, and system health.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4">
        {statsData.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: T.elevated }}>
        {(['users', 'subscriptions', 'tickets', 'health'] as Tab[]).map((t) => {
          const icons: Record<Tab, any> = { users: Users, subscriptions: CreditCard, tickets: Ticket, health: Activity };
          const Icon = icons[t];
          return (
            <button key={t} onClick={() => setTab(t)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold capitalize transition"
              style={{
                backgroundColor: tab === t ? T.primary : 'transparent',
                color: tab === t ? 'white' : T.muted,
              }}>
              <Icon className="h-3.5 w-3.5" />
              {t}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tabContent[tab]()}
    </div>
  );
}

export default function AdminCRM() {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm font-bold" style={{ color: T.muted }}>Loading admin panel...</p>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="rounded-xl border p-8 text-center max-w-sm"
          style={{ borderColor: `${T.danger}30`, backgroundColor: `${T.danger}08` }}>
          <ShieldAlert className="h-12 w-12 mx-auto mb-3" style={{ color: T.danger }} />
          <h2 className="text-lg font-bold" style={{ color: T.danger }}>Access Denied</h2>
          <p className="text-sm mt-2" style={{ color: T.muted }}>
            This portal is restricted to administrators.
          </p>
        </div>
      </div>
    );
  }

  return isMobile ? <MobileAdmin /> : <DesktopAdmin />;
}
