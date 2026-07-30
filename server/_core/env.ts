export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiApiKey2: process.env.GEMINI_API_KEY_2 ?? "",
  grokApiKey: process.env.GROK_API_KEY ?? "",
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN ?? "",
  bynaraApiUrl: process.env.BYNARA_API_URL ?? "https://router.bynara.id/v1",
  bynaraApiKey: process.env.BYNARA_API_KEY ?? "",
  bynaraModel: process.env.BYNARA_MODEL ?? "glm-5.2-free",
  tokenrouterApiUrl: process.env.TOKENROUTER_API_URL ?? "https://api.tokenrouter.com/v1",
  tokenrouterApiKey: process.env.TOKENROUTER_API_KEY ?? "",
  tokenrouterModel: process.env.TOKENROUTER_MODEL ?? "z-ai/glm-5.2-free",
  opencodeApiUrl: process.env.OPENCODE_API_URL ?? "https://opencode.ai/zen/go/v1",
  opencodeApiKey: process.env.OPENCODE_API_KEY ?? "",
  opencodeModel: process.env.OPENCODE_MODEL ?? "glm-5.2",
  openrouterApiUrl: process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1",
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openrouterModel: process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it:free",
  openaiApiUrl: process.env.OPENAI_API_URL ?? "https://api.openai.com/v1",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  /** A3: requests/minute soft-cap (failover at 80%). */
  aiRpmLimit: process.env.AI_RPM_LIMIT ?? "60",
  /** A3: requests/day soft-cap (failover at 90%). */
  aiRpdLimit: process.env.AI_RPD_LIMIT ?? "2000",
  /** A3: comma-separated ordered fallback model ids. */
  aiFallbackModels: process.env.AI_FALLBACK_MODELS ?? "",
  /** B3: daily global USD spend ceiling (premium stripped when hit). */
  aiDailySpendCeilingUsd: process.env.AI_DAILY_SPEND_CEILING_USD ?? "5",
  /** B3: daily LLM call quotas by plan tier. */
  aiQuotaGuest: process.env.AI_QUOTA_GUEST ?? "3",
  aiQuotaFree: process.env.AI_QUOTA_FREE ?? "20",
  aiQuotaPaid: process.env.AI_QUOTA_PAID ?? "200",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  /** Payments: razorpay (primary) | stripe (legacy emergency only). */
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? "razorpay").toLowerCase(),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
};


