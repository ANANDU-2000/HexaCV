/**
 * F4 — subscription grace (3 days default).
 * Do not hard-cut paid access when endDate passes or payment fails.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { subscriptions, type SubscriptionDb } from "../drizzle/schema";
import { getDb, mockDb, updateSubscription } from "./db";

export type SubscriptionView = {
  id: string;
  userId: number;
  tier: string;
  status: string;
  provider: string;
  referenceId?: string | null;
  startDate: Date;
  endDate?: Date | null;
  graceUntil?: Date | null;
  inGrace: boolean;
};

export function getGraceDays(): number {
  const n = parseInt(process.env.SUBSCRIPTION_GRACE_DAYS || "3", 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

function freeView(userId: number): SubscriptionView {
  return {
    id: "free",
    userId,
    tier: "free",
    status: "active",
    provider: "local",
    startDate: new Date(),
    endDate: null,
    graceUntil: null,
    inGrace: false,
  };
}

function toView(
  row: any,
  inGrace: boolean
): SubscriptionView {
  return {
    id: row.id,
    userId: row.userId,
    tier: row.tier,
    status: row.status,
    provider: row.provider,
    referenceId: row.referenceId ?? null,
    startDate: row.startDate instanceof Date ? row.startDate : new Date(row.startDate),
    endDate: row.endDate
      ? row.endDate instanceof Date
        ? row.endDate
        : new Date(row.endDate)
      : null,
    graceUntil: row.graceUntil
      ? row.graceUntil instanceof Date
        ? row.graceUntil
        : new Date(row.graceUntil)
      : null,
    inGrace,
  };
}

async function loadCurrentSubscriptionRow(
  userId: number
): Promise<any | null> {
  const db = await getDb();
  if (!db) {
    const rows = (mockDb.subscriptions as any[])
      .filter(
        (s) =>
          s.userId === userId &&
          (s.status === "active" || s.status === "grace")
      )
      .sort((a, b) => {
        const ta = new Date(a.startDate || 0).getTime();
        const tb = new Date(b.startDate || 0).getTime();
        return tb - ta;
      });
    return rows[0] || null;
  }
  try {
    const rows = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          inArray(subscriptions.status, ["active", "grace"])
        )
      )
      .orderBy(desc(subscriptions.startDate))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.warn("[subscriptionGrace] load failed:", error);
    const rows = (mockDb.subscriptions as any[]).filter(
      (s) =>
        s.userId === userId &&
        (s.status === "active" || s.status === "grace")
    );
    return rows[0] || null;
  }
}

async function patchSubscriptionRow(
  userId: number,
  subId: string,
  patch: Partial<SubscriptionDb>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    const idx = mockDb.subscriptions.findIndex(
      (s: any) => s.userId === userId && s.id === subId
    );
    if (idx >= 0) {
      mockDb.subscriptions[idx] = {
        ...mockDb.subscriptions[idx],
        ...patch,
      };
    }
    return;
  }
  try {
    await db
      .update(subscriptions)
      .set(patch as any)
      .where(
        and(eq(subscriptions.userId, userId), eq(subscriptions.id, subId))
      );
  } catch (error) {
    console.warn("[subscriptionGrace] patch failed:", error);
    const idx = mockDb.subscriptions.findIndex(
      (s: any) => s.userId === userId && s.id === subId
    );
    if (idx >= 0) {
      mockDb.subscriptions[idx] = {
        ...mockDb.subscriptions[idx],
        ...patch,
      };
    }
  }
}

/**
 * Enter grace keeping tier. Idempotent if already in grace with future graceUntil.
 */
export async function enterGracePeriod(
  userId: number,
  reason: string
): Promise<SubscriptionView> {
  const row = await loadCurrentSubscriptionRow(userId);
  if (!row || row.tier === "free") {
    console.info(
      `[subscriptionGrace] skip enterGrace user=${userId} reason=${reason} (no paid sub)`
    );
    return freeView(userId);
  }

  const now = Date.now();
  const existingUntil = row.graceUntil
    ? new Date(row.graceUntil).getTime()
    : 0;
  if (row.status === "grace" && existingUntil > now) {
    console.info(
      `[subscriptionGrace] already in grace user=${userId} until=${row.graceUntil}`
    );
    return toView(row, true);
  }

  const graceUntil = new Date(
    now + getGraceDays() * 24 * 60 * 60 * 1000
  );
  await patchSubscriptionRow(userId, row.id, {
    status: "grace",
    graceUntil,
  } as any);
  console.info(
    `[subscriptionGrace] entered grace user=${userId} until=${graceUntil.toISOString()} reason=${reason}`
  );
  return toView({ ...row, status: "grace", graceUntil }, true);
}

export async function expireGraceIfNeeded(
  userId: number
): Promise<boolean> {
  const row = await loadCurrentSubscriptionRow(userId);
  if (!row || row.status !== "grace") return false;
  const until = row.graceUntil ? new Date(row.graceUntil).getTime() : 0;
  if (until > Date.now()) return false;

  await updateSubscription(userId, "free", {
    provider: row.provider || "razorpay",
    referenceId: row.referenceId || undefined,
  });
  console.info(
    `[subscriptionGrace] grace expired → free user=${userId}`
  );
  return true;
}

/**
 * Resolve subscription with F4 grace transitions. Used by getSubscription.
 */
export async function resolveSubscriptionWithGrace(
  userId: number
): Promise<SubscriptionView> {
  await expireGraceIfNeeded(userId);

  let row = await loadCurrentSubscriptionRow(userId);
  if (!row || row.tier === "free") {
    return freeView(userId);
  }

  const now = Date.now();
  const endMs = row.endDate ? new Date(row.endDate).getTime() : Infinity;

  // Active paid but period ended → enter grace (no hard-cut)
  if (
    row.status === "active" &&
    row.tier !== "free" &&
    Number.isFinite(endMs) &&
    endMs < now
  ) {
    return enterGracePeriod(userId, "endDate_passed");
  }

  // Re-check expire after possible race
  if (row.status === "grace") {
    const until = row.graceUntil ? new Date(row.graceUntil).getTime() : 0;
    if (until <= now) {
      await expireGraceIfNeeded(userId);
      return freeView(userId);
    }
    return toView(row, true);
  }

  return toView(row, false);
}

export function isEffectivelyPaid(sub: {
  tier?: string;
  status?: string;
  inGrace?: boolean;
  graceUntil?: Date | null;
}): boolean {
  const tier = (sub.tier || "free").toLowerCase();
  if (!tier || tier === "free") return false;
  if (sub.inGrace) return true;
  if (sub.status === "grace") {
    const until = sub.graceUntil ? new Date(sub.graceUntil).getTime() : 0;
    return until > Date.now();
  }
  return sub.status === "active";
}
