export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Public Manus OAuth portal configured for this build. */
export function canUseOAuthPortal(): boolean {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as
    | string
    | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;
  return Boolean(oauthPortalUrl?.trim() && appId?.trim());
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
