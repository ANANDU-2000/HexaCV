import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Users, Shield, Plus, Building, Mail, Trash2, CreditCard, BarChart3, Settings } from "lucide-react";
import { toast } from "sonner";

const T = {
  bg: '#0b1326',
  surface: '#131b33',
  elevated: '#1c2747',
  primary: '#1e40af',
  primaryText: '#b8c4ff',
  accent: '#ea580c',
  text: '#e2e8f0',
  muted: '#94a3b8',
  outlineVariant: '#2a3a5c',
  success: '#16a34a',
};

type Section = 'members' | 'roles' | 'usage' | 'billing';

export default function OrganizationPortal() {
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [section, setSection] = useState<Section>('members');

  const listOrgsQuery = trpc.organization.list.useQuery();
  const createOrgMutation = trpc.organization.create.useMutation();
  const getMembersQuery = trpc.organization.members.useQuery({ orgId: selectedOrgId }, { enabled: !!selectedOrgId });

  useEffect(() => {
    if (listOrgsQuery.data?.length && !selectedOrgId) setSelectedOrgId(listOrgsQuery.data[0].id);
  }, [listOrgsQuery.data]);

  const currentOrg = listOrgsQuery.data?.find((o: any) => o.id === selectedOrgId);

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Sidebar nav */}
      <div className="w-full sm:w-[200px] shrink-0 space-y-1">
        {listOrgsQuery.data && (
          <select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm mb-3 sm:hidden"
            style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
            {listOrgsQuery.data.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
        <p className="hidden sm:block text-xs font-bold uppercase tracking-widest mb-2 px-2" style={{ color: T.muted }}>Settings</p>
        {[
          { id: 'members' as Section, icon: Users, label: 'Members' },
          { id: 'roles' as Section, icon: Shield, label: 'Roles & Permissions' },
          { id: 'usage' as Section, icon: BarChart3, label: 'Usage' },
          { id: 'billing' as Section, icon: CreditCard, label: 'Billing' },
        ].map((s) => {
          const active = section === s.id;
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-left transition"
              style={{ backgroundColor: active ? T.primary : 'transparent', color: active ? '#fff' : T.text }}>
              <Icon className="h-4 w-4 shrink-0" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {selectedOrgId ? (
          <>
            {section === 'members' && <MembersSection orgId={selectedOrgId} org={currentOrg} />}
            {section === 'roles' && (
              <div className="flex flex-col items-center py-16 gap-2 rounded-xl border border-dashed" style={{ borderColor: T.outlineVariant }}>
                <Shield className="h-8 w-8" style={{ color: T.muted }} />
                <p className="text-sm" style={{ color: T.muted }}>Roles & Permissions</p>
                <p className="text-xs" style={{ color: T.muted }}>Coming soon</p>
              </div>
            )}
            {section === 'usage' && <UsageSection />}
            {section === 'billing' && <BillingSection />}
          </>
        ) : (
          <div className="flex flex-col items-center py-20 gap-3">
            <Building className="h-10 w-10" style={{ color: T.muted }} />
            <p className="text-sm font-bold" style={{ color: T.text }}>No organization selected</p>
            <p className="text-xs" style={{ color: T.muted }}>Create or select an organization.</p>
            <CreateOrgForm onSubmit={async (name, slug) => {
              try {
                const org = await createOrgMutation.mutateAsync({ name, slug: slug.toLowerCase().replace(/\s+/g, "-") });
                toast.success(`"${name}" created`);
                listOrgsQuery.refetch();
                setSelectedOrgId(org.id);
              } catch (e: any) { toast.error(e.message); }
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

function MembersSection({ orgId, org }: { orgId: string; org: any }) {
  const getMembersQuery = trpc.organization.members.useQuery({ orgId }, { enabled: !!orgId });
  const inviteMutation = trpc.organization.invite.useMutation();
  const removeMemberMutation = trpc.organization.removeMember.useMutation();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("collaborator");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await inviteMutation.mutateAsync({ orgId, email: inviteEmail, role: inviteRole });
      toast.success(`Invited ${inviteEmail}`);
      getMembersQuery.refetch();
      setInviteEmail("");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMemberMutation.mutateAsync({ orgId, memberId });
      toast.success("Member removed");
      getMembersQuery.refetch();
    } catch { toast.error("Failed"); }
  };

  const members = getMembersQuery.data || [];

  return (
    <div className="space-y-4">
      {/* Org header card */}
      <div className="rounded-xl border p-4" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: T.elevated }}>
            <Building className="h-6 w-6" style={{ color: T.primaryText }} />
          </div>
          <div>
            <p className="text-base font-extrabold" style={{ color: T.text }}>{org?.name || 'Organization'}</p>
            <p className="text-xs mt-0.5" style={{ color: T.muted }}>{org?.role || 'owner'} · {members.length} members</p>
          </div>
          <span className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${T.success}20`, color: T.success }}>
            {org?.role === 'owner' ? 'Owner' : 'Member'}
          </span>
        </div>
      </div>

      {/* Invite */}
      <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
        <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@email.com" type="email" required
          className="flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
          className="rounded-lg border px-3 py-2.5 text-sm"
          style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }}>
          <option value="recruiter">Recruiter</option>
          <option value="collaborator">Collaborator</option>
        </select>
        <button type="submit"
          className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          style={{ backgroundColor: T.primary }}>
          <Mail className="h-4 w-4" /> Invite
        </button>
      </form>

      {/* Member list */}
      <div className="space-y-2">
        {members.map((m: any) => (
          <div key={m.id} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: T.elevated }}>
              <Users className="h-5 w-5" style={{ color: T.primaryText }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: T.text }}>{m.userName || 'User'}</p>
              <p className="text-xs" style={{ color: T.muted }}>{m.userEmail}</p>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{
              backgroundColor: m.role === 'owner' ? `${T.success}20` : m.role === 'recruiter' ? `${T.primary}30` : T.elevated,
              color: m.role === 'owner' ? T.success : m.role === 'recruiter' ? T.primaryText : T.muted,
            }}>{m.role}</span>
            {m.role !== 'owner' && (
              <button onClick={() => handleRemove(m.id)} className="p-1 rounded" style={{ color: '#ffb4ab' }}><Trash2 className="h-4 w-4" /></button>
            )}
          </div>
        ))}
        {members.length === 0 && <p className="text-center text-xs py-6" style={{ color: T.muted }}>No members found</p>}
      </div>
    </div>
  );
}

function UsageSection() {
  return (
    <div className="space-y-3">
      <p className="text-base font-extrabold" style={{ color: T.text }}>Usage</p>
      {[{ label: 'Resumes Created', value: '12 / 50' }, { label: 'ATS Scans', value: '28 / 100' }, { label: 'Team Members', value: '4 / 10' }].map((item) => (
        <div key={item.label} className="rounded-xl border p-4" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: T.text }}>{item.label}</span>
            <span style={{ color: T.muted }}>{item.value}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: T.elevated } as React.CSSProperties}>
            <div className="h-full rounded-full" style={{ width: '40%', backgroundColor: T.primary }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function BillingSection() {
  return (
    <div className="space-y-3">
      <p className="text-base font-extrabold" style={{ color: T.text }}>Billing</p>
      <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: T.outlineVariant, backgroundColor: T.surface }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: T.text }}>Current Plan</span>
          <span className="font-bold" style={{ color: T.primaryText }}>Pro</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: T.text }}>Monthly Cost</span>
          <span style={{ color: T.muted }}>$29 / mo</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: T.text }}>Next Invoice</span>
          <span style={{ color: T.muted }}>Aug 15, 2026</span>
        </div>
      </div>
      <button className="w-full rounded-lg py-2.5 text-sm font-bold text-white transition hover:opacity-90" style={{ backgroundColor: T.accent }}>
        Manage Subscription
      </button>
    </div>
  );
}

function CreateOrgForm({ onSubmit }: { onSubmit: (name: string, slug: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const handle = async (e: React.FormEvent) => { e.preventDefault(); await onSubmit(name, slug); setName(""); setSlug(""); };
  return (
    <form onSubmit={handle} className="mt-4 space-y-3 w-full max-w-xs">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" required
        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
        style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
      <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-slug" required
        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
        style={{ borderColor: T.outlineVariant, backgroundColor: T.elevated, color: T.text }} />
      <button type="submit" className="w-full rounded-lg py-2.5 text-sm font-bold text-white" style={{ backgroundColor: T.primary }}>
        Create Organization
      </button>
    </form>
  );
}
