// Rules behind the instant estimate. Ranges come from the published price tiers and timelines on the services
// pages, so the planner never promises more than the site does. The final price is always a fixed written quote.

export type ProjectType = "business" | "store" | "landing" | "webapp" | "redesign" | "branding";

export const PROJECT_TYPES: [ProjectType, string, string][] = [
  ["business", "Business website", "5–10 pages about your company and services"],
  ["store", "Online store", "Sell products with online payments"],
  ["landing", "Landing page", "One page for an ad, offer or launch"],
  ["webapp", "Web app or portal", "Logins, dashboards or custom tools"],
  ["redesign", "Redesign my website", "Make an existing site faster and better"],
  ["branding", "Logo and branding", "A logo and a consistent visual identity"],
];

export const INDUSTRIES = ["Manufacturing", "Healthcare", "Real estate", "Retail", "Education", "Food & hospitality", "Professional services", "Other"];

export const FEATURES = ["Admin panel to edit content", "Online payments", "Booking or appointments", "Product catalogue", "Blog", "WhatsApp and enquiry forms", "Hindi and English"];

export const TIMELINES = ["As soon as possible", "Within a month", "Just exploring"];

type Plan = { price: string; time: string; service: string; serviceSlug: string; note: string };

const PLANS: Record<ProjectType, Plan> = {
  landing: { price: "₹8,000 – ₹20,000", time: "3–5 days", service: "Landing Page Design", serviceSlug: "landing-page-design", note: "One focused page with a form and WhatsApp button." },
  business: { price: "₹20,000 – ₹60,000", time: "1–3 weeks", service: "Custom Website Development", serviceSlug: "custom-website-development", note: "Custom design, mobile-first pages and on-page SEO." },
  store: { price: "₹20,000 – ₹60,000 for most stores; larger catalogues from ₹60,000", time: "2–6 weeks", service: "E-Commerce & Shopify", serviceSlug: "ecommerce-shopify", note: "Platform and payment gateway fees are separate." },
  webapp: { price: "From ₹60,000", time: "3–8 weeks for a first version", service: "Web Application Development", serviceSlug: "web-application-development", note: "Scope is written down and quoted as a fixed price." },
  redesign: { price: "₹8,000 – ₹60,000, depending on the number of pages", time: "1–3 weeks", service: "Custom Website Development", serviceSlug: "custom-website-development", note: "We review your current site first." },
  branding: { price: "Quoted after a short brief", time: "1–2 weeks", service: "Brand Identity & Logo Design", serviceSlug: "brand-identity-logo-design", note: "Depends on the number of concepts and applications." },
};

/** Features that usually push a project toward the upper end of its range. */
const HEAVY = new Set(["Admin panel to edit content", "Online payments", "Booking or appointments", "Product catalogue", "Hindi and English"]);

export function estimate(type: ProjectType, features: string[]) {
  // A landing page with payments, bookings or an admin panel is really a small website.
  const upgraded = type === "landing" && features.some((f) => ["Admin panel to edit content", "Online payments", "Booking or appointments"].includes(f));
  const plan = upgraded ? PLANS.business : PLANS[type];
  const heavy = features.filter((f) => HEAVY.has(f));
  return { ...plan, heavy, upgraded, upper: heavy.length >= 2 && type !== "branding" };
}

export function briefText(a: { type: ProjectType; industry: string; features: string[]; timeline: string }) {
  const label = PROJECT_TYPES.find(([t]) => t === a.type)?.[1] ?? a.type;
  const e = estimate(a.type, a.features);
  return [
    `Hi! I used the instant estimate on your website.`,
    `Project: ${label}`,
    `Business: ${a.industry}`,
    a.features.length ? `Must-haves: ${a.features.join(", ")}` : "",
    `Timeline: ${a.timeline}`,
    `Estimate shown: ${e.price} (${e.time})`,
    ``,
    `More about my project:`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}
