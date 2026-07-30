import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie("hexacv_logout", { ...cookieOptions });
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Mock login for local sandbox / dev testing
  app.get("/api/mock/login", async (req: Request, res: Response) => {
    const email = (req.query.email as string) || "test.candidate@gmail.com";
    const password = (req.query.password as string) || "";
    const name = (req.query.name as string) || (email.toLowerCase() === "admin@hexacv.com" ? "Admin User" : "Test Candidate");
    const provider = (req.query.provider as string) || "google";
    const normalizedEmail = email.toLowerCase().trim();

    // Verify admin credentials if logging in as admin@hexacv.com
    if (normalizedEmail === "admin@hexacv.com" && password && password !== "1234@hexaCv") {
      res.status(401).json({ error: "Invalid credentials for admin account." });
      return;
    }

    const isAdmin = normalizedEmail === "admin@hexacv.com" || normalizedEmail.includes("admin");
    const openId = isAdmin ? "admin-key-owner" : `mock-${provider}-${normalizedEmail.replace("@", "-")}`;

    try {
      await db.upsertUser({
        openId,
        name: name || (isAdmin ? "Admin User" : "Test Candidate"),
        email: normalizedEmail,
        loginMethod: provider,
        lastSignedIn: new Date(),
        role: isAdmin ? "admin" : "user",
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || (isAdmin ? "Admin User" : "Test Candidate"),
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie("hexacv_logout", { ...cookieOptions });
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      
      const defaultRedirect = isAdmin ? "/admin" : "/";
      const redirect = (req.query.redirect as string) || defaultRedirect;
      res.redirect(302, redirect);
    } catch (error) {
      console.error("[Mock Auth] Login failed", error);
      res.status(500).json({ error: "Mock login failed" });
    }
  });

  // Explicit HTTP logout endpoint
  app.get("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "lax", secure: false });
    res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "none", secure: true });
    res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true });
    res.clearCookie(COOKIE_NAME);
    res.redirect(302, "/");
  });
}
