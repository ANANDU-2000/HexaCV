import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chrome, Github, Linkedin, Mail, ArrowRight, ArrowLeft, Shield, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useResumeStorage } from "@/_core/hooks/useResumeStorage";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Login() {
  const { isAuthenticated, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const storage = useResumeStorage();
  const convertGuestMutation = trpc.auth.convertGuest.useMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const params = new URLSearchParams(window.location.search);
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
    const name = provider.charAt(0).toUpperCase() + provider.slice(1) + " Candidate";
    const userEmail = `${provider}.candidate@gmail.com`;
    const finalRedirect = convertParam ? `${redirectParam}?convert=true` : redirectParam;
    
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
    const finalRedirect = convertParam ? `${redirectParam}?convert=true` : redirectParam;
    
    window.location.href = `/api/mock/login?provider=email&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(finalRedirect)}`;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Decorative Background Shapes */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-100/60 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[5%] w-[20%] h-[20%] bg-emerald-100/40 rounded-full blur-[80px] pointer-events-none" />

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
              <Shield className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              {convertParam ? "Secure Your Guest Resume" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm mt-2">
              {convertParam 
                ? "Sign in or create an account to back up your guest work to the cloud."
                : "Sign in to sync resumes, access AI tools, and manage your career profile."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-6">
            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold text-slate-600">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus-visible:ring-blue-500 h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs font-semibold text-slate-600">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus-visible:ring-blue-500 h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition">
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-11 flex items-center justify-center gap-2 transition duration-200 font-semibold shadow-md shadow-blue-200/40">
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-medium uppercase tracking-widest">Or continue with</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleMockLogin("google")}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-10 transition duration-200 shadow-sm"
              >
                <Chrome className="w-4 h-4 mr-2 text-red-500" />
                Google
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleMockLogin("github")}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-10 transition duration-200 shadow-sm"
              >
                <Github className="w-4 h-4 mr-2 text-slate-800" />
                GitHub
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleMockLogin("linkedin")}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-10 transition duration-200 shadow-sm"
              >
                <Linkedin className="w-4 h-4 mr-2 text-blue-600 fill-current" />
                LinkedIn
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 bg-slate-50/50 border-t border-slate-100 px-6 py-5 text-center">
            {/* Registration CTA */}
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition">
                  Create Free Account
                </span>
              </Link>
            </p>

            {/* Guest Mode Link */}
            <Link href={redirectParam}>
              <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer transition flex items-center justify-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Continue as Guest (No account needed)
              </span>
            </Link>

            <p className="text-[10px] text-slate-400 leading-normal max-w-[280px] mx-auto">
              By continuing, you agree to HexaCv's Terms of Service and Privacy Policy. Secured by HexaStack Solutions.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
