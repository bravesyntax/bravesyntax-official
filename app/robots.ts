import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

// /robots.txt (from the old robots.txt). Blog and portfolio images under /uploads/ stay crawlable;
// resumes and quote logos are no longer public at all. /quotation/ is left crawlable so search engines see its 410.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/uploads/",
      disallow: ["/admin/", "/api/", "/gone", "/*?q=", "/*&q="],
    },
    // sitemap-removed.xml is temporary: it lists removed city pages so Google drops them sooner.
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/sitemap-removed.xml`],
  };
}
