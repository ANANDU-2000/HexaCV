# HexaCV — Super Admin, Admin, and env

## Roles

| Role | How you get it | Powers |
|---|---|---|
| `user` | Default | Own resumes, billing checkout |
| `admin` | `users.role = admin` or OpenID matches owner | `adminProcedure` CRM + `manualGrantSubscription` |

There is no separate DB enum for “super admin”. **Owner** is the OpenID that auto-promotes to `admin` on upsert.

---

## Env keys for admin / owner

| Key | Purpose | Reality today |
|---|---|---|
| `OWNER_OPEN_ID` | Read by `server/_core/env.ts` → promote to admin | **Required** for real owner promotion |
| `VITE_OWNER_OPEN_ID` | Client / admin panel schema | Keep in sync with `OWNER_OPEN_ID` |
| `ADMIN_EMAIL` | Loaded into `ENV` | Mock login target until Clerk; not full auth |
| `ADMIN_PASSWORD` | Loaded into `ENV` | Same — mock / hardcoded path in OAuth helper |
| `AUTH_PROVIDER=clerk` | Marker for future | Runtime still Manus OAuth |

Until Clerk migration: treat `ADMIN_EMAIL` / `ADMIN_PASSWORD` as CRM mock credentials, not production identity.

---

## Admin CRM tabs (`AdminCRM.tsx`)

| Tab | Status |
|---|---|
| Dashboard stats | Live |
| Users / guests | Live |
| API keys (edit `.env`) | Live |
| Support tickets | Live |
| Payments | Placeholder |
| Audit logs | Empty (no table) |
| Pause AI UI | Done — AdminCRM **Model routing & usage** → Pause AI (`AI_PAUSED`) |
| Usage / RPM | Done — live from `usage_logs` + in-memory RPM/circuit (B2) |
| Manual grant subscription | API only (`admin.manualGrantSubscription`) |

---

## Related keys (not admin UI)

| Area | Keys |
|---|---|
| Kill switch | `AI_PAUSED` |
| Payments (future) | `RAZORPAY_*`, `PAYMENT_PROVIDER` |
| Auth (future) | `CLERK_*`, `VITE_CLERK_PUBLISHABLE_KEY` |
| LLM | See [`MODELS_AND_KEYS.md`](./MODELS_AND_KEYS.md) |

Deploy checklist: [`docs/ops/VERCEL_ENV.md`](../ops/VERCEL_ENV.md).
