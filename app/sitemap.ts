import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getActiveJobs } from "@/lib/content";
import { rows, sql } from "@/lib/db";
import { getIndexableLocationPaths } from "@/lib/locations";
import { noindexKeys } from "@/lib/seo";
import { SEO_PAGES } from "@/lib/seo-pages";
import { getActiveServices } from "@/lib/services";
import { PDF_TOOL_LIST, WEB_TOOL_LIST } from "@/lib/tools/registry";

// /sitemap.xml — every indexable public URL. Anything set to noindex in Admin → SEO is left out, as are
// non-canonical URLs (a page whose canonical points elsewhere shouldn't be listed). Regenerated at most hourly.
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [hidden, canonicalised] = await Promise.all([
    noindexKeys(),
    rows<{ entity_type: string; entity_key: string; canonical_url: string }>(
      sql`SELECT entity_type, entity_key, canonical_url FROM seo_meta WHERE COALESCE(canonical_url, '') <> ''`,
    ),
  ]);
  const canonicalOf = new Map(canonicalised.map((c) => [`${c.entity_type}:${c.entity_key}`, c.canonical_url.replace(/\/$/, "")]));
  const out: Entry[] = [];
  /** Adds the URL unless it is noindex or canonicalised to a different URL. */
  const add = (type: keyof typeof hidden, key: string, entry: Entry) => {
    const canonical = canonicalOf.get(`${type}:${key}`);
    if (hidden[type].has(key) || (canonical && canonical !== entry.url.replace(/\/$/, ""))) return;
    out.push(entry);
  };

  // 1. Static pages
  for (const p of SEO_PAGES) {
    add("page", p.slug, { url: p.path === "/" ? SITE_URL : `${SITE_URL}${p.path}`, changeFrequency: p.changeFrequency, priority: p.priority });
  }

  // 1b. Service pages
  for (const s of await getActiveServices()) {
    if (s.slug) add("page", `services/${s.slug}`, { url: `${SITE_URL}/services/${s.slug}`, changeFrequency: "monthly", priority: 0.8 });
  }

  // 1b. Free tools
  for (const t of PDF_TOOL_LIST) add("page", `pdf-tools/${t.slug}`, { url: `${SITE_URL}/pdf-tools/${t.slug}`, changeFrequency: "monthly", priority: 0.7 });
  for (const t of WEB_TOOL_LIST) add("page", `tools/${t.slug}`, { url: `${SITE_URL}/tools/${t.slug}`, changeFrequency: "monthly", priority: 0.7 });

  // 1c. Open job pages
  for (const j of await getActiveJobs()) {
    out.push({ url: `${SITE_URL}/careers?job=${encodeURIComponent(j.slug)}`, changeFrequency: "weekly", priority: 0.6 });
  }

  // 2. Blog posts, with their real last-modified dates
  const posts = (await sql`
    SELECT id, slug, COALESCE(updated_at, published_at) AS modified FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC NULLS LAST
  `) as { id: number; slug: string; modified: Date | null }[];
  for (const p of posts) {
    add("post", String(p.id), { url: `${SITE_URL}/blog/${encodeURIComponent(p.slug)}`, changeFrequency: "monthly", priority: 0.7, lastModified: p.modified ?? undefined });
  }

  // 3. Portfolio case studies
  const projects = (await sql`
    SELECT id, slug, updated_at FROM portfolios WHERE is_active = 1 AND COALESCE(slug, '') <> '' ORDER BY sort_order ASC
  `) as { id: number; slug: string; updated_at: Date | null }[];
  for (const p of projects) {
    add("project", String(p.id), { url: `${SITE_URL}/portfolio/${encodeURIComponent(p.slug)}`, changeFrequency: "monthly", priority: 0.6, lastModified: p.updated_at ?? undefined });
  }

  // 4. Location pages — indexable tier only (the rest are noindex,follow by design)
  const { cities, serviceCities, services } = await getIndexableLocationPaths();
  for (const city of cities) {
    add("location", city, { url: `${SITE_URL}/${city}`, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const city of serviceCities) {
    for (const svc of services) {
      add("location", `${city}/${svc}`, { url: `${SITE_URL}/${city}/${svc}`, changeFrequency: "monthly", priority: 0.7 });
    }
  }

  return out.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.url.localeCompare(b.url));
}
