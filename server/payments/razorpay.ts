/**
 * Razorpay primary payments — orders, signature verify, payment_orders persistence.
 * Server sets amounts; never trust client-reported price or success alone.
 */
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { eq, desc } from "drizzle-orm";
import {
  paymentOrders,
  type PaymentOrderDb,
} from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getDb, mockDb, updateSubscription } from "../db";

export const RAZORPAY_PRICES_PAISE: Record<string, number> = {
  pro: 39900,
  enterprise: 79900,
};

export type PaymentOrderStatus =
  | "pending"
  | "verified"
  | "failed"
  | "refunded";

export function getPaymentProvider(): "razorpay" | "stripe" {
  return ENV.paymentProvider === "stripe" ? "stripe" : "razorpay";
}

export function getRazorpayKeyId(): string {
  return (process.env.RAZORPAY_KEY_ID || ENV.razorpayKeyId || "").trim();
}

export function getRazorpayKeySecret(): string {
  return (process.env.RAZORPAY_KEY_SECRET || ENV.razorpayKeySecret || "").trim();
}

export function getRazorpayWebhookSecret(): string {
  return (
    process.env.RAZORPAY_WEBHOOK_SECRET || ENV.razorpayWebhookSecret || ""
  ).trim();
}

export function amountPaiseForTier(tier: string): number {
  const amount = RAZORPAY_PRICES_PAISE[tier];
  if (!amount) {
    throw new Error(`Unsupported billing tier: ${tier}`);
  }
  return amount;
}

export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret ?? getRazorpayKeySecret();
  if (!secret || !params.orderId || !params.paymentId || !params.signature) {
    return false;
  }
  const expected = createHmac("sha256", secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(params.signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret?: string
): boolean {
  const whSecret = secret ?? getRazorpayWebhookSecret();
  if (!whSecret || !signature) return false;
  const body =
    typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const expected = createHmac("sha256", whSecret).update(body).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function resetPaymentOrdersForTests(): void {
  mockDb.paymentOrders = [];
}

async function insertPaymentOrder(row: PaymentOrderDb): Promise<PaymentOrderDb> {
  const db = await getDb();
  if (!db) {
    mockDb.paymentOrders.push(row);
    return row;
  }
  try {
    await db.insert(paymentOrders).values(row);
    return row;
  } catch (error) {
    console.warn("[razorpay] insertPaymentOrder DB failed, using mock:", error);
    mockDb.paymentOrders.push(row);
    return row;
  }
}

export async function findPaymentOrderByRazorpayOrderId(
  razorpayOrderId: string
): Promise<PaymentOrderDb | null> {
  const db = await getDb();
  if (!db) {
    return (
      (mockDb.paymentOrders as PaymentOrderDb[]).find(
        (o) => o.razorpayOrderId === razorpayOrderId
      ) || null
    );
  }
  try {
    const rows = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.razorpayOrderId, razorpayOrderId))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.warn("[razorpay] findPaymentOrder failed:", error);
    return (
      (mockDb.paymentOrders as PaymentOrderDb[]).find(
        (o) => o.razorpayOrderId === razorpayOrderId
      ) || null
    );
  }
}

async function persistOrderUpdate(
  razorpayOrderId: string,
  patch: Partial<PaymentOrderDb>
): Promise<PaymentOrderDb | null> {
  const now = new Date();
  const db = await getDb();
  if (!db) {
    const list = mockDb.paymentOrders as PaymentOrderDb[];
    const idx = list.findIndex((o) => o.razorpayOrderId === razorpayOrderId);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...patch, updatedAt: now };
    return list[idx];
  }
  try {
    await db
      .update(paymentOrders)
      .set({ ...patch, updatedAt: now })
      .where(eq(paymentOrders.razorpayOrderId, razorpayOrderId));
    return findPaymentOrderByRazorpayOrderId(razorpayOrderId);
  } catch (error) {
    console.warn("[razorpay] persistOrderUpdate failed:", error);
    const list = mockDb.paymentOrders as PaymentOrderDb[];
    const idx = list.findIndex((o) => o.razorpayOrderId === razorpayOrderId);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...patch, updatedAt: now };
    return list[idx];
  }
}

/**
 * Create Razorpay order (live API) or sandbox mock order when keys missing.
 * Always persists payment_orders row as pending.
 */
export async function createRazorpayOrder(params: {
  userId: number;
  tier: string;
}): Promise<{
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  tier: string;
  paymentOrderId: string;
  sandbox: boolean;
}> {
  const tier = params.tier.toLowerCase();
  const amountPaise = amountPaiseForTier(tier);
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();

  let razorpayOrderId: string;
  let sandbox = false;

  if (keyId && keySecret && !keyId.includes("...")) {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `hexacv_${params.userId}_${Date.now()}`,
        notes: {
          userId: String(params.userId),
          tier,
        },
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Razorpay Orders API ${res.status}: ${errText}`);
    }
    const order = (await res.json()) as { id: string };
    if (!order.id) throw new Error("Razorpay order missing id");
    razorpayOrderId = order.id;
  } else {
    sandbox = true;
    razorpayOrderId = `order_mock_${randomUUID().replace(/-/g, "").slice(0, 14)}`;
    console.warn(
      "[razorpay] RAZORPAY_KEY_ID/SECRET missing or placeholder — sandbox order",
      razorpayOrderId
    );
  }

  const row: PaymentOrderDb = {
    id: randomUUID(),
    userId: params.userId,
    tier,
    amountPaise,
    currency: "INR",
    razorpayOrderId,
    razorpayPaymentId: null,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await insertPaymentOrder(row);

  return {
    keyId: keyId || "rzp_test_sandbox",
    orderId: razorpayOrderId,
    amount: amountPaise,
    currency: "INR",
    tier,
    paymentOrderId: row.id,
    sandbox,
  };
}

/**
 * Mark order verified + apply subscription. Idempotent if already verified.
 */
export async function fulfillVerifiedPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  expectedUserId?: number;
}): Promise<{ duplicate: boolean; order: PaymentOrderDb | null }> {
  const order = await findPaymentOrderByRazorpayOrderId(params.razorpayOrderId);
  if (!order) {
    throw new Error(`Unknown Razorpay order: ${params.razorpayOrderId}`);
  }
  if (
    params.expectedUserId != null &&
    order.userId !== params.expectedUserId
  ) {
    throw new Error("Order does not belong to this user");
  }
  if (order.status === "verified") {
    console.info(
      `[razorpay] Skipping duplicate fulfill for ${params.razorpayOrderId}`
    );
    return { duplicate: true, order };
  }

  const updated = await persistOrderUpdate(params.razorpayOrderId, {
    status: "verified",
    razorpayPaymentId: params.razorpayPaymentId || order.razorpayPaymentId,
  });

  await updateSubscription(order.userId, order.tier, {
    provider: "razorpay",
    referenceId: params.razorpayPaymentId || params.razorpayOrderId,
  });

  return { duplicate: false, order: updated };
}

export async function verifyAndFulfillCheckout(params: {
  userId: number;
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ duplicate: boolean; order: PaymentOrderDb | null }> {
  const ok = verifyCheckoutSignature({
    orderId: params.orderId,
    paymentId: params.paymentId,
    signature: params.signature,
  });
  if (!ok) {
    // Sandbox mock orders: allow verify only when no real secret configured
    const secret = getRazorpayKeySecret();
    const isMock = params.orderId.startsWith("order_mock_");
    if (!(isMock && !secret)) {
      throw new Error("Invalid Razorpay payment signature");
    }
  }
  return fulfillVerifiedPayment({
    razorpayOrderId: params.orderId,
    razorpayPaymentId: params.paymentId,
    expectedUserId: params.userId,
  });
}

export async function findPaymentOrderById(
  id: string
): Promise<PaymentOrderDb | null> {
  const db = await getDb();
  if (!db) {
    return (
      (mockDb.paymentOrders as PaymentOrderDb[]).find((o) => o.id === id) ||
      null
    );
  }
  try {
    const rows = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, id))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.warn("[razorpay] findPaymentOrderById failed:", error);
    return (
      (mockDb.paymentOrders as PaymentOrderDb[]).find((o) => o.id === id) ||
      null
    );
  }
}

export async function listPaymentOrders(limit = 100): Promise<PaymentOrderDb[]> {
  const db = await getDb();
  if (!db) {
    return [...(mockDb.paymentOrders as PaymentOrderDb[])]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, limit);
  }
  try {
    return await db
      .select()
      .from(paymentOrders)
      .orderBy(desc(paymentOrders.createdAt))
      .limit(limit);
  } catch (error) {
    console.warn("[razorpay] listPaymentOrders failed:", error);
    return [...(mockDb.paymentOrders as PaymentOrderDb[])]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, limit);
  }
}

/**
 * F5 — Admin refund: Razorpay refund API (or sandbox), mark order refunded,
 * revoke paid tier to free. Idempotent if already refunded.
 */
export async function adminRefundPaymentOrder(params: {
  paymentOrderId: string;
  reason: string;
  adminUserId: number;
}): Promise<{
  duplicate: boolean;
  order: PaymentOrderDb;
  sandbox: boolean;
}> {
  const order = await findPaymentOrderById(params.paymentOrderId);
  if (!order) {
    throw new Error(`Unknown payment order: ${params.paymentOrderId}`);
  }
  if (order.status === "refunded") {
    return { duplicate: true, order, sandbox: false };
  }
  if (order.status !== "verified") {
    throw new Error(
      `Only verified orders can be refunded (status=${order.status})`
    );
  }

  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  let sandbox = false;

  if (
    order.razorpayPaymentId &&
    keyId &&
    keySecret &&
    !keyId.includes("...") &&
    !order.razorpayPaymentId.startsWith("pay_mock_")
  ) {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${order.razorpayPaymentId}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: order.amountPaise,
          notes: {
            reason: params.reason.slice(0, 500),
            adminUserId: String(params.adminUserId),
            paymentOrderId: order.id,
          },
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Razorpay refund API ${res.status}: ${errText}`);
    }
  } else {
    sandbox = true;
    console.warn(
      "[razorpay] F5 sandbox refund (no live payment id/keys)",
      order.id,
      params.reason
    );
  }

  const updated = await persistOrderUpdate(order.razorpayOrderId, {
    status: "refunded",
  });
  if (!updated) {
    throw new Error("Failed to mark payment order refunded");
  }

  await updateSubscription(order.userId, "free", {
    provider: "razorpay",
    referenceId: `refund_${order.id}`,
  });

  console.log(
    `[Admin] refundPayment by user=${params.adminUserId} order=${order.id} userId=${order.userId} reason=${params.reason}`
  );

  return { duplicate: false, order: updated, sandbox };
}
