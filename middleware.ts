import { neon } from "@neondatabase/serverless";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, sessionCookieOptions, signSession, verifySession } from "@/lib/admin/session";
import { matchRedirect, type RedirectRule } from "@/lib/redirects";
import { NOT_CITIES } from "@/lib/reserved";

// 0) Admin panel: every /admin page and /api/admin route needs a valid session cookie; an active session is
//    re-issued so the 1-hour timeout counts from the last request (pages and actions also re-check the
//    account in the database via requireAdmin()).
// 1) Old blog post URLs: /pages/blog.php?post=slug → /blog/slug (301, query string dropped).
//    Done here instead of next.config redirects, which would carry ?post= over to the new URL.
// 2) Redirects managed in Admin → SEO → Redirects (301/302/410), cached briefly in memory, with hit counting.
// 2b) /quotation/* (retired PHP quotation module) answers 410 Gone.
// 3) Location pages (router.php): a city slug that was deactivated or removed answers 410 Gone, so
//    search engines drop it faster than a 404. Active and unknown slugs fall through to app/[city]
//    (which renders the page or a 404).

const CITY_SLUG_RE = /^[a-z][a-z0-9-]{0,49}$/;

// Gone = deactivated, or removed (in the backup table) and not active again. The list changes rarely, so
// it's loaded once and kept in memory for a while instead of querying on every city page view.
const GONE_TTL_MS = 10 * 60 * 1000;
let gone: { slugs: Set<string>; expires: number } | null = null;

async function goneCities(): Promise<Set<string>> {
  if (gone && gone.expires > Date.now()) return gone.slugs;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = (await sql`
      SELECT slug FROM location_cities WHERE is_active = 0
      UNION
      SELECT slug FROM location_cities_removed_backup
      WHERE slug NOT IN (SELECT slug FROM location_cities WHERE is_active = 1)
    `) as { slug: string }[];
    gone = { slugs: new Set(rows.map((r) => r.slug)), expires: Date.now() + GONE_TTL_MS };
    return gone.slugs;
  } catch (err) {
    console.error("[middleware] gone-city lookup failed", err);
    return gone?.slugs ?? new Set(); // fail open: the page itself decides 404 vs render
  }
}

// Redirect rules change rarely; a 60-second cache keeps them off the request path almost always.
const REDIRECT_TTL_MS = 60 * 1000;
let redirects: { rules: RedirectRule[]; expires: number } | null = null;

async function redirectRules(): Promise<RedirectRule[]> {
  if (redirects && redirects.expires > Date.now()) return redirects.rules;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rules = (await sql`SELECT id, source_path, destination, status_code FROM seo_redirects WHERE is_active = 1`) as RedirectRule[];
    redirects = { rules, expires: Date.now() + REDIRECT_TTL_MS };
    return rules;
  } catch (err) {
    console.error("[middleware] redirect lookup failed", err);
    return redirects?.rules ?? [];
  }
}

function countHit(event: NextFetchEvent, id: number) {
  event.waitUntil(
    neon(process.env.DATABASE_URL!)`UPDATE seo_redirects SET hits = hits + 1, last_hit_at = LOCALTIMESTAMP WHERE id = ${id}`
      .then(() => undefined)
      .catch((err) => console.error("[middleware] redirect hit", err)),
  );
}

async function adminGate(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const res = NextResponse.next();
  // Re-issue at most every 5 minutes to keep the sliding window without signing on every request.
  if (session.exp - Date.now() / 1000 < SESSION_TTL_SECONDS - 300) {
    const { uid, u, pv } = session;
    res.cookies.set(SESSION_COOKIE, await signSession({ uid, u, pv }), sessionCookieOptions);
  }
  return res;
}

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) {
    return adminGate(req);
  }

  if (!pathname.startsWith("/api/")) {
    const hit = matchRedirect(await redirectRules(), pathname);
    if (hit) {
      countHit(event, hit.rule.id);
      if (hit.rule.status_code === 410) return NextResponse.rewrite(new URL("/gone", req.url), { status: 410 });
      return NextResponse.redirect(new URL(hit.location, req.url), hit.rule.status_code);
    }
  }

  // The PHP quotation module was retired with the move to Next.js: tell search engines it's gone for good.
  if (pathname === "/quotation" || pathname.startsWith("/quotation/")) {
    return NextResponse.rewrite(new URL("/gone", req.url), { status: 410 });
  }

  if (pathname === "/pages/blog.php") {
    const post = searchParams.get("post");
    const url = req.nextUrl.clone();
    url.search = "";
    url.pathname = post && /^[a-zA-Z0-9_-]+$/.test(post) ? `/blog/${post}` : "/blog";
    return NextResponse.redirect(url, 301);
  }

  const [first] = pathname.split("/").filter(Boolean);
  if (first && !NOT_CITIES.has(first) && CITY_SLUG_RE.test(first) && (await goneCities()).has(first)) {
    return NextResponse.rewrite(new URL("/gone", req.url), { status: 410 });
  }
  return NextResponse.next();
}

export const config = {
  // Every page request (admin redirects can target any path), but not Next internals or static assets.
  matcher: ["/((?!_next/|favicon\\.ico|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|wasm|txt|xml|json)$).*)"],
};
