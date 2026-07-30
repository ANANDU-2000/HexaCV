export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** True on local machine — mock Google/email allowed only here. */
export function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

/** Public Manus OAuth portal configured for this build. */
export function canUseOAuthPortal(): boolean {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;
  return Boolean(oauthPortalUrl?.trim() && appId?.trim());
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (type: "signIn" | "signUp" = "signIn") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;

  // Local always uses in-app login (mock allowed). Production uses Manus when configured.
  if (isLocalDevHost() || !oauthPortalUrl?.trim() || !appId?.trim()) {
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
