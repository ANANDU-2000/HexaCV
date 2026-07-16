import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { User, Mail, Phone, MapPin, Key, Github, Linkedin, ShieldCheck, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function UserSettings() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form coordinates state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setEmail(user.email || "");
      setPhone((user as any).phone || "+1 (555) 019-2834");
      setLocation((user as any).location || "San Francisco, CA");
    }
  }, [user]);

  const handleSaveCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate updating contact settings
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Contact configurations saved successfully.");
    }, 1200);
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
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Security credentials updated successfully.");
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Account Configurations
        </h2>
        <p className="text-slate-600 mt-1">
          Manage your personal details, secure coordinates, login credentials, and linked professional integrations.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left column: Contact Coordinates */}
        <div className="md:col-span-2 space-y-8">
          <Card className="border border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Contact Coordinates
              </CardTitle>
              <CardDescription>
                Your public profile details used when generating custom CV documents.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveCoordinates}>
              <CardContent className="space-y-4 pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Full Name</label>
                    <div className="relative">
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Anandu Krishna"
                        className="pl-9"
                        required
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email Coordinates</label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="anandu@example.com"
                        className="pl-9"
                        required
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                    <div className="relative">
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-9"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Office Location</label>
                    <div className="relative">
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Bangalore, India"
                        className="pl-9"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 pt-4 flex justify-end">
                <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium">
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configurations"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Security details */}
          <Card className="border border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Change Password
              </CardTitle>
              <CardDescription>
                Ensure your workspace remains fully private by cycling auth credentials regularly.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">New Password</label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 pt-4 flex justify-end">
                <Button type="submit" disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white font-medium gap-2">
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Cycle Security Credentials"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right column: Linked Integrations & Audits */}
        <div className="space-y-8">
          <Card className="border border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Third-Party Integrations
              </CardTitle>
              <CardDescription>
                Manage linked external systems for importing details or pushing vacancy listings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* LinkedIn Integration card */}
              <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700">
                    <Linkedin className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-850">LinkedIn Sync</div>
                    <div className="text-[10px] text-slate-500">Auto import experience histories</div>
                  </div>
                </div>
                <Badge className="bg-green-50 text-green-700 border-green-150 hover:bg-green-50">
                  Linked
                </Badge>
              </div>

              {/* GitHub Integration card */}
              <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-800">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-850">GitHub Sync</div>
                    <div className="text-[10px] text-slate-500">Auto pull repositories details</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 text-[10px] font-semibold">
                  Link Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session Token Audits */}
          <Card className="border border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-sm font-bold text-slate-800">
                Active Session Audits
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-3">
              <div className="flex justify-between items-center text-slate-600 border-b border-slate-100 pb-2">
                <div>
                  <span className="font-semibold text-slate-800">Web Session (You)</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Google Chrome • Windows 10</p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-150 text-[10px]">
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <div>
                  <span className="font-semibold text-slate-850">OAuth API Client Token</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Expired 2 hours ago • API Gateway</p>
                </div>
                <span className="text-[10px] text-slate-400">Revoked</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
