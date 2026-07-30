# Vercel environment variables — HexaCV

**Project ID:** `prj_ZLUzdW0OdMAQt8iXFBQ7jbPmmwCY`  
**Domain (current):** https://www.hexacv.online  
**Repo (after push):** https://github.com/ANANDU-2000/HexaCV.git

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

## Payments (Razorpay — future; keys ready locally)

| Key | Notes |
|---|---|
| `RAZORPAY_KEY_ID` | Test: `rzp_test_…` |
| `RAZORPAY_KEY_SECRET` | Server only |
| `RAZORPAY_WEBHOOK_SECRET` | After webhook endpoint exists (Production first) |
| `PAYMENT_PROVIDER` | `razorpay` |

## App / safety

| Key | Notes |
|---|---|
| `AUTH_PROVIDER` | `clerk` (marker; runtime still Manus until migration) |
| `AI_PAUSED` | Production: `false` |
| `DATABASE_URL` | Real MySQL URL when backend is hosted |
| `JWT_SECRET` | Long random secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Current admin portal |

## LLM (as needed for production)

Copy from local `.env` via Dashboard or `vercel env add` — prefer host secret store, never commit.

`OPENROUTER_API_KEY`, `OPENCODE_API_KEY`, `BYNARA_API_KEY`, `TOKENROUTER_API_KEY`, `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GROK_API_KEY`, `HUGGINGFACE_API_KEY`, etc.

## Stack note

This monorepo is **Vite + Express**, not Next.js. The existing Vercel project (`hexacv-admin-web`) may not match this app’s build/start commands. Options:

1. Keep `hexacv-admin-web` separate; create a new Vercel or **Render** web service for this Express app.
2. Or retarget this Vercel project’s Git + Build settings after connecting `ANANDU-2000/HexaCV`.

Suggested build (this repo):

- Install: `pnpm install`
- Build: `pnpm run build`
- Start: `pnpm run start`
- Node: 22.x

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
