import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chrome, Layers, Mail, Lock, Eye, EyeOff, User, Check, X, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { registerLocalUser } from "@/lib/localStorageDb";
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
  error: '#ffb4ab',
  radius: 8,
};

const strengthConfig = [
  { min: 0, label: 'Weak', color: '#ffb4ab', fill: 1 },
  { min: 2, label: 'Fair', color: '#fb923c', fill: 2 },
  { min: 3, label: 'Good', color: '#fbbf24', fill: 3 },
  { min: 4, label: 'Strong', color: '#4ade80', fill: 4 },
  { min: 5, label: 'Very Strong', color: '#22d3ee', fill: 5 },
];

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return strengthConfig.find(s => score >= s.min) ?? strengthConfig[0];
}

export default function Register() {
  const [, setLocation] = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const redirectParam = params.get('redirect') || '/';
  const allowDevMock = isLocalDevHost();

  const strength = useMemo(() => getStrength(password), [password]);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const isFormValid = Boolean(fullName.trim() && email.trim() && password.length >= 6 && passwordsMatch);

  const checks = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number or symbol', met: /[0-9]|[^A-Za-z0-9]/.test(password) },
  ];

  const handleEmailRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Please enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { toast.error('Please enter a valid email address.'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (confirmPassword && password !== confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (!agreedToTerms) { toast.error('Please agree to the Terms of Service.'); return; }

    if (!allowDevMock && !canUseOAuthPortal()) {
      toast.error('Account signup via email is available in local development only until OAuth is configured.');
      return;
    }

    const result = registerLocalUser(fullName, email, password);
    if (result.success) {
      toast.success(result.message || 'Account created successfully!');
      const targetRedirect = email.includes('admin') ? '/admin' : redirectParam;
      window.location.href = `/api/mock/login?provider=email&name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(targetRedirect)}`;
    } else {
      toast.error(result.message || 'Failed to create account.');
    }
  };

  const handleOAuthContinue = () => {
    if (canUseOAuthPortal()) {
      window.location.href = getLoginUrl("signUp");
      return;
    }
    if (allowDevMock) {
      toast.message("Dev mock signup — not a real Google account");
      const name = "Google Candidate";
      const gEmail = "google.candidate@gmail.com";
      registerLocalUser(name, gEmail);
      window.location.href = `/api/mock/login?provider=google&name=${encodeURIComponent(name)}&email=${encodeURIComponent(gEmail)}&redirect=${encodeURIComponent(redirectParam)}`;
      return;
    }
    toast.error("Sign-up is not configured yet. Continue as guest, or try again later.");
  };

  const inputStyle = {
    width: '100%', height: 48, borderRadius: T.radius, paddingLeft: 40,
    backgroundColor: T.surface, border: `1px solid ${T.border}`,
    color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  };

  const form = (
    <div style={{ width: '100%', maxWidth: 440 }}>
      <div className="flex items-center justify-center gap-2 mb-8">
        <Layers style={{ color: T.primaryText }} className="w-7 h-7" />
        <span className="text-xl font-bold" style={{ color: T.text }}>HexaCv</span>
      </div>

      <h1 className="text-2xl font-bold text-center mb-8" style={{ color: T.text }}>Create your account</h1>

      <form onSubmit={handleEmailRegister} className="flex flex-col gap-4">
        <div className="sm:grid sm:grid-cols-2 sm:gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" style={{ color: T.muted, fontSize: 13, fontWeight: 600 }}>Full Name</Label>
            <div className="relative">
              <User className="absolute left-3.5" style={{ top: 16, color: T.muted, width: 16, height: 16 }} />
              <Input id="name" type="text" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = T.primaryText}
                onBlur={e => e.currentTarget.style.borderColor = T.border}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-email" style={{ color: T.muted, fontSize: 13, fontWeight: 600 }}>Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5" style={{ top: 16, color: T.muted, width: 16, height: 16 }} />
              <Input id="reg-email" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = T.primaryText}
                onBlur={e => e.currentTarget.style.borderColor = T.border}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-password" style={{ color: T.muted, fontSize: 13, fontWeight: 600 }}>Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5" style={{ top: 16, color: T.muted, width: 16, height: 16 }} />
            <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password"
              value={password} onChange={e => setPassword(e.target.value)} required
              style={{ ...inputStyle, paddingRight: 40 }}
              onFocus={e => e.currentTarget.style.borderColor = T.primaryText}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 12, top: 16, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-0.5" style={{ height: 6 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      flex: 1, borderRadius: 3,
                      backgroundColor: i <= strength.fill ? strength.color : T.border,
                      transition: 'background-color 0.3s',
                    }} />
                  ))}
                </div>
                <span style={{ color: strength.color, fontSize: 11, fontWeight: 600 }}>{strength.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {checks.map(c => (
                  <div key={c.label} className="flex items-center gap-1.5">
                    {c.met
                      ? <Check className="w-3 h-3" style={{ color: T.success }} />
                      : <X className="w-3 h-3" style={{ color: T.border }} />
                    }
                    <span style={{ color: c.met ? T.success : T.muted, fontSize: 10 }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" style={{ color: T.muted, fontSize: 13, fontWeight: 600 }}>Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5" style={{ top: 16, color: T.muted, width: 16, height: 16 }} />
            <Input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              style={{
                ...inputStyle, paddingRight: 40,
                borderColor: passwordsMismatch ? T.error : confirmPassword.length > 0 && passwordsMatch ? T.success : T.border,
              }}
              onFocus={e => e.currentTarget.style.borderColor = T.primaryText}
              onBlur={e => { if (!passwordsMismatch && !passwordsMatch) e.currentTarget.style.borderColor = T.border; }}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ position: 'absolute', right: 12, top: 16, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordsMismatch && <p className="text-xs flex items-center gap-1 mt-1" style={{ color: T.error }}><X className="w-3 h-3" /> Passwords do not match</p>}
          {confirmPassword.length > 0 && passwordsMatch && <p className="text-xs flex items-center gap-1 mt-1" style={{ color: T.success }}><Check className="w-3 h-3" /> Passwords match</p>}
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start gap-2.5 pt-1">
          <input id="terms" type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
            style={{ marginTop: 2, width: 16, height: 16, accentColor: T.accent, cursor: 'pointer' }} />
          <label htmlFor="terms" style={{ color: T.muted, fontSize: 12, lineHeight: 1.4, cursor: 'pointer' }}>
            I agree to HexaCv's{' '}
            <Link href="/terms" style={{ color: T.primaryText }} className="hover:underline font-medium no-underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" style={{ color: T.primaryText }} className="hover:underline font-medium no-underline">Privacy Policy</Link>
          </label>
        </div>

        <Button type="submit" disabled={!isFormValid} style={{
          width: '100%', height: 48, borderRadius: T.radius,
          backgroundColor: isFormValid ? T.accent : T.border,
          color: isFormValid ? '#fff' : T.muted, fontSize: 15, fontWeight: 600,
          border: 'none', cursor: isFormValid ? 'pointer' : 'not-allowed', marginTop: 4,
        }} className="transition-opacity hover:opacity-90">
          Create Account
        </Button>
      </form>

      {/* OAuth */}
      <div className="flex items-center gap-3 my-6">
        <div style={{ flex: 1, height: 1, backgroundColor: T.border }} />
        <span style={{ color: T.muted, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>or sign up with</span>
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
        Already have an account?{' '}
        <Link href="/login">
          <span style={{ color: T.primaryText, fontWeight: 600, cursor: 'pointer' }} className="hover:underline">Log in</span>
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
        Secured by HexaStack Solutions. Your data is protected with enterprise-grade encryption.
      </p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: T.bg, fontFamily: 'Inter, sans-serif', display: 'flex' }}>
      {/* Mobile */}
      <div className="flex sm:hidden items-center justify-center w-full px-6 py-12">
        {form}
      </div>

      {/* Desktop two-column */}
      <div className="hidden sm:flex w-full">
        <div className="flex items-center justify-center" style={{ width: '40%', padding: 32 }}>
          {form}
        </div>
        <div style={{
          width: '60%', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f1b3d 0%, #1e40af 40%, #ea580c 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64,
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
              <User className="w-8 h-8 mx-auto mb-4" style={{ color: '#b8c4ff' }} />
              <blockquote style={{ color: '#fff', fontSize: 18, lineHeight: 1.6, fontWeight: 500, fontStyle: 'italic' }}>
                "Creating an account took less than a minute. I was able to import my old resume and tailor it for a new role right away."
              </blockquote>
              <div style={{ marginTop: 20, color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>
                — Anandu Krishna P A - Software Engineer, Co-Founder Of HexaStack Solutions
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
