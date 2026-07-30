# Vercel — HexaCV frontend only

**Project:** `hexacv-admin-web` (`prj_ZLUzdW0OdMAQt8iXFBQ7jbPmmwCY`)  
**Domain:** https://www.hexacv.online  
**Repo:** https://github.com/ANANDU-2000/HexaCV.git  

**No Render. No Vercel backend. No MongoDB on this frontend project.**

---

## Why the site showed `drizzle/schema.ts` code

Vercel published the **server bundle** (`dist/index.js`) instead of the **Vite SPA** (`dist/public`).

**Repo fix:** [`vercel.json`](../../vercel.json)

| Setting | Value |
|---|---|
| Build Command | `npx vite build` |
| Output Directory | **`dist/public`** |
| Framework | Other / null |
| `/api/*` | Rewritten to backend `http://16.171.240.226:3001/api/$1` |

---

## Vercel Environment Variables (frontend project)

### DELETE from Vercel (wrong for this app)

| Key | Why remove |
|---|---|
| `DATABASE_URL` with `mongodb+srv://…` | HexaCV uses **MySQL + Drizzle**, not Mongo. DB belongs on the **API server**, not Vercel. |
| `PAYU_KEY` / `PAYU_SALT` | App payments are **Razorpay**, not PayU. |
| `VITE_OPENAI_API_KEY` / `VITE_GEMINI_API_KEY` / `VITE_GROQ_API_KEY` | LLM secrets must stay **server-only** on the API host. Never `VITE_` (exposes keys in the browser). |

### KEEP / ADD on Vercel (public client only)

| Key | Example / notes |
|---|---|
| `VITE_APP_ID` | OAuth / app id if used |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL if used |
| `VITE_ANALYTICS_ENDPOINT` | Optional |
| `VITE_ANALYTICS_WEBSITE_ID` | Optional |

**Do not set `VITE_API_URL` on Vercel** when using the rewrite in `vercel.json` (browser keeps calling `/api/trpc` on `hexacv.online`, Vercel proxies to EC2).

Optional override (only if rewrite fails):  
`VITE_API_URL=http://16.171.240.226:3001` — then client calls that host directly (CORS/cookies harder).

---

## Backend host (not Vercel) — env key/value

On **`http://16.171.240.226:3001`** (or your API VPS), create a **local `.env`** (never commit):

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/hexacv
JWT_SECRET=generate-a-long-random-secret
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
OWNER_OPEN_ID=
AI_PAUSED=false
OPENROUTER_API_KEY=
OPENAI_API_KEY=
```

Then: `npm run build && npm run start`  
Check: `GET http://16.171.240.226:3001/api/health` → `{ "ok": true }`

---

## Dashboard redeploy (required for hexacv.online)

1. Vercel → **hexacv-admin-web** → **Settings → Build and Deployment**
2. Framework Preset: **Other**
3. Output Directory: **`dist/public`** (override if dashboard still says `dist`)
4. Build Command: `npx vite build` (or blank to use `vercel.json`)
5. **Environments**: remove Mongo `DATABASE_URL` / PayU / `VITE_*` AI secrets
6. **Deployments → Redeploy** latest `main` with **Clear cache**

After deploy: homepage must be HTML (HexaCv UI), not JavaScript schema text.

---

## Mongo connection string you pasted

That `mongodb+srv://…` string is **not compatible** with this codebase. Do **not** put it on Vercel for HexaCV.

**Security:** you posted the DB password in chat — **rotate that MongoDB Atlas password** in Atlas immediately.
