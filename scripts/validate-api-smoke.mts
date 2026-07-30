/**
 * Smoke: structural + sandbox billing checks (no live LLM / live Razorpay keys required).
 * Run: npx tsx scripts/validate-api-smoke.mts
 */
import { createHmac } from "crypto";
import { RAZORPAY_PRICES_PAISE } from "../server/payments/razorpay";
import {
  createRazorpayOrder,
  getPaymentProvider,
  resetPaymentOrdersForTests,
  verifyAndFulfillCheckout,
  adminRefundPaymentOrder,
  listPaymentOrders,
} from "../server/payments/razorpay";
import { mockDb, setUserEvaluationOptOut } from "../server/db";
import { systemRouter } from "../server/_core/systemRouter";

process.env.PAYMENT_PROVIDER = "razorpay";
process.env.RAZORPAY_KEY_ID = "";
process.env.RAZORPAY_KEY_SECRET = "smoke_secret";

if (getPaymentProvider() !== "razorpay") {
  throw new Error("Expected razorpay provider");
}

if (RAZORPAY_PRICES_PAISE.pro !== 39900 || RAZORPAY_PRICES_PAISE.enterprise !== 79900) {
  throw new Error("Pricing paise mismatch vs Pricing.tsx");
}

const healthCaller = systemRouter.createCaller({} as any);
const health = await healthCaller.health({ timestamp: Date.now() });
if (!(health as { ok?: boolean }).ok) {
  throw new Error("system.health did not return ok");
}

resetPaymentOrdersForTests();
const order = await createRazorpayOrder({ userId: 2, tier: "pro" });
if (order.amount !== 39900) throw new Error("createCheckout amount mismatch");

const paymentId = "pay_smoke_1";
const signature = createHmac("sha256", "smoke_secret")
  .update(`${order.orderId}|${paymentId}`)
  .digest("hex");
await verifyAndFulfillCheckout({
  userId: 2,
  orderId: order.orderId,
  paymentId,
  signature,
});

const listed = await listPaymentOrders(10);
if (!listed.some((o) => o.id === order.paymentOrderId && o.status === "verified")) {
  throw new Error("listPaymentOrders missing verified order");
}

await adminRefundPaymentOrder({
  paymentOrderId: order.paymentOrderId,
  reason: "smoke refund",
  adminUserId: 1,
});

await setUserEvaluationOptOut(2, true);
const u = mockDb.users.find((x: { id: number }) => x.id === 2);
if (!u?.evaluationOptOut) throw new Error("evaluationOptOut not set");
await setUserEvaluationOptOut(2, false);

console.log("validate-api-smoke: OK", {
  provider: getPaymentProvider(),
  health: typeof health,
  orderId: order.orderId,
  listed: listed.length,
});
