import { Button } from "@/shared/ui/button";
import { Chrome } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useResumeStorage } from "@/_core/hooks/useResumeStorage";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { canUseOAuthPortal, getLoginUrl, guestHref } from "@/const";
import SiteHeader from "@/shared/layout/SiteHeader";
import SiteFooter from "@/shared/layout/SiteFooter";

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

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
      <SiteHeader showAuth={false} />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card px-7 py-10 shadow-sm">
          <h1 className="mb-3 text-center font-display text-2xl font-semibold tracking-tight text-foreground">
            {convertParam ? "Save your guest resume" : "Welcome back"}
          </h1>
          <p className="mb-2 text-center text-sm leading-relaxed text-muted-foreground">
            Your resume draft is saved — you&apos;ll pick up right where you left off.
          </p>
          <p className="mb-8 text-center text-[13px] leading-relaxed text-muted-foreground">
            Guest drafts stay on this device until you sign in. First build is free.
          </p>

          <Button
            onClick={handleOAuthContinue}
            className="min-h-11 w-full gap-2 rounded-[18px] bg-accent-warm text-[15px] font-bold text-white hover:bg-accent-warm/90"
          >
            <Chrome className="h-4 w-4" strokeWidth={1.75} /> Sign in with HexaCv
          </Button>

          <Link href={guestHref(redirectParam)} className="mt-3 block w-full no-underline">
            <Button
              variant="outline"
              className="min-h-11 w-full rounded-[18px] border-border bg-card font-semibold text-foreground"
            >
              Continue as guest
            </Button>
          </Link>

          {!canUseOAuthPortal() && (
            <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
              Live sign-in is not set up on this deploy. Guest mode still works.
            </p>
          )}

          <p className="mt-8 text-center text-[13px] text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={`/register${window.location.search || ""}`}
              className="font-semibold text-primary no-underline hover:underline"
            >
              Sign up
            </Link>
          </p>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            By continuing, you agree to HexaCv&apos;s{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
