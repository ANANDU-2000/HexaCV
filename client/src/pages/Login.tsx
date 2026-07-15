import { useAuth } from "@/_core/hooks/useAuth";
import { useResumeStorage } from "@/_core/hooks/useResumeStorage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  Chrome,
  Github,
  Layers,
  Linkedin,
  Lock,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Login() {
  const { isAuthenticated, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const storage = useResumeStorage();
  const convertGuestMutation = trpc.auth.convertGuest.useMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const convertParam = params.get("convert") === "true";
  const redirectParam = params.get("redirect") || "/builder";

  useEffect(() => {
    if (isAuthenticated) {
      handlePostLoginFlow();
    }
  }, [isAuthenticated]);

  const handlePostLoginFlow = async () => {
    if (convertParam) {
      const guestSessionId = localStorage.getItem("guest_session_id");
      if (guestSessionId) {
        toast.info("Migrating your guest data to your account...");
        try {
          await convertGuestMutation.mutateAsync({ guestSessionId });
          await storage.syncGuestDataToCloud();
          toast.success("Guest data successfully saved to your cloud account!");
        } catch (e) {
          console.error("Failed to convert guest session:", e);
        }
      }
    }
    setLocation(redirectParam);
  };

  const handleMockLogin = (provider: string) => {
    const base = provider === "google" ? "Google" : provider === "github" ? "GitHub" : "LinkedIn";
    const name = `${base} Candidate`;
    const userEmail = `${provider}.candidate@gmail.com`;
    const finalRedirect = convertParam
      ? `${redirectParam}?convert=true`
      : redirectParam;

    window.location.href = `/api/mock/login?provider=${provider}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(userEmail)}&redirect=${encodeURIComponent(finalRedirect)}`;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    const isOwner = email.includes("admin");
    const name = isOwner ? "Surag (Admin)" : "Email Candidate";
    const finalRedirect = convertParam
      ? `${redirectParam}?convert=true`
      : redirectParam;

    window.location.href = `/api/mock/login?provider=email&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(finalRedirect)}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Desktop: brand glow behind card */}
      <div className="hidden md:flex min-h-screen items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#0566d9]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[420px] p-4 relative z-10">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            {/* Logo */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[#1e40af] flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                {convertParam ? "Secure Your Guest Resume" : "Welcome back"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {convertParam
                  ? "Sign in to save your guest progress to the cloud."
                  : "Sign in to sync your resumes and continue building."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-lowest border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-lowest border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
              >
                Sign In
                <ArrowRight className="w-4 h-4 ml-1.5" strokeWidth={1.5} />
              </Button>
            </form>

            {/* Divider */}
            <div className="relative flex py-4 items-center mt-4">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink mx-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                or continue with
              </span>
              <div className="flex-grow border-t border-border" />
            </div>

            {/* OAuth */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Chrome, label: "Google", provider: "google", color: "" },
                { icon: Github, label: "GitHub", provider: "github", color: "" },
                { icon: Linkedin, label: "LinkedIn", provider: "linkedin", color: "text-[#0A66C2]" },
              ].map((item) => (
                <Button
                  key={item.provider}
                  variant="outline"
                  onClick={() => handleMockLogin(item.provider)}
                  className="h-10 border-border bg-transparent hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
                >
                  <item.icon className={cn("w-4 h-4 mr-2", item.color)} strokeWidth={1.5} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Create one
                </Link>
              </p>
              <Link
                href={redirectParam}
                className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue as Guest (No account needed)
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE ===== */}
      <div className="md:hidden min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={1.5} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[#1e40af] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <span className="font-semibold text-sm text-foreground">HexaCv</span>
          </div>
          <div className="w-5" />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {convertParam ? "Secure Your Guest Resume" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {convertParam
              ? "Sign in to save your guest progress."
              : "Sign in to sync your resumes."}
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="mobile-email" className="text-xs font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  id="mobile-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-lowest border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mobile-password" className="text-xs font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  id="mobile-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-lowest border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>
              <div className="flex justify-end">
                <button type="button" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="mobile-remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label htmlFor="mobile-remember" className="text-xs text-muted-foreground cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink mx-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                or continue with
              </span>
              <div className="flex-grow border-t border-border" />
            </div>

            {/* OAuth — stacked on mobile */}
            <div className="flex flex-col gap-3">
              {[
                { icon: Chrome, label: "Google", provider: "google", color: "" },
                { icon: Github, label: "GitHub", provider: "github", color: "" },
                { icon: Linkedin, label: "LinkedIn", provider: "linkedin", color: "text-[#0A66C2]" },
              ].map((item) => (
                <Button
                  key={item.provider}
                  variant="outline"
                  onClick={() => handleMockLogin(item.provider)}
                  className="h-11 border-border bg-transparent hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
                >
                  <item.icon className={cn("w-4 h-4 mr-2", item.color)} strokeWidth={1.5} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Create one
              </Link>
            </p>

            <Link
              href={redirectParam}
              className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue as Guest
            </Link>
          </form>
        </div>

        {/* Sticky submit button */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 pb-[env(safe-area-inset-bottom)]">
          <Button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              handleEmailSubmit(e as any);
            }}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
          >
            Sign In
            <ArrowRight className="w-4 h-4 ml-1.5" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
