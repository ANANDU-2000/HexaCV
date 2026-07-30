import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chrome, Layers, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useResumeStorage } from "@/_core/hooks/useResumeStorage";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { loginLocalUser, registerLocalUser } from "@/lib/localStorageDb";
import { canUseOAuthPortal, getLoginUrl, isLocalDevHost } from "@/const";

const T = {
  bg: '#0b1326',
  surface: '#171f33',
  elevated: '#222a3d',
  primary: '#1e40af',
  primaryText: '#b8c4ff',
  accent: '#ea580c',
  text: '#dae2fd',
  muted: '#c4c5d5',
  border: '#444653',
  success: '#16a34a',
  radius: 8,
};

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
  const redirectParam = params.get("redirect") || "/";
  const allowDevMock = isLocalDevHost();

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

  const handleOAuthContinue = () => {
    if (canUseOAuthPortal() && !allowDevMock) {
      window.location.href = getLoginUrl("signIn");
      return;
    }
    if (canUseOAuthPortal() && allowDevMock) {
      // Prefer real portal even on localhost when configured
      window.location.href = getLoginUrl("signIn");
      return;
    }
    if (allowDevMock) {
      handleDevMockLogin("google");
      return;
    }
    toast.error("Sign-in is not configured yet. Continue as guest, or try again later.");
  };

  const handleDevMockLogin = (provider: string) => {
    const name = provider.charAt(0).toUpperCase() + provider.slice(1) + " Candidate";
    const userEmail = `${provider}.candidate@gmail.com`;
    registerLocalUser(name, userEmail);
    const finalRedirect = convertParam ? `${redirectParam}?convert=true` : redirectParam;
    toast.message("Dev mock login — not a real Google account");
    window.location.href = `/api/mock/login?provider=${provider}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(userEmail)}&redirect=${encodeURIComponent(finalRedirect)}`;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!allowDevMock && !canUseOAuthPortal()) {
      toast.error("Email login is available in local development only until OAuth is configured.");
      return;
    }

    const res = loginLocalUser(email, password);
    if (!res.success) {
      toast.error(res.message || "Invalid credentials.");
      return;
    }

    const loggedUser = res.user!;
    toast.success(`Welcome back, ${loggedUser.name}!`);

    const isOwner = loggedUser.role === "admin";
    const targetRedirect = isOwner ? "/admin" : (convertParam ? `${redirectParam}?convert=true` : redirectParam);
    window.location.href = `/api/mock/login?provider=email&name=${encodeURIComponent(loggedUser.name)}&email=${encodeURIComponent(loggedUser.email)}&password=${encodeURIComponent(password)}&redirect=${encodeURIComponent(targetRedirect)}`;
  };

  const form = (
    <div style={{ width: '100%', maxWidth: 400 }}>
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <Layers style={{ color: T.primaryText }} className="w-7 h-7" />
        <span className="text-xl font-bold" style={{ color: T.text }}>HexaCv</span>
      </div>

      <h1 className="text-2xl font-bold text-center mb-8" style={{ color: T.text }}>
        {convertParam ? 'Secure Your Guest Resume' : 'Welcome back'}
      </h1>

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" style={{ color: T.muted, fontSize: 13, fontWeight: 600 }}>Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3.5" style={{ top: 16, color: T.muted, width: 16, height: 16 }} />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', height: 48, borderRadius: T.radius, paddingLeft: 40,
                backgroundColor: T.surface, border: `1px solid ${T.border}`,
                color: T.text, fontSize: 14, outline: 'none',
              }}
              className="focus:outline-none focus-visible:ring-2"
              onFocus={e => e.currentTarget.style.borderColor = T.primaryText}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" style={{ color: T.muted, fontSize: 13, fontWeight: 600 }}>Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5" style={{ top: 16, color: T.muted, width: 16, height: 16 }} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', height: 48, borderRadius: T.radius, paddingLeft: 40, paddingRight: 40,
                backgroundColor: T.surface, border: `1px solid ${T.border}`,
                color: T.text, fontSize: 14, outline: 'none',
              }}
              className="focus:outline-none focus-visible:ring-2"
              onFocus={e => e.currentTarget.style.borderColor = T.primaryText}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 12, top: 16, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <button type="button" style={{ color: T.primaryText, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}
              className="hover:underline font-medium">
              Forgot password?
            </button>
          </div>
        </div>

        <Button type="submit" style={{
          width: '100%', height: 48, borderRadius: T.radius,
          backgroundColor: T.accent, color: '#fff', fontSize: 15, fontWeight: 600,
          border: 'none', cursor: 'pointer', marginTop: 4,
        }} className="hover:opacity-90 transition-opacity">
          Log In
        </Button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div style={{ flex: 1, height: 1, backgroundColor: T.border }} />
        <span style={{ color: T.muted, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>or continue with</span>
        <div style={{ flex: 1, height: 1, backgroundColor: T.border }} />
      </div>

      <Button variant="outline" onClick={handleOAuthContinue} style={{
        width: '100%', height: 48, borderRadius: T.radius,
        backgroundColor: 'transparent', border: `1px solid ${T.border}`,
        color: T.text, fontSize: 14, fontWeight: 500, gap: 8, cursor: 'pointer',
      }} className="hover:opacity-80 transition-opacity">
        <Chrome className="w-4 h-4" />{" "}
        {canUseOAuthPortal()
          ? "Continue with HexaCv account"
          : allowDevMock
            ? "Continue with Google (dev mock)"
            : "Continue with HexaCv account"}
      </Button>
      {allowDevMock && !canUseOAuthPortal() && (
        <p className="text-center mt-2" style={{ color: T.muted, fontSize: 11 }}>
          Local only — invents a test user. Not real Google.
        </p>
      )}

      <p className="text-center mt-8" style={{ color: T.muted, fontSize: 13 }}>
        Don't have an account?{' '}
        <Link href="/register">
          <span style={{ color: T.primaryText, fontWeight: 600, cursor: 'pointer' }} className="hover:underline">Sign up</span>
        </Link>
      </p>

      <div className="text-center mt-4">
        <Link href={redirectParam}>
          <span style={{ color: T.muted, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            className="hover:opacity-80 transition-opacity">
            <Sparkles className="w-3 h-3" /> Continue as Guest
          </span>
        </Link>
      </div>

      <p className="text-center mt-6" style={{ color: T.border, fontSize: 10, lineHeight: 1.4 }}>
        By continuing, you agree to HexaCv's{" "}
        <Link href="/terms" className="underline no-underline hover:underline" style={{ color: T.muted }}>Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="underline no-underline hover:underline" style={{ color: T.muted }}>Privacy Policy</Link>
        . Secured by HexaStack Solutions.
      </p>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', width: '100%', backgroundColor: T.bg,
      fontFamily: 'Inter, sans-serif', display: 'flex',
    }}>
      {/* Mobile: single column */}
      <div className="flex sm:hidden items-center justify-center w-full px-6 py-12">
        {form}
      </div>

      {/* Desktop: two-column */}
      <div className="hidden sm:flex w-full">
        {/* Left: form */}
        <div className="flex items-center justify-center" style={{ width: '40%', padding: 32 }}>
          {form}
        </div>

        {/* Right: brand panel */}
        <div style={{
          width: '60%', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f1b3d 0%, #1e40af 40%, #ea580c 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 64,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="flex items-center gap-3 mb-12 relative" style={{ zIndex: 1 }}>
            <Layers style={{ color: '#fff', opacity: 0.9 }} className="w-8 h-8" />
            <span className="text-2xl font-bold text-white">HexaCv</span>
          </div>
          <div className="relative" style={{ zIndex: 1, maxWidth: 440, textAlign: 'center' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
              borderRadius: 16, padding: 40, border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <Sparkles className="w-8 h-8 mx-auto mb-4" style={{ color: '#b8c4ff' }} />
              <blockquote style={{ color: '#fff', fontSize: 18, lineHeight: 1.6, fontWeight: 500, fontStyle: 'italic' }}>
                "HexaCv helped me tailor my resume for a senior role at Google. The ATS score jumped from 65 to 94 — I got the interview."
              </blockquote>
              <div style={{ marginTop: 20, color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>
                — Surag M S - Software Engineer, Founder Of HexaStack Solutions
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
