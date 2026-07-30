import type { Request, Response, NextFunction, Express } from 'express';

// Custom security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com ws: wss:; img-src 'self' data: blob:;"
  );
  next();
}

// Custom simple memory-based rate limiter
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
