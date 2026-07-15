import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  User, Mail, Phone, MapPin, Key, Github, Linkedin,
  ShieldCheck, RefreshCw, Eye, EyeOff, ChevronRight,
  ChevronLeft, Bell, Trash2, AlertTriangle, Link2,
  CheckCircle2, XCircle, Globe
} from "lucide-react";

type SettingsTab = "profile" | "security" | "notifications" | "connected" | "danger";

const DESKTOP_TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  { key: "security", label: "Security", icon: <Key className="w-4 h-4" /> },
  { key: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { key: "connected", label: "Connected Accounts", icon: <Link2 className="w-4 h-4" /> },
  { key: "danger", label: "Danger Zone", icon: <Trash2 className="w-4 h-4" /> },
];

export default function UserSettings() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [mobileScreen, setMobileScreen] = useState<SettingsTab | null>(null);

  // Profile form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Security form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [atsAlerts, setAtsAlerts] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Danger zone
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setEmail(user.email || "");
      setPhone((user as any).phone || "+1 (555) 019-2834");
      setLocation((user as any).location || "San Francisco, CA");
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);
    setTimeout(() => {
      setSavingProfile(false);
      setProfileSaved(true);
      toast.success("Profile updated successfully.");
      setTimeout(() => setProfileSaved(false), 3000);
    }, 800);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully.");
    }, 1200);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifs(true);
    setTimeout(() => {
      setSavingNotifs(false);
      toast.success("Notification preferences saved.");
    }, 600);
  };

  const handleDeleteAccount = () => {
    if (deleteEmail !== user?.email) {
      toast.error("Email does not match. Type your account email to confirm.");
      return;
    }
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      toast.success("Account deletion requested. Check your email for confirmation.");
    }, 1500);
  };

  const subContent = (tab: SettingsTab) => {
    switch (tab) {
      case "profile": return (
        <ProfileForm
          fullName={fullName} setFullName={setFullName}
          email={email} setEmail={setEmail}
          phone={phone} setPhone={setPhone}
          location={location} setLocation={setLocation}
          saving={savingProfile} saved={profileSaved}
          onSubmit={handleSaveProfile}
        />
      );
      case "security": return (
        <SecurityForm
          currentPassword={currentPassword} setCurrentPassword={setCurrentPassword}
          newPassword={newPassword} setNewPassword={setNewPassword}
          confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
          showPassword={showPassword} setShowPassword={setShowPassword}
          saving={savingPassword}
          onSubmit={handleChangePassword}
        />
      );
      case "notifications": return (
        <NotificationsForm
          emailNotifs={emailNotifs} setEmailNotifs={setEmailNotifs}
          marketingEmails={marketingEmails} setMarketingEmails={setMarketingEmails}
          atsAlerts={atsAlerts} setAtsAlerts={setAtsAlerts}
          saving={savingNotifs}
          onSubmit={handleSaveNotifications}
        />
      );
      case "connected": return <ConnectedAccounts />;
      case "danger": return (
        <DangerZone
          userEmail={user?.email || ""}
          deleteEmail={deleteEmail} setDeleteEmail={setDeleteEmail}
          deleting={deleting}
          onDelete={handleDeleteAccount}
        />
      );
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Settings</h2>
          <p className="text-[11px] text-slate-500">Manage your account and preferences</p>
        </div>
      </div>

      {isMobile ? (
        <>
          {/* Mobile: stacked categories list */}
          {!mobileScreen ? (
            <Card className="border-slate-200 shadow-sm divide-y divide-slate-100">
              {DESKTOP_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMobileScreen(tab.key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-slate-500">{tab.icon}</span>
                  <span className="flex-1 text-sm font-medium text-slate-800">{tab.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </Card>
          ) : (
            /* Mobile: full-screen sub-screen */
            <div className="space-y-4">
              <button
                onClick={() => setMobileScreen(null)}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800"
              >
                <ChevronLeft className="w-5 h-5" />
                Settings
              </button>
              {subContent(mobileScreen)}
            </div>
          )}
        </>
      ) : (
        /* Desktop: left nav + right content */
        <div className="flex gap-6">
          <div className="w-52 shrink-0 space-y-0.5">
            {DESKTOP_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors",
                  activeTab === tab.key
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <span className={cn(activeTab === tab.key ? "text-indigo-500" : "text-slate-400")}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            {subContent(activeTab)}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileForm({
  fullName, setFullName, email, setEmail, phone, setPhone, location, setLocation,
  saving, saved, onSubmit,
}: {
  fullName: string; setFullName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  saving: boolean; saved: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="px-4 py-3.5 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          Profile
        </CardTitle>
        <CardDescription className="text-[11px]">Your personal details used on resumes.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="pl-8 h-8 text-xs" required />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Email</label>
              <div className="relative">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="pl-8 h-8 text-xs" required />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Phone</label>
              <div className="relative">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="pl-8 h-8 text-xs" />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Location</label>
              <div className="relative">
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" className="pl-8 h-8 text-xs" />
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 py-3 border-t border-slate-100 flex justify-between items-center">
          {saved && <span className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>}
          {!saved && <span />}
          <Button type="submit" disabled={saving} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
            {saving ? <><RefreshCw className="w-3 h-3 animate-spin" /> Saving</> : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SecurityForm({
  currentPassword, setCurrentPassword,
  newPassword, setNewPassword,
  confirmPassword, setConfirmPassword,
  showPassword, setShowPassword,
  saving, onSubmit,
}: {
  currentPassword: string; setCurrentPassword: (v: string) => void;
  newPassword: string; setNewPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="px-4 py-3.5 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Key className="w-4 h-4 text-slate-500" />
          Security
        </CardTitle>
        <CardDescription className="text-[11px]">Update your password and authentication settings.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">Current Password</label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="h-8 text-xs pr-8" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">New Password</label>
              <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" className="h-8 text-xs" required />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Confirm New Password</label>
              <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" className="h-8 text-xs" required />
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 py-3 border-t border-slate-100 flex justify-end">
          <Button type="submit" disabled={saving} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
            {saving ? <><RefreshCw className="w-3 h-3 animate-spin" /> Updating</> : "Change Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function NotificationsForm({
  emailNotifs, setEmailNotifs,
  marketingEmails, setMarketingEmails,
  atsAlerts, setAtsAlerts,
  saving, onSubmit,
}: {
  emailNotifs: boolean; setEmailNotifs: (v: boolean) => void;
  marketingEmails: boolean; setMarketingEmails: (v: boolean) => void;
  atsAlerts: boolean; setAtsAlerts: (v: boolean) => void;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="px-4 py-3.5 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-500" />
          Notifications
        </CardTitle>
        <CardDescription className="text-[11px]">Control what notifications you receive.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="p-4 space-y-4">
          <ToggleRow label="Email Notifications" desc="Receive email when your resume is viewed" checked={emailNotifs} onChange={setEmailNotifs} />
          <ToggleRow label="ATS Score Alerts" desc="Get notified when your ATS score changes" checked={atsAlerts} onChange={setAtsAlerts} />
          <ToggleRow label="Marketing Emails" desc="Tips, product updates, and offers" checked={marketingEmails} onChange={setMarketingEmails} />
        </CardContent>
        <CardFooter className="px-4 py-3 border-t border-slate-100 flex justify-end">
          <Button type="submit" disabled={saving} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
            {saving ? <><RefreshCw className="w-3 h-3 animate-spin" /> Saving</> : "Save Preferences"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-slate-800">{label}</p>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ConnectedAccounts() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="px-4 py-3.5 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-slate-500" />
          Connected Accounts
        </CardTitle>
        <CardDescription className="text-[11px]">Link external services to your account.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Linkedin className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">LinkedIn</p>
              <p className="text-[10px] text-slate-500">Auto-import experience and education</p>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0">Connected</Badge>
        </div>
        <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Github className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">GitHub</p>
              <p className="text-[10px] text-slate-500">Showcase repositories and contributions</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px] border-slate-300 text-slate-600">Connect</Button>
        </div>
        <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Globe className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Google</p>
              <p className="text-[10px] text-slate-500">Sign in and calendar sync</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px] border-slate-300 text-slate-600">Connect</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DangerZone({
  userEmail, deleteEmail, setDeleteEmail, deleting, onDelete,
}: {
  userEmail: string;
  deleteEmail: string; setDeleteEmail: (v: string) => void;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <Card className="border-red-200 shadow-sm ring-1 ring-red-100">
      <CardHeader className="px-4 py-3.5 border-b border-red-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-red-800">Danger Zone</CardTitle>
            <CardDescription className="text-[11px] text-red-600/70">Irreversible account deletion</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-slate-600 leading-relaxed">
          Deleting your account will permanently remove all your resumes, job descriptions,
          and account data. This action cannot be undone.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-red-800 mb-2">
            Type <strong>{userEmail}</strong> to confirm deletion:
          </p>
          <Input
            value={deleteEmail}
            onChange={(e) => setDeleteEmail(e.target.value)}
            placeholder={userEmail}
            className="h-8 text-xs bg-white border-red-200 focus:border-red-400"
          />
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 border-t border-red-100">
        <Button
          onClick={onDelete}
          disabled={deleting || deleteEmail !== userEmail}
          className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white gap-1.5 disabled:opacity-50"
        >
          {deleting ? <><RefreshCw className="w-3 h-3 animate-spin" /> Deleting</> : "Delete Account"}
        </Button>
      </CardFooter>
    </Card>
  );
}
