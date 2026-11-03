import { getPdfTool, TOOL_GROUPS } from "@/lib/tools/registry";
// Menu data shared by the header mega menu and mobile drawer (from includes/header.php).

/** Header menu groups, built from the admin-managed services table (see app/(site)/layout.tsx). */
export type NavService = { title: string; category: string; slug: string };

/** A service's own page; services without a slug yet fall back to the contact form. */
export const serviceHref = (s: { title: string; slug: string }) => (s.slug ? `/services/${s.slug}` : contactServiceHref(s.title));
export type NavServiceGroup = { id: string; name: string; items: string[] };

export function groupNavServices(services: NavService[]): NavServiceGroup[] {
  return (
    [
      ["design", "Design"],
      ["development", "Development"],
    ] as const
  )
    .map(([id, name]) => ({ id, name, items: services.filter((s) => s.category === id).map((s) => s.title) }))
    .filter((g) => g.items.length);
}

export type PdfTool = { name: string; slug: string; desc: string; group: string };

export { PDF_TOOL_COUNT } from "@/lib/tools/registry";

const POPULAR_PDF_TOOLS = ["compress-pdf", "merge-pdf", "split-pdf", "image-to-pdf", "pdf-to-image", "sign-pdf", "protect-pdf", "pdf-to-text"];

/** The popular tools shown in menus. */
export const PDF_TOOLS: PdfTool[] = POPULAR_PDF_TOOLS.map((slug) => {
  const t = getPdfTool(slug)!;
  return { name: t.name, slug: t.slug, desc: t.short, group: TOOL_GROUPS[t.group] };
});

export const PDF_TOOL_GROUPS: [string, PdfTool[]][] = Object.entries(
  PDF_TOOLS.reduce<Record<string, PdfTool[]>>((acc, t) => {
    (acc[t.group] ??= []).push(t);
    return acc;
  }, {}),
);

export const NAV_LINKS = [
  { href: "/portfolio", label: "Work" },
  { href: "/industries", label: "Industries" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
];

export const contactServiceHref = (service: string) => `/contact?service=${encodeURIComponent(service)}`;
