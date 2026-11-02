# Brave Syntax website

The bravesyntax.com agency site: public pages, free tools, 320 location pages and a full admin panel.
Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind v4, on Neon Postgres, designed to deploy on Vercel.
`MIGRATION.md` records how it was moved from the old PHP site and why things work the way they do.

## Run it locally

Needs Node 20 or newer.

```bash
npm install --legacy-peer-deps
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

`npm run build` then `npm start` runs the production build. Building needs internet access: pages are generated
from the database and fonts are downloaded from Google.

On OneDrive, if a build fails with `EINVAL: readlink … .next`, stop the server, delete `.next` and build again.

## Environment variables

Every variable is described in `.env.example`. Never prefix a secret with `NEXT_PUBLIC_`.

| Variable | Needed for |
| --- | --- |
| `DATABASE_URL` | Everything (Neon connection string) |
| `ADMIN_SESSION_SECRET` | Admin sign-in. Use a different random value in each environment |
| `SMTP_PASS` | All email, including admin sign-in codes. Production sign-in is refused without it |
| `NEXT_PUBLIC_SITE_URL` | Canonical links and emails (defaults to https://bravesyntax.com) |
| `BLOB_READ_WRITE_TOKEN` | Admin image uploads on Vercel |
| `RESUME_BLOB_READ_WRITE_TOKEN` | Job application resumes (a separate, private Blob store) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` | Optional captcha on the contact form |

## Admin panel

Sign in at `/admin/login` with username, password and an emailed code. In `npm run dev` without `SMTP_PASS`, the code
is printed in the terminal instead.

```bash
node scripts/admin-user.mjs list
node scripts/admin-user.mjs create <username> <email> "Full Name"
node scripts/admin-user.mjs reset <username>
node scripts/admin-user.mjs unlock <username>
```

## Where things live

| Path | What |
| --- | --- |
| `app/(site)` | Public pages |
| `app/(site)/[city]`, `components/location` | Location pages |
| `app/admin` | Admin panel and sign-in |
| `lib/seo.ts`, `lib/admin/seo-audit.ts` | SEO resolution and the audit behind Admin → SEO |
| `lib/admin/images.ts` | Image uploads: Vercel Blob, or `public/uploads` when no token is set (not on Vercel) |
| `proxy.ts` | Admin gate, admin-managed redirects, 410 responses |
| `lib/email` | Email layout and templates |
| `scripts/migrate.mjs` | Applies a file from `db/migrations` |
| `scripts/make-brand-images.mjs` | Regenerates the share image and app icon from the original logo |

## Database

`db/schema.sql` is the reference schema; changes go in `db/migrations` and are applied with:

```bash
node scripts/migrate.mjs db/migrations/<file>.sql
```

`db/data.sql` is a dump of production data (password hashes, enquiries, job applicants). It is git-ignored on purpose:
never commit it or share it.

## Deploying

Connect the repository to Vercel, set the variables above and connect two Blob stores (public for images, private with
the `RESUME_BLOB` prefix for resumes). `vercel.json` runs server code in Singapore (`sin1`), next to the Neon database.

## UI

Public pages use [Velora UI](https://velora.colorlib.com/) (MIT, see `components/velora/LICENSE.txt`), with brand colours set in `app/globals.css`. `@tanstack/react-table` stays pinned to v8 because `components/velora/data-grid.tsx` is written for it. Use `npm install --legacy-peer-deps`; without the flag npm stalls resolving Next's optional `playwright` peer.

## SEO

City hub pages are indexed for the top 20 cities. City + service pages are indexed only for the cities in `SERVICE_PAGE_CITIES` (`lib/locations.ts`); the rest are `noindex, follow` and left out of the sitemap, because the same service page across every city reads too alike. Add a city to that list once its pages have their own content.
