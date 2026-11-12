import { SITE_URL } from "@/lib/config";
import { rows, sql } from "@/lib/db";

// Temporary sitemap of removed city pages (they answer 410 Gone). Listing them makes Google re-crawl them sooner,
// see the 410 and drop them from search. Remove this file, and its line in robots.ts, once Search Console shows
// these URLs are gone from the index (about 1–2 months).
export const revalidate = 86400;

export async function GET() {
  const gone = await rows<{ slug: string }>(sql`
    SELECT slug FROM location_cities WHERE is_active = 0
    UNION
    SELECT slug FROM location_cities_removed_backup
    WHERE slug NOT IN (SELECT slug FROM location_cities WHERE is_active = 1)
    ORDER BY slug
  `);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${gone.map((g) => `  <url><loc>${SITE_URL}/${g.slug}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "X-Robots-Tag": "noindex" } });
}
