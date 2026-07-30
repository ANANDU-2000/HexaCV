import { Button } from "@/components/ui/button";
import { Layers, Chrome, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useResumeStorage } from "@/_core/hooks/useResumeStorage";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { canUseOAuthPortal, getLoginUrl } from "@/const";

const T = {
  bg: "#0b1326",
  surface: "#171f33",
  primaryText: "#b8c4ff",
  accent: "#ea580c",
  text: "#dae2fd",
  muted: "#c4c5d5",
  border: "#444653",
  radius: 8,
};

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const storage = useResumeStorage();
  const convertGuestMutation = trpc.auth.convertGuest.useMutation();

  const params = new URLSearchParams(window.location.search);
  const convertParam = params.get("convert") === "true";
  const redirectParam = params.get("redirect") || "/";

  useEffect(() => {
    if (isAuthenticated) {
      void handlePostLoginFlow();
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
          toast.success("Guest data saved to your account.");
        } catch (e) {
          console.error("Failed to convert guest session:", e);
        }
      }
    }
    setLocation(redirectParam);
  };

  const handleOAuthContinue = () => {
    if (!canUseOAuthPortal()) {
      toast.error(
        "Live sign-in is not configured. Set VITE_OAUTH_PORTAL_URL and VITE_APP_ID, then redeploy. Or continue as guest."
      );
      return;
    }
    window.location.href = getLoginUrl("signIn");
  };

  const form = (
    <div style={{ width: "100%", maxWidth: 400 }}>
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
        {convertParam ? "Secure your guest resume" : "Welcome back"}
      </h1>
      <p
        className="text-center mb-8"
        style={{ color: T.muted, fontSize: 14, lineHeight: 1.5 }}
      >
        Sign in with your real HexaCv account. No fake Google or test emails.
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
        <Chrome className="w-4 h-4" /> Sign in with HexaCv
      </Button>

      {!canUseOAuthPortal() && (
        <p
          className="text-center mt-3"
          style={{ color: T.muted, fontSize: 12, lineHeight: 1.4 }}
        >
          OAuth portal env is missing on this deploy. Use guest mode below, or
          add <code>VITE_OAUTH_PORTAL_URL</code> + <code>VITE_APP_ID</code> on
          Vercel and redeploy.
        </p>
      )}

      <p className="text-center mt-8" style={{ color: T.muted, fontSize: 13 }}>
        Don&apos;t have an account?{" "}
        <Link href="/register">
          <span
            style={{ color: T.primaryText, fontWeight: 600, cursor: "pointer" }}
            className="hover:underline"
          >
            Sign up
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
        By continuing, you agree to HexaCv&apos;s{" "}
        <Link
          href="/terms"
          className="underline hover:underline"
          style={{ color: T.muted }}
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline hover:underline"
          style={{ color: T.muted }}
        >
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
      }}
    >
      <div className="flex sm:hidden items-center justify-center w-full px-6 py-12">
        {form}
      </div>
      <div className="hidden sm:flex w-full">
        <div
          className="flex items-center justify-center"
          style={{ width: "40%", padding: 32 }}
        >
          {form}
        </div>
        <div
          style={{
            width: "60%",
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, #0f1b3d 0%, #1e40af 40%, #ea580c 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 64,
          }}
        >
          <div className="flex items-center gap-3 mb-8 relative" style={{ zIndex: 1 }}>
            <Layers style={{ color: "#fff", opacity: 0.9 }} className="w-8 h-8" />
            <span className="text-2xl font-bold text-white">HexaCv</span>
          </div>
          <p
            className="relative text-center text-white/90"
            style={{ zIndex: 1, maxWidth: 400, fontSize: 16, lineHeight: 1.6 }}
          >
            Build an ATS-friendly resume with real account sync — no fabricated
            demo identities.
          </p>
        </div>
      </div>
    </div>
  );
}
