import { randomUUID } from "crypto";
import { ENV } from "./_core/env";
import { invokeLLM, type InvokeParams, type InvokeResult } from "./_core/llm";
import {
  ensureModelRoutingLoaded,
  getOrderedModelsForStage,
  getCachedModelRoutingRows,
  getModelRoutingRowByModel,
  isAiPaused,
} from "./apiKeyManager";
import { getDb, mockDb } from "./db";
import { usageLogs } from "../drizzle/schema";
import { and, eq, gte } from "drizzle-orm";
import type {
  AiPlanTier,
  AiQuotaConfig,
  AiQuotaStatus,
} from "@shared/types";

export type UsageLogInput = {
  stage: string;
  provider: string;
  model: string;
  userId?: number | null;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  status: "success" | "error";
};

export type TrackedInvokeOptions = {
  userId?: number | null;
  planTier?: AiPlanTier;
  guestKey?: string;
};

/** In-memory call timestamps per model (A3 RPM/RPD). */
const callTimestampsByModel = new Map<string, number[]>();

/** A4 circuit breaker state per model. */
export type CircuitState = {
  consecutiveRealErrors: number;
  openUntilMs: number | null;
};

const circuitsByModel = new Map<string, CircuitState>();

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * 60_000;
const CIRCUIT_OPEN_MS = 5 * 60_000;
const CIRCUIT_TRIP_AFTER = 3;

function getOrCreateCircuit(model: string): CircuitState {
  const key = model || "default";
  let state = circuitsByModel.get(key);
  if (!state) {
    state = { consecutiveRealErrors: 0, openUntilMs: null };
    circuitsByModel.set(key, state);
  }
  return state;
}

/** True if circuit is open (skip this model in A3 chain). */
export function isCircuitOpen(model: string): boolean {
  const state = circuitsByModel.get(model || "default");
  if (!state?.openUntilMs) return false;
  if (Date.now() >= state.openUntilMs) {
    state.openUntilMs = null;
    state.consecutiveRealErrors = 0;
    return false;
  }
  return true;
}

/**
 * Rate-limits (429) do not trip. Timeouts, 5xx, network, malformed JSON do.
 */
export function isCircuitTrippingError(error: unknown): boolean {
  const msg = (
    error instanceof Error ? error.message : String(error ?? "")
  ).toLowerCase();
  if (!msg) return true;
  if (/\b429\b/.test(msg) || msg.includes("rate limit") || msg.includes("rate-limit")) {
    return false;
  }
  if (
    msg.includes("timeout") ||
    msg.includes("etimedout") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("malformed") ||
    msg.includes("unexpected token") ||
    msg.includes("json parse") ||
    msg.includes("failed to parse") ||
    msg.includes("syntaxerror")
  ) {
    return true;
  }
  // Default: treat unknown provider failures as real errors (trip).
  return true;
}

/** Record a real (non-429) failure; open circuit after 3 consecutive. */
export function recordModelRealError(model: string): void {
  const state = getOrCreateCircuit(model);
  state.consecutiveRealErrors += 1;
  if (state.consecutiveRealErrors >= CIRCUIT_TRIP_AFTER) {
    state.openUntilMs = Date.now() + CIRCUIT_OPEN_MS;
    console.warn(
      `[usageTracker] A4 circuit_open for model "${model || "default"}" until ${new Date(state.openUntilMs).toISOString()}`
    );
  }
}

/** Clear streak / open state after a successful call. */
export function resetModelCircuit(model: string): void {
  const key = model || "default";
  circuitsByModel.set(key, { consecutiveRealErrors: 0, openUntilMs: null });
}

export function getCircuitState(model: string): CircuitState {
  const state = circuitsByModel.get(model || "default");
  return state
    ? { ...state }
    : { consecutiveRealErrors: 0, openUntilMs: null };
}

export function resetCircuitsForTests(): void {
  circuitsByModel.clear();
}


export function getRpmLimit(): number {
  const n = Number(ENV.aiRpmLimit);
  return Number.isFinite(n) && n > 0 ? n : 60;
}

export function getRpdLimit(): number {
  const n = Number(ENV.aiRpdLimit);
  return Number.isFinite(n) && n > 0 ? n : 2000;
}

// ==========================================
// B3 — spend ceiling + plan quotas
// ==========================================

/** In-memory guest call timestamps (UTC day). */
const guestCallTimestamps = new Map<string, number[]>();

export function getAiQuotaConfig(): AiQuotaConfig {
  // Prefer live process.env so validate scripts can override without restart.
  const guest = Number(process.env.AI_QUOTA_GUEST ?? ENV.aiQuotaGuest);
  const free = Number(process.env.AI_QUOTA_FREE ?? ENV.aiQuotaFree);
  const paid = Number(process.env.AI_QUOTA_PAID ?? ENV.aiQuotaPaid);
  const ceiling = Number(
    process.env.AI_DAILY_SPEND_CEILING_USD ?? ENV.aiDailySpendCeilingUsd
  );
  return {
    guestDailyCalls: Number.isFinite(guest) && guest >= 0 ? guest : 3,
    freeDailyCalls: Number.isFinite(free) && free >= 0 ? free : 20,
    paidDailyCalls: Number.isFinite(paid) && paid >= 0 ? paid : 200,
    dailySpendCeilingUsd:
      Number.isFinite(ceiling) && ceiling >= 0 ? ceiling : 5,
  };
}

function utcStartOfDay(now = Date.now()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function resolvePlanTier(opts?: TrackedInvokeOptions): AiPlanTier {
  if (opts?.planTier) return opts.planTier;
  if (opts?.userId != null) return "free";
  return "guest";
}

function quotaLimitForTier(tier: AiPlanTier, config: AiQuotaConfig): number {
  if (tier === "guest") return config.guestDailyCalls;
  if (tier === "paid") return config.paidDailyCalls;
  return config.freeDailyCalls;
}

export function isPremiumModel(model: string): boolean {
  const m = (model || "").toLowerCase();
  if (m.startsWith("gpt-")) return true;
  const rows = getCachedModelRoutingRows();
  const row = rows.find((r) => r.model === model);
  if (row?.tier === "premium") return true;
  if (row?.provider === "openai") return true;
  return false;
}

export async function getGlobalSpendUsdToday(): Promise<number> {
  const start = utcStartOfDay();
  const dbConn = await getDb();
  type LogRow = { costUsd: string; createdAt: Date | string };
  let rows: LogRow[] = [];
  if (!dbConn) {
    rows = ((mockDb.usageLogs || []) as LogRow[]).filter(
      (l) => new Date(l.createdAt).getTime() >= start.getTime()
    );
  } else {
    try {
      rows = (await dbConn
        .select({
          costUsd: usageLogs.costUsd,
          createdAt: usageLogs.createdAt,
        })
        .from(usageLogs)
        .where(gte(usageLogs.createdAt, start))) as LogRow[];
    } catch {
      rows = ((mockDb.usageLogs || []) as LogRow[]).filter(
        (l) => new Date(l.createdAt).getTime() >= start.getTime()
      );
    }
  }
  return rows.reduce(
    (sum, r) => sum + (Number.parseFloat(r.costUsd || "0") || 0),
    0
  );
}

async function countUserCallsToday(userId: number): Promise<number> {
  const start = utcStartOfDay();
  const dbConn = await getDb();
  if (!dbConn) {
    return ((mockDb.usageLogs || []) as Array<{ userId?: number | null; createdAt: Date | string }>).filter(
      (l) =>
        l.userId === userId &&
        new Date(l.createdAt).getTime() >= start.getTime()
    ).length;
  }
  try {
    const rows = await dbConn
      .select({ id: usageLogs.id })
      .from(usageLogs)
      .where(
        and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, start))
      );
    return rows.length;
  } catch {
    return 0;
  }
}

function countGuestCallsToday(guestKey: string): number {
  const startMs = utcStartOfDay().getTime();
  const list = guestCallTimestamps.get(guestKey) ?? [];
  const kept = list.filter((t) => t >= startMs);
  guestCallTimestamps.set(guestKey, kept);
  return kept.length;
}

export function recordGuestCall(guestKey: string): void {
  const key = guestKey || "anonymous";
  const list = guestCallTimestamps.get(key) ?? [];
  list.push(Date.now());
  guestCallTimestamps.set(key, list);
}

export async function getAiQuotaStatus(
  opts?: TrackedInvokeOptions
): Promise<AiQuotaStatus> {
  const config = getAiQuotaConfig();
  const planTier = resolvePlanTier(opts);
  const limit = quotaLimitForTier(planTier, config);
  let usedToday = 0;
  if (planTier === "guest") {
    usedToday = countGuestCallsToday(opts?.guestKey || "anonymous");
  } else if (opts?.userId != null) {
    usedToday = await countUserCallsToday(opts.userId);
  }
  const globalSpendUsdToday = await getGlobalSpendUsdToday();
  return {
    planTier,
    usedToday,
    limit,
    remaining: Math.max(0, limit - usedToday),
    globalSpendUsdToday,
    globalSpendCeilingUsd: config.dailySpendCeilingUsd,
    premiumBlockedBySpend: globalSpendUsdToday >= config.dailySpendCeilingUsd,
  };
}

export async function assertQuotaAllowed(
  opts?: TrackedInvokeOptions
): Promise<AiQuotaStatus> {
  const status = await getAiQuotaStatus(opts);
  if (status.usedToday >= status.limit) {
    throw new Error(
      "AI daily quota exceeded for your plan. Try again tomorrow or upgrade."
    );
  }
  return status;
}

export function resetQuotaCountersForTests(): void {
  guestCallTimestamps.clear();
}

/** Ordered fallback models: B1 model_routing cache, else ENV / AI_FALLBACK_MODELS. */
export function getFallbackModels(
  stage?: string,
  options?: { cheapOnly?: boolean }
): string[] {
  let fromRouting = getOrderedModelsForStage(stage || "default");
  if (options?.cheapOnly) {
    const rows = getCachedModelRoutingRows();
    const allowed = new Set(
      rows
        .filter((r) => r.tier !== "premium" && r.provider !== "openai")
        .map((r) => r.model)
        .filter((m) => !isPremiumModel(m))
    );
    fromRouting = fromRouting.filter(
      (m) => allowed.has(m) || !isPremiumModel(m)
    );
    // Prefer non-premium even if routing empty of tier metadata
    fromRouting = fromRouting.filter((m) => !isPremiumModel(m));
  }
  if (fromRouting.length > 0) return fromRouting;

  const fromEnv = ENV.aiFallbackModels
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const envList = options?.cheapOnly
    ? fromEnv.filter((m) => !isPremiumModel(m))
    : fromEnv;
  if (envList.length > 0) return envList;

  const defaults = [
    ENV.openrouterModel,
    ENV.opencodeModel,
    ENV.bynaraModel,
    ENV.tokenrouterModel,
    ...(options?.cheapOnly ? [] : [ENV.openaiModel]),
    "gemini-2.0-flash",
    "llama-3.3-70b-versatile",
  ].filter((m): m is string => !!m && m.trim().length > 0);

  return Array.from(new Set(defaults)).filter((m) =>
    options?.cheapOnly ? !isPremiumModel(m) : true
  );
}

function pruneAndCount(model: string, windowMs: number, now: number): number {
  const key = model || "default";
  const list = callTimestampsByModel.get(key) ?? [];
  const kept = list.filter((t) => now - t < windowMs);
  callTimestampsByModel.set(key, kept);
  return kept.length;
}

export function getModelRpm(model: string): number {
  return pruneAndCount(model, MS_PER_MINUTE, Date.now());
}

export function getModelRpd(model: string): number {
  return pruneAndCount(model, MS_PER_DAY, Date.now());
}

function resolvePositiveLimit(
  value: number | null | undefined,
  fallback: number
): number {
  return value != null && Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * True when at/above 80% RPM or 90% RPD (pre-emptive failover).
 * Prefer per-row model_routing limits; ENV only when row limits are nullish.
 */
export function isModelNearLimit(
  model: string,
  limits?: { rpmLimit?: number | null; rpdLimit?: number | null } | null
): boolean {
  const rpmLimit = resolvePositiveLimit(limits?.rpmLimit, getRpmLimit());
  const rpdLimit = resolvePositiveLimit(limits?.rpdLimit, getRpdLimit());
  const rpm = getModelRpm(model);
  const rpd = getModelRpd(model);
  return rpm >= rpmLimit * 0.8 || rpd >= rpdLimit * 0.9;
}

export function recordModelCall(model: string): void {
  const key = model || "default";
  const now = Date.now();
  const list = callTimestampsByModel.get(key) ?? [];
  list.push(now);
  callTimestampsByModel.set(
    key,
    list.filter((t) => now - t < MS_PER_DAY)
  );
}

/**
 * Pick first model in chain that is under RPM/RPD and not circuit_open.
 * Starts with requested model (if any), then ordered fallback list for stage.
 */
export function selectModelForCall(
  requested?: string,
  stage?: string,
  options?: { cheapOnly?: boolean }
): string {
  const chain = getFallbackModels(stage, options);
  const ordered: string[] = [];
  if (requested && requested !== "default") {
    if (!options?.cheapOnly || !isPremiumModel(requested)) {
      ordered.push(requested);
    }
  }
  for (const m of chain) {
    if (!ordered.includes(m)) ordered.push(m);
  }
  if (ordered.length === 0) {
    ordered.push(requested || "default");
  }

  for (const model of ordered) {
    if (options?.cheapOnly && isPremiumModel(model)) continue;
    if (isCircuitOpen(model)) continue;
    const row = getModelRoutingRowByModel(model);
    if (!isModelNearLimit(model, row)) {
      return model;
    }
  }

  throw new Error(
    options?.cheapOnly
      ? "AI budget ceiling reached and no non-premium models are available. Please try again tomorrow."
      : "AI capacity temporarily exceeded. Please try again shortly."
  );
}

/** Test helper: clear in-memory RPM/RPD counters. */
export function resetUsageCountersForTests(): void {
  callTimestampsByModel.clear();
}

function inferProvider(model: string): string {
  const m = model.toLowerCase();
  if (m.startsWith("gpt-") || m.includes("openai")) return "openai";
  if (m.includes("gemini") || m.includes("gemma")) return "gemini";
  if (m.includes("llama") || m.includes("mixtral") || m.includes("groq")) return "groq";
  if (m.includes("glm") || m.includes("opencode")) return "opencode";
  if (m.includes("claude")) return "anthropic";
  if (m.includes("bynara")) return "bynara";
  if (m.includes("tokenrouter") || m.includes("z-ai")) return "tokenrouter";
  if (m.includes("openrouter") || m.includes("/")) return "openrouter";
  return "failover";
}

/** Approximate USD for known paid models; free / unknown → 0. */
export function estimateCostUsd(
  model: string,
  tokensIn: number,
  tokensOut: number
): number {
  const m = model.toLowerCase();
  let inPerM = 0;
  let outPerM = 0;
  if (m.includes("gpt-4o-mini")) {
    inPerM = 0.15;
    outPerM = 0.6;
  } else if (m.includes("gpt-4o")) {
    inPerM = 2.5;
    outPerM = 10;
  } else if (m.startsWith("gpt-")) {
    inPerM = 0.15;
    outPerM = 0.6;
  }
  return (tokensIn / 1_000_000) * inPerM + (tokensOut / 1_000_000) * outPerM;
}

/**
 * Persist one AI call row. Never throws to the caller — logging must
 * not break resume generation.
 */
export async function logUsage(
  entry: UsageLogInput,
  options?: { countTowardLimits?: boolean }
): Promise<void> {
  if (options?.countTowardLimits !== false) {
    recordModelCall(entry.model);
  }

  const row = {
    id: randomUUID(),
    stage: entry.stage,
    provider: entry.provider,
    model: entry.model,
    userId: entry.userId ?? null,
    tokensIn: entry.tokensIn,
    tokensOut: entry.tokensOut,
    costUsd: entry.costUsd.toFixed(6),
    latencyMs: entry.latencyMs,
    status: entry.status,
    createdAt: new Date(),
  };

  try {
    const db = await getDb();
    if (!db) {
      const store = mockDb as { usageLogs?: typeof row[] };
      if (!store.usageLogs) store.usageLogs = [];
      store.usageLogs.push(row);
      return;
    }
    await db.insert(usageLogs).values(row);
  } catch (error) {
    console.warn("[usageTracker] failed to write usage_logs:", error);
  }
}

/**
 * Wrap invokeLLM: B3 quotas/spend + B1 routes + A3/A4 + usage_logs.
 */
export async function trackedInvokeLLM(
  stage: string,
  params: InvokeParams,
  opts?: TrackedInvokeOptions
): Promise<InvokeResult> {
  const started = Date.now();
  await ensureModelRoutingLoaded();

  let quotaStatus: AiQuotaStatus;
  try {
    quotaStatus = await assertQuotaAllowed(opts);
  } catch (error) {
    await logUsage(
      {
        stage,
        provider: "none",
        model: params.model || "default",
        userId: opts?.userId,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencyMs: Date.now() - started,
        status: "error",
      },
      { countTowardLimits: false }
    );
    throw error;
  }

  const cheapOnly = quotaStatus.premiumBlockedBySpend;

  let selectedModel: string;
  try {
    selectedModel = selectModelForCall(params.model, stage, { cheapOnly });
  } catch (error) {
    await logUsage(
      {
        stage,
        provider: "none",
        model: params.model || "default",
        userId: opts?.userId,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencyMs: Date.now() - started,
        status: "error",
      },
      { countTowardLimits: false }
    );
    throw error;
  }

  if (selectedModel !== (params.model || "default") || cheapOnly) {
    console.info(
      `[usageTracker] B3/B1/A3/A4: using model "${selectedModel}" (stage "${stage}", cheapOnly=${cheapOnly}, requested "${params.model || "default"}")`
    );
  }

  const invokeParams: InvokeParams = { ...params, model: selectedModel };

  try {
    const result = await invokeLLM(invokeParams);
    const model = result.model || selectedModel;
    const tokensIn = result.usage?.prompt_tokens ?? 0;
    const tokensOut = result.usage?.completion_tokens ?? 0;
    resetModelCircuit(selectedModel);
    if (model !== selectedModel) {
      resetModelCircuit(model);
    }
    if (resolvePlanTier(opts) === "guest") {
      recordGuestCall(opts?.guestKey || "anonymous");
    }
    await logUsage({
      stage,
      provider: inferProvider(model),
      model,
      userId: opts?.userId,
      tokensIn,
      tokensOut,
      costUsd: estimateCostUsd(model, tokensIn, tokensOut),
      latencyMs: Date.now() - started,
      status: "success",
    });
    return result;
  } catch (error) {
    if (isCircuitTrippingError(error)) {
      recordModelRealError(selectedModel);
    }
    await logUsage({
      stage,
      provider: inferProvider(selectedModel),
      model: selectedModel,
      userId: opts?.userId,
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      latencyMs: Date.now() - started,
      status: "error",
    });
    throw error;
  }
}

export type AdminUsageModelRow = {
  model: string;
  provider: string;
  rpm: number;
  rpd: number;
  rpmLimit: number;
  rpdLimit: number;
  circuitOpen: boolean;
  openUntilMs: number | null;
  spendUsdToday: string;
};

export type AdminUsageStats = {
  aiPaused: boolean;
  routes: ReturnType<typeof getCachedModelRoutingRows>;
  models: AdminUsageModelRow[];
  totals: { callsToday: number; spendUsdToday: string };
};

/** Live admin panel payload — no static/mock numbers. */
export async function buildAdminUsageStats(): Promise<AdminUsageStats> {
  await ensureModelRoutingLoaded();
  const routes = getCachedModelRoutingRows().sort(
    (a, b) => a.priority - b.priority
  );

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  type LogRow = { model: string; costUsd: string; createdAt: Date | string };
  let todayLogs: LogRow[] = [];
  const dbConn = await getDb();
  if (!dbConn) {
    todayLogs = ((mockDb.usageLogs || []) as LogRow[]).filter(
      (l) => new Date(l.createdAt).getTime() >= startOfDay.getTime()
    );
  } else {
    try {
      todayLogs = (await dbConn
        .select({
          model: usageLogs.model,
          costUsd: usageLogs.costUsd,
          createdAt: usageLogs.createdAt,
        })
        .from(usageLogs)
        .where(gte(usageLogs.createdAt, startOfDay))) as LogRow[];
    } catch (error) {
      console.warn("[usageTracker] usage_logs query failed:", error);
      todayLogs = ((mockDb.usageLogs || []) as LogRow[]).filter(
        (l) => new Date(l.createdAt).getTime() >= startOfDay.getTime()
      );
    }
  }

  const spendByModel = new Map<string, number>();
  let spendUsdToday = 0;
  for (const l of todayLogs) {
    const c = Number.parseFloat(l.costUsd || "0") || 0;
    spendUsdToday += c;
    spendByModel.set(l.model, (spendByModel.get(l.model) || 0) + c);
  }

  const defaultRpm = getRpmLimit();
  const defaultRpd = getRpdLimit();
  const seen = new Set<string>();
  const models: AdminUsageModelRow[] = [];

  for (const r of routes) {
    if (seen.has(r.model)) continue;
    seen.add(r.model);
    const circuit = getCircuitState(r.model);
    models.push({
      model: r.model,
      provider: r.provider,
      rpm: getModelRpm(r.model),
      rpd: getModelRpd(r.model),
      rpmLimit: r.rpmLimit,
      rpdLimit: r.rpdLimit,
      circuitOpen: isCircuitOpen(r.model),
      openUntilMs: circuit.openUntilMs,
      spendUsdToday: (spendByModel.get(r.model) || 0).toFixed(6),
    });
  }

  for (const [model, spend] of Array.from(spendByModel.entries())) {
    if (seen.has(model)) continue;
    seen.add(model);
    const circuit = getCircuitState(model);
    models.push({
      model,
      provider: "unknown",
      rpm: getModelRpm(model),
      rpd: getModelRpd(model),
      rpmLimit: defaultRpm,
      rpdLimit: defaultRpd,
      circuitOpen: isCircuitOpen(model),
      openUntilMs: circuit.openUntilMs,
      spendUsdToday: spend.toFixed(6),
    });
  }

  return {
    aiPaused: isAiPaused(),
    routes,
    models,
    totals: {
      callsToday: todayLogs.length,
      spendUsdToday: spendUsdToday.toFixed(6),
    },
  };
}
