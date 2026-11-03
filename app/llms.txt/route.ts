import { SITE_URL } from "@/lib/config";
import { getPortfolios } from "@/lib/content";
import { INDUSTRIES } from "@/lib/industries";
import { getActiveServices } from "@/lib/services";

export const revalidate = 3600;

/** A plain-text map of the site for AI tools, following the llms.txt proposal. */
export async function GET() {
  const [services, projects] = await Promise.all([getActiveServices(), getPortfolios()]);
  const text = [
    "# Brave Syntax",
    "",
    "> Brave Syntax is a design and development studio in Ghaziabad, India. It builds websites, web applications, online stores and brand identities, and quotes fixed prices.",
    "",
    "## Services",
    ...services.filter((s) => s.slug).map((s) => `- [${s.title}](${SITE_URL}/services/${s.slug}): ${s.tagline || s.description}`),
    "",
    "## Industries",
    ...INDUSTRIES.map((i) => `- [${i.title}](${SITE_URL}/industries/${i.slug}): ${i.desc}`),
    "",
    "## Projects",
    ...projects.filter((p) => p.slug).map((p) => `- [${p.title}](${SITE_URL}/portfolio/${p.slug})${p.year ? ` (${p.year})` : ""}`),
    "",
    "## Company",
    `- [About](${SITE_URL}/about)`,
    `- [Contact](${SITE_URL}/contact)`,
    `- [Free tools](${SITE_URL}/tools)`,
    `- [Blog](${SITE_URL}/blog)`,
    "",
  ].join("\n");
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
