/**
 * C4 validate: userEdited merge helpers (no LLM).
 * Run: npx tsx scripts/validate-c4-userEdited.mts
 */
import {
  markBulletEdits,
  mergeBulletsAi,
  mergeSummaryAi,
} from "../client/src/lib/userEditedMerge";

const summaryKeep = mergeSummaryAi("My manual summary", "AI summary", true, false);
if (summaryKeep.text !== "My manual summary" || !summaryKeep.blocked) {
  throw new Error("Expected protected summary to be kept");
}

const summaryForce = mergeSummaryAi("My manual summary", "AI summary", true, true);
if (summaryForce.text !== "AI summary" || summaryForce.summaryUserEdited) {
  throw new Error("Expected force overwrite of summary");
}

const current = ["Built APIs", "Led team"];
const ai = ["Built REST APIs", "Led engineering team"];
const flags = [true, false];
const merged = mergeBulletsAi(current, ai, flags, false);
if (merged.bullets[0] !== "Built APIs") {
  throw new Error("Expected first bullet protected");
}
if (merged.bullets[1] !== "Led engineering team") {
  throw new Error("Expected second bullet to take AI");
}
if (merged.blockedCount < 1) {
  throw new Error("Expected blockedCount >= 1");
}

const forced = mergeBulletsAi(current, ai, flags, true);
if (forced.bullets[0] !== "Built REST APIs" || forced.flags.some(Boolean)) {
  throw new Error("Expected force clear all flags and apply AI");
}

const marked = markBulletEdits(["a", "b"], ["a", "b2"], [false, false]);
if (!marked[1] || marked[0]) {
  throw new Error("markBulletEdits failed");
}

console.log("C4 validate OK: mergeSummaryAi + mergeBulletsAi + markBulletEdits");
