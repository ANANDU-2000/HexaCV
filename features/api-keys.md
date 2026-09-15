# API Keys (Environment)

> All LLM / payment / auth secrets live in **environment variables** — never in
> client code. Providers are selected per stage via `apiKeyManager` + `trackedInvokeLLM`.

**Status:** Implemented.

## Where keys are loaded

| Layer | File | Role |
|-------|------|------|
| Env object | `server/_core/env.ts` | Reads `process.env.*` into `ENV` |
| Routing / failover | `server/apiKeyManager.ts` | Maps stages → models/keys; can persist updates to `.env` |
| Call path | `server/usageTracker.ts` → `server/_core/llm.ts` | Every parse/rewrite uses env-backed keys only |
| Template | `.env.example` | Documents required vars (empty values) |

## LLM provider keys (put values in `.env`, not in git)

Copy `.env.example` → `.env` and fill:

```
OPENROUTER_API_KEY=
OPENAI_API_KEY=
OPENCODE_API_KEY=
BYNARA_API_KEY=
TOKENROUTER_API_KEY=
GEMINI_API_KEY=
GEMINI_API_KEY_2=
GROK_API_KEY=
HUGGINGFACE_API_KEY=   # or HF_TOKEN
DEEPSEEK_API_KEY=
BUILT_IN_FORGE_API_KEY=
```

Optional URL/model overrides: `OPENROUTER_API_URL`, `OPENROUTER_MODEL`,
`OPENAI_API_URL`, `OPENAI_MODEL`, `OPENCODE_*`, `BYNARA_*`, `TOKENROUTER_*`,
`BUILT_IN_FORGE_API_URL`.

## Quotas / kill switch

```
AI_PAUSED=false
AI_RPM_LIMIT=60
AI_RPD_LIMIT=2000
AI_FALLBACK_MODELS=
AI_DAILY_SPEND_CEILING_USD=5
AI_QUOTA_GUEST=3
AI_QUOTA_FREE=20
AI_QUOTA_PAID=200
```

## Other secrets (same `.env`)

`JWT_SECRET`, `DATABASE_URL`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID`,
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`RAZORPAY_WEBHOOK_SECRET`.

## Guarantees

- **No hardcoded API keys** in `client/` or committed source.
- Parse (`resume.parse`) and rewrite (`ai.generateFullResume`) both go through
  `trackedInvokeLLM` so missing keys fail clearly instead of inventing content offline.
- If every provider key is empty, LLM calls error and parse falls back to the
  **heuristic** parser (still grounded against source text).

## See also

- [parsing-rewrite-quality.md](parsing-rewrite-quality.md) — genuine content rules
- [runtime-error-reporting.md](runtime-error-reporting.md) — failures land in `runtime-errors/`
- [ai-pipeline.md](ai-pipeline.md) — stage → model tiers
