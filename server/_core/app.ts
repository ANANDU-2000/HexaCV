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
import { reportClientError, reportServerError } from "./errorReporter";

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

  // Runtime error reporting — client sends window/global errors here.
  app.post("/api/runtime-error", (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    reportClientError({
      message:
        typeof body.message === "string" ? body.message.slice(0, 500) : "client error",
      stack: typeof body.stack === "string" ? body.stack.slice(0, 5000) : undefined,
      url:
        typeof body.url === "string" ? body.url.slice(0, 500) : undefined,
      userAgent: req.headers["user-agent"] || undefined,
    });
    res.json({ ok: true });
  });

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
      // Log unexpected tRPC failures (500s + parse errors); expected 4xx are noise.
      onError: ({ error, path, type, ctx, input }) => {
        const code = (error as { code?: string }).code;
        if (
          code === "INTERNAL_SERVER_ERROR" ||
          code === "PARSE_ERROR" ||
          !code
        ) {
          reportServerError({
            message: error?.message || "tRPC error",
            stack: error?.stack,
            method: type,
            path: path,
            userId: (ctx as { user?: { id?: number | string } | null })
              ?.user?.id ?? null,
            extra: { code },
          });
        }
      },
    })
  );

  if (serveClient) {
    serveStatic(app);
  }

  // Last middleware — catch anything that fell through and report it.
  app.use(
    (
      err: unknown,
      req: { method?: string; url?: string },
      res: { status: (code: number) => { json: (body: unknown) => void } },
      _next: unknown
    ) => {
      const e = err instanceof Error ? err : new Error(String(err));
      reportServerError({
        message: e.message || "Express error",
        stack: e.stack,
        method: req?.method,
        path: req?.url,
      });
      res.status(500).json({ error: "Internal server error" });
    }
  );

  return app;
}
