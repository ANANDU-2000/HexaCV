/**
 * C1 validate (no live LLM): pipeline exports + model_routing stages.
 * Run: npx tsx scripts/validate-c1-pipeline.mts
 */
import { ensureModelRoutingLoaded, getOrderedModelsForStage } from "../server/apiKeyManager";
import { runResumePipeline, stageExtract, stageTarget, stageRewrite } from "../server/ai/pipelineOrchestrator";

if (typeof runResumePipeline !== "function") {
  throw new Error("runResumePipeline missing");
}
if (typeof stageExtract !== "function" || typeof stageTarget !== "function" || typeof stageRewrite !== "function") {
  throw new Error("C1 stage helpers missing");
}

await ensureModelRoutingLoaded();

for (const stage of ["extract", "target", "rewrite"] as const) {
  const models = getOrderedModelsForStage(stage);
  if (models.length === 0) {
    throw new Error(`No models routed for stage "${stage}"`);
  }
  console.log(`stage ${stage}:`, models.slice(0, 3).join(", "), models.length > 3 ? "…" : "");
}

console.log("C1 validate OK: orchestrator exports + extract/target/rewrite routing");
