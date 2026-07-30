# HexaCV v6 — Marketing, SEO, Analytics & Blog CRM (Super Admin)
Prepared for: Anandu / HexaStack Solutions
Reads with: V4 Phase B/D admin panel work, V5 Page 9 (Super Admin).
This adds Phase I — everything here lives inside the existing admin
panel as new tabs, per the "extend, don't build a separate app" rule
already established in V4/V5.

---

## I1. SEO fundamentals (code-level, not admin-configurable)
- Scope: `client/` page templates, `next-sitemap` or equivalent,
  one new `robots.txt` + `sitemap.xml` route
- Task: every public page (landing, blog posts, pricing) gets
  server-rendered `<title>`, `<meta description>`, Open Graph tags,
  canonical URL — these are per-page code, not admin fields, because
  they need to exist even before an admin edits anything
- Task: `sitemap.xml` auto-generates from published blog posts +
  static pages, regenerates on publish (not a manual admin button)
- Validate: `/sitemap.xml` returns valid XML listing every published
  post and static page, `/robots.txt` allows crawling of public
  pages and disallows `/admin`, `/api`, `/builder` (logged-in-only
  areas shouldn't be crawled or indexed)

## I2. Google Search Console + Analytics — admin-configurable
- Scope: new admin tab `Marketing`, `site_config` table (or extend
  existing config pattern) with fields: `gaTrackingId`,
  `gscVerificationTag`, `metaPixelId` (optional, only if ever needed)
- Task: admin pastes their GA4 Measurement ID and GSC verification
  meta tag value into the panel — site injects them server-side into
  the `<head>` of public pages; no tracking code hardcoded, so
  swapping properties never needs a deploy
- Validate: paste a real GA4 ID, confirm the tag appears in rendered
  HTML `<head>` on the next page load (view-source, not devtools
  inspector, to confirm it's server-rendered not JS-injected only)

## I3. Blog CRM — admin can write, publish, and manage posts
- Scope: new tables `blog_posts` (id, slug, title, body, excerpt,
  coverImageUrl, status: draft/published, publishedAt, authorId,
  seoTitle, seoDescription), new admin tab `Blog`, new public route
  `/blog` and `/blog/[slug]`
- Task: admin editor — title, slug (auto-generated from title, editable),
  a rich-text or markdown body field, cover image upload, excerpt,
  SEO title/description overrides (fallback to title/excerpt if blank)
- Task: **Draft vs Published** status is the only gate — no separate
  approval workflow needed at this stage (single admin/small team),
  but keep the field so a review step can be added later without a
  schema change
- Task: "Share" button per post — generates the public URL + a
  pre-filled share text for WhatsApp/LinkedIn (your stated channels
  given the Gulf/Kerala audience), opens the platform's share intent
  URL, doesn't post automatically on the admin's behalf
- Validate: publish a post, confirm it appears at `/blog/<slug>`
  with correct SEO meta tags and shows up in the next sitemap
  regeneration; set back to draft, confirm the public URL 404s
  immediately (no cached-published-page leak)

## I4. Blog content ideas (product-fit, not engineering — for planning only)
Not a build task — a content backlog to seed once I3 ships:
- "ATS-safe resume format for Gulf job applications"
- "How UAE/Saudi/Qatar visa-status fields should appear on a resume"
- Country-specific resume differences (ties directly to your
  country-rule engine in V2_ROADMAP §8 — genuinely differentiated
  content, not generic "10 resume tips" filler)
- Case-study style posts once the evaluation dataset (V2_ROADMAP §7)
  has real accept/reject data worth writing about

## I5. Admin analytics tab — what's already yours vs. what needs GA
- Scope: existing CRM/Overview tab (V5 Page 9) already tracks guest
  sessions, conversions, downloads — that data is yours, query it
  directly, don't re-implement it in GA
- Task: GA/GSC (I2) is for **external** discovery data you don't
  otherwise have — organic search queries, referral sources, page-
  level traffic from outside your own app. Keep the two data sources
  visually separate in the admin UI (e.g. "Product analytics" tab
  vs "Marketing/SEO" tab) so nobody confuses "5 people downloaded a
  resume today" (your DB) with "340 people saw us in Google search"
  (GSC) — they answer different questions.

**Phase I exit criteria:** admin can publish an SEO-tagged blog post
with zero code deploy, GA/GSC are wired via config not hardcoded IDs,
and the sitemap reflects published content automatically.

---

## Cursor scope-lock notes

- New tables: `blog_posts`, `site_config` (or extend existing config
  table if one already holds admin-settable site-wide values).
- Do not build a comment system, tags/categories taxonomy, or
  multi-author roles for the blog unless a real need shows up — one
  admin, draft/published, is the whole v1 scope here.
- robots.txt/sitemap.xml are code-generated, not admin-editable
  fields — don't add a text box for "edit your sitemap," that
  invites a broken XML file being hand-typed by a non-developer.
