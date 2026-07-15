import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Progress } from "./ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "./ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "./ui/sheet";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Users, Plus, Building, Mail, UserMinus, Shield, MoreVertical,
  UserCog, Check, X, AlertTriangle, Crown, UserCheck
} from "lucide-react";

type Member = {
  id: string;
  userId: number;
  organizationId: string;
  role: string;
  userName: string;
  userEmail: string;
};

const SEATS_LIMIT: Record<string, number> = {
  free: 1,
  pro: 5,
  enterprise: 999,
};

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { value: "admin", label: "Admin", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "recruiter", label: "Recruiter", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "collaborator", label: "Collaborator", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

function getRoleBadge(role: string) {
  const opt = ROLE_OPTIONS.find(r => r.value === role);
  return opt || { value: role, label: role, color: "bg-slate-100 text-slate-700 border-slate-200" };
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function getPlanLabel(tier: string): string {
  if (tier === "enterprise") return "Enterprise";
  if (tier === "pro") return "Pro";
  return "Free";
}

interface ConfirmActionProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void;
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, confirmVariant = "destructive", onConfirm }: ConfirmActionProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <DialogTitle className="text-base">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="sm"
            className={confirmVariant === "destructive" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
            onClick={() => { onConfirm(); onOpenChange(false); }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OrganizationPortal() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("collaborator");
  const [createOpen, setCreateOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  // Confirmation state
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState<{ member: Member; newRole: string } | null>(null);

  const listOrgsQuery = trpc.organization.list.useQuery();
  const createOrgMutation = trpc.organization.create.useMutation();
  const getMembersQuery = trpc.organization.members.useQuery(
    { orgId: selectedOrgId },
    { enabled: !!selectedOrgId }
  );
  const inviteMutation = trpc.organization.invite.useMutation();
  const updateRoleMutation = trpc.organization.updateMemberRole.useMutation();
  const removeMemberMutation = trpc.organization.removeMember.useMutation();
  const getSubQuery = trpc.billing.getSubscription.useQuery();

  const currentOrg = listOrgsQuery.data?.find(o => o?.id === selectedOrgId);
  const members = (getMembersQuery.data || []) as Member[];
  const currentTier = getSubQuery.data?.tier || "free";
  const seatsLimit = SEATS_LIMIT[currentTier] || 1;
  const seatsUsed = members.length;
  const seatsPercent = Math.min(100, Math.round((seatsUsed / seatsLimit) * 100));
  const isOwnerOrAdmin = currentOrg && (currentOrg.role === "owner" || currentOrg.role === "admin");

  useEffect(() => {
    if (listOrgsQuery.data && listOrgsQuery.data.length > 0 && !selectedOrgId) {
      setSelectedOrgId(listOrgsQuery.data[0]?.id || "");
    }
  }, [listOrgsQuery.data]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgSlug.trim()) {
      toast.error("Please provide a name and URL slug");
      return;
    }
    try {
      const org = await createOrgMutation.mutateAsync({
        name: orgName,
        slug: orgSlug.toLowerCase().replace(/\s+/g, "-"),
      });
      toast.success(`Organization "${orgName}" created!`);
      listOrgsQuery.refetch();
      setSelectedOrgId(org.id);
      setOrgName("");
      setOrgSlug("");
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create organization");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    if (seatsUsed >= seatsLimit && currentTier !== "enterprise") {
      toast.error(`Seat limit reached (${seatsUsed}/${seatsLimit}). Upgrade your plan to add more members.`);
      return;
    }
    try {
      await inviteMutation.mutateAsync({ orgId: selectedOrgId, email: inviteEmail, role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}!`);
      getMembersQuery.refetch();
      setInviteEmail("");
      setInviteOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to invite member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMemberMutation.mutateAsync({ orgId: selectedOrgId, memberId });
      toast.success("Team member removed");
      getMembersQuery.refetch();
    } catch {
      toast.error("Could not remove team member");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ orgId: selectedOrgId, memberId, role: newRole });
      toast.success("Member role updated");
      getMembersQuery.refetch();
    } catch {
      toast.error("Could not update member role");
    }
  };

  const canManage = (role: string) => role !== "owner" && isOwnerOrAdmin;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <Building className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Organization</h2>
            <p className="text-[11px] text-slate-500">Team management & settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-40 h-8 text-xs bg-white border-slate-300">
              <SelectValue placeholder="Select org..." />
            </SelectTrigger>
            <SelectContent>
              {listOrgsQuery.data?.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3 h-3 text-slate-400" />
                    {org.name}
                    <span className="text-[9px] text-slate-400">({org.role})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs border-slate-300" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </div>
      </div>

      {selectedOrgId && currentOrg ? (
        <>
          {/* Seats / Usage Summary Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">Team Seats</span>
                </div>
                <span className="text-xs text-slate-500">
                  {seatsUsed} of {currentTier === "enterprise" ? "∞" : seatsLimit} used
                  <span className="ml-1.5 text-[10px] font-medium text-indigo-600 uppercase">{getPlanLabel(currentTier)}</span>
                </span>
              </div>
              <Progress
                value={currentTier === "enterprise" ? 10 : seatsPercent}
                className={cn(
                  "h-1.5 bg-slate-100",
                  seatsPercent >= 90 ? "[&>div]:bg-red-500" : seatsPercent >= 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-indigo-500"
                )}
              />
              {seatsUsed >= seatsLimit && currentTier !== "enterprise" && (
                <p className="text-[10px] text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Seat limit reached. <a href="/dashboard/billing" className="underline font-medium">Upgrade plan</a> to add more members.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="px-4 py-3 border-b border-slate-100 flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-500" />
                Members ({members.length})
              </CardTitle>
              {isOwnerOrAdmin && !isMobile && (
                <Button
                  size="sm"
                  className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                  onClick={() => setInviteOpen(true)}
                >
                  <Plus className="w-3 h-3" />
                  Invite Member
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isMobile ? (
                <MobileMemberList
                  members={members}
                  currentUserId={user?.id}
                  isOwnerOrAdmin={!!isOwnerOrAdmin}
                  onRemove={setConfirmRemove}
                  onRoleChange={setConfirmRoleChange}
                />
              ) : (
                <DesktopMemberTable
                  members={members}
                  currentUserId={user?.id}
                  isOwnerOrAdmin={!!isOwnerOrAdmin}
                  onRemove={setConfirmRemove}
                  onRoleChange={setConfirmRoleChange}
                />
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg h-48 flex flex-col items-center justify-center text-center p-6">
          <Building className="w-10 h-10 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Organization Selected</h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xs">Select an organization above or create a new one to manage team members.</p>
        </div>
      )}

      {/* Mobile Floating Action Button */}
      {isMobile && isOwnerOrAdmin && selectedOrgId && (
        <button
          onClick={() => setInviteOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 flex items-center justify-center transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Create Org Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm bg-white">
          <form onSubmit={handleCreateOrg}>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>Set up a new team workspace.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Team Name</label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Acme Corp" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Subdomain</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[11px] text-slate-400">hexacv.com/</span>
                  <Input value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} placeholder="acme" className="pl-[76px]" required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-indigo-600 text-white">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog / Full-Screen Mobile Sheet */}
      {isMobile ? (
        <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
          <SheetContent
            side="right"
            className="w-full max-w-full border-0 bg-white"
          >
            <SheetHeader className="mb-6">
              <SheetTitle className="text-lg">Invite Member</SheetTitle>
              <SheetDescription className="text-sm">Add someone to your team workspace.</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleInvite} className="space-y-5 px-1">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="collaborator">Collaborator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {seatsUsed >= seatsLimit && currentTier !== "enterprise" && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Seat limit reached. <a href="/dashboard/billing" className="underline">Upgrade</a>
                </p>
              )}
              <Button type="submit" className="w-full bg-indigo-600 text-white h-10 text-sm" disabled={seatsUsed >= seatsLimit && currentTier !== "enterprise"}>
                <Mail className="w-4 h-4 mr-1.5" />
                Send Invitation
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent className="max-w-sm bg-white">
            <form onSubmit={handleInvite}>
              <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogDescription>Add someone to your team workspace.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Role</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                      <SelectItem value="collaborator">Collaborator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {seatsUsed >= seatsLimit && currentTier !== "enterprise" && (
                  <p className="text-[10px] text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Seat limit reached. <a href="/dashboard/billing" className="underline">Upgrade plan</a>
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-indigo-600 text-white" disabled={seatsUsed >= seatsLimit && currentTier !== "enterprise"}>
                  <Mail className="w-3 h-3 mr-1" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation: Remove Member */}
      {confirmRemove && (
        <ConfirmDialog
          open={!!confirmRemove}
          onOpenChange={() => setConfirmRemove(null)}
          title="Remove Member?"
          description={`${confirmRemove.userName} will lose access to this organization and all its resources. This action cannot be undone.`}
          confirmLabel="Remove"
          confirmVariant="destructive"
          onConfirm={() => handleRemoveMember(confirmRemove.id)}
        />
      )}

      {/* Confirmation: Change Role */}
      {confirmRoleChange && (
        <ConfirmDialog
          open={!!confirmRoleChange}
          onOpenChange={() => setConfirmRoleChange(null)}
          title="Change Member Role?"
          description={`Change ${confirmRoleChange.member.userName}'s role from "${getRoleBadge(confirmRoleChange.member.role).label}" to "${getRoleBadge(confirmRoleChange.newRole).label}". This affects their permissions.`}
          confirmLabel="Change Role"
          confirmVariant="default"
          onConfirm={() => handleRoleChange(confirmRoleChange.member.id, confirmRoleChange.newRole)}
        />
      )}
    </div>
  );
}

function DesktopMemberTable({
  members,
  currentUserId,
  isOwnerOrAdmin,
  onRemove,
  onRoleChange,
}: {
  members: Member[];
  currentUserId?: number;
  isOwnerOrAdmin: boolean;
  onRemove: (m: Member) => void;
  onRoleChange: (p: { member: Member; newRole: string }) => void;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-100">
          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Member</th>
          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Email</th>
          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Role</th>
          <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {members.map((m) => {
          const badge = getRoleBadge(m.role);
          const isSelf = m.userId === currentUserId;
          const manageable = m.role !== "owner" && isOwnerOrAdmin;
          return (
            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-[9px] font-semibold bg-indigo-100 text-indigo-700">
                      {getInitials(m.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                      {m.userName}
                      {isSelf && <span className="text-[9px] text-slate-400 font-normal">(you)</span>}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5 text-xs text-slate-500 hidden md:table-cell">{m.userEmail}</td>
              <td className="px-4 py-2.5">
                {manageable && !isSelf ? (
                  <Select
                    value={m.role}
                    onValueChange={(newRole) => onRoleChange({ member: m, newRole })}
                  >
                    <SelectTrigger className={cn("h-6 text-[10px] border-slate-200 w-[110px]", badge.color)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.filter(r => r.value !== "owner").map(r => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={cn("text-[10px] px-1.5 py-0 font-medium", badge.color)}>
                    {m.role === "owner" && <Crown className="w-2.5 h-2.5 mr-0.5" />}
                    {badge.label}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                {manageable && !isSelf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
                    onClick={() => onRemove(m)}
                  >
                    <UserMinus className="w-3 h-3" />
                    <span className="hidden md:inline">Remove</span>
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
        {members.length === 0 && (
          <tr>
            <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400 italic">No members yet.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function MobileMemberList({
  members,
  currentUserId,
  isOwnerOrAdmin,
  onRemove,
  onRoleChange,
}: {
  members: Member[];
  currentUserId?: number;
  isOwnerOrAdmin: boolean;
  onRemove: (m: Member) => void;
  onRoleChange: (p: { member: Member; newRole: string }) => void;
}) {
  return (
    <div className="divide-y divide-slate-100">
      {members.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-slate-400 italic">No members yet.</div>
      ) : (
        members.map((m) => {
          const badge = getRoleBadge(m.role);
          const isSelf = m.userId === currentUserId;
          const manageable = m.role !== "owner" && isOwnerOrAdmin;
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {getInitials(m.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  {m.userName}
                  {isSelf && <span className="text-[9px] text-slate-400 font-normal">(you)</span>}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{m.userEmail}</p>
                <Badge className={cn("text-[9px] px-1 py-0 mt-0.5 font-medium", badge.color)}>
                  {m.role === "owner" && <Crown className="w-2 h-2 mr-0.5" />}
                  {badge.label}
                </Badge>
              </div>
              {manageable && !isSelf && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white min-w-[160px]">
                    <div className="px-2 py-1 text-[9px] font-semibold text-slate-400 uppercase">Change Role</div>
                    {ROLE_OPTIONS.filter(r => r.value !== "owner" && r.value !== m.role).map(r => (
                      <DropdownMenuItem
                        key={r.value}
                        className="text-xs gap-2"
                        onClick={() => onRoleChange({ member: m, newRole: r.value })}
                      >
                        <UserCog className="w-3.5 h-3.5 text-slate-400" />
                        {r.label}
                      </DropdownMenuItem>
                    ))}
                    <div className="border-t border-slate-100 my-1" />
                    <DropdownMenuItem
                      className="text-xs gap-2 text-red-600 focus:text-red-700"
                      onClick={() => onRemove(m)}
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
