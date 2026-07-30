# Vercel environment variables — HexaCV

**Project ID:** `prj_ZLUzdW0OdMAQt8iXFBQ7jbPmmwCY`  
**Domain (current):** https://www.hexacv.online  
**Repo (after push):** https://github.com/ANANDU-2000/HexaCV.git  
**Production app (Render):** https://hexacv.onrender.com — service `srv-d9lekem417fc73coh0n0`  
**Webhook:** `https://hexacv.onrender.com/api/webhooks/razorpay`

Add these in Vercel → Project → Settings → Environment Variables  
(Production + Preview + Development unless noted). **Do not put secrets in git.**

## Auth (Clerk — future; keys ready locally)

| Key | Notes |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | If project is Next-based (`pk_test_…`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same publishable key for Vite client builds |
| `CLERK_SECRET_KEY` | Server only — never `NEXT_PUBLIC_` / `VITE_` |
| `CLERK_FRONTEND_API` | e.g. `https://daring-crab-29.clerk.accounts.dev` |

Clerk Dashboard → allowed origins / redirect URLs:

- `http://localhost:3000`
- `https://www.hexacv.online`

## Payments (Razorpay primary — set live secrets before real charges)

| Key | Notes |
|---|---|
| `PAYMENT_PROVIDER` | `razorpay` |
| `RAZORPAY_KEY_ID` | Live `rzp_live_…` or test `rzp_test_…` — **required for real Checkout** |
| `RAZORPAY_KEY_SECRET` | Server only — **required before live charges** |
| `RAZORPAY_WEBHOOK_SECRET` | Dashboard → Webhooks → `https://www.hexacv.online/api/webhooks/razorpay` (or your host) |
| `SUBSCRIPTION_GRACE_DAYS` | Default `3` (F4 grace after period end / payment failure) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Legacy only |

## App / safety

| Key | Notes |
|---|---|
| `AUTH_PROVIDER` | `clerk` (marker; runtime still Manus until migration) |
| `OWNER_OPEN_ID` | Server owner OpenID (keep in sync with `VITE_OWNER_OPEN_ID`) |
| `AI_PAUSED` | Production: `false` |
| `AI_RPM_LIMIT` | Default `60` (A3 failover at 80%) |
| `AI_RPD_LIMIT` | Default `2000` (A3 failover at 90%) |
| `AI_FALLBACK_MODELS` | Optional comma-separated model ids |
| `DATABASE_URL` | Real MySQL URL when backend is hosted |
| `JWT_SECRET` | Long random secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | CRM mock login targets until Clerk |

## LLM (as needed for production)

Copy from local `.env` via Dashboard or `vercel env add` — prefer host secret store, never commit.

| Key | Category |
|---|---|
| `OPENROUTER_API_KEY` (+ URL/MODEL) | Cheap / free |
| `OPENCODE_API_KEY`, `BYNARA_API_KEY`, `TOKENROUTER_API_KEY` | Rewrite |
| `OPENAI_API_KEY` | Premium |
| `OPENAI_MODEL` | e.g. `gpt-4o-mini` (stable API id only) |
| `OPENAI_API_URL` | `https://api.openai.com/v1` |
| `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GROK_API_KEY` | Failover |

Full map: [`docs/ai/MODELS_AND_KEYS.md`](../ai/MODELS_AND_KEYS.md).

## Stack note

This monorepo is **Vite + Express**, not Next.js. **Production host for the full app is Render** (`render.yaml` — `npm run build` / `npm run start`, health `/api/health`, bind `0.0.0.0:$PORT`).

The Vercel project (`prj_ZLUzdW0OdMAQt8iXFBQ7jbPmmwCY`, hexacv.online) stays linked to `ANANDU-2000/HexaCV` for env continuity; long-running Express is not a natural Vercel Free fit. Point live DNS / webhooks at the Render service URL unless you run a split frontend/API setup.

Suggested build (this repo / Render):

- Install: `npm install` (or `pnpm install`)
- Build: `npm run build`
- Start: `npm run start`
- Health: `GET /api/health`
- Node: 22.x

Webhook: `https://<render-host>/api/webhooks/razorpay`

## CLI (if logged in)

```bash
vercel link --project prj_ZLUzdW0OdMAQt8iXFBQ7jbPmmwCY
vercel env add CLERK_SECRET_KEY production
# …repeat per key
```

## After deploy checklist

- [ ] Git connected to `ANANDU-2000/HexaCV`
- [ ] Env keys set (table above)
- [ ] Clerk redirect URLs include production domain
- [ ] Razorpay dashboard website includes checkout domain if different from hexastacksolutions.com
- [ ] `AI_PAUSED=false` in production
