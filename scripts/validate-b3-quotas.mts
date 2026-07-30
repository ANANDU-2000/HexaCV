/**
 * B3 validate: guest quota=1 blocks 2nd call; cheapOnly skips premium.
 * Run: pnpm exec tsx scripts/validate-b3-quotas.mts
 */
process.env.AI_QUOTA_GUEST = "1";

const {
  assertQuotaAllowed,
  recordGuestCall,
  resetQuotaCountersForTests,
  selectModelForCall,
  isPremiumModel,
  getAiQuotaConfig,
} = await import("../server/usageTracker");

resetQuotaCountersForTests();

const cfg = getAiQuotaConfig();
if (cfg.guestDailyCalls !== 1) {
  throw new Error(`Expected guestDailyCalls=1, got ${cfg.guestDailyCalls}`);
}

const guestOpts = { planTier: "guest" as const, guestKey: "g1" };

await assertQuotaAllowed(guestOpts);
recordGuestCall("g1");

let threw = false;
try {
  await assertQuotaAllowed(guestOpts);
} catch (e) {
  threw = true;
  const msg = e instanceof Error ? e.message : String(e);
  if (!msg.includes("AI daily quota exceeded")) {
    throw new Error(`Unexpected quota error message: ${msg}`);
  }
}
if (!threw) {
  throw new Error("Expected 2nd guest assertQuotaAllowed to throw");
}

if (!isPremiumModel("gpt-4o")) {
  throw new Error("gpt-4o should be premium");
}

const cheap = selectModelForCall("gpt-4o", "default", { cheapOnly: true });
if (isPremiumModel(cheap)) {
  throw new Error(`cheapOnly still selected premium model: ${cheap}`);
}

console.log("B3 validate OK:", {
  guestQuotaBlocked: true,
  cheapOnlyModel: cheap,
});
