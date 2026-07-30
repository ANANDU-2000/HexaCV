/**
 * C2 validate: shared grounding + pipeline rewrite helpers + routing.
 * Run: npx tsx scripts/validate-c2-pipeline.mts
 */
import { AI_GROUNDING_RULES, STRICT_REWRITE_RULES, EXTRACT_PARSE_RULES } from "../server/ai/grounding";
import {
  rewriteBulletsViaPipeline,
  rewriteSummaryViaPipeline,
  rewriteProjectBulletsViaPipeline,
  stageTarget,
} from "../server/ai/pipelineOrchestrator";
import { ensureModelRoutingLoaded, getOrderedModelsForStage } from "../server/apiKeyManager";

if (!AI_GROUNDING_RULES.includes("ONLY use facts")) {
  throw new Error("AI_GROUNDING_RULES missing");
}
if (!STRICT_REWRITE_RULES.includes("ONLY rephrase")) {
  throw new Error("STRICT_REWRITE_RULES missing");
}
if (!EXTRACT_PARSE_RULES.includes("GENUINE CONTENT")) {
  throw new Error("EXTRACT_PARSE_RULES missing");
}

for (const fn of [
  rewriteBulletsViaPipeline,
  rewriteSummaryViaPipeline,
  rewriteProjectBulletsViaPipeline,
  stageTarget,
]) {
  if (typeof fn !== "function") throw new Error("C2 helper missing");
}

await ensureModelRoutingLoaded();
for (const stage of ["target", "rewrite", "extract"] as const) {
  const models = getOrderedModelsForStage(stage);
  if (models.length === 0) {
    throw new Error(`No models for stage ${stage}`);
  }
}

console.log("C2 validate OK: grounding + rewrite helpers + target/rewrite routing");
