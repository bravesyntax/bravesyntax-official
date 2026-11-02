// Menu data shared by the header mega menu and mobile drawer (from includes/header.php).

/** Header menu groups, built from the admin-managed services table (see app/(site)/layout.tsx). */
export type NavService = { title: string; category: string };
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

/** How many tools public/js/pdf-tools.js has. PDF_TOOLS below is only the popular ones shown in menus. */
export const PDF_TOOL_COUNT = 16;

export const PDF_TOOLS: PdfTool[] = [
  { name: "Image to PDF", slug: "img2pdf", desc: "Convert images to PDF format", group: "Convert" },
  { name: "PDF to JPG", slug: "pdf2img", desc: "Extract pages as high-quality images", group: "Convert" },
  { name: "PDF Merge", slug: "merge", desc: "Combine multiple PDFs into one", group: "Organize" },
  { name: "PDF Split", slug: "split", desc: "Split PDF pages into separate files", group: "Organize" },
  { name: "Rotate PDF", slug: "rotate", desc: "Rotate PDF pages easily", group: "Organize" },
  { name: "PDF Compress", slug: "compress", desc: "Reduce PDF file size significantly", group: "Optimize & Secure" },
  { name: "PDF Watermark", slug: "watermark", desc: "Add text or image watermarks", group: "Optimize & Secure" },
  { name: "Unlock PDF", slug: "unlock", desc: "Remove PDF password protection", group: "Optimize & Secure" },
];

export const PDF_TOOL_GROUPS: [string, PdfTool[]][] = Object.entries(
  PDF_TOOLS.reduce<Record<string, PdfTool[]>>((acc, t) => {
    (acc[t.group] ??= []).push(t);
    return acc;
  }, {}),
);

export const NAV_LINKS = [
  { href: "/industries", label: "Industries" },
  { href: "/about", label: "About" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blogs" },
  { href: "/careers", label: "Careers" },
];

export const contactServiceHref = (service: string) => `/contact?service=${encodeURIComponent(service)}`;
