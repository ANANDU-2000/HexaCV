/**
 * PHASE 4 — production deployment hardening regression tests.
 *
 * Guards the behavior this phase introduced/changed:
 *   1. `trust proxy` is set for exactly one reverse-proxy hop when the app runs
 *      on Render (env-aware), and stays OFF in local dev — so `req.ip` reflects
 *      the real client IP behind the proxy and the in-memory rate limiter no
 *      longer shares one bucket across all visitors.
 *   2. Production CSP drops `'unsafe-eval'`, allows the Razorpay checkout
 *      origin, and pins frame-ancestors/object-src/base-uri/form-action.
 *   3. Deprecated X-XSS-Protection is removed; HSTS is sent on HTTPS requests
 *      only; Permissions-Policy is present.
 *   4. The rate limiter still rejects bursts (limits were NOT relaxed).
 *
 * These tests are pure HTTP-header/request behavior — they never reach the LLM,
 * the database, or a payment provider.
 */
import { afterAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { createServer, type Server, request as httpRequest } from "node:http";

// The modules below load at import time; they capture env at call time for the
// knobs we toggle (trust proxy + CSP dev/prod), so no secret stubbing is needed
// here — this suite never authenticates a user.
import { createApp } from "./_core/app";
import { contentSecurityPolicy } from "./middleware/security";
import { rateLimiter } from "./middleware/security";

type CspPolicy = Extract<ReturnType<typeof contentSecurityPolicy>, string>;

type Response = {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
};

function start(server: Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve((server.address() as AddressInfo).port);
    });
  });
}

/** One real HTTP GET against the running app; returns status + headers + body. */
function getOnce(
  app: ReturnType<typeof createApp>,
  path: string,
  headers: Record<string, string> = {}
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const server = createServer(app);
    start(server)
      .then((port) => {
        const req = httpRequest(
          { host: "127.0.0.1", port, path, method: "GET", headers },
          (res) => {
            let body = "";
            res.on("data", (c) => (body += c));
            res.on("end", () =>
              resolve({ status: res.statusCode ?? 0, headers: res.headers, body })
            );
          }
        );
        req.on("error", reject);
        req.end();
      })
      .catch(reject);
  });
}

afterAll(() => {
  delete process.env.RENDER;
  delete process.env.TRUST_PROXY;
});

function singleValue(headers: Response["headers"], name: string): string {
  const v = headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

describe("Phase 4 — trust proxy (env-aware, narrowest safe)", () => {
  it("sets 1 proxy hop behind Render so X-Forwarded-For gives the real IP", async () => {
    process.env.RENDER = "1";
    try {
      const app = createApp();
      app.get("/__test_ip__", (req, res) => res.json({ ip: req.ip }));
      // With exactly one trusted hop, the client IP is the XFF header value.
      const { status, body } = await getOnce(app, "/__test_ip__", {
        "x-forwarded-for": "203.0.113.7",
        "x-forwarded-proto": "https",
      });
      expect(status).toBe(200);
      expect(body).toContain("203.0.113.7");
      expect(body).not.toContain("127.0.0.1");
    } finally {
      delete process.env.RENDER;
    }
  });

  it("ignores X-Forwarded-For in local dev (no proxy in front)", async () => {
    delete process.env.RENDER;
    delete process.env.TRUST_PROXY;
    const app = createApp();
    app.get("/__test_ip__", (req, res) => res.json({ ip: req.ip }));
    const { body: ipBody } = await getOnce(app, "/__test_ip__", {
      "x-forwarded-for": "203.0.113.7",
    });
    expect(ipBody).not.toContain("203.0.113.7");
    expect(ipBody).toContain("127.0.0.1");
  });
});

describe("Phase 4 — Content-Security-Policy", () => {
  it("production policy allows the Razorpay checkout origin and drops unsafe-eval", () => {
    const prod = contentSecurityPolicy(true) as CspPolicy;
    expect(prod).toContain("https://checkout.razorpay.com");
    expect(prod).not.toMatch(/'unsafe-eval'/);
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("object-src 'none'");
    expect(prod).toContain("base-uri 'self'");
    expect(prod).toContain("form-action 'self'");
  });

  it("dev policy keeps unsafe-eval for Vite/React tooling", () => {
    const dev = contentSecurityPolicy(false) as CspPolicy;
    expect(dev).toMatch(/'unsafe-eval'/);
    expect(dev).toContain("https://checkout.razorpay.com");
  });

  it("serves the production CSP header when running on Render", async () => {
    process.env.RENDER = "1";
    process.env.NODE_ENV = "production";
    try {
      const app = createApp();
      const res = await getOnce(app, "/api/health", { "x-forwarded-proto": "https" });
      const csp = singleValue(res.headers, "content-security-policy");
      expect(csp).toContain("https://checkout.razorpay.com");
      expect(csp).not.toMatch(/'unsafe-eval'/);
    } finally {
      delete process.env.RENDER;
      delete process.env.NODE_ENV;
    }
  });
});

describe("Phase 4 — security headers", () => {
  it("removes deprecated X-XSS-Protection and sets the modern set", async () => {
    const app = createApp();
    const res = await getOnce(app, "/api/health", {});
    expect(singleValue(res.headers, "x-xss-protection")).toBe("");
    expect(singleValue(res.headers, "x-frame-options")).toBe("DENY");
    expect(singleValue(res.headers, "x-content-type-options")).toBe("nosniff");
    expect(singleValue(res.headers, "referrer-policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(singleValue(res.headers, "permissions-policy")).toContain(
      "geolocation=()"
    );
  });

  it("sends HSTS only on HTTPS requests (never on plaintext)", async () => {
    // Plain http request → no HSTS.
    const httpApp = createApp();
    const plain = await getOnce(httpApp, "/api/health", {});
    expect(singleValue(plain.headers, "strict-transport-security")).toBe("");

    // Behind a TLS-terminating proxy (X-Forwarded-Proto: https + trusted proxy)
    // → HSTS present.
    process.env.RENDER = "1";
    try {
      const tlsApp = createApp();
      const secure = await getOnce(tlsApp, "/api/health", {
        "x-forwarded-proto": "https",
      });
      const hsts = singleValue(secure.headers, "strict-transport-security");
      expect(hsts).toMatch(/^max-age=\d+; includeSubDomains$/);
    } finally {
      delete process.env.RENDER;
    }
  });
});

describe("Phase 4 — rate limiter still enforced (not relaxed)", () => {
  it("rejects a request over the limit with 429", () => {
    let hits = 0;
    const next = () => {
      hits++;
    };
    const req = { ip: "198.51.100.9", socket: {} } as never;
    const res = {
      status: (code: number) => ({
        json: () => {
          hits = -code; // sentinel: 429 hit
        },
      }),
    } as never;

    const limiter = rateLimiter(3, 60_000);
    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next); // exactly the limit → passes
    expect(hits).toBe(3);
    limiter(req, res, next); // over the limit → 429
    expect(hits).toBe(-429);
  });
});