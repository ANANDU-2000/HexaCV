/**
 * C5 validate: prompt versioning + evaluations (mock DB, no live LLM).
 * Run: npx tsx scripts/validate-c5-prompts.mts
 */
import {
  getActivePrompt,
  insertPromptVersion,
  insertResumeEvaluation,
  promotePromptVersion,
  resetPromptVersionStoresForTests,
  DEFAULT_REWRITE_PROMPT_BODY,
} from "../server/promptVersions";

resetPromptVersionStoresForTests();

const v1 = await insertPromptVersion({
  stage: "rewrite",
  body: DEFAULT_REWRITE_PROMPT_BODY,
  createdBy: "test",
  promote: true,
});
if (!v1.isActive || v1.version !== 1) {
  throw new Error(`Expected v1 active version 1, got ${JSON.stringify(v1)}`);
}

const active1 = await getActivePrompt("rewrite");
if (!active1 || active1.id !== v1.id) {
  throw new Error("Active prompt should be v1 after seed");
}

const v2 = await insertPromptVersion({
  stage: "rewrite",
  body: DEFAULT_REWRITE_PROMPT_BODY + "\n/* v2 marker */",
  createdBy: "test",
  promote: false,
});
if (v2.isActive) {
  throw new Error("v2 must not be active until promoted");
}

const stillV1 = await getActivePrompt("rewrite");
if (!stillV1 || stillV1.id !== v1.id) {
  throw new Error("Inserting inactive v2 must not change active prompt");
}

const promoted = await promotePromptVersion(v2.id);
if (!promoted?.isActive || promoted.id !== v2.id) {
  throw new Error("Promote failed");
}
const active2 = await getActivePrompt("rewrite");
if (!active2 || active2.id !== v2.id) {
  throw new Error("Active should be v2 after promote");
}
if (active2.body.includes("v2 marker") !== true) {
  throw new Error("Active body should be v2");
}

const evalRow = await insertResumeEvaluation({
  userId: 1,
  resumeId: "resume-test",
  stage: "rewrite",
  promptVersionId: active2.id,
  rating: "up",
  note: "looks good",
});
if (!evalRow.id || evalRow.rating !== "up") {
  throw new Error("Evaluation insert failed");
}

console.log("C5 validate OK:", {
  v1: v1.version,
  activeAfterV2Insert: stillV1.version,
  activeAfterPromote: active2.version,
  evaluationId: evalRow.id,
});
