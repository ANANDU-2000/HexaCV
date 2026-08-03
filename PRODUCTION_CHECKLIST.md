# HexaCv Production Readiness Checklist

This document details the security, performance, and configuration checks required to deploy the **HexaCv** platform to production by **HexaStack Solutions**.

## 1. Security Architecture

- [ ] **Rate Limiting**
  - Implement Express middleware (`express-rate-limit`) to limit API routes.
  - Limit login, file-upload parsing, and AI suggestion generation procedures to prevent DDOS or cost overruns.
- [ ] **JWT Session Token Policies**
  - Set session tokens to expire within 24 hours.
  - Implement JWT refresh token rotation with storage in HttpOnly, Secure, SameSite cookies.
- [ ] **SQL Injection Prevention**
  - Ensure all database queries use Drizzle ORM query builders or Prisma typed clients.
  - Avoid raw SQL string concatenation; use placeholders or template literals with `sql` tags.
- [ ] **XSS (Cross-Site Scripting) Protection**
  - Sanitize user HTML content inside the editor and preview using `dompurify` or safe text escapes.
  - Enable HTTP response header `Content-Security-Policy` (CSP) blocking unauthorized script injection.
- [ ] **CSRF (Cross-Site Request Forgery) Protection**
  - Use `SameSite=Lax` or `SameSite=Strict` flags on cookies.
  - Ensure `credentials: "include"` in frontend fetch requests is restricted only to trusted subdomains.
- [ ] **Data Encryption**
  - Encrypt database connection strings and environment values at rest on Render/Vercel.
  - Configure SSL connections for PostgreSQL database access (`ssl=true` or similar).

## 2. Infrastructure & Hosting

- [ ] **Frontend Deployment (Vercel)**
  - Bind environment variables (`VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`).
  - Optimize caching for static assets (images, service-worker, manifest).
- [ ] **Backend Deployment (Render)**
  - Configure Docker container parameters.
  - Set production env overrides (e.g. `NODE_ENV=production`, `PORT=3000`).
  - Connect Redis cache add-on to speed up requests.

## 3. SEO & Accessibility (WCAG AA)

- [ ] **SEO Meta Elements**
  - Verify `<title>` and `<meta name="description">` tags exist in client headers.
  - Check semantic tags hierarchy (single `<h1>` for page header, nested `<h2>` etc.).
- [ ] **Keyboard Accessibility**
  - Test builder forms to ensure all input fields and buttons are tab-navigable.
  - Ensure clear focus indicators appear on active inputs.
