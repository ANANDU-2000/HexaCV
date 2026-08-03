import { Button } from "@/shared/ui/button";
import { Layers, Chrome } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useResumeStorage } from "@/_core/hooks/useResumeStorage";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { canUseOAuthPortal, getLoginUrl } from "@/const";

/** Ledger tokens (DESIGN.md) */
const T = {
  bg: "#FBF8F3",
  surface: "#FFFFFF",
  primary: "#123832",
  accent: "#C5622A",
  text: "#1C1B18",
  muted: "#635F55",
  lightMuted: "#8B8680",
  border: "#E4DFD3",
  radius: 12,
};

function guestHref(redirect: string): string {
  if (!redirect || redirect === "/" || redirect.startsWith("/login") || redirect.startsWith("/register")) {
    return "/builder";
  }
  // Auth-gated account/admin pages would bounce a guest straight back to /login (infinite loop).
  // Route them to the guest-capable builder instead.
  if (
    redirect.startsWith("/dashboard/") ||
    redirect.startsWith("/admin") ||
    redirect.startsWith("/url")
  ) {
    return "/builder";
  }
  return redirect;
}

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
        toast.info("Saving your guest drafts to your account…");
        try {
          await convertGuestMutation.mutateAsync({ guestSessionId });
          await storage.syncGuestDataToCloud();
          toast.success("Your guest drafts are now on your account.");
        } catch {
          toast.error(
            "Signed in, but we could not move guest drafts automatically. Your local drafts are still on this device."
          );
        }
      }
    }
    const dest =
      redirectParam === "/" && convertParam
        ? "/builder/target"
        : redirectParam || "/builder/target";
    setLocation(dest);
  };

  const handleOAuthContinue = () => {
    if (!canUseOAuthPortal()) {
      toast.error(
        "Sign-in is not available on this site right now. Continue as guest to build a resume, or try again later."
      );
      return;
    }
    window.location.href = getLoginUrl("signIn");
  };

  const form = (
    <div style={{ width: "100%", maxWidth: 400 }}>
      <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 no-underline">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: T.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden="true"
        >
          <Layers style={{ color: "#fff" }} className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <span className="text-xl font-extrabold tracking-tight" style={{ color: T.text }}>
          HexaCv
        </span>
      </Link>

      <h1 className="text-2xl font-extrabold text-center mb-3 tracking-tight" style={{ color: T.text }}>
        {convertParam ? "Save your guest resume" : "Welcome back"}
      </h1>
      <p
        className="text-center mb-2"
        style={{ color: T.muted, fontSize: 14, lineHeight: 1.55 }}
      >
        Your resume draft is saved — you&apos;ll pick up right where you left off.
      </p>
      <p
        className="text-center mb-8"
        style={{ color: T.lightMuted, fontSize: 13, lineHeight: 1.55 }}
      >
        Guest drafts stay on this device until you sign in. First build is free.
      </p>

      <Button
        onClick={handleOAuthContinue}
        className="w-full font-bold hover:opacity-90 transition-opacity"
        style={{
          height: 48,
          minHeight: 44,
          borderRadius: T.radius,
          backgroundColor: T.accent,
          color: "#fff",
          fontSize: 15,
          border: "none",
          gap: 8,
        }}
      >
        <Chrome className="w-4 h-4" strokeWidth={1.75} /> Sign in with HexaCv
      </Button>

      <Link href={guestHref(redirectParam)} className="block w-full mt-3 no-underline">
        <Button
          variant="outline"
          className="w-full font-semibold"
          style={{
            height: 48,
            minHeight: 44,
            borderRadius: T.radius,
            borderColor: T.border,
            color: T.text,
            backgroundColor: T.surface,
          }}
        >
          Continue as guest
        </Button>
      </Link>

      {!canUseOAuthPortal() && (
        <p
          className="text-center mt-3"
          style={{ color: T.lightMuted, fontSize: 12, lineHeight: 1.4 }}
        >
          Live sign-in is not set up on this deploy. Guest mode still works.
        </p>
      )}

      <p className="text-center mt-8" style={{ color: T.muted, fontSize: 13 }}>
        Don&apos;t have an account?{" "}
        <Link href={`/register${window.location.search || ""}`}>
          <span
            style={{ color: T.primary, fontWeight: 600, cursor: "pointer" }}
            className="hover:underline"
          >
            Sign up
          </span>
        </Link>
      </p>

      <p
        className="text-center mt-6"
        style={{ color: T.lightMuted, fontSize: 11, lineHeight: 1.45 }}
      >
        By continuing, you agree to HexaCv&apos;s{" "}
        <Link href="/terms" className="underline" style={{ color: T.muted }}>
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline" style={{ color: T.muted }}>
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
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: "40px 28px",
          boxShadow: "0 12px 40px rgba(15,23,42,0.06)",
        }}
      >
        {form}
      </div>
    </div>
  );
}
