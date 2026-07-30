# HexaCV — Models and API keys

Maps providers in `server/_core/llm.ts` to env keys, defaults, and cost category.

Pin **stable API model IDs** only (`gpt-4o-mini`, `gpt-4o`, `glm-5.2`, etc.). Do not use OpenAI marketing names (e.g. GPT-5.6 Sol/Terra/Luna) as API model strings.

---

## Failover order (as wired)

First configured key that returns a successful completion wins. On 401/403/429 or network error, try the next.

| # | Provider | Category | Key env | URL env | Model env | Default model |
|---|---|---|---|---|---|---|
| 1 | OpenRouter | Cheap / free | `OPENROUTER_API_KEY` | `OPENROUTER_API_URL` | `OPENROUTER_MODEL` | `google/gemma-4-31b-it:free` |
| 2 | OpenCode | Rewrite | `OPENCODE_API_KEY` | `OPENCODE_API_URL` | `OPENCODE_MODEL` | `glm-5.2` |
| 3 | Bynara | Rewrite | `BYNARA_API_KEY` | `BYNARA_API_URL` | `BYNARA_MODEL` | `glm-5.2-free` |
| 4 | TokenRouter | Rewrite | `TOKENROUTER_API_KEY` | `TOKENROUTER_API_URL` | `TOKENROUTER_MODEL` | `z-ai/glm-5.2-free` |
| 5 | **OpenAI** | Premium | `OPENAI_API_KEY` | `OPENAI_API_URL` | `OPENAI_MODEL` | `gpt-4o-mini` |
| 6 | Forge (Manus) | Platform | `BUILT_IN_FORGE_API_KEY` | `BUILT_IN_FORGE_API_URL` | — | (caller must pass model) |
| 7 | Gemini | Failover | `GEMINI_API_KEY` | hardcoded | — | `gemini-1.5-flash` |
| 8 | Gemini 2 | Failover | `GEMINI_API_KEY_2` | hardcoded | — | `gemini-1.5-flash` |
| 9 | Groq | Cheap / fast | `GROK_API_KEY` | hardcoded | — | `llama-3.3-70b-versatile` |

Kill switch: `AI_PAUSED=true|1|yes` blocks `ai.*` only.

**B1 model selection:** Ordered model ids also come from `model_routing`
(cached 5 min in `apiKeyManager.ensureModelRoutingLoaded`).  
`usageTracker.getFallbackModels(stage)` prefers DB routes; ENV
`AI_FALLBACK_MODELS` / provider defaults remain the empty-cache fallback.
Provider HTTP failover order above is still owned by `llm.ts`.

---

## Categories (intent)

| Category | Use for | Preferred |
|---|---|---|
| Cheap / extract | Parse, light keyword work | OpenRouter free, Groq, Gemini Flash |
| Rewrite | Bullets, summary, suggestions | OpenCode, Bynara, TokenRouter |
| Premium / polish | Schema-critical + future Stage 5 | OpenAI `gpt-4o-mini` / `gpt-4o` |
| Eval (future) | Stage 4 scorer | Cheap model — not built |

---

## Model name remapping

Callers often pass `model: "gpt-4o"`. Behavior:

- **OpenAI provider** (`isOpenAI`): uses the requested `gpt-*` model (or `OPENAI_MODEL` default).
- **Other providers**: `gpt-*` names are remapped to that provider’s `defaultModel` so free/rewrite backends are not sent invalid OpenAI model IDs.

---

## Present in env but not used for chat completions

| Key | Status |
|---|---|
| `HUGGINGFACE_API_KEY` / `HF_TOKEN` | Admin CRM only; not in `invokeLLM` |
| `DEEPSEEK_API_KEY` | Placeholder; not wired |

---

## Admin CRM

Keys editable via Admin → API Key Usage (`apiKeyManager.ts`), including `OPENAI_API_KEY`. See [`ADMIN_AND_ENV.md`](./ADMIN_AND_ENV.md).
