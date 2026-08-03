/**
 * V6 per-build credit ledger.
 * Balance = SUM(delta). Reasons: signup_free | purchase | referral_reward | build_consume | build_release | admin_grant
 */
import { randomUUID } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import {
  creditLedger,
  builds,
  affiliateReferrals,
  type CreditLedgerDb,
  type BuildDb,
} from "../drizzle/schema";
import { getDb, mockDb } from "./db";

export type CreditReason =
  | "signup_free"
  | "purchase"
  | "referral_reward"
  | "build_consume"
  | "build_release"
  | "admin_grant";

export type BuildStage =
  | "extract"
  | "target"
  | "rewrite"
  | "validate"
  | "polish"
  | "done"
  | "failed";

if (!(mockDb as any).creditLedger) {
  (mockDb as any).creditLedger = [] as CreditLedgerDb[];
}
if (!(mockDb as any).builds) {
  (mockDb as any).builds = [] as BuildDb[];
}

export async function getCreditBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    const rows = ((mockDb as any).creditLedger as CreditLedgerDb[]).filter(
      (r) => r.userId === userId
    );
    return rows.reduce((sum, r) => sum + r.delta, 0);
  }
  try {
    const result = await db
      .select({
        balance: sql<number>`coalesce(sum(${creditLedger.delta}), 0)`,
      })
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId));
    return Number(result[0]?.balance ?? 0);
  } catch (error) {
    console.warn("[credits] getCreditBalance failed:", error);
    return 0;
  }
}

async function findByIdempotencyKey(
  key: string
): Promise<CreditLedgerDb | null> {
  const db = await getDb();
  if (!db) {
    return (
      ((mockDb as any).creditLedger as CreditLedgerDb[]).find(
        (r) => r.idempotencyKey === key
      ) || null
    );
  }
  try {
    const rows = await db
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.idempotencyKey, key))
      .limit(1);
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function appendCredit(params: {
  userId: number;
  delta: number;
  reason: CreditReason;
  orderId?: string | null;
  buildId?: string | null;
  idempotencyKey: string;
}): Promise<{ row: CreditLedgerDb; duplicate: boolean; balance: number }> {
  const existing = await findByIdempotencyKey(params.idempotencyKey);
  if (existing) {
    const balance = await getCreditBalance(params.userId);
    return { row: existing, duplicate: true, balance };
  }

  const row: CreditLedgerDb = {
    id: randomUUID(),
    userId: params.userId,
    delta: params.delta,
    reason: params.reason,
    orderId: params.orderId ?? null,
    buildId: params.buildId ?? null,
    idempotencyKey: params.idempotencyKey,
    createdAt: new Date(),
  };

  const db = await getDb();
  if (!db) {
    ((mockDb as any).creditLedger as CreditLedgerDb[]).push(row);
    const balance = await getCreditBalance(params.userId);
    return { row, duplicate: false, balance };
  }

  try {
    await db.insert(creditLedger).values(row);
  } catch (error: any) {
    // Unique violation on idempotency key
    if (String(error?.message || "").includes("idem") || error?.code === "23505") {
      const again = await findByIdempotencyKey(params.idempotencyKey);
      const balance = await getCreditBalance(params.userId);
      if (again) return { row: again, duplicate: true, balance };
    }
    throw error;
  }

  const balance = await getCreditBalance(params.userId);
  return { row, duplicate: false, balance };
}

/** Grant +1 free credit once per account (idempotent). */
export async function grantSignupFreeCredit(userId: number): Promise<number> {
  const result = await appendCredit({
    userId,
    delta: 1,
    reason: "signup_free",
    idempotencyKey: `signup_free:${userId}`,
  });
  return result.balance;
}

/**
 * Grant purchase credits for a verified build order (1 credit, or N for a
 * bundle). Idempotent per order id.
 */
export async function grantPurchaseCredit(
  userId: number,
  orderId: string,
  count = 1
): Promise<number> {
  const result = await appendCredit({
    userId,
    delta: count,
    reason: "purchase",
    orderId,
    idempotencyKey: `purchase:${orderId}`,
  });
  return result.balance;
}

/**
 * Consume 1 credit for a build. Returns false if balance < 1.
 * Uses buildId for idempotency so retries don't double-charge.
 */
export async function consumeBuildCredit(
  userId: number,
  buildId: string
): Promise<{ ok: boolean; balance: number }> {
  const balance = await getCreditBalance(userId);
  if (balance < 1) {
    return { ok: false, balance };
  }
  const result = await appendCredit({
    userId,
    delta: -1,
    reason: "build_consume",
    buildId,
    idempotencyKey: `build_consume:${buildId}`,
  });
  return { ok: true, balance: result.balance };
}

/** Release a consumed credit after failed generation (net zero). */
export async function releaseBuildCredit(
  userId: number,
  buildId: string
): Promise<number> {
  const consumeKey = `build_consume:${buildId}`;
  const consumed = await findByIdempotencyKey(consumeKey);
  if (!consumed) {
    return getCreditBalance(userId);
  }
  const result = await appendCredit({
    userId,
    delta: 1,
    reason: "build_release",
    buildId,
    idempotencyKey: `build_release:${buildId}`,
  });
  return result.balance;
}

/** Referral reward: +1 to referrer when referred user completes first paid build. */
export async function grantReferralRewardOnFirstPaidBuild(
  referredUserId: number,
  orderId: string
): Promise<void> {
  const db = await getDb();
  let referral: { id: string; referrerId: number; status: string } | null = null;

  if (!db) {
    const list = mockDb.affiliateReferrals as any[];
    referral =
      list.find(
        (r) =>
          r.refereeId === referredUserId &&
          (r.status === "joined" || r.status === "pending" || r.status === "converted")
      ) || null;
  } else {
    try {
      const rows = await db
        .select()
        .from(affiliateReferrals)
        .where(eq(affiliateReferrals.refereeId, referredUserId))
        .limit(1);
      referral = rows[0]
        ? {
            id: rows[0].id,
            referrerId: rows[0].referrerId,
            status: rows[0].status,
          }
        : null;
    } catch {
      return;
    }
  }

  if (!referral || referral.referrerId === referredUserId) return;

  await appendCredit({
    userId: referral.referrerId,
    delta: 1,
    reason: "referral_reward",
    orderId,
    idempotencyKey: `referral_reward:${referredUserId}`,
  });

  // Mark converted
  if (!db) {
    const list = mockDb.affiliateReferrals as any[];
    const row = list.find((r) => r.id === referral!.id);
    if (row) {
      row.status = "converted";
      row.commissionEarned = (row.commissionEarned || 0) + 1;
    }
    return;
  }
  try {
    await db
      .update(affiliateReferrals)
      .set({ status: "converted", commissionEarned: 1 })
      .where(eq(affiliateReferrals.id, referral.id));
  } catch (error) {
    console.warn("[credits] referral status update failed:", error);
  }
}

// ——— Builds (pipeline stage tracking) ———

export async function createBuild(params: {
  userId: number;
  role?: string;
  region?: string;
}): Promise<BuildDb> {
  const row: BuildDb = {
    id: randomUUID(),
    userId: params.userId,
    resumeId: null,
    stage: "extract",
    role: params.role ?? null,
    region: params.region ?? null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const db = await getDb();
  if (!db) {
    ((mockDb as any).builds as BuildDb[]).push(row);
    return row;
  }
  try {
    await db.insert(builds).values(row);
  } catch (error) {
    console.warn("[credits] createBuild failed, mock fallback:", error);
    ((mockDb as any).builds as BuildDb[]).push(row);
  }
  return row;
}

export async function updateBuildStage(
  buildId: string,
  stage: BuildStage,
  patch?: { errorMessage?: string | null; resumeId?: string | null }
): Promise<BuildDb | null> {
  const db = await getDb();
  if (!db) {
    const list = (mockDb as any).builds as BuildDb[];
    const idx = list.findIndex((b) => b.id === buildId);
    if (idx < 0) return null;
    list[idx] = {
      ...list[idx],
      stage,
      errorMessage: patch?.errorMessage ?? list[idx].errorMessage,
      resumeId: patch?.resumeId ?? list[idx].resumeId,
      updatedAt: new Date(),
    };
    return list[idx];
  }
  try {
    await db
      .update(builds)
      .set({
        stage,
        ...(patch?.errorMessage !== undefined
          ? { errorMessage: patch.errorMessage }
          : {}),
        ...(patch?.resumeId !== undefined ? { resumeId: patch.resumeId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(builds.id, buildId));
    const rows = await db
      .select()
      .from(builds)
      .where(eq(builds.id, buildId))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.warn("[credits] updateBuildStage failed:", error);
    return null;
  }
}

export async function getBuild(
  buildId: string,
  userId: number
): Promise<BuildDb | null> {
  const db = await getDb();
  if (!db) {
    return (
      ((mockDb as any).builds as BuildDb[]).find(
        (b) => b.id === buildId && b.userId === userId
      ) || null
    );
  }
  try {
    const rows = await db
      .select()
      .from(builds)
      .where(and(eq(builds.id, buildId), eq(builds.userId, userId)))
      .limit(1);
    return rows[0] || null;
  } catch {
    return null;
  }
}
