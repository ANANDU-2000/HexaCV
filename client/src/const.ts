export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Default post-auth / guest destination when a redirect is missing or gated. */
export const SAFE_GUEST_FALLBACK = "/builder/target";

/** Public Manus OAuth portal configured for this build. */
export function canUseOAuthPortal(): boolean {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as
    | string
    | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;
  return Boolean(oauthPortalUrl?.trim() && appId?.trim());
}

/**
 * Whether `path` is a safe in-app destination for guests (and for OAuth return).
 * Auth-gated account/admin routes and auth pages themselves are rejected.
 */
export function isSafeGuestRedirect(path: string): boolean {
  if (!path || typeof path !== "string") return false;

  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return false;

  const pathname = (trimmed.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  const lower = pathname.toLowerCase();

  if (lower === "/") return false;
  if (lower === "/login" || lower.startsWith("/login/")) return false;
  if (lower === "/register" || lower.startsWith("/register/")) return false;
  if (lower === "/dashboard" || lower.startsWith("/dashboard/")) return false;
  if (lower === "/admin" || lower.startsWith("/admin")) return false;
  if (lower === "/url" || lower.startsWith("/url")) return false;

  return true;
}

/**
 * Safe post-auth-page destination for "Continue as guest".
 * Auth-gated account/admin routes would bounce a guest back to /login.
 * Default destination is /builder/target (guests can fill the form, sign-in
 * is gated at build time only).
 */
export function guestHref(redirect: string): string {
  return isSafeGuestRedirect(redirect) ? redirect.trim() : SAFE_GUEST_FALLBACK;
}

/**
 * Stash the post-login destination in a cookie so the server-side
 * OAuth callback can redirect there after the provider round-trip.
 */
export function stashReturnTo(returnTo: string): void {
  const safe = guestHref(returnTo);
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
