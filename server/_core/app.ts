/**
 * Shared Express app factory — used by local/Render (`index.ts`) and Vercel (`api/index.ts`).
 * Does not call listen(); the host owns the HTTP server.
 */
import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";
import { configureSecurity } from "../middleware/security";
import { registerRazorpayWebhook } from "../razorpayWebhook";
import { registerCountryRoutes } from "../countryRoutes";

export type CreateAppOptions = {
  /** Serve Vite `dist/public` SPA (local/Render). Off on Vercel (static CDN). */
  serveClient?: boolean;
};

export function createApp(options: CreateAppOptions = {}): Express {
  const { serveClient = false } = options;
  const app = express();

  app.use((req, res, next) => {
    try {
      decodeURIComponent(req.path);
      next();
    } catch (err) {
      if (err instanceof URIError) {
        console.warn(`Malformed URI sequence in request URL: ${req.url}`);
        res.status(400).send("Bad Request: Malformed URI");
        return;
      }
      next(err);
    }
  });

  configureSecurity(app);

  registerRazorpayWebhook(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerCountryRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true, service: "hexacv" });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (serveClient) {
    serveStatic(app);
  }

  return app;
}
