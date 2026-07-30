/**
 * F5 validate: admin refund marks order refunded, revokes tier, idempotent.
 * Run: npx tsx scripts/validate-f5-refund.mts
 */
import { createHmac } from "crypto";
import {
  createRazorpayOrder,
  resetPaymentOrdersForTests,
  verifyAndFulfillCheckout,
  adminRefundPaymentOrder,
} from "../server/payments/razorpay";
import { mockDb } from "../server/db";

process.env.PAYMENT_PROVIDER = "razorpay";
process.env.RAZORPAY_KEY_ID = "";
process.env.RAZORPAY_KEY_SECRET = "test_secret_hexacv";

resetPaymentOrdersForTests();
mockDb.subscriptions = mockDb.subscriptions.filter(
  (s: { userId: number }) => s.userId !== 99
);

const created = await createRazorpayOrder({ userId: 99, tier: "pro" });
const paymentId = "pay_mock_f5_1";
const signature = createHmac("sha256", "test_secret_hexacv")
  .update(`${created.orderId}|${paymentId}`)
  .digest("hex");

await verifyAndFulfillCheckout({
  userId: 99,
  orderId: created.orderId,
  paymentId,
  signature,
});

const sub = mockDb.subscriptions.find((s: { userId: number }) => s.userId === 99);
if (!sub || sub.tier !== "pro") {
  throw new Error(`Expected pro after pay, got ${JSON.stringify(sub)}`);
}

const first = await adminRefundPaymentOrder({
  paymentOrderId: created.paymentOrderId,
  reason: "test refund within window",
  adminUserId: 1,
});
if (first.duplicate) throw new Error("First refund must not be duplicate");
if (first.order.status !== "refunded") {
  throw new Error(`Expected refunded status, got ${first.order.status}`);
}

const subAfter = mockDb.subscriptions.find(
  (s: { userId: number }) => s.userId === 99
);
if (!subAfter || subAfter.tier !== "free") {
  throw new Error(`Expected free after refund, got ${JSON.stringify(subAfter)}`);
}

const second = await adminRefundPaymentOrder({
  paymentOrderId: created.paymentOrderId,
  reason: "retry",
  adminUserId: 1,
});
if (!second.duplicate) throw new Error("Second refund must be duplicate");

console.log("validate-f5-refund: OK");
