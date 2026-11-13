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
// 2) Redirects managed in Admin → SEO → Redirects (301/302/410), cached in memory (see below), with hit counting.
// 2b) /quotation/* (retired PHP quotation module) answers 410 Gone.
// 3) Location pages (router.php): a city slug that was deactivated or removed answers 410 Gone, so
//    search engines drop it faster than a 404. Active and unknown slugs fall through to app/[city]
//    (which renders the page or a 404).

const CITY_SLUG_RE = /^[a-z][a-z0-9-]{0,49}$/;

// Everything the proxy needs from the database (removed cities, redirect rules, real slugs) is loaded with ONE
// query and kept in memory for 15 minutes. Querying less often lets the free Neon database sleep between visits
// (its free plan limits compute hours), and keeps the proxy fast.
//   gone  = deactivated, or removed (in the backup table) and not active again: answered with 410
//   known = real slugs of the dynamic pages (see 4 below)
const LOOKUP_TTL_MS = 15 * 60 * 1000;
// A slug the list doesn't know may belong to a post published a moment ago: reload early, but at most this often.
const MISS_RELOAD_MS = 3 * 60 * 1000;
type Known = { city: Set<string>; svc: Set<string>; blog: Set<string>; portfolio: Set<string>; service: Set<string> };
type Lookup = { gone: Set<string>; redirects: RedirectRule[]; known: Known };
let lookup: { data: Lookup; loadedAt: number } | null = null;
let loading: Promise<Lookup | null> | null = null;

async function loadLookup(): Promise<Lookup | null> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = (await sql`
      SELECT 'gone' AS k, slug AS v, NULL::int AS id, NULL::text AS dest, NULL::int AS code FROM location_cities WHERE is_active = 0
      UNION ALL SELECT 'gone', slug, NULL, NULL, NULL FROM location_cities_removed_backup
        WHERE slug NOT IN (SELECT slug FROM location_cities WHERE is_active = 1)
      UNION ALL SELECT 'redirect', source_path, id, destination, status_code FROM seo_redirects WHERE is_active = 1
      UNION ALL SELECT 'city', slug, NULL, NULL, NULL FROM location_cities WHERE is_active = 1
      UNION ALL SELECT 'svc', slug, NULL, NULL, NULL FROM location_services WHERE is_active = 1 AND slug <> ''
      UNION ALL SELECT 'blog', slug, NULL, NULL, NULL FROM blog_posts WHERE is_published = 1
      UNION ALL SELECT 'portfolio', slug, NULL, NULL, NULL FROM portfolios WHERE is_active = 1 AND COALESCE(slug, '') <> ''
      UNION ALL SELECT 'service', slug, NULL, NULL, NULL FROM services WHERE is_active = 1 AND COALESCE(slug, '') <> ''
    `) as { k: string; v: string; id: number | null; dest: string | null; code: number | null }[];
    const data: Lookup = { gone: new Set(), redirects: [], known: { city: new Set(), svc: new Set(), blog: new Set(), portfolio: new Set(), service: new Set() } };
    for (const r of rows) {
      if (r.k === "gone") data.gone.add(r.v);
      else if (r.k === "redirect") data.redirects.push({ id: r.id!, source_path: r.v, destination: r.dest ?? "", status_code: r.code as RedirectRule["status_code"] });
      else data.known[r.k as keyof Known]?.add(r.v);
    }
    lookup = { data, loadedAt: Date.now() };
    return data;
  } catch (err) {
    console.error("[proxy] lookup failed", err);
    return lookup?.data ?? null; // fail open: the pages decide
  } finally {
    loading = null;
  }
}

/** Cached lookup; `maxAge` lets a caller ask for a fresher copy (one load at a time per instance). */
async function getLookup(maxAge = LOOKUP_TTL_MS): Promise<Lookup | null> {
  if (lookup && Date.now() - lookup.loadedAt < maxAge) return lookup.data;
  loading ??= loadLookup();
  return loading;
}

async function goneCities(): Promise<Set<string>> {
  return (await getLookup())?.gone ?? new Set();
}

async function redirectRules(): Promise<RedirectRule[]> {
  return (await getLookup())?.redirects ?? [];
}

// 4) Unknown slugs: any one- or two-segment path would reach app/[city] (and /blog/x, /portfolio/x, /services/x
//    their own dynamic pages), which renders a 404 and stores it in the ISR cache. Bots probe thousands of made-up
//    URLs (/wp-login, /xyz/abc), and every one cost an ISR write. Real slugs are kept in memory, and anything else
//    gets the pre-built /missing page with a 404 status: served from the cache, never written.
/** Whether a slug exists; an unknown one triggers an early reload (rate-limited) before it is called missing. */
async function slugExists(kind: keyof Known, slug: string, also?: [keyof Known, string]): Promise<boolean> {
  const ok = (d: Lookup) => d.known[kind].has(slug) && (!also || d.known[also[0]].has(also[1]));
  const data = await getLookup();
  if (!data || ok(data)) return true;
  const fresh = await getLookup(MISS_RELOAD_MS);
  return !fresh || ok(fresh);
}

const missing = (req: NextRequest) => NextResponse.rewrite(new URL("/missing", req.url), { status: 404 });

// Redirect hits are counted in memory and saved in one write every 15 minutes (or every 25 hits), instead of a
// database write per visit. A few counts can be lost when an instance shuts down; they are statistics only.
const pendingHits = new Map<number, number>();
let hitsFlushedAt = Date.now();

function countHit(event: NextFetchEvent, id: number) {
  pendingHits.set(id, (pendingHits.get(id) ?? 0) + 1);
  const total = [...pendingHits.values()].reduce((a, b) => a + b, 0);
  if (total < 25 && Date.now() - hitsFlushedAt < LOOKUP_TTL_MS) return;
  const ids = [...pendingHits.keys()];
  const counts = ids.map((i) => pendingHits.get(i)!);
  pendingHits.clear();
  hitsFlushedAt = Date.now();
  event.waitUntil(
    neon(process.env.DATABASE_URL!)`
      UPDATE seo_redirects r SET hits = r.hits + c.n, last_hit_at = LOCALTIMESTAMP
      FROM unnest(${ids}::int[], ${counts}::int[]) AS c(id, n) WHERE r.id = c.id
    `
      .then(() => undefined)
      .catch((err) => console.error("[proxy] redirect hits", err)),
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
      if (!(await slugExists(dynamicChild[first], slug))) return missing(req);
    } else if (!NOT_CITIES.has(first)) {
      // Not a real top-level route: only an active city (and, below it, an active location service) exists here.
      if (!(await slugExists("city", first, segs.length === 2 ? ["svc", slug] : undefined))) return missing(req);
    }
  }
  return NextResponse.next();
}

export const config = {
  // Every page request (admin redirects can target any path), but not Next internals or static assets.
  matcher: ["/((?!_next/|favicon\\.ico|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|wasm|txt|xml|json|mp4|webm)$).*)"],
};
