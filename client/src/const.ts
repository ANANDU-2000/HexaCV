export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // In local development or when no OAuth portal is configured, use the local login page.
  // We check for localhost and the placeholder domain to prevent cached environment variables from causing issues.
  if (!oauthPortalUrl || 
      oauthPortalUrl.includes("auth.hexastacksolutions.com") || 
      window.location.hostname === "localhost" || 
      window.location.hostname === "127.0.0.1") {
    return "/login";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    if (appId) {
      url.searchParams.set("appId", appId);
    }
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error("Failed to construct OAuth login URL:", error);
    // Fallback to local login page
    return "/login";
  }
};
