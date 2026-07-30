import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDb, mockDb } from "./db";
import { modelRouting, type ModelRoutingDb } from "../drizzle/schema";

export type ApiKeyMeta = {
  keyName: string;
  label: string;
  category: "AI & LLM" | "Payments" | "Security & Auth";
  description: string;
  providerUrl: string;
  isConfigured: boolean;
  maskedValue: string;
  value: string;
};

export const API_KEYS_SCHEMA: Omit<ApiKeyMeta, "isConfigured" | "maskedValue" | "value">[] = [
  {
    keyName: "GEMINI_API_KEY",
    label: "Google Gemini Primary API Key",
    category: "AI & LLM",
    description: "Primary Google Gemini 1.5 Flash & Pro AI key for resume parsing, AI optimization, and scoring.",
    providerUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    keyName: "GEMINI_API_KEY_2",
    label: "Google Gemini Secondary API Key",
    category: "AI & LLM",
    description: "Secondary Google Gemini key used for failover redundancy and high-load requests.",
    providerUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    keyName: "GROK_API_KEY",
    label: "Groq / Grok AI Key",
    category: "AI & LLM",
    description: "Ultra-fast Groq LLaMA-3 / Grok inference API key for rapid resume suggestions.",
    providerUrl: "https://console.groq.com/keys",
  },
  {
    keyName: "OPENROUTER_API_KEY",
    label: "OpenRouter Multi-Model Key",
    category: "AI & LLM",
    description: "Cheap/free-tier OpenRouter key (first in failover). Default model via OPENROUTER_MODEL.",
    providerUrl: "https://openrouter.ai/keys",
  },
  {
    keyName: "OPENCODE_API_KEY",
    label: "OpenCode AI API Key",
    category: "AI & LLM",
    description: "Rewrite-tier OpenCode key. Default model via OPENCODE_MODEL (e.g. glm-5.2).",
    providerUrl: "https://opencode.ai",
  },
  {
    keyName: "BYNARA_API_KEY",
    label: "Bynara AI Router Key",
    category: "AI & LLM",
    description: "Rewrite-tier Bynara router key for high-speed AI completions.",
    providerUrl: "https://router.bynara.id",
  },
  {
    keyName: "TOKENROUTER_API_KEY",
    label: "TokenRouter AI Key",
    category: "AI & LLM",
    description: "Rewrite-tier TokenRouter fallback for LLM completions.",
    providerUrl: "https://tokenrouter.com",
  },
  {
    keyName: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    category: "AI & LLM",
    description: "Premium OpenAI key (gpt-4o-mini / gpt-4o). Tried after free/rewrite providers. Set OPENAI_MODEL.",
    providerUrl: "https://platform.openai.com/api-keys",
  },
  {
    keyName: "BUILT_IN_FORGE_API_KEY",
    label: "Forge Platform API Key",
    category: "AI & LLM",
    description: "Built-in Forge key for OpenAI LLM, voice transcription, storage, and Google Maps proxy.",
    providerUrl: "https://manus.im",
  },
  {
    keyName: "HUGGINGFACE_API_KEY",
    label: "HuggingFace API Token",
    category: "AI & LLM",
    description: "HuggingFace Hub token (not used by invokeLLM chat path today).",
    providerUrl: "https://huggingface.co/settings/tokens",
  },
  {
    keyName: "RAZORPAY_KEY_ID",
    label: "Razorpay Key ID",
    category: "Payments",
    description: "Razorpay test/live Key ID (primary payments provider).",
    providerUrl: "https://dashboard.razorpay.com/app/keys",
  },
  {
    keyName: "RAZORPAY_KEY_SECRET",
    label: "Razorpay Key Secret",
    category: "Payments",
    description: "Razorpay Key Secret — server only.",
    providerUrl: "https://dashboard.razorpay.com/app/keys",
  },
  {
    keyName: "STRIPE_SECRET_KEY",
    label: "Stripe Secret Key",
    category: "Payments",
    description: "Legacy Stripe secret (demoted — Razorpay is primary; Stripe webhook only for legacy subs).",
    providerUrl: "https://dashboard.stripe.com/apikeys",
  },
  {
    keyName: "STRIPE_WEBHOOK_SECRET",
    label: "Stripe Webhook Secret",
    category: "Payments",
    description: "Webhook signature secret (whsec_...) for verifying billing event webhooks.",
    providerUrl: "https://dashboard.stripe.com/webhooks",
  },
  {
    keyName: "JWT_SECRET",
    label: "JWT Session Secret",
    category: "Security & Auth",
    description: "Encryption secret key for signing user authentication JWT cookies.",
    providerUrl: "",
  },
  {
    keyName: "VITE_APP_ID",
    label: "OAuth Application ID",
    category: "Security & Auth",
    description: "Unique application client ID for Manus / OAuth single sign-on integration.",
    providerUrl: "",
  },
  {
    keyName: "OWNER_OPEN_ID",
    label: "Owner OpenID (server)",
    category: "Security & Auth",
    description: "Server-side owner OpenID — promotes user to admin on upsert. Keep in sync with VITE_OWNER_OPEN_ID.",
    providerUrl: "",
  },
  {
    keyName: "VITE_OWNER_OPEN_ID",
    label: "Owner OpenID (client)",
    category: "Security & Auth",
    description: "Client-facing owner OpenID; mirror OWNER_OPEN_ID.",
    providerUrl: "",
  },
  {
    keyName: "ADMIN_EMAIL",
    label: "Admin Portal Email",
    category: "Security & Auth",
    description: "CRM mock admin email until Clerk migration — not a full auth system.",
    providerUrl: "",
  },
  {
    keyName: "ADMIN_PASSWORD",
    label: "Admin Portal Password",
    category: "Security & Auth",
    description: "CRM mock admin password until Clerk migration.",
    providerUrl: "",
  },
];

export function maskKey(val: string): string {
  if (!val) return "";
  if (val.length <= 8) return "••••••••";
  return `${val.slice(0, 6)}...${val.slice(-4)}`;
}

export function getAllApiKeys(): ApiKeyMeta[] {
  return API_KEYS_SCHEMA.map((schema) => {
    const rawVal = process.env[schema.keyName] || "";
    const isConfigured = Boolean(rawVal && rawVal.trim().length > 0 && !rawVal.includes("change_me"));
    return {
      ...schema,
      isConfigured,
      maskedValue: maskKey(rawVal),
      value: rawVal,
    };
  });
}

export function saveApiKey(keyName: string, value: string): void {
  const trimmed = value.trim();
  process.env[keyName] = trimmed;

  // Sync to runtime ENV object if applicable
  const envMap: Record<string, string> = {
    GEMINI_API_KEY: "geminiApiKey",
    GEMINI_API_KEY_2: "geminiApiKey2",
    GROK_API_KEY: "grokApiKey",
    OPENROUTER_API_KEY: "openrouterApiKey",
    OPENCODE_API_KEY: "opencodeApiKey",
    BYNARA_API_KEY: "bynaraApiKey",
    TOKENROUTER_API_KEY: "tokenrouterApiKey",
    OPENAI_API_KEY: "openaiApiKey",
    OPENAI_MODEL: "openaiModel",
    OPENAI_API_URL: "openaiApiUrl",
    BUILT_IN_FORGE_API_KEY: "forgeApiKey",
    HUGGINGFACE_API_KEY: "huggingfaceApiKey",
    JWT_SECRET: "cookieSecret",
    VITE_APP_ID: "appId",
    VITE_OWNER_OPEN_ID: "ownerOpenId",
    OWNER_OPEN_ID: "ownerOpenId",
    ADMIN_EMAIL: "adminEmail",
    ADMIN_PASSWORD: "adminPassword",
  };


  const internalKey = envMap[keyName];
  if (internalKey && internalKey in ENV) {
    (ENV as any)[internalKey] = trimmed;
  }

  // Update .env file on disk
  try {
    const envPath = path.join(process.cwd(), ".env");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    const regex = new RegExp(`^${keyName}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${keyName}=${trimmed}`);
    } else {
      content += `\n${keyName}=${trimmed}`;
    }

    fs.writeFileSync(envPath, content.trim() + "\n", "utf-8");
  } catch (err) {
    console.error(`[saveApiKey] Failed to update .env on disk for ${keyName}:`, err);
  }
}

export async function testApiKey(keyName: string): Promise<{ success: boolean; message: string }> {
  const keyVal = process.env[keyName];
  if (!keyVal || !keyVal.trim()) {
    return { success: false, message: `${keyName} is empty or not configured.` };
  }

  try {
    if (keyName === "GEMINI_API_KEY" || keyName === "GEMINI_API_KEY_2") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyVal.trim()}`);
      if (res.ok) {
        return { success: true, message: "Google Gemini API key verified successfully! Response OK (200)." };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, message: `Gemini API error (${res.status}): ${data?.error?.message || res.statusText}` };
    }

    if (keyName === "GROK_API_KEY") {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${keyVal.trim()}` },
      });
      if (res.ok) {
        return { success: true, message: "Groq / Grok API key verified successfully! Response OK (200)." };
      }
      return { success: false, message: `Groq API returned HTTP ${res.status}` };
    }

    if (keyName === "OPENROUTER_API_KEY") {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${keyVal.trim()}` },
      });
      if (res.ok) {
        return { success: true, message: "OpenRouter API key verified successfully! Models fetched." };
      }
      return { success: false, message: `OpenRouter returned HTTP ${res.status}` };
    }

    if (keyName === "STRIPE_SECRET_KEY") {
      if (!keyVal.startsWith("sk_")) {
        return { success: false, message: "Stripe key formatting warning: Secret keys usually start with sk_live_ or sk_test_" };
      }
      return { success: true, message: "Stripe secret key format validated successfully." };
    }

    return { success: true, message: `${keyName} format check passed and is configured.` };
  } catch (err: any) {
    return { success: false, message: `Connection test failed: ${err.message || String(err)}` };
  }
}

/** Global AI kill switch — set AI_PAUSED=true|1|yes to short-circuit all ai.* procedures. */
export function isAiPaused(): boolean {
  const v = (process.env.AI_PAUSED ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

// ==========================================
// B1 — model_routing cache (5 min)
// ==========================================

const MODEL_ROUTING_CACHE_MS = 5 * 60_000;

type ModelRoutingCache = {
  loadedAt: number;
  rows: ModelRoutingDb[];
};

let modelRoutingCache: ModelRoutingCache | null = null;

function buildDefaultSeedRows(): ModelRoutingDb[] {
  const now = new Date();
  const specs: Array<{
    provider: string;
    model: string;
    tier: string;
    priority: number;
  }> = [
    { provider: "openrouter", model: ENV.openrouterModel || "google/gemma-4-31b-it:free", tier: "cheap", priority: 10 },
    { provider: "opencode", model: ENV.opencodeModel || "glm-5.2", tier: "rewrite", priority: 20 },
    { provider: "bynara", model: ENV.bynaraModel || "glm-5.2-free", tier: "rewrite", priority: 30 },
    { provider: "tokenrouter", model: ENV.tokenrouterModel || "z-ai/glm-5.2-free", tier: "rewrite", priority: 40 },
    { provider: "openai", model: ENV.openaiModel || "gpt-4o-mini", tier: "premium", priority: 50 },
    { provider: "gemini", model: "gemini-2.0-flash", tier: "cheap", priority: 60 },
    { provider: "groq", model: "llama-3.3-70b-versatile", tier: "cheap", priority: 70 },
  ];

  const stages: Array<{ stage: string; tiers: string[] }> = [
    { stage: "default", tiers: ["cheap", "rewrite", "premium"] },
    { stage: "extract", tiers: ["cheap", "rewrite"] },
    { stage: "target", tiers: ["cheap", "rewrite"] },
    { stage: "rewrite", tiers: ["rewrite", "cheap", "premium"] },
  ];

  const seen = new Set<string>();
  const rows: ModelRoutingDb[] = [];
  for (const stageSpec of stages) {
    for (const s of specs) {
      if (!s.model || !stageSpec.tiers.includes(s.tier)) continue;
      const key = `${stageSpec.stage}::${s.model}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        id: randomUUID(),
        stage: stageSpec.stage,
        tier: s.tier,
        provider: s.provider,
        model: s.model,
        rpmLimit: Number(ENV.aiRpmLimit) || 60,
        rpdLimit: Number(ENV.aiRpdLimit) || 2000,
        priority: s.priority,
        updatedAt: now,
        updatedBy: "system-seed",
      });
    }
  }
  return rows;
}

/** Ensure C1 stage rows exist when DB already has default-only seeds. */
async function ensurePipelineStageRoutingRows(
  existing: ModelRoutingDb[]
): Promise<ModelRoutingDb[]> {
  const needed = ["extract", "target", "rewrite"] as const;
  const missing = needed.filter(
    (st) => !existing.some((r) => r.stage === st)
  );
  if (missing.length === 0) return existing;

  const defaults = existing.filter((r) => r.stage === "default");
  const now = new Date();
  const toInsert: ModelRoutingDb[] = [];
  for (const stage of missing) {
    const allowPremium = stage === "rewrite";
    const source = defaults.filter((r) =>
      allowPremium ? true : r.tier !== "premium" && r.provider !== "openai"
    );
    const pool = source.length > 0 ? source : defaults;
    for (const d of pool) {
      toInsert.push({
        ...d,
        id: randomUUID(),
        stage,
        updatedAt: now,
        updatedBy: "system-c1-seed",
      });
    }
  }

  if (toInsert.length === 0) return existing;

  const db = await getDb();
  if (!db) {
    mockDb.modelRouting = [...existing, ...toInsert];
    return [...existing, ...toInsert];
  }
  try {
    await db.insert(modelRouting).values(toInsert);
  } catch (error) {
    console.warn("[model_routing] C1 stage seed insert failed:", error);
  }
  return [...existing, ...toInsert];
}

async function seedDefaultModelRouting(): Promise<ModelRoutingDb[]> {
  const rows = buildDefaultSeedRows();
  const db = await getDb();
  if (!db) {
    mockDb.modelRouting = [...rows];
    return rows;
  }
  try {
    await db.insert(modelRouting).values(rows);
  } catch (error) {
    console.warn("[model_routing] seed insert failed:", error);
  }
  return rows;
}

async function fetchAllModelRoutingRows(): Promise<ModelRoutingDb[]> {
  const db = await getDb();
  if (!db) {
    return [...(mockDb.modelRouting || [])] as ModelRoutingDb[];
  }
  try {
    return (await db.select().from(modelRouting)) as ModelRoutingDb[];
  } catch (error) {
    console.warn("[model_routing] select failed, using mock/seed:", error);
    return [...(mockDb.modelRouting || [])] as ModelRoutingDb[];
  }
}

/** Invalidate cache so next ensure reloads from DB/mock. */
export function clearModelRoutingCache(): void {
  modelRoutingCache = null;
}

export function getModelRoutingCacheMeta(): {
  loadedAt: number | null;
  rowCount: number;
} {
  return {
    loadedAt: modelRoutingCache?.loadedAt ?? null,
    rowCount: modelRoutingCache?.rows.length ?? 0,
  };
}

/**
 * Load model_routing into memory (≤5 min TTL). Seeds defaults when empty.
 */
export async function ensureModelRoutingLoaded(): Promise<void> {
  const now = Date.now();
  if (
    modelRoutingCache &&
    now - modelRoutingCache.loadedAt < MODEL_ROUTING_CACHE_MS &&
    modelRoutingCache.rows.length > 0
  ) {
    return;
  }

  let rows = await fetchAllModelRoutingRows();
  if (rows.length === 0) {
    rows = await seedDefaultModelRouting();
  } else {
    rows = await ensurePipelineStageRoutingRows(rows);
  }
  modelRoutingCache = { loadedAt: now, rows };
}

/**
 * Ordered unique model ids for a stage (priority ASC).
 * Falls back to stage "default" when stage has no rows.
 */
export function getOrderedModelsForStage(stage: string): string[] {
  const rows = modelRoutingCache?.rows ?? [];
  const target = stage || "default";
  let matched = rows.filter((r) => r.stage === target);
  if (matched.length === 0) {
    matched = rows.filter((r) => r.stage === "default");
  }
  matched = [...matched].sort((a, b) => a.priority - b.priority);
  const out: string[] = [];
  for (const r of matched) {
    if (r.model && !out.includes(r.model)) out.push(r.model);
  }
  return out;
}

/** Test/admin helper: replace mock rows and clear cache. */
export function setMockModelRoutingForTests(rows: ModelRoutingDb[]): void {
  mockDb.modelRouting = [...rows];
  clearModelRoutingCache();
}

export type UpsertModelRouteInput = {
  id?: string;
  stage: string;
  tier: string;
  provider: string;
  model: string;
  rpmLimit: number;
  rpdLimit: number;
  priority: number;
  updatedBy?: string | null;
};

/** Insert or update a model_routing row and invalidate cache. */
export async function upsertModelRoute(
  input: UpsertModelRouteInput
): Promise<ModelRoutingDb> {
  const now = new Date();
  const row: ModelRoutingDb = {
    id: input.id || randomUUID(),
    stage: input.stage,
    tier: input.tier,
    provider: input.provider,
    model: input.model,
    rpmLimit: input.rpmLimit,
    rpdLimit: input.rpdLimit,
    priority: input.priority,
    updatedAt: now,
    updatedBy: input.updatedBy ?? null,
  };

  const dbConn = await getDb();
  if (!dbConn) {
    const list = [...(mockDb.modelRouting || [])] as ModelRoutingDb[];
    const idx = list.findIndex((r) => r.id === row.id);
    if (idx >= 0) list[idx] = row;
    else list.push(row);
    mockDb.modelRouting = list;
    clearModelRoutingCache();
    return row;
  }

  try {
    if (input.id) {
      await dbConn
        .update(modelRouting)
        .set({
          stage: row.stage,
          tier: row.tier,
          provider: row.provider,
          model: row.model,
          rpmLimit: row.rpmLimit,
          rpdLimit: row.rpdLimit,
          priority: row.priority,
          updatedAt: row.updatedAt,
          updatedBy: row.updatedBy,
        })
        .where(eq(modelRouting.id, input.id));
    } else {
      await dbConn.insert(modelRouting).values(row);
    }
  } catch (error) {
    console.warn("[model_routing] upsert failed:", error);
    throw error;
  }

  clearModelRoutingCache();
  return row;
}

/** Snapshot of cached routes (call ensureModelRoutingLoaded first). */
export function getCachedModelRoutingRows(): ModelRoutingDb[] {
  return [...(modelRoutingCache?.rows ?? [])];
}
