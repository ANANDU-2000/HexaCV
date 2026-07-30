# Vercel — HexaCV frontend only

**Project:** `hexacv-admin-web` (`prj_ZLUzdW0OdMAQt8iXFBQ7jbPmmwCY`)  
**Domain:** https://www.hexacv.online  
**Repo:** https://github.com/ANANDU-2000/HexaCV.git  

**Vercel = SPA only. Empty Environment Variables on Vercel is correct.**  
**Secrets + DB live on Render `hexacv-app` + Render Postgres `hexacv` (`dpg-d9lfhubm8hqs738kcq80-a`).**

---

## Architecture

| Layer | Where | Env |
|---|---|---|
| Frontend | Vercel `hexacv-admin-web` | Keep **empty** (optional public `VITE_*` later) |
| API | Render **`hexacv-app`** (`srv-d9lenj710e5c73di93h0`) | All secrets + `DATABASE_URL` |
| DB | Render Postgres **`hexacv`** Free (expires ~2026-08-29) | Internal URL on API service |
| Duplicate API | Render **`hexacv`** web (`srv-d9lekem417fc73coh0n0`) | **Suspend in dashboard** (MCP cannot suspend). Keep only `hexacv-app`. |

`/api/*` on hexacv.online → `https://hexacv-app.onrender.com/api/$1` ([`vercel.json`](../../vercel.json)).

---

## Database (PostgreSQL)

App uses **Drizzle + `pg`** (`postgresql://…`).  
**Not** MySQL. **Not** MongoDB.

| Use | URL |
|---|---|
| Render service env (internal) | `postgresql://hexacv_user:***@dpg-d9lfhubm8hqs738kcq80-a/hexacv` |
| Local / drizzle-kit (external) | `postgresql://hexacv_user:***@dpg-d9lfhubm8hqs738kcq80-a.singapore-postgres.render.com/hexacv?sslmode=require` |

Push schema: `DATABASE_URL=<external> npm run db:push`

---

## Vercel env

**Correct:** no variables.  
Delete if present: Mongo/`DATABASE_URL`, PayU, `VITE_*` AI secrets.

---

## Auth note

Login UI still uses `/api/mock/login` (not Clerk). Clerk keys unused until wired.

---

## Verify

1. `GET https://hexacv-app.onrender.com/api/health` → `{ok:true}`  
2. `GET https://www.hexacv.online/api/health` → same  
3. Mock login + resume parse  
4. Dashboard → suspend web service **`hexacv`** (not `hexacv-app`)
