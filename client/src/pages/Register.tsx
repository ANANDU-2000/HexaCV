import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chrome, Github, Linkedin, Mail, ArrowRight, ArrowLeft, UserPlus, Lock, Eye, EyeOff, User, Check, X, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
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

  if (score <= 1) return { score, label: "Weak", color: "text-red-500", bgColor: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "text-orange-500", bgColor: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "text-yellow-500", bgColor: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "text-emerald-500", bgColor: "bg-emerald-500" };
  return { score, label: "Very Strong", color: "text-blue-600", bgColor: "bg-blue-600" };
}

export default function Register() {
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const redirectParam = params.get("redirect") || "/builder";

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const passwordChecks = useMemo(() => [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const isFormValid = fullName.trim() && email.trim() && password.length >= 8 && passwordsMatch && agreedToTerms;

  const handleMockRegister = (provider: string) => {
    const name = provider.charAt(0).toUpperCase() + provider.slice(1) + " Candidate";
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

    // For local dev, simulate a registration via mock login
    const isOwner = email.includes("admin");
    const name = isOwner ? "Surag (Admin)" : fullName;
    window.location.href = `/api/mock/login?provider=email&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectParam)}`;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative overflow-hidden font-sans py-8">
      {/* Decorative Background Shapes */}
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-blue-100/60 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[30%] left-[5%] w-[20%] h-[20%] bg-emerald-100/40 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md p-4 relative z-10">
        {/* Back to Landing */}
        <Link href="/">
          <Button variant="ghost" className="text-slate-500 hover:text-slate-900 mb-4 gap-2 hover:bg-white/60 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Landing
          </Button>
        </Link>

        <Card className="border border-slate-200 bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200/50">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm mt-2">
              Start building professional resumes with AI-powered tools, cloud sync, and more.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-6">
            <form onSubmit={handleEmailRegister} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="register-name" className="text-xs font-semibold text-slate-600">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus-visible:ring-blue-500 h-10"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="register-email" className="text-xs font-semibold text-slate-600">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus-visible:ring-blue-500 h-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="register-password" className="text-xs font-semibold text-slate-600">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus-visible:ring-blue-500 h-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              i <= passwordStrength.score ? passwordStrength.bgColor : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {passwordChecks.map((check) => (
                        <div key={check.label} className="flex items-center gap-1.5">
                          {check.met ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <X className="w-3 h-3 text-slate-300" />
                          )}
                          <span className={`text-[10px] ${check.met ? "text-emerald-600" : "text-slate-400"}`}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="register-confirm-password" className="text-xs font-semibold text-slate-600">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 pr-10 bg-slate-50 text-slate-900 placeholder-slate-400 focus-visible:ring-blue-500 h-10 ${
                      passwordsMismatch ? "border-red-300 focus-visible:ring-red-400" : "border-slate-200"
                    } ${passwordsMatch ? "border-emerald-300 focus-visible:ring-emerald-400" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <X className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                  I agree to HexaCv's{" "}
                  <span className="text-blue-600 hover:underline font-medium">Terms of Service</span> and{" "}
                  <span className="text-blue-600 hover:underline font-medium">Privacy Policy</span>
                </label>
              </div>

              <Button 
                type="submit" 
                disabled={!isFormValid}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-lg h-11 flex items-center justify-center gap-2 transition duration-200 font-semibold shadow-md shadow-blue-200/40 disabled:shadow-none"
              >
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-medium uppercase tracking-widest">Or sign up with</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Social Sign-ups */}
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleMockRegister("google")}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-10 transition duration-200 shadow-sm"
              >
                <Chrome className="w-4 h-4 mr-2 text-red-500" />
                Google
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleMockRegister("github")}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-10 transition duration-200 shadow-sm"
              >
                <Github className="w-4 h-4 mr-2 text-slate-800" />
                GitHub
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleMockRegister("linkedin")}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-10 transition duration-200 shadow-sm"
              >
                <Linkedin className="w-4 h-4 mr-2 text-blue-600 fill-current" />
                LinkedIn
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 bg-slate-50/50 border-t border-slate-100 px-6 py-5 text-center">
            {/* Login CTA */}
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition">
                  Sign In
                </span>
              </Link>
            </p>

            {/* Guest Mode */}
            <Link href={redirectParam}>
              <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer transition flex items-center justify-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Continue as Guest (No account needed)
              </span>
            </Link>

            <p className="text-[10px] text-slate-400 leading-normal max-w-[280px] mx-auto">
              Secured by HexaStack Solutions. Your data is protected with enterprise-grade encryption.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
