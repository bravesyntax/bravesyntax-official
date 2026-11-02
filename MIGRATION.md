# PHP → Next.js migration

Target: Next.js (App Router, TypeScript) on Vercel, data in Neon Postgres.
The original PHP site in the parent folder stays untouched as the reference until switch-over.

## Database

- `scripts/convert-mysql-dump.mjs <dump.sql>` turns the phpMyAdmin dump into `db/schema.sql` + `db/data.sql`.
- `node --env-file=.env.local scripts/load-db.mjs` loads them into Neon (refuses if tables already have data; `--force` drops and reloads).
- Type mapping: `tinyint(1)` → `smallint` (still 0/1), enums → `text`, `datetime/timestamp` → `timestamp`.
  `ON UPDATE CURRENT_TIMESTAMP` is a `set_updated_at` trigger.
- Already loaded into Neon (row counts verified against the dump).

## Progress

| Step | Scope | Status |
| --- | --- | --- |
| 1 | Scaffold, DB migration, config/settings/SEO helpers, header, footer, search palette, 404, home page, legacy redirects | Done |
| 2 | Static pages: about, services, industries | Done |
| 3 | Data pages: portfolio + portfolio/[slug], blog + blog/[slug], careers (application form saves to Neon, no resume yet) | Done |
| 4 | Forms: contact (SMTP mail, rate limit, honeypot/time trap/spam filter, optional Turnstile), career resume upload (browser → private Vercel Blob, since Vercel caps function bodies at 4.5 MB) | Done |
| 5 | Tools: pdf-tools (original engine in `public/js/pdf-tools.js`), bg-remover (rewritten in React) | Done |
| 6 | Location pages `/[city]` and `/[city]/[service]` (410 for removed cities), sitemap.xml, robots.txt | Done |
| 7 | Admin panel (auth, blog, portfolio, careers, services, SEO, settings, messages, locations) | Done |
| 8 | Google Search Console tool | |
| 9 | ~~Quotation module~~ — dropped (not ported). Old `/quotation/*` URLs answer 410 Gone. | Removed |
| 10 | Vercel deploy, env vars, DNS switch-over (`vercel.json` already pins the Singapore region, next to Neon) | |

## Notes

- Page CSS ported from PHP `<style>` blocks lives next to each page (`app/<page>/<page>.css`) and is scoped under a
  `.pg-<page>` wrapper, because CSS imported by a page stays loaded after client-side navigation.
- `services.icon` is `varchar(500)`; the "Website Maintenance & Support" icon was already truncated in MySQL.
- `uploads/blog/blog_1788609176_b4ca1920f5d6.png` (featured image of blog post 14) was not in the project copy;
  fetch it from the live server into `public/uploads/blog/`.
- Rate limits are counted from the table the form writes to (e.g. `career_applications.ip_address`), replacing
  the PHP `secure_storage/ratelimit/*.json` files.
- Old `/pages/blog.php?post=` URLs are redirected in `middleware.ts`.
- Environment variables are documented in `.env.example` (SMTP, Turnstile, Blob are optional; features switch on when set).
- `career_applications.resume_file`: old rows hold a filename from `uploads/resumes/`; new rows hold a private Blob URL
  (the admin downloads it through `/api/admin/resume/<id>`). Old filenames are shown as "stored on the old server";
  those files would need uploading to the private store to be downloadable — they must not go in `public/`.
- PDF Toolkit: the 16-tool engine is the PHP page's JavaScript, kept as a static script (`public/js/pdf-tools.js`)
  with CDN pdf-lib / pdf.js / JSZip / Tesseract as before. The React page renders its markup once and calls
  `pdfToolsInit()` on each mount. Edit tool behaviour in that file; it is excluded from ESLint.
- Header "Tools" menu links `?tool=pdf-to-word`, `pdf-to-excel` and `word-to-pdf`, which don't exist (same on the
  PHP site); those links open the toolkit without a tool selected.
- Location pages: unknown city → 404; deactivated city, or a slug in `location_cities_removed_backup` that isn't
  active again → 410 (middleware.ts, gone-list cached 10 min). PHP returned 404 for the 382 removed slugs because it
  only checked `location_cities`; 410 is what its own comments intended. Only the top `LOCATION_INDEXABLE_CITY_LIMIT`
  (default 20) cities are indexable and in the sitemap. New top-level routes must be added to `NOT_CITIES` in
  `lib/reserved.ts` (the location admin also refuses those as city slugs).
- `pages/sitemap-viewer.php` and `pages/preview.php` were not linked or routed anywhere, so they were not ported.
- `contact_messages` rows saved by PHP are HTML-escaped (`sanitize()` ran before INSERT, e.g. `O&#039;Brien`); new rows
  are stored as plain text. The admin messages view should decode entities for old rows.

- Uploaded images in `public/uploads/{blog,portfolio}` are copied as-is. Admin image uploads go to Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set; otherwise (local / any non-Vercel host) they are saved to `public/uploads/<kind>/` with PHP-style names and served by `app/uploads/[kind]/[name]/route.ts` until the next build. On Vercel the disk is read-only, so Blob is required there.
- Resumes and quote logos are intentionally **not** in `public/` (private).
- Admin passwords are PHP bcrypt (`$2y$`); `bcryptjs` verifies these once the prefix is normalized to `$2a$`/`$2b$`.
- Admin panel (step 7): sessions are a signed `bs_admin` cookie (`ADMIN_SESSION_SECRET`, 1 h sliding), checked in
  middleware and again against `admin_users` in every page and action; 5 failed logins lock for 15 min. Old
  `/admin/*.php` URLs redirect to the new pages. Edits revalidate the public pages immediately.
- Vercel Blob needs **two** stores (a store is either public or private): a public one (default `BLOB_` prefix) for
  admin blog/portfolio images, and a private one connected with env prefix `RESUME_BLOB` for resumes. Images that
  are replaced or removed are deleted from Blob; legacy files in `public/uploads` are left alone.
- The `categories` table is managed in the admin (as on the PHP site) but nothing on the public site reads it.
- Deactivating or deleting a city takes up to 10 minutes to start answering 410 (middleware gone-list cache).

## Audit & hardening (2026-10-27)

- **Admin sign-in is two-step**: password, then a 6-digit code emailed to the admin address (Settings → Account).
  Codes are HMAC-hashed at rest, expire in 10 min, are single-use, allow 5 guesses, resend after 60 s (max 5 per
  15 min). Production refuses sign-in when SMTP is not configured; dev prints the code to the server log.
  Tables: `admin_login_otps`, `admin_login_failures` (migration `db/migrations/2026-10-27-admin-otp.sql`,
  applied with `node scripts/migrate.mjs <file>`).
- **Brute force**: 5 wrong passwords lock the account for 15 min; 10 failures per IP in 15 min block that IP;
  errors never reveal whether a username exists. Lock checks run in SQL (DB timestamps have no time zone).
- **Emails**: one table-based layout (`lib/email/layout.ts`) and all templates in `lib/email/templates.ts`
  (enquiry alert + auto-reply, reply, application alert + auto-reply, sign-in code, password-changed alert).
  Preview them at Admin → Email Templates.
- **Admin-driven content**: contact details, WhatsApp, hours, response time, booking/Upwork links and socials come
  from Settings via `lib/contact.ts` (header, footer, contact, about, home, location pages, schema, emails).
  Home "What we build", the header mega menu and site search use the Services table (first 6 by sort order are
  featured). Privacy Policy and Terms are editable at Admin → Legal Pages.
- **SEO (v2, rebuilt)**: one `seo_meta` row per URL (`page` / `post` / `project` / `location`, keyed by slug, id
  or `city[/service]`) holding only what an admin overrides: title, description, focus keyword, share image,
  canonical, noindex, custom JSON-LD. Everything else resolves admin value → built-in default → site default
  (`lib/seo.ts`). Location titles/descriptions come from 4 templates (`{city}`, `{state}`, `{service}`, `{keyword}`,
  `{site}`, `{suffix}`). Admin → SEO has: Overview (health score + issues: duplicates, lengths, noindex, missing
  image/keyword), per-type lists, a per-URL editor with Google/social previews and live checks, Redirects
  (301/302/410, `/old/*` wildcards, hit counts; served by middleware with a 60 s cache) and Settings (title suffix,
  fallback description, share image, Google/Bing verification, organisation schema). The sitemap skips noindex and
  canonicalised URLs. Migration: `db/migrations/2026-10-27-seo-v2.sql`. The old `seo_pages`, `seo_keywords` and
  `categories` tables are no longer used (left in place; drop when convenient). The fake aggregateRating in the
  home schema was removed.
- **Security**: admin HTML (blog, jobs, legal) is sanitized with sanitize-html before rendering; security headers
  (CSP baseline, HSTS, COOP, nosniff, frame options); admin/API responses are no-store + noindex; X-Powered-By off.
  Known, accepted advisories: postcss inside Next.js (build-time only) and zod inside @vercel/oidc (CLI config).
- **Icons**: Lucide (`lucide-react`) everywhere instead of emojis. Location feature JSON takes icon names
  (code, palette, search, …); legacy emojis map to icons automatically.
- DB read errors in `getActiveServices`/`getSiteSettings` are rethrown so a timeout can never cache a page with
  empty menus or contact details.
- Windows/OneDrive: if `next build` fails with `EINVAL: readlink … .next`, delete `.next` and rebuild.

