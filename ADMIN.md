# HexaCV — ADMIN.md (Super Admin Dashboard & Monitoring)

Companion to `docs/ai/ADMIN_AND_ENV.md`, `docs/product/roadmap/V3_ADMIN_LIMITS_AND_LONGTERM.md`.  
**Primary UI:** `client/src/components/AdminCRM.tsx` (routes `/dashboard/admin`, `/admin`).  
**Backend:** `admin.*` procedures in `server/routers.ts`, `server/apiKeyManager.ts`, `server/usageTracker.ts`.

---

## 1. Roles

| Role | How granted | Powers |
| --- | --- | --- |
| `user` | Default | Own resumes, pay-per-build checkout |
| `admin` | `users.role = admin` or OpenID matches `OWNER_OPEN_ID` | Full CRM via `adminProcedure` |

There is no separate DB enum for "super admin". Owner OpenID auto-promotes to `admin` on upsert. Keep `OWNER_OPEN_ID` and `VITE_OWNER_OPEN_ID` in sync.

---

## 2. CRM tabs (as-built vs required)

| Tab / area | Status today | v6 product requirement |
| --- | --- | --- |
| Dashboard stats | Live (`admin.getDashboardStats`) | Keep; add credit/build KPIs |
| Users / guests | Live | Search, lock/unlock, set role, grant credits |
| API keys | Live (`getApiKeys` / `updateApiKey` / `testApiKey`) | Keep; never log secrets in UI |
| Model routing & usage | Live (`getUsageStats`, `setModelRoute`, `setAiPaused`) | Keep; surface cost USD + RPM/circuit |
| Support tickets | Live | Keep |
| Payments | Partial (`listPaymentOrders`, `refundPayment`) | Align to ₹99 orders + refunds on failed generation |
| Audit logs | Empty (no table) | **Required:** log every admin write (role change, credit grant, refund, AI pause) |
| Manual grant subscription | API (`manualGrantSubscription`) | Reorient to **grant build credits** (pay-per-use), not subscription tiers |

---

## 3. Required admin capabilities (product)

### Users

- Search by name / email / role.
- Promote/demote `admin` ↔ `user` with reason (already partially wired).
- Lock / unlock accounts (if not present — add; do not soft-delete financial history).
- Grant N build credits manually (replaces "grant Pro/Enterprise subscription" framing).
- View credit balance, referral code, recent builds.

### AI & cost

- Toggle `AI_PAUSED` (blocks `ai.*` only; parse may still run — see API-LIMITS.md).
- Edit model routing rows (`model_routing`) per stage.
- View `usage_logs`: tokens in/out, costUsd, latency, status, stage, provider, model.
- Circuit / RPM visibility (from `usageTracker` in-memory + DB).

### Payments

- List Razorpay orders for ₹99 builds.
- Refund / release holds when generation fails after retry (PLAN §2.6).
- Never show subscription MRR as primary metric if product is pay-per-use — prefer builds sold, credits outstanding, refund rate.

### Audit

- Persist admin actions: actor, action, target user/resource, reason, timestamp.
- Empty "Audit logs" tab must become real before production reliance.

---

## 4. Env keys (admin-related)

| Key | Purpose |
| --- | --- |
| `OWNER_OPEN_ID` | Owner → admin promotion |
| `VITE_OWNER_OPEN_ID` | Client schema sync |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Legacy/mock CRM path — not production identity |
| `AI_PAUSED` | Kill switch for `ai.*` |
| `RAZORPAY_*` | Payments |
| LLM keys | See `API-LIMITS.md` / `docs/ai/MODELS_AND_KEYS.md` |

---

## 5. Access control rules

1. All admin mutations require `adminProcedure` (server-enforced) — never trust client `role` alone.
2. Admin preview in DEV (`import.meta.env.DEV`) must not grant production powers.
3. API key values: mask in list views; write-only updates; test endpoint must not echo full key.
4. Every credit grant and refund creates an audit row.

---

## 6. Agent tasks (admin track)

- [ ] Rename grant-subscription UX to **grant build credits** where exposed in AdminCRM.
- [ ] Implement audit_log table + Admin tab population.
- [ ] Surface credit balances and referral completion (first paid build) in user detail.
- [ ] Payment tab: filter ₹99 build orders; wire refund to generation-failure policy.
- [ ] Dashboard KPIs: DAU, builds completed, credits outstanding, AI cost (USD), refund count — not subscription MRR as primary.
- [ ] Confirm lock/unlock and credit grant APIs exist; add if missing.
