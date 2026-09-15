import type { Request, Response, NextFunction, Express } from 'express';

// Production CSP — this is the primary policy when the Node app serves HTML
// directly (local `npm start` on Render, or any direct hit to the API origin).
// The Vercel CDN (the main user-facing origin) is covered by the identical
// policy injected into the built HTML by `vitePluginMetaCsp` (vite.config.ts),
// plus CDN headers in vercel.json. Keeping the two consistent avoids a
// header+meta double-enforcement mismatch.
//
// Reasoning for each directive:
//  - script-src carries 'unsafe-inline' because vite-plugin-manus-runtime
//    injects a large inline script into the built HTML. 'unsafe-eval' is
//    dropped in production (no eval/new Function in the bundle) but kept in
//    dev for Vite/React tooling. https://checkout.razorpay.com is required for
//    the Razorpay Checkout SDK loaded at runtime for payments.
//  - frame-src allows Razorpay's checkout iframe; frame-ancestors 'none' stops
//    other origins from framing the app (duplicates X-Frame-Options DENY).
//  - object-src/base-uri/form-action are pinned to safe defaults.
//  - ws:/wss: are dev-only (Vite HMR) but harmless to keep in the header the
//    Node server sends; the HTML meta CSP (prod) omits them.
//  - Upgrade-insecure-requests is omitted intentionally: the API origin also
//    receives http:// requests during the cross-origin OAuth redirect from the
//    Manus portal, and we do not want to force HTTPS upgrades at the header
//    level for mixed environments.
// Exported so the Vite build injects the SAME production policy as an HTML
// <meta http-equiv="Content-Security-Policy"> tag (vite.config.ts metaCsp), and
// security regression tests can assert the header shape. The meta/header pair
// is kept identical so a browser enforcing both sees no conflict.
export function contentSecurityPolicy(isProduction: boolean): string {
  const scriptSrc = isProduction
    ? "'self' 'unsafe-inline' https://checkout.razorpay.com"
    : "'self' 'unsafe-inline' 'unsafe-eval'";
  const connectSrc = isProduction
    ? "'self' https://fonts.googleapis.com https://fonts.gstatic.com https://checkout.razorpay.com"
    : "'self' https://fonts.googleapis.com https://fonts.gstatic.com https://checkout.razorpay.com ws: wss:";
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "img-src 'self' data: blob:",
    "frame-src https://checkout.razorpay.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

// Custom security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // X-XSS-Protection is REMOVED (deprecated; often a downgrade vector in legacy
  // Edge). Modern browsers rely on CSP + X-Content-Type-Options instead.
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
  // HSTS is HTTPS-only: never sent over plaintext (local dev / http:// ingress),
  // which is what "send it unreasonably" would mean. Render terminates TLS and
  // forwards X-Forwarded-Proto: https, so this becomes active in production.
  if (req.protocol === "https") {
    const hstsMaxAge = 60 * 60 * 24 * 365; // 1 year
    res.setHeader('Strict-Transport-Security', `max-age=${hstsMaxAge}; includeSubDomains`);
  }
  const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
  res.setHeader('Content-Security-Policy', contentSecurityPolicy(isProduction));
  next();
}

// Custom simple memory-based rate limiter.
//
// Keep in mind (Phase 4 audit):
//  - In-memory: one bucket set per process. If the app ever runs more than one
//    instance (or restarts), counters reset. HexaCv currently runs a single
//    Render node, so this is acceptable today; do NOT relax the limits.
//  - With `trust proxy` configured (server/_core/app.ts, Render = 1 hop), req.ip
//    is the real client IP behind Render's reverse proxy, so the bucket is not
//    shared across all visitors. Verify was done in Phase 4.
//  - Upgrade path (documented, NOT built): move to a shared store (Redis) or a
//    user-keyed limiter if multi-instance / per-user crediting is needed. Do not
//    ship a fake Redis config — add the real dependency only when it is needed.
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = ipRequestCounts.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }

    record.count++;
    ipRequestCounts.set(ip, record);

    if (record.count > limit) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    next();
  };
}

export function configureSecurity(app: Express) {
  // Apply security headers to all routes
  app.use(securityHeaders);

  // Apply global rate limiting to all api endpoints
  app.use('/api', rateLimiter(150, 15 * 60 * 1000)); // 150 requests per 15 minutes

  // Apply strict rate limiting on AI procedures
  app.use('/api/trpc/ai', rateLimiter(30, 60 * 60 * 1000)); // 30 requests per hour
}
