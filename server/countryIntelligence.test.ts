/**
 * PHASE 5 — Country & Target Market Intelligence tests (14).
 *
 * Covers the centralized `getCountryContext` service, canonical server-side
 * validation, backward compatibility, and the multi-resume country model.
 * No LLM calls are made: valid-country AI inputs short-circuit at the credit
 * gate (PAYMENT_REQUIRED), invalid inputs are rejected by zod (BAD_REQUEST),
 * and resume create/update run against the in-memory mock DB.
 */
import { beforeAll, describe, expect, it } from "vitest";

// Env before any server module import so ENV (read at module load) captures it.
process.env.JWT_SECRET = "country-test-secret-at-least-32-bytes!!";
process.env.VITE_APP_ID = "country-test-app-id";
process.env.AI_PAUSED = "";

import type { TrpcContext } from "./_core/context";
import type { AppRouter } from "./routers";
import {
  getCountryContext,
  isValidCountryCode,
  resolveCountryCode,
  searchCountries,
  ALL_COUNTRIES,
  DEFAULT_ATS_RULES,
} from "@shared/countriesData";

let appRouter: AppRouter;
let db: typeof import("./db");

type UserRow = NonNullable<TrpcContext["user"]>;

function userRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 99,
    openId: "country-user",
    name: "Country User",
    email: "country@example.com",
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

/** Build a realistic resume.content JSON string, optionally with country codes. */
function makeResumeContent(
  countryCode?: string,
  targetCountryCode?: string,
  extra: Record<string, unknown> = {}
): string {
  return JSON.stringify({
    header: {
      name: "Priya Nair",
      email: "priya@example.com",
      phone: "9876500000",
      location: "Kochi",
      links: [],
      jobTitle: "Site Engineer",
      targetRole: "Site Engineer",
      ...(countryCode ? { countryCode } : {}),
      ...(targetCountryCode ? { targetCountryCode } : {}),
    },
    summary: "Civil engineering professional with field supervision experience.",
    skills: [{ category: "Tools", skills: ["AutoCAD", "MS Project"] }],
    experiences: [
      {
        id: "exp-1",
        company: "Acme Infra",
        role: "Site Engineer",
        startDate: "2020",
        endDate: "Present",
        current: true,
        description: ["Supervised site concreting and formwork", "Managed quality checks"],
      },
    ],
    projects: [],
    educations: [],
    certifications: [],
    achievements: [],
    languages: [],
    references: [],
    ...extra,
  });
}

beforeAll(async () => {
  appRouter = (await import("./routers")).appRouter;
  db = await import("./db");
  // Rotate test ids between runs so the shared mockDB never collides.
});

describe("Phase 5 — country master list + centralized context service", () => {
  it("1. loads the complete country list with metadata", () => {
    expect(ALL_COUNTRIES.length).toBeGreaterThan(200);
    const india = ALL_COUNTRIES.find((c) => c.code === "IN");
    expect(india?.name).toBe("India");
    expect(india?.dialCode).toBe("+91");

    // getCountryContext resolves the SAME master data (no fabrication).
    const ctx = getCountryContext("IN");
    expect(ctx).not.toBeNull();
    expect(ctx!.country.name).toBe("India");
    expect(ctx!.atsRule.regionalHiringExpectations).toBeTruthy();
  });

  it("2. searches the master list by name or code", () => {
    const uae = searchCountries("emirates");
    expect(uae.length).toBeGreaterThan(0);
    expect(uae[0].code).toBe("AE");

    const byCode = searchCountries("DE", 5);
    expect(byCode[0]?.code).toBe("DE");

    // Common shorthands resolve to the full official names.
    expect(searchCountries("uae")[0]?.code).toBe("AE");
    expect(searchCountries("usa")[0]?.code).toBe("US");
    expect(searchCountries("uk")[0]?.code).toBe("GB");

    const empty = searchCountries("  ", 3);
    expect(empty.length).toBe(3);
    expect(searchCountries("zzzz-not-a-country")).toHaveLength(0);
  });

  it("3. accepts valid ISO country codes and rejects unknowns", () => {
    expect(isValidCountryCode("IN")).toBe(true);
    expect(isValidCountryCode("us")).toBe(true); // canonicalized
    expect(resolveCountryCode(" us ")).toBe("US");
    expect(resolveCountryCode("")).toBeUndefined();
    expect(resolveCountryCode("XX")).toBeUndefined(); // not in master list
    expect(resolveCountryCode("USA")).toBeUndefined(); // malformed (3 chars)
    expect(resolveCountryCode(null)).toBeUndefined();
  });
});

describe("Phase 5 — server-side canonical validation", () => {
  it("4. rejects invalid country codes on resume.create", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 101 })));
    await expect(
      caller.resume.create({
        title: "Bad country",
        templateId: "classic-ats-blue",
        content: makeResumeContent("IN", "XX"),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("4b. rejects invalid country codes on AI generateFullResume before any LLM call", async () => {
    const caller = appRouter.createCaller(ctxWith(null));
    await expect(
      caller.ai.generateFullResume({
        jobTitle: "Site Engineer",
        experienceDetails: "worked on construction sites",
        targetCountryCode: "not-a-code",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("4d. accepts DB-extended (admin-added) countries not present in the master list", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 110 })));
    // "ZT" is not in ALL_COUNTRIES, so the shared master-list path alone would
    // reject it; the canonical validator falls back to the DB countries table.
    expect(isValidCountryCode("ZT")).toBe(false);
    await db.insertCountry({
      code: "ZT",
      name: "Teststan",
      flag: "🏳️",
      dialCode: "+990",
      phoneFormat: "XXXXXXXXX",
      phoneRegex: "^\\d{7,15}$",
      postalCodeLabel: "Postal Code",
      postalCodeFormat: "",
      dateFormat: "DD/MM/YYYY",
      addressFormat: "{city}, Teststan",
      nationality: "Teststani",
      isPriority: false,
      isActive: true,
    });
    const created = await caller.resume.create({
      title: "DB-added country",
      templateId: "classic-ats-blue",
      content: makeResumeContent("IN", "ZT"),
    });
    const stored = await db.getResume(created.id);
    const parsed = JSON.parse(stored!.content) as { header: Record<string, unknown> };
    expect(parsed.header.targetCountryCode).toBe("ZT");
  });

  it("4c. accepts valid country codes on AI procedures (no LLM needed — hits credit gate)", async () => {
    // generateFullResume is `aiProcedure` + in-mutation auth/credit; input parsing
    // runs first, so a VALID code passes zod and we stop at the credit gate.
    const caller = appRouter.createCaller(ctxWith(userRow()));
    await expect(
      caller.ai.generateFullResume({
        jobTitle: "Site Engineer",
        experienceDetails: "worked on construction sites",
        targetCountryCode: "AE",
      })
    ).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" });
  });
});

describe("Phase 5 — resume country persistence & backward compatibility", () => {
  it("5. persists the target country with a new resume (roundtrip)", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 102 })));
    const created = await caller.resume.create({
      title: "IN→US pipeline",
      templateId: "classic-ats-blue",
      content: makeResumeContent("IN", "US"),
    });
    const stored = await db.getResume(created.id);
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!.content) as { header: Record<string, unknown> };
    expect(parsed.header.countryCode).toBe("IN");
    expect(parsed.header.targetCountryCode).toBe("US");
  });

  it("6. loads existing resumes that have no country (backward compatible)", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 103 })));
    const created = await caller.resume.create({
      title: "Legacy resume",
      templateId: "classic-ats-blue",
      content: makeResumeContent(),
    });
    const stored = await db.getResume(created.id);
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!.content) as { header: Record<string, unknown> };
    expect(parsed.header.countryCode).toBeUndefined();
    expect(parsed.header.targetCountryCode).toBeUndefined();
    // No auto-assignment: the context service returns null for absent codes.
    expect(getCountryContext(undefined)).toBeNull();
  });

  it("7. changes the target country on an existing resume", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 104 })));
    const created = await caller.resume.create({
      title: "Change country",
      templateId: "classic-ats-blue",
      content: makeResumeContent("IN", "AE"),
    });
    const changed = await caller.resume.update({
      id: created.id,
      content: makeResumeContent("IN", "CA"),
    });
    const parsed = JSON.parse(changed!.content) as { header: Record<string, unknown> };
    expect(parsed.header.targetCountryCode).toBe("CA");
  });

  it("8. does not modify resume content beyond the country change", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 105 })));
    const created = await caller.resume.create({
      title: "Content preserved",
      templateId: "classic-ats-blue",
      content: makeResumeContent("IN", "US"),
    });
    const updated = await caller.resume.update({
      id: created.id,
      content: makeResumeContent("IN", "GB"),
    });
    const before = JSON.parse(created.content) as any;
    const after = JSON.parse(updated!.content) as any;
    expect(after.header.name).toBe(before.header.name);
    expect(after.summary).toBe(before.summary);
    expect(after.experiences).toEqual(before.experiences);
    expect(after.skills).toEqual(before.skills);
    expect(after.header.targetCountryCode).toBe("GB");
  });

  it("9. does not modify the resume template", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 106 })));
    const created = await caller.resume.create({
      title: "Template locked",
      templateId: "classic-ats-blue",
      content: makeResumeContent("IN", "CA"),
    });
    const updated = await caller.resume.update({
      id: created.id,
      templateId: "classic-ats-blue",
      content: makeResumeContent("IN", "AU"),
    });
    expect(updated!.templateId).toBe("classic-ats-blue");
    expect(created.templateId).toBe("classic-ats-blue");
  });
});

describe("Phase 5 — ATS/AI context, ownership & multi-resume", () => {
  it("10. includes the country in ATS/AI context (master DATA_ATS_RULES only)", () => {
    const ctx = getCountryContext("IN", "US");
    expect(ctx).not.toBeNull();
    expect(ctx!.hadSpecificRule).toBe(true);
    expect(ctx!.atsRule.keywords).toContain("Managed");
    expect(ctx!.atsRule.regionalTerminology).toMatchObject({ CV: "Resume" });
    expect(DEFAULT_ATS_RULES.some((r) => r.sourceCountryCode === "IN" && r.targetCountryCode === "US")).toBe(true);

    // Unknown target → the master-data GENERIC fallback, still no fabrication.
    const generic = getCountryContext("IN", "XX");
    expect(generic).not.toBeNull();
    expect(generic!.hadSpecificRule).toBe(false);
    expect(generic!.atsRule.preferredFormatting).toBeTruthy();
  });

  it("11. can't bypass ownership when updating a resume", async () => {
    const ownerCaller = appRouter.createCaller(ctxWith(userRow({ id: 107 })));
    const created = await ownerCaller.resume.create({
      title: "Owned",
      templateId: "classic-ats-blue",
      content: makeResumeContent("IN", "US"),
    });
    const attacker = appRouter.createCaller(ctxWith(userRow({ id: 999 })));
    await expect(
      attacker.resume.update({ id: created.id, content: makeResumeContent("FR", "DE") })
    ).rejects.toMatchObject({ message: /not found|access denied/i });
    // Owner's data is untouched.
    const stored = await db.getResume(created.id);
    const parsed = JSON.parse(stored!.content) as { header: Record<string, unknown> };
    expect(parsed.header.targetCountryCode).toBe("US");
  });

  it("12. keeps different target countries on different resumes", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 108 })));
    const a = await caller.resume.create({
      title: "Resume A",
      templateId: "classic-ats-blue",
      content: makeResumeContent("IN", "US"),
    });
    const b = await caller.resume.create({
      title: "Resume B",
      templateId: "classic-ats-blue",
      content: makeResumeContent("IN", "AU"),
    });
    const pa = JSON.parse((await db.getResume(a.id))!.content) as { header: Record<string, unknown> };
    const pb = JSON.parse((await db.getResume(b.id))!.content) as { header: Record<string, unknown> };
    expect(pa.header.targetCountryCode).toBe("US");
    expect(pb.header.targetCountryCode).toBe("AU");
  });

  it("13. guests can pick a target country without auth (metadata, not gated)", () => {
    // Guest workflow lives client-side (localStorage draft); the shared service
    // and master list it renders must work with no session, auth, or DB.
    const nonAuthCtx = getCountryContext("AE");
    expect(nonAuthCtx).not.toBeNull();
    expect(nonAuthCtx!.country.name).toBe("United Arab Emirates");
    expect(searchCountries("canada").some((c) => c.code === "CA")).toBe(true);
    expect(isValidCountryCode("SG")).toBe(true);
  });

  it("14. logged-in workflow persists the country on the account-scoped resume", async () => {
    const caller = appRouter.createCaller(ctxWith(userRow({ id: 109 })));
    const created = await caller.resume.create({
      title: "IN→CA saved",
      templateId: "classic-ats-blue",
      content: makeResumeContent("IN", "CA"),
    });
    const mine = await caller.resume.get({ id: created.id });
    const parsed = JSON.parse(mine.content) as { header: Record<string, unknown> };
    expect(parsed.header.countryCode).toBe("IN");
    expect(parsed.header.targetCountryCode).toBe("CA");
  });
});