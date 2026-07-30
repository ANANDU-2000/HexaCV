/**
 * F3 validate: Stripe webhook event idempotency (mock DB, no live Stripe).
 * Run: npx tsx scripts/validate-f3-stripe-idempotency.mts
 */
import {
  markStripeEventProcessed,
  resetProcessedStripeEventsForTests,
  wasStripeEventProcessed,
} from "../server/stripeEvents";
import { handleStripeEvent } from "../server/stripeWebhook";
import { mockDb } from "../server/db";

resetProcessedStripeEventsForTests();

const EVENT_ID = "evt_test_1";

if (await wasStripeEventProcessed(EVENT_ID)) {
  throw new Error("Fresh store must not contain evt_test_1");
}

await markStripeEventProcessed(EVENT_ID, "customer.subscription.updated");
if (!(await wasStripeEventProcessed(EVENT_ID))) {
  throw new Error("wasStripeEventProcessed should be true after mark");
}

// Second mark must not throw / duplicate row
await markStripeEventProcessed(EVENT_ID, "customer.subscription.updated");
const markedCount = mockDb.processedStripeEvents.filter(
  (r: { id: string }) => r.id === EVENT_ID
).length;
if (markedCount !== 1) {
  throw new Error(`Expected 1 mock row for evt_test_1, got ${markedCount}`);
}

resetProcessedStripeEventsForTests();

const fakeEvent = {
  id: "evt_handler_dup",
  type: "customer.subscription.updated",
  data: {
    object: {
      metadata: { userId: "2", tier: "pro" },
    },
  },
};

const first = await handleStripeEvent(fakeEvent);
if (first.duplicate) {
  throw new Error("First handle must not be duplicate");
}
if (!(await wasStripeEventProcessed("evt_handler_dup"))) {
  throw new Error("Event must be marked after successful handle");
}

const beforeTier = mockDb.subscriptions.find(
  (s: { userId: number }) => s.userId === 2
)?.tier;

const second = await handleStripeEvent({
  ...fakeEvent,
  data: {
    object: {
      metadata: { userId: "2", tier: "enterprise" },
    },
  },
});
if (!second.duplicate) {
  throw new Error("Second handle must be duplicate");
}

const afterTier = mockDb.subscriptions.find(
  (s: { userId: number }) => s.userId === 2
)?.tier;
if (afterTier !== beforeTier) {
  throw new Error(
    `Duplicate must not re-apply subscription (before=${beforeTier}, after=${afterTier})`
  );
}

console.log("F3 validate OK:", {
  markLookup: true,
  firstDuplicate: first.duplicate,
  secondDuplicate: second.duplicate,
  tierUnchanged: afterTier,
});
