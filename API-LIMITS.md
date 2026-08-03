# HexaCV — API-LIMITS.md (API Management, Cost Control & Retry Logic)

Companion to `docs/ai/MODELS_AND_KEYS.md`, `docs/ai/ADMIN_AND_ENV.md`, PLAN.md §2.6 / §5.  
**Code:** `server/_core/llm.ts`, `server/apiKeyManager.ts`, `server/usageTracker.ts`.

---

## 1. Goals

1. Keep AI cost predictable under pay-per-use (₹99/build margin).
2. Fail over across providers without inventing content when a model errors.
3. Never charge a user when generation fails after the allowed retry.
4. Give admins a kill switch and live usage visibility.

---

## 2. Provider failover order (as wired)

First configured key that returns a successful completion wins. On 401/403/429 or network error, try the next.

| # | Provider | Category | Key env | Default model |
| --- | --- | --- | --- | --- |
| 1 | OpenRouter | Cheap / free | `OPENROUTER_API_KEY` | `google/gemma-4-31b-it:free` |
| 2 | OpenCode | Rewrite | `OPENCODE_API_KEY` | `glm-5.2` |
| 3 | Bynara | Rewrite | `BYNARA_API_KEY` | `glm-5.2-free` |
| 4 | TokenRouter | Rewrite | `TOKENROUTER_API_KEY` | `z-ai/glm-5.2-free` |
| 5 | OpenAI | Premium | `OPENAI_API_KEY` | `gpt-4o-mini` |
| 6 | Forge (Manus) | Platform | `BUILT_IN_FORGE_API_KEY` | (caller passes model) |
| 7–8 | Gemini | Failover | `GEMINI_API_KEY` / `_2` | `gemini-1.5-flash` |
| 9 | Groq | Cheap / fast | `GROK_API_KEY` | `llama-3.3-70b-versatile` |

**Kill switch:** `AI_PAUSED=true|1|yes` blocks `ai.*` routes only (not `resume.parse` today — document this honestly to operators).

**B1 model routing:** Ordered model IDs also come from `model_routing` (cached ~5 min via `apiKeyManager.ensureModelRoutingLoaded`). `usageTracker.getFallbackModels(stage)` prefers DB routes; env `AI_FALLBACK_MODELS` is empty-cache fallback. HTTP provider order remains owned by `llm.ts`.

---

## 3. Stage → cost category

| Pipeline stage | Prefer | Temp |
| --- | --- | --- |
| Extract / parse | Cheap (OpenRouter free, Groq, Gemini Flash) | 0.1 |
| Target | Cheap | 0.2 |
| Rewrite | Rewrite tier (OpenCode / Bynara / TokenRouter) | 0.2–0.3 |
| Validate | Deterministic (no LLM) + optional cheap eval | n/a |
| Polish (future) | Premium OpenAI | TBD |

Schema-critical calls may pin to `gpt-4o` — see `docs/ai/AI_PROMPT_GUIDE.md`.

---

## 4. Usage tracking

`trackedInvokeLLM` in `usageTracker.ts` logs to `usage_logs`:

- stage, provider, model, userId
- tokensIn, tokensOut, costUsd, latencyMs
- status: success | error

Admin CRM **Model routing & usage** tab reads these stats. Every billable AI call in the build path should go through the tracker — do not call `invokeLLM` raw from new features without logging.

---

## 5. Rate limits & circuit breaker

As implemented in `usageTracker.ts`:

| Mechanism | Behavior |
| --- | --- |
| RPM / RPD | In-memory timestamps per model; skip/backoff when exceeded |
| Circuit breaker | After 3 consecutive *real* errors (timeouts, 5xx, network, bad JSON — not 429), open circuit ~5 minutes |
| Rate-limit 429 | Does **not** trip the circuit — try next model/provider |

---

## 6. Generation retry & no-charge rule (product)

| Attempt | On failure |
| --- | --- |
| 1st pipeline run | Auto-retry once (silent) |
| 2nd failure | Release credit/₹99 hold; plain-language error naming the failed phase; no charge |

Validate-stage rewrite retry (C3 deterministic fail → one Rewrite retry) is separate and must also respect grounding — it is not a second paid attempt.

---

## 7. Per-user / product caps (target under pay-per-use)

Align quotas with credits, not old subscription tiers:

| Cap | Intent |
| --- | --- |
| Build credits | Hard gate for full pipeline |
| AI-assist edits | Included pack per paid/free build; then top-up (**BLOCKED PLAN §10**) |
| Soft daily AI spend | Optional admin guardrail from `usage_logs` costUsd |
| Guest | No pipeline; draft only |

Existing `AiPlanTier` / quota types in shared types should be reoriented away from subscription language when touched.

---

## 8. Key management

- Editable via Admin → API Key Usage (`apiKeyManager.ts`).
- Mask secrets in UI; support test-key mutation without echoing full values.
- Present but unused for chat completions today: `HUGGINGFACE_API_KEY` / `HF_TOKEN` (CRM only), `DEEPSEEK_API_KEY` (placeholder) — do not document as live completion providers.

---

## 9. Operator checklist

- [ ] At least one cheap + one rewrite + OpenAI premium key configured in production.
- [ ] `AI_PAUSED` known and tested from AdminCRM.
- [ ] Usage panel shows non-zero logs after a test generate.
- [ ] Failed generate after retry does not leave a captured ₹99 without refund/release.
- [ ] Circuit open state visible or logged for on-call.
