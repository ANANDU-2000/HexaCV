# Vercel — HexaCV frontend only

**Project:** `hexacv-admin-web` (`prj_ZLUzdW0OdMAQt8iXFBQ7jbPmmwCY`)  
**Domain:** https://www.hexacv.online  
**Repo:** https://github.com/ANANDU-2000/HexaCV.git  

**Vercel = SPA only. Empty Environment Variables on Vercel is correct.**  
**All secrets (DB, JWT, Razorpay, LLM keys) live on Render service `hexacv-app` (`srv-d9lenj710e5c73di93h0`).**  
**No MongoDB. No LLM secrets on Vercel.**

---

## Why the site showed `drizzle/schema.ts` code

Vercel published the **server bundle** (`dist/index.js`) instead of the **Vite SPA** (`dist/public`).

**Repo fix:** [`vercel.json`](../../vercel.json)

| Setting | Value |
|---|---|
| Build Command | `npx vite build` |
| Output Directory | **`dist/public`** |
| Framework | Other / null |
| `/api/*` | Rewritten to `https://hexacv-app.onrender.com/api/$1` |

**Auth note:** UI “Continue with Google” is currently **`/api/mock/login`** (dev mock), not Clerk. Clerk keys are not wired into `Login.tsx` yet.

---

## Vercel Environment Variables

### Correct state: **none required**

Leave Vercel env empty (or only optional public `VITE_*` analytics later).  
Do **not** add `DATABASE_URL`, Razorpay, or AI keys here — the SPA never uses them at runtime; `/api` is proxied to Render.

### DELETE if present (wrong for this app)

| Key | Why remove |
|---|---|
| `DATABASE_URL` (`mongodb+srv://…` or any DB URL) | DB belongs on **Render**, and HexaCV needs **MySQL** (`mysql://…`), not Mongo. |
| `PAYU_KEY` / `PAYU_SALT` | Payments are **Razorpay**. |
| `VITE_OPENAI_API_KEY` / `VITE_GEMINI_*` / `VITE_GROQ_*` | Exposes secrets in the browser bundle. |

**Do not set `VITE_API_URL` on Vercel** when using the rewrite in `vercel.json`.

---

## Render API env (source of truth)

Service: **hexacv-app** → https://hexacv-app.onrender.com  

Synced from local `.env` (MCP): JWT, owner/admin, Razorpay, OpenRouter / OpenCode / Bynara / TokenRouter / OpenAI / Gemini / Groq, `AI_PAUSED`.

**Not synced:** local `DATABASE_URL` was `postgresql://…` — app only accepts `mysql://` / `mysql2://` ([`server/db.ts`](../../server/db.ts)). Until a real MySQL URL is set on Render, the API uses the in-memory mock DB fallback.

Set on Render Dashboard when you have MySQL:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/hexacv
```

---

## Dashboard check (frontend)

1. Vercel → **hexacv-admin-web** → Environments → confirm **no** DB/AI secrets  
2. Output Directory: **`dist/public`**  
3. After API env changes: wait for Render deploy, then `GET https://www.hexacv.online/api/health` → `{ "ok": true, "service": "hexacv" }`

---

## Mongo note

`mongodb+srv://…` is **not compatible** with this codebase. Never set it as `DATABASE_URL` for HexaCV.
