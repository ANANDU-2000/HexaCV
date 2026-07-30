/**
 * Razorpay primary validate: orders + signature fulfill idempotency (mock, no live Razorpay).
 * Run: npx tsx scripts/validate-razorpay-orders.mts
 */
import { createHmac } from "crypto";
import {
  createRazorpayOrder,
  fulfillVerifiedPayment,
  resetPaymentOrdersForTests,
  verifyAndFulfillCheckout,
  verifyCheckoutSignature,
  RAZORPAY_PRICES_PAISE,
} from "../server/payments/razorpay";
import { mockDb } from "../server/db";

process.env.PAYMENT_PROVIDER = "razorpay";
process.env.RAZORPAY_KEY_ID = "";
process.env.RAZORPAY_KEY_SECRET = "test_secret_hexacv";
process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";

resetPaymentOrdersForTests();

if (RAZORPAY_PRICES_PAISE.pro !== 39900 || RAZORPAY_PRICES_PAISE.enterprise !== 79900) {
  throw new Error("Price lock mismatch");
}

const created = await createRazorpayOrder({ userId: 2, tier: "pro" });
if (!created.orderId.startsWith("order_mock_") || created.amount !== 39900) {
  throw new Error(`Bad sandbox order: ${JSON.stringify(created)}`);
}

const paymentId = "pay_test_validate_1";
const signature = createHmac("sha256", "test_secret_hexacv")
  .update(`${created.orderId}|${paymentId}`)
  .digest("hex");

if (
  !verifyCheckoutSignature({
    orderId: created.orderId,
    paymentId,
    signature,
    secret: "test_secret_hexacv",
  })
) {
  throw new Error("HMAC fixture failed");
}

const first = await verifyAndFulfillCheckout({
  userId: 2,
  orderId: created.orderId,
  paymentId,
  signature,
});
if (first.duplicate) throw new Error("First fulfill must not be duplicate");

const sub1 = mockDb.subscriptions.find((s: { userId: number }) => s.userId === 2);
if (!sub1 || sub1.tier !== "pro" || sub1.provider !== "razorpay") {
  throw new Error(`Expected pro/razorpay sub, got ${JSON.stringify(sub1)}`);
}

const second = await verifyAndFulfillCheckout({
  userId: 2,
  orderId: created.orderId,
  paymentId,
  signature,
});
if (!second.duplicate) throw new Error("Second fulfill must be duplicate");

const webhookDup = await fulfillVerifiedPayment({
  razorpayOrderId: created.orderId,
  razorpayPaymentId: paymentId,
});
if (!webhookDup.duplicate) {
  throw new Error("Webhook re-fulfill must be duplicate");
}

const verifiedCount = mockDb.paymentOrders.filter(
  (o: { status: string }) => o.status === "verified"
).length;
if (verifiedCount !== 1) {
  throw new Error(`Expected 1 verified order, got ${verifiedCount}`);
}

console.log("Razorpay validate OK:", {
  orderId: created.orderId,
  amount: created.amount,
  firstDuplicate: first.duplicate,
  secondDuplicate: second.duplicate,
  provider: sub1.provider,
});
