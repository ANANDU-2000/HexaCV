import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Chrome,
  Github,
  Info,
  Layers,
  Linkedin,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "text-destructive", bgColor: "bg-destructive" };
  if (score <= 2) return { score, label: "Fair", color: "text-warning", bgColor: "bg-warning" };
  if (score <= 3) return { score, label: "Good", color: "text-yellow-500", bgColor: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "text-success", bgColor: "bg-success" };
  return { score, label: "Very Strong", color: "text-primary", bgColor: "bg-primary" };
}

export default function Register() {
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const redirectParam = params.get("redirect") || "/builder";

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const passwordChecks = useMemo(
    () => [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(password) },
      { label: "One lowercase letter", met: /[a-z]/.test(password) },
      { label: "One number", met: /[0-9]/.test(password) },
      { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const isFormValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    passwordsMatch &&
    agreedToTerms;

  const handleMockRegister = (provider: string) => {
    const base =
      provider === "google" ? "Google" : provider === "github" ? "GitHub" : "LinkedIn";
    const name = `${base} Candidate`;
    const userEmail = `${provider}.candidate@gmail.com`;
    window.location.href = `/api/mock/login?provider=${provider}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(userEmail)}&redirect=${encodeURIComponent(redirectParam)}`;
  };

  const handleEmailRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service.");
      return;
    }

    const isOwner = email.includes("admin");
    const name = isOwner ? "Surag (Admin)" : fullName;
    window.location.href = `/api/mock/login?provider=email&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectParam)}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ===== DESKTOP ===== */}
      <div className="hidden md:flex min-h-screen items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#0566d9]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[420px] p-4 relative z-10">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[#1e40af] flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <h1 className="text-xl font-bold text-foreground">Create your account</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Start building professional resumes with AI-powered tools.
              </p>
            </div>

            <form onSubmit={handleEmailRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium text-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-lowest border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                  />
                </div>
              </div>

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
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-lowest border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                  />
                </div>

                {password.length > 0 && (
                  <>
                    {/* Strength bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex-1 rounded-full transition-colors duration-300",
                              i <= passwordStrength.score
                                ? passwordStrength.bgColor
                                : "bg-border"
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn("text-xs font-medium", passwordStrength.color)}>
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Checklist */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      {passwordChecks.map((check) => (
                        <div key={check.label} className="flex items-center gap-1.5">
                          {check.met ? (
                            <Check className="w-3 h-3 text-success" strokeWidth={2} />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-border" />
                          )}
                          <span
                            className={cn(
                              "text-[10px]",
                              check.met ? "text-success" : "text-muted-foreground"
                            )}
                          >
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-xs font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "w-full h-10 pl-10 pr-3 rounded-lg bg-surface-lowest border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-1 transition-colors",
                      passwordsMismatch
                        ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                        : passwordsMatch
                        ? "border-success focus:border-success focus:ring-success/30"
                        : "border-border focus:border-ring focus:ring-ring"
                    )}
                  />
                </div>
                {passwordsMismatch && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-success mt-1">Passwords match</p>
                )}
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(v) => setAgreedToTerms(v === true)}
                  className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to HexaCv's{" "}
                  <span className="text-primary hover:underline font-medium">Terms of Service</span> and{" "}
                  <span className="text-primary hover:underline font-medium">Privacy Policy</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={!isFormValid}
                className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-xl"
              >
                Create Account
                <ArrowRight className="w-4 h-4 ml-1.5" strokeWidth={1.5} />
              </Button>
            </form>

            <div className="relative flex py-4 items-center mt-4">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink mx-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                or sign up with
              </span>
              <div className="flex-grow border-t border-border" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Chrome, label: "Google", provider: "google", color: "" },
                { icon: Github, label: "GitHub", provider: "github", color: "" },
                { icon: Linkedin, label: "LinkedIn", provider: "linkedin", color: "text-[#0A66C2]" },
              ].map((item) => (
                <Button
                  key={item.provider}
                  variant="outline"
                  onClick={() => handleMockRegister(item.provider)}
                  className="h-10 border-border bg-transparent hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
                >
                  <item.icon className={cn("w-4 h-4 mr-2", item.color)} strokeWidth={1.5} />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              ))}
            </div>

            <div className="mt-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign In
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

        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32">
          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Start building with AI-powered tools.
          </p>

          <form onSubmit={handleEmailRegister} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="mobile-name" className="text-xs font-medium text-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  id="mobile-name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-lowest border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>
            </div>

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
              <div className="flex items-center justify-between">
                <label htmlFor="mobile-password" className="text-xs font-medium text-foreground">
                  Password
                </label>

                {/* Info icon with tooltip for requirements checklist on mobile */}
                {password.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="bg-surface-elevated border border-border p-3 rounded-lg shadow-lg max-w-[220px]">
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-foreground mb-1">Password requirements</p>
                          {passwordChecks.map((check) => (
                            <div key={check.label} className="flex items-center gap-1.5">
                              {check.met ? (
                                <Check className="w-3 h-3 text-success shrink-0" strokeWidth={2} />
                              ) : (
                                <div className="w-3 h-3 shrink-0 rounded-full border border-border" />
                              )}
                              <span className={cn("text-[10px]", check.met ? "text-success" : "text-muted-foreground")}>
                                {check.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  id="mobile-password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-lowest border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>

              {/* Mobile: slim horizontal bar + label */}
              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 rounded-full transition-colors duration-300",
                          i <= passwordStrength.score
                            ? passwordStrength.bgColor
                            : "bg-border"
                        )}
                      />
                    ))}
                  </div>
                  <span className={cn("text-[10px] font-medium shrink-0", passwordStrength.color)}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mobile-confirm" className="text-xs font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  id="mobile-confirm"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full h-11 pl-10 pr-3 rounded-lg bg-surface-lowest border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-1 transition-colors",
                    passwordsMismatch
                      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                      : passwordsMatch
                      ? "border-success focus:border-success focus:ring-success/30"
                      : "border-border focus:border-ring focus:ring-ring"
                  )}
                />
              </div>
              {passwordsMismatch && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-success mt-1">Passwords match</p>
              )}
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="mobile-terms"
                checked={agreedToTerms}
                onCheckedChange={(v) => setAgreedToTerms(v === true)}
                className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label htmlFor="mobile-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                I agree to the{" "}
                <span className="text-primary hover:underline font-medium">Terms</span> and{" "}
                <span className="text-primary hover:underline font-medium">Privacy Policy</span>
              </label>
            </div>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink mx-3 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                or sign up with
              </span>
              <div className="flex-grow border-t border-border" />
            </div>

            {/* OAuth stacked on mobile */}
            <div className="flex flex-col gap-3">
              {[
                { icon: Chrome, label: "Google", provider: "google", color: "" },
                { icon: Github, label: "GitHub", provider: "github", color: "" },
                { icon: Linkedin, label: "LinkedIn", provider: "linkedin", color: "text-[#0A66C2]" },
              ].map((item) => (
                <Button
                  key={item.provider}
                  variant="outline"
                  onClick={() => handleMockRegister(item.provider)}
                  className="h-11 border-border bg-transparent hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
                >
                  <item.icon className={cn("w-4 h-4 mr-2", item.color)} strokeWidth={1.5} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground pt-2">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign In
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
            disabled={!isFormValid}
            onClick={(e) => {
              e.preventDefault();
              handleEmailRegister(e as any);
            }}
            className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-xl"
          >
            Create Account
            <ArrowRight className="w-4 h-4 ml-1.5" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
