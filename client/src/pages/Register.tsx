import { Button } from "@/shared/ui/button";
import { Chrome } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { canUseOAuthPortal, getLoginUrl } from "@/const";
import SiteHeader from "@/shared/layout/SiteHeader";
import SiteFooter from "@/shared/layout/SiteFooter";

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

export default function Register() {
  const params = new URLSearchParams(window.location.search);
  const redirectParam = params.get("redirect") || "/";

  const handleOAuthContinue = () => {
    if (!canUseOAuthPortal()) {
      toast.error(
        "Sign-up is not available on this site right now. Continue as guest to build a resume, or try again later."
      );
      return;
    }
    window.location.href = getLoginUrl("signUp");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
      <SiteHeader showAuth={false} />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card px-7 py-10 shadow-sm">
          <h1 className="mb-3 text-center font-display text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mb-2 text-center text-sm leading-relaxed text-muted-foreground">
            Your resume draft is saved — you&apos;ll pick up right where you left off.
          </p>
          <p className="mb-8 text-center text-[13px] leading-relaxed text-muted-foreground">
            First build free after signup. No subscription.
          </p>

          <Button
            onClick={handleOAuthContinue}
            className="min-h-11 w-full gap-2 rounded-[18px] bg-accent-warm text-[15px] font-bold text-white hover:bg-accent-warm/90"
          >
            <Chrome className="h-4 w-4" strokeWidth={1.75} /> Sign up with HexaCv
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
              Live sign-up is not set up on this deploy. Guest mode still works.
            </p>
          )}

          <p className="mt-8 text-center text-[13px] text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={`/login${window.location.search || ""}`}
              className="font-semibold text-primary no-underline hover:underline"
            >
              Log in
            </Link>
          </p>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            By continuing you agree to the{" "}
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
