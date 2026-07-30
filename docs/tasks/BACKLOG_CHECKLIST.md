# HexaCV — Living backlog checklist

Prepared for: Anandu / HexaStack Solutions  
**One-by-one status** for pages, features, flows, logic, errors, and validation.  
Canonical with [`NEXT.md`](./NEXT.md) and [`.cursor/rules/project.md`](../../.cursor/rules/project.md).  
Do **not** skip waves. Mark `[x]` only after that wave’s Validate step passes.

## Validate matrix (every wave)

| Check | Meaning |
|---|---|
| **Page** | UI exists or N/A (API-only) |
| **Feature** | Code path does the job |
| **Flow** | Happy path end-to-end |
| **Logic** | Trust rules (no fake tiers / invented AI facts) |
| **Errors** | Clean `TRPCError` / user message |
| **Validation** | Zod + post-AI grounding where applicable |

---

## Done

| Wave | Item | Page | Feature | Flow | Logic | Errors | Validation |
|---|---|---|---|---|---|---|---|
| P1 | Billing lockdown / `admin.manualGrantSubscription` | N/A | [x] | [x] | [x] | [x] | [x] |
| A1 | `AI_PAUSED` kill switch on `ai.*` | N/A | [x] | [x] | [x] | [x] | [x] |
| Docs | `docs/ai/PIPELINE` + MODELS + ADMIN; agent rules §0/§5 | N/A | [x] | N/A | [x] | N/A | N/A |
| A2 | `usage_logs` + `usageTracker` + `aiSuggestions` | N/A | [x] | [x] | [x] | [x] | [x] |
| Wave 0 | Log `generateFullResume` + `fileParser` via `trackedInvokeLLM` | N/A | [x] | [x] | [x] | [x] | [x] |
| **A3** | RPM/RPD counters + ordered model fallback | N/A | [x] | [x] | [x] | [x] | [x] |
| **A4** | Circuit breaker (3 errors → 5 min skip) | N/A | [x] | [x] | [x] | [x] | [x] |
| **B1** | `model_routing` table + 5-min cache | N/A | [x] | [x] | [x] | [x] | [x] |
| **B2** | Admin usage / Pause AI / fallback editor | AdminCRM | [x] | [x] | [x] | [x] | [x] |
| **B3** | Spend ceiling + tier quotas | N/A (gate) | [x] | [x] | [x] | [x] | [x] |
| **C1** | Thin Extract→Target→Rewrite orchestrator | Builder AI | [x] | [x] | [x] | [x] | [x] |
| **C2** | Dedup editor improve via Target+Rewrite | Editor | [x] | [x] | [x] | [x] | [x] |
| **C3** | Evaluator + one Rewrite retry | N/A | [x] | [x] | [x] | [x] | [x] |
| **C4** | Preserve `userEdited` | Editor | [x] | [x] | [x] | [x] | [x] |
| **C5** | `prompt_versions` + `resume_evaluations` | Editor thumbs | [x] | [x] | [x] | [x] | [x] |
| **G1–G3** | Terms / Privacy / Refund (+ Cookie) placeholders | Legal pages | [x] | [x] | [x] | [x] | [x] | [x] |
| **Pricing** | Public Pricing page ₹399 / ₹799 | Pricing | [x] | [x] | [x] | [x] | [x] | [x] |
| **F5** | Admin Razorpay refund + revoke to free | Admin payments | [x] | [x] | [x] | [x] | [x] | [x] |
| **G2-opt** | Evaluation-dataset opt-out in Settings | Settings | [x] | [x] | [x] | [x] | [x] | [x] |

---

## Next

| Wave | Item | Page | Feature | Flow | Logic | Errors | Validation |
|---|---|---|---|---|---|---|---|
| **R1** | Referral model decision (human) | N/A | [ ] | [ ] | [ ] | [ ] | [ ] |

---

## Phase F — Payments (done / in progress)

| ID | Item | Page | Feature | Flow | Logic | Errors | Validation |
|---|---|---|---|---|---|---|---|
| F-decide | **Razorpay primary** (Stripe legacy) | N/A | [x] | [x] | [x] | [x] | [x] |
| F3 | Stripe webhook idempotency (legacy) | N/A | [x] | [x] | [x] | [x] | [x] |
| F-rzp | Razorpay orders + webhook + BillingPortal | Billing | [x] | [x] | [x] | [x] | [x] |
| F4 | Subscription grace (3 days) | Billing | [x] | [x] | [x] | [x] | [x] |
| F5 | Admin refund + payment_orders UI | Admin | [x] | [x] | [x] | [x] | [x] |

---

## Phase B — Model routing + admin

| ID | Item | Page | Feature | Flow | Logic | Errors | Validation |
|---|---|---|---|---|---|---|---|
| B1 | `model_routing` table + cache | N/A | [x] | [x] | [x] | [x] | [x] |
| B2 | Admin usage / Pause AI / fallback editor | AdminCRM | [x] | [x] | [x] | [x] | [x] |
| B3 | Spend ceiling + tier quotas | N/A (gate) | [x] | [x] | [x] | [x] | [x] |

---

## Phase C — Real pipeline + feedback

| ID | Item | Page | Feature | Flow | Logic | Errors | Validation |
|---|---|---|---|---|---|---|---|
| C1 | Thin Extract→Target→Rewrite | Builder AI | [x] | [x] | [x] | [x] | [x] |
| C2 | More entry points via orchestrator | Editor | [x] | [x] | [x] | [x] | [x] |
| C3 | Evaluator + one Rewrite retry | N/A | [x] | [x] | [x] | [x] | [x] |
| C4 | Preserve `userEdited` | Editor | [x] | [x] | [x] | [x] | [x] |
| C5 | `prompt_versions` + `resume_evaluations` | Editor thumbs | [x] | [x] | [x] | [x] | [x] |

---

## Pages & product surfaces

| Surface | Status | Page | Feature | Flow | Logic | Errors | Validation |
|---|---|---|---|---|---|---|---|
| Landing | Real | [x] | [x] | [x] | [x] | [x] | partial |
| Login / Register | Real (mock + OAuth) | [x] | partial | partial | [x] | partial | partial |
| Dashboard shell | Real | [x] | [x] | [x] | [x] | [x] | [x] |
| DashboardHome stats | Real resumes + zeros for ATS/apps | [x] | [x] | [x] | [x] | [x] | [x] |
| Builder hub / upload / scratch / AI / editor | Real | [x] | [x] | [x] | [x] | [x] | [x] |
| Pricing page | Real | [x] | [x] | [x] | [x] | [x] | [x] |
| Terms / Privacy / Refund / Cookies | Real (placeholders) | [x] | [x] | [x] | [x] | [x] | [x] |
| Blog list / post | Missing | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Referral dedicated page | Missing (dash affiliate) | [ ] | partial | partial | [ ] | [ ] | [ ] |
| Admin audit tab | Stub | [x] | [ ] | [ ] | [ ] | [ ] | [ ] |

---

## Money / trust (later waves)

| ID | Item | Status |
|---|---|---|
| **F-decide** | Razorpay primary (Stripe legacy) | Done — flipped 2026 |
| F3 | Stripe webhook idempotency | Done — legacy Stripe retries |
| F-rzp | Razorpay orders + verify + webhook | Done — payment_orders |
| F4–F5 | Grace / refund admin | **Done** — F4 grace + F5 admin refund |
| G1–G3 | Legal placeholder pages | **Done** |
| H2 | Referral 24h+action + flag | Not built — awaits R1 |
| Clerk auth | Blocked until auth PR | Not built |

---

## Blocked until their wave

- Full 5-stage / self-improving agent (beyond C1–C5)
- Clerk auth migration
- Dual live Stripe+Razorpay Checkout UIs
- Razorpay Subscriptions product + F4 grace UI

**Deferred (not next):** I marketing/blog, K QA matrix, Polish AI stage, G4 Razorpay KYC paperwork (human).

See [`PIPELINE.md`](../ai/PIPELINE.md) and [`TASK_PROMPTS.md`](./TASK_PROMPTS.md).
