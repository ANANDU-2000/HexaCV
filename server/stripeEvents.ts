/**
 * F3 — processed Stripe event IDs for webhook idempotency.
 */
import { eq } from "drizzle-orm";
import {
  processedStripeEvents,
  type ProcessedStripeEventDb,
} from "../drizzle/schema";
import { getDb, mockDb } from "./db";

export function resetProcessedStripeEventsForTests(): void {
  mockDb.processedStripeEvents = [];
}

export async function wasStripeEventProcessed(
  eventId: string
): Promise<boolean> {
  if (!eventId) return false;

  const db = await getDb();
  if (!db) {
    return (mockDb.processedStripeEvents as ProcessedStripeEventDb[]).some(
      (r) => r.id === eventId
    );
  }
  try {
    const rows = await db
      .select()
      .from(processedStripeEvents)
      .where(eq(processedStripeEvents.id, eventId))
      .limit(1);
    return rows.length > 0;
  } catch (error) {
    console.warn("[stripeEvents] wasStripeEventProcessed failed:", error);
    return (mockDb.processedStripeEvents as ProcessedStripeEventDb[]).some(
      (r) => r.id === eventId
    );
  }
}

export async function markStripeEventProcessed(
  eventId: string,
  type: string
): Promise<void> {
  if (!eventId) return;

  const row: ProcessedStripeEventDb = {
    id: eventId,
    type: type || "unknown",
    createdAt: new Date(),
  };

  const db = await getDb();
  if (!db) {
    const list = mockDb.processedStripeEvents as ProcessedStripeEventDb[];
    if (!list.some((r) => r.id === eventId)) {
      list.push(row);
    }
    return;
  }
  try {
    await db.insert(processedStripeEvents).values(row);
  } catch (error: any) {
    // Duplicate PK = already marked (concurrent retry) — treat as success
    const msg = String(error?.message || error || "");
    if (
      msg.includes("Duplicate") ||
      msg.includes("ER_DUP_ENTRY") ||
      error?.code === "ER_DUP_ENTRY"
    ) {
      return;
    }
    console.warn("[stripeEvents] markStripeEventProcessed DB failed:", error);
    const list = mockDb.processedStripeEvents as ProcessedStripeEventDb[];
    if (!list.some((r) => r.id === eventId)) {
      list.push(row);
    }
  }
}
