import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Users, Shield, Plus, Building, Globe, Paintbrush, Link2, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";

export default function OrganizationPortal() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("collaborator");
  
  // Org Creation states
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  const listOrgsQuery = trpc.organization.list.useQuery();
  const createOrgMutation = trpc.organization.create.useMutation();
  const updateOrgMutation = trpc.organization.update.useMutation();
  const getMembersQuery = trpc.organization.members.useQuery(
    { orgId: selectedOrgId },
    { enabled: !!selectedOrgId }
  );
  const inviteMutation = trpc.organization.invite.useMutation();
  const removeMemberMutation = trpc.organization.removeMember.useMutation();

  // White-label settings states
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1e40af");
  const [secondaryColor, setSecondaryColor] = useState("#0d9488");
  const [customDomain, setCustomDomain] = useState("");

  const currentOrg = listOrgsQuery.data?.find(o => o?.id === selectedOrgId);

  useEffect(() => {
    if (listOrgsQuery.data && listOrgsQuery.data.length > 0 && !selectedOrgId) {
      setSelectedOrgId(listOrgsQuery.data[0]?.id || "");
    }
  }, [listOrgsQuery.data]);

  useEffect(() => {
    if (currentOrg) {
      setLogoUrl(currentOrg.logoUrl || "");
      setPrimaryColor(currentOrg.primaryColor || "#1e40af");
      setSecondaryColor(currentOrg.secondaryColor || "#0d9488");
      setCustomDomain(currentOrg.customDomain || "");
    }
  }, [currentOrg]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgSlug.trim()) {
      toast.error("Please provide a name and url slug");
      return;
    }
    try {
      const org = await createOrgMutation.mutateAsync({
        name: orgName,
        slug: orgSlug.toLowerCase().replace(/\s+/g, "-"),
      });
      toast.success(`Organization workspace "${orgName}" created!`);
      listOrgsQuery.refetch();
      setSelectedOrgId(org.id);
      setOrgName("");
      setOrgSlug("");
    } catch (e: any) {
      toast.error("Failed to create workspace: " + e.message);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await inviteMutation.mutateAsync({
        orgId: selectedOrgId,
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${inviteEmail}!`);
      getMembersQuery.refetch();
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to invite member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMemberMutation.mutateAsync({
        orgId: selectedOrgId,
        memberId,
      });
      toast.success("Team member removed");
      getMembersQuery.refetch();
    } catch (e) {
      toast.error("Could not remove team member");
    }
  };

  const handleSaveBranding = async () => {
    try {
      await updateOrgMutation.mutateAsync({
        id: selectedOrgId,
        logoUrl,
        primaryColor,
        secondaryColor,
        customDomain,
      });
      toast.success("Organization branding settings updated!");
      listOrgsQuery.refetch();
    } catch (e) {
      toast.error("Failed to save branding specifications");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Organization Settings & White Label
        </h2>
        <p className="text-slate-600 mt-1">
          Configure collaborative workspaces, custom subdomains, logo settings, and corporate brand palettes.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Org selector or Creator */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Select Workspace
              </CardTitle>
              <CardDescription>Switch between your organizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="No organization found" />
                </SelectTrigger>
                <SelectContent>
                  {listOrgsQuery.data?.map((org: any) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} ({org.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                New Organization
              </CardTitle>
              <CardDescription>Setup team-wide billing and collaborative CV templates</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Company / Team Name</label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Subdomain URL Slug</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">
                      hexacv.com/
                    </span>
                    <Input
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      placeholder="acme-group"
                      className="pl-[94px]"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600 text-white">
                  Create Workspace
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Member Directory and Invite */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrgId ? (
            <div className="space-y-6">
              {/* Member list */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
                  <div>
                    <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-slate-600" />
                      Workspace Members
                    </CardTitle>
                    <CardDescription>Manage user roles and recruiters</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Invite field */}
                  <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-end gap-3 bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <div className="space-y-1 flex-1">
                      <label className="text-xs font-semibold text-slate-600">Invite User (Email)</label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="collaborator@example.com"
                        className="bg-white border-slate-200"
                        required
                      />
                    </div>
                    <div className="space-y-1 w-full sm:w-40">
                      <label className="text-xs font-semibold text-slate-600">Workspace Role</label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recruiter">Recruiter / Hiring Manager</SelectItem>
                          <SelectItem value="collaborator">Editor / Collaborator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="bg-slate-900 text-white gap-2 shrink-0">
                      <Mail className="w-4 h-4" />
                      Add Member
                    </Button>
                  </form>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getMembersQuery.data?.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-semibold text-slate-800">{m.userName}</TableCell>
                          <TableCell className="text-slate-600">{m.userEmail}</TableCell>
                          <TableCell>
                            <Badge className={
                              m.role === "owner" ? "bg-red-50 text-red-800 border-red-200" :
                              m.role === "recruiter" ? "bg-amber-50 text-amber-800 border-amber-200" :
                              "bg-slate-100 text-slate-800"
                            }>
                              {m.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {m.role !== "owner" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* White Label Settings */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <Paintbrush className="w-5 h-5 text-indigo-600" />
                    White Label Branding Settings
                  </CardTitle>
                  <CardDescription>Inject corporate styling, logo overrides, and custom domains</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-slate-400" />
                        Branded Logo URL
                      </label>
                      <Input
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://acme.com/assets/logo.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        Custom Domain Settings
                      </label>
                      <Input
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="careers.acme.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Primary Color Theme</label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-10 p-1 border rounded-lg cursor-pointer"
                        />
                        <span className="text-sm text-slate-600 font-mono">{primaryColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Secondary Accent Color</label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-12 h-10 p-1 border rounded-lg cursor-pointer"
                        />
                        <span className="text-sm text-slate-600 font-mono">{secondaryColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Brand Preview Box */}
                  <div className="bg-slate-50 border border-dashed rounded-xl p-6">
                    <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">Live Logo & Theme Preview</h4>
                    <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Brand Logo" className="h-8 max-w-[120px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <div className="h-8 w-8 rounded bg-slate-200 flex items-center justify-center font-bold text-slate-600">B</div>
                      )}
                      <div>
                        <div className="text-sm font-bold" style={{ color: primaryColor }}>{currentOrg?.name} Resume Builder</div>
                        <div className="text-xs text-slate-500">Custom Workspace portal enabled</div>
                      </div>
                      <Badge className="ml-auto text-[10px]" style={{ backgroundColor: secondaryColor }}>Active Brand</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-slate-100 pt-4">
                  <Button onClick={handleSaveBranding} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    Save Branding Settings
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl h-80 flex flex-col items-center justify-center text-center p-8">
              <Users className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Select or Create an Organization</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                You need to select a workspace from the left pane (or create a new one) to invite team members and configure white-label sub-domains.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
