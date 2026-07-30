# Vercel — HexaCV frontend only

**Project:** `hexacv-admin-web`  
**Domain:** https://www.hexacv.online  
**API:** Render `hexacv-app` + Postgres `hexacv`

## Vercel env (public only)

Empty is OK for a guest-only SPA. For **real Manus OAuth** on production Login, add these **public** keys on Vercel (safe in the client bundle):

| Key | Purpose |
|---|---|
| `VITE_OAUTH_PORTAL_URL` | Manus auth portal base URL (e.g. `https://auth.hexastacksolutions.com`) |
| `VITE_APP_ID` | App id for Manus `/app-auth` |

**Do not** put on Vercel: `DATABASE_URL`, Razorpay secrets, LLM keys, `JWT_SECRET`, `ADMIN_PASSWORD`.

After adding `VITE_*`, redeploy Vercel so the client bundle embeds them.

## Auth behavior

| Environment | Google / OAuth CTA | Mock `/api/mock/login` |
|---|---|---|
| Localhost | Dev mock allowed (labeled) if portal unset; portal if `VITE_*` set | Allowed |
| Production | Manus OAuth when `VITE_*` set; else toast (no fake “Google Candidate”) | **Admin email+password only** |

`useAuth` prefers **`auth.me`** (server) over localStorage.

Profile: `/dashboard/settings` — name save via `auth.updateProfile`.

## Builder steps

Primary form steps: Header → Summary → Skills → Experience → Projects → Education → **More** (optional) → Review. Live Preview stays a side panel / mobile tab, not a forced 12-step march.

## Verify

1. `GET https://www.hexacv.online/api/health` → ok  
2. Production Google CTA must **not** create `mock-google-*` openIds when OAuth env is set  
3. Header name links to Account Settings  
4. Profile save persists to Postgres  
