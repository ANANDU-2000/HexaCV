import { Button } from "@/components/ui/button";
import { Layers, Chrome, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { canUseOAuthPortal, getLoginUrl } from "@/const";

const T = {
  bg: "#0b1326",
  primaryText: "#b8c4ff",
  accent: "#ea580c",
  text: "#dae2fd",
  muted: "#c4c5d5",
  border: "#444653",
  radius: 8,
};

export default function Register() {
  const params = new URLSearchParams(window.location.search);
  const redirectParam = params.get("redirect") || "/";

  const handleOAuthContinue = () => {
    if (!canUseOAuthPortal()) {
      toast.error(
        "Live sign-up is not configured. Set VITE_OAUTH_PORTAL_URL and VITE_APP_ID, then redeploy. Or continue as guest."
      );
      return;
    }
    window.location.href = getLoginUrl("signUp");
  };

  const form = (
    <div style={{ width: "100%", maxWidth: 440 }}>
      <div className="flex items-center justify-center gap-2 mb-8">
        <Layers style={{ color: T.primaryText }} className="w-7 h-7" />
        <span className="text-xl font-bold" style={{ color: T.text }}>
          HexaCv
        </span>
      </div>

      <h1
        className="text-2xl font-bold text-center mb-3"
        style={{ color: T.text }}
      >
        Create your account
      </h1>
      <p
        className="text-center mb-8"
        style={{ color: T.muted, fontSize: 14, lineHeight: 1.5 }}
      >
        Use your real HexaCv identity. Fake Google / test emails are removed.
      </p>

      <Button
        onClick={handleOAuthContinue}
        style={{
          width: "100%",
          height: 48,
          borderRadius: T.radius,
          backgroundColor: T.accent,
          color: "#fff",
          fontSize: 15,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          gap: 8,
        }}
        className="hover:opacity-90 transition-opacity"
      >
        <Chrome className="w-4 h-4" /> Sign up with HexaCv
      </Button>

      {!canUseOAuthPortal() && (
        <p
          className="text-center mt-3"
          style={{ color: T.muted, fontSize: 12, lineHeight: 1.4 }}
        >
          OAuth portal env is missing on this deploy. Continue as guest, or add
          public <code>VITE_OAUTH_*</code> keys on Vercel and redeploy.
        </p>
      )}

      <p className="text-center mt-8" style={{ color: T.muted, fontSize: 13 }}>
        Already have an account?{" "}
        <Link href="/login">
          <span
            style={{ color: T.primaryText, fontWeight: 600, cursor: "pointer" }}
            className="hover:underline"
          >
            Log in
          </span>
        </Link>
      </p>

      <div className="text-center mt-4">
        <Link href={redirectParam}>
          <span
            style={{
              color: T.muted,
              fontSize: 12,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              minHeight: 44,
            }}
            className="hover:opacity-80 transition-opacity"
          >
            <Sparkles className="w-3 h-3" /> Continue as Guest
          </span>
        </Link>
      </div>

      <p
        className="text-center mt-6"
        style={{ color: T.border, fontSize: 10, lineHeight: 1.4 }}
      >
        By continuing you agree to the{" "}
        <Link href="/terms" style={{ color: T.muted }} className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" style={{ color: T.muted }} className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: T.bg,
        fontFamily: "Inter, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {form}
    </div>
  );
}
