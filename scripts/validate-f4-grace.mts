/**
 * F4 validate: subscription grace enter + expire (mock DB).
 * Run: npx tsx scripts/validate-f4-grace.mts
 */
import { mockDb } from "../server/db";
import {
  getGraceDays,
  isEffectivelyPaid,
  resolveSubscriptionWithGrace,
} from "../server/subscriptionGrace";

process.env.SUBSCRIPTION_GRACE_DAYS = "3";

if (getGraceDays() !== 3) {
  throw new Error("Expected grace days 3");
}

const userId = 99;
mockDb.subscriptions = mockDb.subscriptions.filter(
  (s: { userId: number }) => s.userId !== userId
);

mockDb.subscriptions.push({
  id: "sub-grace-test",
  userId,
  tier: "pro",
  status: "active",
  provider: "razorpay",
  referenceId: "ref_test",
  startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
  endDate: new Date(Date.now() - 60 * 1000), // expired 1 min ago
  graceUntil: null,
});

const inGrace = await resolveSubscriptionWithGrace(userId);
if (!inGrace.inGrace || inGrace.status !== "grace" || inGrace.tier !== "pro") {
  throw new Error(`Expected grace/pro, got ${JSON.stringify(inGrace)}`);
}
if (!isEffectivelyPaid(inGrace)) {
  throw new Error("Grace period must still count as paid");
}
if (!inGrace.graceUntil || new Date(inGrace.graceUntil).getTime() <= Date.now()) {
  throw new Error("graceUntil must be in the future");
}

// Force grace expired
const row = mockDb.subscriptions.find((s: { userId: number }) => s.userId === userId);
if (!row) throw new Error("missing row");
row.status = "grace";
row.graceUntil = new Date(Date.now() - 1000);
row.tier = "pro";

const afterExpire = await resolveSubscriptionWithGrace(userId);
if (afterExpire.tier !== "free" || afterExpire.inGrace) {
  throw new Error(`Expected free after grace expiry, got ${JSON.stringify(afterExpire)}`);
}
if (isEffectivelyPaid(afterExpire)) {
  throw new Error("Expired grace must not be paid");
}

const stable = await resolveSubscriptionWithGrace(userId);
if (stable.tier !== "free") {
  throw new Error("Second call should stay free");
}

console.log("F4 validate OK:", {
  graceDays: getGraceDays(),
  enteredGrace: inGrace.status,
  afterExpire: afterExpire.tier,
  stable: stable.tier,
});
