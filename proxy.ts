import { neon } from "@neondatabase/serverless";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, sessionCookieOptions, signSession, verifySession } from "@/lib/admin/session";
import { matchRedirect, type RedirectRule } from "@/lib/redirects";
import { NOT_CITIES } from "@/lib/reserved";
import { LEGACY_PDF_TOOL_IDS } from "@/lib/tools/registry";

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
    console.error("[proxy] gone-city lookup failed", err);
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
    console.error("[proxy] redirect lookup failed", err);
    return redirects?.rules ?? [];
  }
}

// 4) Unknown slugs: any one- or two-segment path would reach app/[city] (and /blog/x, /portfolio/x, /services/x
//    their own dynamic pages), which renders a 404 and stores it in the ISR cache. Bots probe thousands of made-up
//    URLs (/wp-login, /xyz/abc), and every one cost an ISR write. Real slugs are kept in memory, and anything else
//    gets the pre-built /missing page with a 404 status: served from the cache, never written.
const KNOWN_TTL_MS = 60 * 1000;
type Known = { city: Set<string>; svc: Set<string>; blog: Set<string>; portfolio: Set<string>; service: Set<string> };
let known: { sets: Known; expires: number } | null = null;

async function knownSlugs(): Promise<Known | null> {
  if (known && known.expires > Date.now()) return known.sets;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = (await sql`
      SELECT 'city' AS k, slug FROM location_cities WHERE is_active = 1
      UNION ALL SELECT 'svc', slug FROM location_services WHERE is_active = 1 AND slug <> ''
      UNION ALL SELECT 'blog', slug FROM blog_posts WHERE is_published = 1
      UNION ALL SELECT 'portfolio', slug FROM portfolios WHERE is_active = 1 AND COALESCE(slug, '') <> ''
      UNION ALL SELECT 'service', slug FROM services WHERE is_active = 1 AND COALESCE(slug, '') <> ''
    `) as { k: keyof Known; slug: string }[];
    const sets: Known = { city: new Set(), svc: new Set(), blog: new Set(), portfolio: new Set(), service: new Set() };
    for (const r of rows) sets[r.k]?.add(r.slug);
    known = { sets, expires: Date.now() + KNOWN_TTL_MS };
    return sets;
  } catch (err) {
    console.error("[proxy] slug lookup failed", err);
    return known?.sets ?? null; // fail open: the pages decide
  }
}

const missing = (req: NextRequest) => NextResponse.rewrite(new URL("/missing", req.url), { status: 404 });

function countHit(event: NextFetchEvent, id: number) {
  event.waitUntil(
    neon(process.env.DATABASE_URL!)`UPDATE seo_redirects SET hits = hits + 1, last_hit_at = LOCALTIMESTAMP WHERE id = ${id}`
      .then(() => undefined)
      .catch((err) => console.error("[proxy] redirect hit", err)),
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

export async function proxy(req: NextRequest, event: NextFetchEvent) {
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

  // The PDF tools used to open through a query string; each now has its own page.
  if (pathname === "/pdf-tools" && searchParams.has("tool")) {
    const slug = LEGACY_PDF_TOOL_IDS[searchParams.get("tool") ?? ""];
    const url = req.nextUrl.clone();
    url.search = "";
    url.pathname = slug ? `/pdf-tools/${slug}` : "/pdf-tools";
    return NextResponse.redirect(url, 301);
  }

  if (pathname === "/pages/blog.php") {
    const post = searchParams.get("post");
    const url = req.nextUrl.clone();
    url.search = "";
    url.pathname = post && /^[a-zA-Z0-9_-]+$/.test(post) ? `/blog/${post}` : "/blog";
    return NextResponse.redirect(url, 301);
  }

  const segs = pathname.split("/").filter(Boolean);
  const [first] = segs;
  if (first && !NOT_CITIES.has(first) && CITY_SLUG_RE.test(first) && (await goneCities()).has(first)) {
    // Still 410 (so search engines drop it), but the page names the city and offers remote help to visitors.
    return NextResponse.rewrite(new URL(`/gone?city=${first}`, req.url), { status: 410 });
  }

  // 4) Paths that would reach a dynamic page with a slug that doesn't exist. Files (anything with an extension,
  //    such as /media/home-reel.mp4) are left to the static file server.
  if ((segs.length === 1 || segs.length === 2) && !/\.[a-z0-9]{1,5}$/i.test(pathname)) {
    let slug = "";
    try {
      slug = decodeURIComponent(segs[segs.length - 1]);
    } catch {
      return missing(req);
    }
    const dynamicChild: Record<string, keyof Known> = { blog: "blog", portfolio: "portfolio", services: "service" };
    if (segs.length === 2 && dynamicChild[first]) {
      const sets = await knownSlugs();
      if (sets && !sets[dynamicChild[first]].has(slug)) return missing(req);
    } else if (!NOT_CITIES.has(first)) {
      // Not a real top-level route: only an active city (and, below it, an active location service) exists here.
      const sets = await knownSlugs();
      if (sets && (!sets.city.has(first) || (segs.length === 2 && !sets.svc.has(slug)))) return missing(req);
    }
  }
  return NextResponse.next();
}

export const config = {
  // Every page request (admin redirects can target any path), but not Next internals or static assets.
  matcher: ["/((?!_next/|favicon\\.ico|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|wasm|txt|xml|json|mp4|webm)$).*)"],
};
