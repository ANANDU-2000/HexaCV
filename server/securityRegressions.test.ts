/**
 * PHASE 3 — security regression tests.
 *
 * Guards the three critical fixes and the step-2/3/4/6/12 hardening:
 *   1. AI endpoints require authentication (no anonymous paid AI).
 *   2. AI endpoints stay gated by the AI_PAUSED kill switch.
 *   3. Input validation bounds AI payloads BEFORE any LLM call.
 *   4. resume.parse validates extension / size / encoding server-side.
 *   5. x-local-user-openid impersonation is closed (identity = signed cookie only).
 *   6. x-local-user-logout still drops a valid session.
 *   7. Ownership checks reject cross-user resume access on AI procedures.
 *
 * All checks are designed to throw in middleware/validation BEFORE any LLM or
 * file-parsing work is reached, so no network call is made.
 *
 * The secret/app-id are stubbed BEFORE the routers/sdk modules load (dynamic
 * import) so ENV captures them and a real session cookie can be issued.
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";

// Set env BEFORE any server module import so ENV (read at module load) captures
// the test values. Direct assignment, not vi.stubEnv — stubEnv defers application
// to test-run time, but the modules below load during beforeAll and must already
// see the secrets. Static imports are hoisted first, but none of them read env.
const TEST_SECRET = "test-secret-at-least-32-bytes-long!!";
process.env.JWT_SECRET = TEST_SECRET;
process.env.VITE_APP_ID = "test-app-id";
process.env.AI_PAUSED = "";

import { COOKIE_NAME } from "../shared/const";
import { RESUME_UPLOAD_TOO_LARGE_MSG, MAX_RESUME_PARSE_TEXT_CHARS } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import type { AppRouter } from "./routers";

// NOTE: no static imports of server modules beyond pure `shared`/type imports.
// fileParser → usageTracker → env makes ENV capture secrets at first load, so
// every server module must load AFTER process.env is set (all dynamic, below).

let appRouter: AppRouter;
let sdk: typeof import("./_core/sdk");
let db: typeof import("./db");

type UserRow = NonNullable<TrpcContext["user"]>;

function userRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 99,
    openId: "regression-user",
    name: "Regression User",
    email: "regression@example.com",
    loginMethod: "oauth",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  } as UserRow;
}

function ctxWith(user: UserRow | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function reqWith(headers: Record<string, string>): TrpcContext["req"] {
  return { headers } as TrpcContext["req"];
}

beforeAll(async () => {
  appRouter = (await import("./routers")).appRouter;
  sdk = await import("./_core/sdk");
  db = await import("./db");
});

afterAll(() => {
  delete process.env.JWT_SECRET;
  delete process.env.VITE_APP_ID;
  delete process.env.AI_PAUSED;
});

/** A small, realistic AI call shape that passes schema checks. */
const VALID_AI_INPUT = {
  role: "Software Engineer",
  company: "Acme Inc",
  currentBullets: ["Built the checkout flow"],
  jobDescription: "Looking for a React engineer with payment experience.",
};

describe("Phase 3 — AI endpoints require authentication", () => {
  it("rejects anonymous callers on generation procedures", async () => {
    const caller = appRouter.createCaller(ctxWith(null));
    await expect(
      caller.ai.improveBullets(VALID_AI_INPUT)
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Please sign in to use this AI feature.",
    });
  });

  it("rejects anonymous callers on evaluation", async () => {
    const caller = appRouter.createCaller(ctxWith(null));
    await expect(
      caller.ai.submitEvaluation({ rating: "up" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("Phase 3 — AI input validation bounds payloads before the LLM", () => {
  // Middleware (auth → credit) runs before input parsing in tRPC, so these use
  // a credited user: the request must clear both gates and then be rejected by
  // zod BEFORE any LLM call.
  async function creditedCaller() {
    const { grantSignupFreeCredit } = await import("./credits");
    await grantSignupFreeCredit(99);
    return appRouter.createCaller(ctxWith(userRow({ id: 99 })));
  }

  it("rejects oversized input fields", async () => {
    const caller = await creditedCaller();
    await expect(
      caller.ai.improveBullets({
        ...VALID_AI_INPUT,
        jobDescription: "x".repeat(60_000),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects empty required fields", async () => {
    const caller = await creditedCaller();
    await expect(
      caller.ai.improveBullets({ ...VALID_AI_INPUT, role: "   " })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("Phase 3 — AI_PAUSED kill switch", () => {
  it("short-circuits authenticated AI calls when paused", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow()));
    process.env.AI_PAUSED = "true";
    try {
      await expect(
        caller.ai.improveBullets(VALID_AI_INPUT)
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
      await expect(
        caller.resume.parse({
          filename: "r.pdf",
          base64: Buffer.from("hello").toString("base64"),
        })
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    } finally {
      process.env.AI_PAUSED = "";
    }
  });
});

describe("Phase 3 — resume.parse upload validation", () => {
  const filename = "resume.pdf";
  const tinyPdf = Buffer.from("%PDF-1.4 fake").toString("base64");

  it("rejects unsupported file extensions before any parsing", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow()));
    await expect(
      caller.resume.parse({ filename: "resume.exe", base64: tinyPdf })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects oversized payloads (decodes to > 10 MB)", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow()));
    const oversized = Buffer.alloc(10 * 1024 * 1024 + 1).toString("base64");
    await expect(
      caller.resume.parse({ filename, base64: oversized })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: RESUME_UPLOAD_TOO_LARGE_MSG,
    });
  });

  it("rejects corrupted base64 payloads", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow()));
    await expect(
      caller.resume.parse({ filename, base64: "@@not-base64@@!!" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects empty payloads", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow()));
    await expect(
      caller.resume.parse({ filename, base64: "" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("validateResumeUpload accepts a valid small file in isolation", async () => {
    const { validateResumeUpload } = await import("./uploadValidation");
    const result = validateResumeUpload({ filename, base64: tinyPdf });
    expect(result).toMatchObject({ ok: true, extension: "pdf" });
    if (result.ok) {
      expect(result.buffer.toString("utf-8")).toBe("%PDF-1.4 fake");
    }
  });

  it("rejects extracted text beyond the parse limit", async () => {
    const { isResumeParseTextTooLong } = await import("./uploadValidation");
    expect(isResumeParseTextTooLong("a".repeat(MAX_RESUME_PARSE_TEXT_CHARS + 1))).toBe(
      true
    );
    expect(isResumeParseTextTooLong("a".repeat(100))).toBe(false);
  });
});

describe("Phase 3 — scanned/image-only documents give a helpful error", () => {
  it("parseResumeWithLLM explains scanned PDFs instead of a bare 'empty' error", async () => {
    const { parseResumeWithLLM } = await import("./fileParser");
    await expect(parseResumeWithLLM("   ")).rejects.toThrow(
      /We couldn't extract text from this document/
    );
  });
});

describe("Phase 3 — x-local-user-openid impersonation is closed", () => {
  it("no cookie + forged user header ⇒ anonymous (header is not trusted)", async () => {
    const user = await sdk.sdk.authenticateRequest(
      reqWith({ "x-local-user-openid": "user-2" })
    );
    expect(user).toBeNull();
  });

  it("identity comes only from the signed session cookie, never the header", async () => {
    const cookie = await signSessionCookie("user-2");
    const user = await sdk.sdk.authenticateRequest(
      reqWith({
        cookie,
        "x-local-user-openid": "user-3",
      })
    ) as UserRow | null;
    expect(user).not.toBeNull();
    expect(user?.openId).toBe("user-2");
  });

  it("x-local-user-logout drops a valid session", async () => {
    const cookie = await signSessionCookie("user-2");
    const user = await sdk.sdk.authenticateRequest(
      reqWith({
        cookie,
        "x-local-user-logout": "true",
      })
    );
    expect(user).toBeNull();
  });
});

describe("Phase 3 — credit enforcement on AI generation", () => {
  it("authenticated user without credits cannot run paid generation", async () => {
    // id 98 is never credited anywhere in this suite, so its balance stays 0.
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 98 })));
    await expect(
      caller.ai.improveBullets(VALID_AI_INPUT)
    ).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" });
  });

  it("credit gate opens for a user with a credit balance", async () => {
    const { grantSignupFreeCredit } = await import("./credits");
    await grantSignupFreeCredit(99);
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 99 })));
    // Payload is valid, authed, credited → the gate passes and control reaches
    // the resolver, where the unowned-resume ownership check rejects it. This
    // proves the credit gate opened without ever touching the LLM.
    await expect(
      caller.ai.generateSuggestions({
        resumeId: "res-owned-by-user-2",
        jobDescription: "Senior engineer role with 10+ years of React",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("Phase 3 — credit consume / release / retry semantics", () => {
  it("a failed build releases the consumed credit (net zero)", async () => {
    const credits = await import("./credits");
    // Fresh user: never touched elsewhere in the suite.
    await credits.grantSignupFreeCredit(97);
    expect(await credits.getCreditBalance(97)).toBe(1);

    const consumed = await credits.consumeBuildCredit(97, "build-fail-1");
    expect(consumed.ok).toBe(true);
    expect(await credits.getCreditBalance(97)).toBe(0);

    // Failure path: release restores the credit — nothing is permanently spent.
    await credits.releaseBuildCredit(97, "build-fail-1");
    expect(await credits.getCreditBalance(97)).toBe(1);
  });

  it("retrying the same build cannot double-charge", async () => {
    const credits = await import("./credits");
    await credits.grantSignupFreeCredit(96);

    const first = await credits.consumeBuildCredit(96, "build-retry-1");
    expect(first.ok).toBe(true);
    const balanceAfterFirst = await credits.getCreditBalance(96);

    // Retry with the same build: idempotency key prevents appending another -1,
    // so balance never drops below the first charge.
    const second = await credits.consumeBuildCredit(96, "build-retry-1");
    expect(await credits.getCreditBalance(96)).toBe(balanceAfterFirst);
    expect(balanceAfterFirst).toBeGreaterThanOrEqual(0);
    expect(second.balance).toBe(balanceAfterFirst);
  });
});

describe("Phase 3 — ownership enforcement on resume-backed AI", () => {
  it("generateSuggestions refuses a resume owned by another user", async () => {
    await db.createResume({
      id: "res-owned-by-user-2",
      userId: 2,
      title: "Anandu's Resume",
      templateId: "classic-ats-blue",
      content: JSON.stringify({ sections: [] }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Self-contained: this caller must clear auth AND the credit gate to reach
    // the ownership check. A zero-credit run is covered by the credit suite.
    const { grantSignupFreeCredit } = await import("./credits");
    await grantSignupFreeCredit(99);
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 99 })));
    await expect(
      caller.ai.generateSuggestions({
        resumeId: "res-owned-by-user-2",
        jobDescription: "Senior engineer role with 10+ years of React",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

async function signSessionCookie(openId: string): Promise<string> {
  const { sdk: fullSdk } = await import("./_core/sdk");
  const token = await fullSdk.createSessionToken(openId, { name: "Anandu Krishna" });
  return `${COOKIE_NAME}=${token}`;
}