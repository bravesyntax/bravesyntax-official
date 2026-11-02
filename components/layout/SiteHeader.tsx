import { getContactInfo } from "@/lib/contact";
import { rows, sql } from "@/lib/db";
import { getActiveServices } from "@/lib/services";
import Header from "./Header";

type SearchDoc = { kind: "post" | "project"; title: string; slug: string; sub: string | null };

/** Published blog posts and case studies for the site search (titles only, so the list stays small). */
async function searchDocs(): Promise<SearchDoc[]> {
  return rows<SearchDoc>(sql`
    (SELECT 'post' AS kind, title, slug, category AS sub FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC NULLS LAST LIMIT 60)
    UNION ALL
    (SELECT 'project' AS kind, title, slug, category AS sub FROM portfolios WHERE is_active = 1 AND COALESCE(slug, '') <> '' ORDER BY sort_order ASC LIMIT 40)
  `);
}

/** Server wrapper: feeds the client header the live services (Admin → Services), contact details (Admin → Settings)
 *  and the blog/case-study titles the search palette can find. */
export default async function SiteHeader() {
  const [services, c, docs] = await Promise.all([getActiveServices(), getContactInfo(), searchDocs()]);
  return (
    <Header
      services={services.map(({ title, category, slug }) => ({ title, category, slug }))}
      contact={{ email: c.email, phone: c.phone, phoneHref: c.phoneHref, whatsappHref: c.whatsappHref }}
      searchDocs={docs.map((d) => ({ title: d.title, url: d.kind === "post" ? `/blog/${d.slug}` : `/portfolio/${d.slug}`, kind: d.kind, sub: d.sub }))}
    />
  );
}
