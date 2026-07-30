# Vercel — HexaCV frontend only

**Domain:** https://www.hexacv.online  
**API:** Render `hexacv-app` + Postgres  

## Required for live sign-in (public VITE_ only)

Set on **Vercel** and redeploy:

| Key | Notes |
|---|---|
| `VITE_OAUTH_PORTAL_URL` | Manus portal base URL |
| `VITE_APP_ID` | Manus app id |

Without these, Login/Register show a clear error and guest mode only — **no fake Google / test emails**.

Never put on Vercel: `DATABASE_URL`, LLM keys, Razorpay secrets, `JWT_SECRET`, `ADMIN_PASSWORD`.

## Auth rules (live only)

- Login / Register → Manus OAuth only (`getLoginUrl`)
- `/api/mock/login` → **disabled** unless `ALLOW_MOCK_LOGIN=true` on Render (admin recovery only)
- `useAuth` prefers `auth.me` (server session)
- Legacy `Google Candidate` / `mock-*` localStorage users are purged on load

## Builder

Steps: Header → Summary → Skills → Experience → Projects → Education → More → Review
