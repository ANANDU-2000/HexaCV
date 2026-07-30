# Vercel — HexaCV (primary production)

**Project ID:** `prj_ZLUzdW0OdMAQt8iXFBQ7jbPmmwCY`  
**Domain:** https://www.hexacv.online  
**Repo:** https://github.com/ANANDU-2000/HexaCV.git  

## Why production showed raw `drizzle/schema.ts` code

Vercel was serving the **server esbuild bundle** (`dist/index.js`) as the site root instead of the **Vite SPA** (`dist/public`). That bundle inlines schema source — so the homepage looked like database code.

**Fix (in repo now):** [`vercel.json`](../../vercel.json)

- `buildCommand`: `npx vite build` (client only)
- `outputDirectory`: `dist/public` (real UI)
- `/api/*` → serverless Express in [`api/index.ts`](../../api/index.ts)
- SPA fallback → `index.html`

## Dashboard settings (must match)

In Vercel → Project → Settings → General / Build & Development:

| Setting | Value |
|---|---|
| Framework Preset | Other |
| Root Directory | `.` (repo root) |
| Install Command | `npm install --include=dev` (or leave blank — vercel.json sets it) |
| Build Command | leave blank to use vercel.json **or** `npx vite build` |
| Output Directory | `dist/public` |
| Node.js | 22.x |

Then **Redeploy** Production (Deployments → … → Redeploy). Domain `hexacv.online` should already be attached to this project.

## Environment variables

Add for Production (and Preview as needed). **Never commit secrets.**

| Key | Notes |
|---|---|
| `DATABASE_URL` | **External MySQL** (TiDB Cloud / PlanetScale / Railway / Aiven). Vercel does **not** host MySQL; app dialect is MySQL. |
| `JWT_SECRET` | Long random secret |
| `PAYMENT_PROVIDER` | `razorpay` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Webhook URL: `https://www.hexacv.online/api/webhooks/razorpay` |
| `OWNER_OPEN_ID` | Admin owner openId |
| `AI_PAUSED` | `false` for live AI |
| LLM keys | See [`docs/ai/MODELS_AND_KEYS.md`](../ai/MODELS_AND_KEYS.md) |
| `VITE_OAUTH_PORTAL_URL` / `VITE_APP_ID` | Client OAuth (build-time) |

Apply SQL migrations against that MySQL (`drizzle/*.sql`, including `g2_evaluation_opt_out.sql`).

## Architecture on Vercel

```
Browser → hexacv.online
  ├── static files from dist/public  (Landing, Pricing, Terms, app shell)
  └── /api/* → api/index.ts → Express (tRPC, webhooks, OAuth, health)
       └── DATABASE_URL → your MySQL host
```

AI / long requests: Hobby plan has short serverless timeouts; Pro allows up to 60s (`vercel.json` `maxDuration`).

## CLI deploy (after `vercel login`)

```bash
vercel link --project prj_ZLUzdW0OdMAQt8iXFBQ7jbPmmwCY
vercel --prod
```

## Render note

Render (`hexacv-app.onrender.com`) was a temporary Node host while Vercel output was misconfigured. **Canonical production is Vercel + hexacv.online** once the redeploy above succeeds.
