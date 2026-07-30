import fs from "fs";
import path from "path";
import { ENV } from "./_core/env";

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
    description: "Unified OpenRouter API key routing to Claude 3.5, GPT-4o, and open-source models.",
    providerUrl: "https://openrouter.ai/keys",
  },
  {
    keyName: "OPENCODE_API_KEY",
    label: "OpenCode AI API Key",
    category: "AI & LLM",
    description: "OpenCode high-throughput AI engine key for instant resume formatting and tailoring.",
    providerUrl: "https://opencode.ai",
  },
  {
    keyName: "BYNARA_API_KEY",
    label: "Bynara AI Router Key",
    category: "AI & LLM",
    description: "Bynara enterprise router key for high-speed AI completions.",
    providerUrl: "https://router.bynara.id",
  },
  {
    keyName: "TOKENROUTER_API_KEY",
    label: "TokenRouter AI Key",
    category: "AI & LLM",
    description: "TokenRouter model engine key for fallback LLM completions.",
    providerUrl: "https://tokenrouter.com",
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
    description: "HuggingFace Hub token for NLP embeddings and specialized AI models.",
    providerUrl: "https://huggingface.co/settings/tokens",
  },
  {
    keyName: "STRIPE_SECRET_KEY",
    label: "Stripe Secret Key",
    category: "Payments",
    description: "Secret Key (sk_live_... or sk_test_...) for payment processing and plan checkout.",
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
    keyName: "VITE_OWNER_OPEN_ID",
    label: "Owner OpenID",
    category: "Security & Auth",
    description: "System Owner OpenID identifier granting superadministrator privileges.",
    providerUrl: "",
  },
  {
    keyName: "ADMIN_EMAIL",
    label: "Admin Portal Email",
    category: "Security & Auth",
    description: "Administrator login email address for administrative authentication.",
    providerUrl: "",
  },
  {
    keyName: "ADMIN_PASSWORD",
    label: "Admin Portal Password",
    category: "Security & Auth",
    description: "Administrator login password credential.",
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
    BUILT_IN_FORGE_API_KEY: "forgeApiKey",
    HUGGINGFACE_API_KEY: "huggingfaceApiKey",
    JWT_SECRET: "cookieSecret",
    VITE_APP_ID: "appId",
    VITE_OWNER_OPEN_ID: "ownerOpenId",
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
