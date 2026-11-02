// Every public page the SEO Manager controls. Each has sensible defaults so no two pages ever share a title
// or description, even before an admin edits them; values saved in Admin → SEO Manager override these.

export type SeoPageDef = {
  slug: string;
  label: string;
  path: string;
  title: string;
  description: string;
  schemaType: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

export const SEO_PAGES: SeoPageDef[] = [
  {
    slug: "home",
    label: "Home",
    path: "/",
    title: "Web Design & Development Agency in India | Brave Syntax",
    description: "Brave Syntax designs and builds fast, conversion-focused websites, web apps, Shopify stores and brand identities for growing businesses in India and worldwide.",
    schemaType: "Organization",
    changeFrequency: "daily",
    priority: 1,
  },
  {
    slug: "services",
    label: "Services",
    path: "/services",
    title: "Web Design & Development Services | Brave Syntax",
    description: "UI/UX design, custom websites, web applications, Shopify and WordPress development, SEO and ongoing support — fixed quotes and milestone delivery.",
    schemaType: "CollectionPage",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    slug: "industries",
    label: "Industries",
    path: "/industries",
    title: "Industries We Serve | Brave Syntax",
    description: "Websites and digital products for healthcare, real estate, education, retail, restaurants, startups and more — built around how your industry sells.",
    schemaType: "CollectionPage",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    slug: "portfolio",
    label: "Portfolio",
    path: "/portfolio",
    title: "Portfolio & Case Studies | Brave Syntax",
    description: "Explore websites, e-commerce stores and brand projects we've designed and built, with the challenges, approach and results behind each one.",
    schemaType: "CollectionPage",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    slug: "blog",
    label: "Blog",
    path: "/blog",
    title: "Web Design & Development Blog | Brave Syntax",
    description: "Practical guides on websites, e-commerce, SEO, UI/UX and AI tools for business owners and marketers, written by the Brave Syntax team.",
    schemaType: "Blog",
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    slug: "about",
    label: "About",
    path: "/about",
    title: "About Brave Syntax | Design & Development Studio",
    description: "Meet Brave Syntax: a design and development studio that builds custom, high-performing websites and brands with direct access to the people doing the work.",
    schemaType: "AboutPage",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    slug: "careers",
    label: "Careers",
    path: "/careers",
    title: "Careers at Brave Syntax | Design & Development Jobs",
    description: "Join Brave Syntax. Explore open design and development roles, internships and freelance opportunities, and apply online in minutes.",
    schemaType: "WebPage",
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    slug: "contact",
    label: "Contact",
    path: "/contact",
    title: "Contact Brave Syntax | Get a Free Project Quote",
    description: "Tell us about your project and get a clear proposal, fixed quote and realistic timeline. Reach us by form, email, phone or WhatsApp.",
    schemaType: "ContactPage",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    slug: "pdf-tools",
    label: "PDF Tools",
    path: "/pdf-tools",
    title: "Free PDF Tools: Merge, Split & Compress | Brave Syntax",
    description: "Merge, split, compress, rotate, watermark and convert PDFs free in your browser. No sign-up, no watermarks — files never leave your device.",
    schemaType: "WebApplication",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    slug: "bg-remover",
    label: "Background Remover",
    path: "/bg-remover",
    title: "Free AI Background Remover | Brave Syntax",
    description: "Remove image backgrounds automatically with AI, right in your browser. Download a transparent PNG for free — no sign-up and no uploads to a server.",
    schemaType: "WebApplication",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    slug: "privacy-policy",
    label: "Privacy Policy",
    path: "/privacy-policy",
    title: "Privacy Policy | Brave Syntax",
    description: "How Brave Syntax collects, uses and protects the information you share through our website, contact forms and free tools.",
    schemaType: "WebPage",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    slug: "terms",
    label: "Terms of Service",
    path: "/terms",
    title: "Terms of Service | Brave Syntax",
    description: "The terms that apply when you use the Brave Syntax website, free online tools and our design and development services.",
    schemaType: "WebPage",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

export const seoPageDef = (slug: string) => SEO_PAGES.find((p) => p.slug === slug);

/** Google truncates around these lengths. */
export const TITLE_RANGE = [30, 60] as const;
export const DESCRIPTION_RANGE = [120, 160] as const;
