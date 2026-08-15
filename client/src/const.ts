export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Public Manus OAuth portal configured for this build. */
export function canUseOAuthPortal(): boolean {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as
    | string
    | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;
  return Boolean(oauthPortalUrl?.trim() && appId?.trim());
}

/**
 * Safe post-auth-page destination for "Continue as guest".
 * Auth-gated account/admin routes would bounce a guest back to /login.
 * Default destination is /builder/target (guests can fill the form, sign-in
 * is gated at build time only).
 */
export function guestHref(redirect: string): string {
  if (!redirect || redirect === "/" || redirect.startsWith("/login") || redirect.startsWith("/register")) {
    return "/builder/target";
  }
  if (
    redirect.startsWith("/dashboard/") ||
    redirect.startsWith("/admin") ||
    redirect.startsWith("/url")
  ) {
    return "/builder/target";
  }
  return redirect;
}

/**
 * Stash the post-login destination in a cookie so the server-side
 * OAuth callback can redirect there after the provider round-trip.
 */
export function stashReturnTo(returnTo: string): void {
  const safe =
    returnTo && returnTo !== "/" && !returnTo.startsWith("/login") && !returnTo.startsWith("/register")
      ? returnTo
      : "/builder/target";
  document.cookie = `hexacv_return_to=${encodeURIComponent(safe)};path=/;max-age=600;samesite=lax`;
}

/** Live Manus OAuth URL, or `/login` when portal env is missing. */
export const getLoginUrl = (type: "signIn" | "signUp" = "signIn") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as
    | string
    | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;

  if (!oauthPortalUrl?.trim() || !appId?.trim()) {
    return "/login";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl.replace(/\/$/, "")}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", type);
    return url.toString();
  } catch (error) {
    console.error("Failed to construct OAuth login URL:", error);
    return "/login";
  }
};
