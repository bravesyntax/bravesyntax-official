import "server-only";
import type { Metadata } from "next";
import { cache } from "react";
import { SITE_NAME, SITE_URL } from "./config";
import { getContactInfo } from "./contact";
import { sql } from "./db";
import { seoPageDef } from "./seo-pages";
import { absoluteMediaUrl } from "./media";
import { getSiteSettings } from "./settings";

// SEO for every public URL. Resolution order for each field:
//   1. what an admin saved for that exact URL (seo_meta, Admin → SEO)
//   2. the URL's built-in default (page registry, blog post title/excerpt, location templates…)
//   3. site-wide defaults (Admin → SEO → Settings)

export type SeoEntity = "page" | "post" | "project" | "location";

export type SeoRecord = {
  title: string | null;
  description: string | null;
  focus_keyword: string | null;
  og_image: string | null;
  canonical_url: string | null;
  noindex: number;
  schema_json: string | null;
  updated_at: Date | null;
};

/** The admin-saved SEO for one URL, or null. */
export const getSeoRecord = cache(async (type: SeoEntity, key: string): Promise<SeoRecord | null> => {
  const rows = (await sql`
    SELECT title, description, focus_keyword, og_image, canonical_url, noindex, schema_json, updated_at
    FROM seo_meta WHERE entity_type = ${type} AND entity_key = ${key} LIMIT 1
  `) as SeoRecord[];
  return rows[0] ?? null;
});

// ── Site-wide SEO settings (stored in site_settings) ─────────────────────────

export const SEO_SETTING_DEFAULTS = {
  seo_title_suffix: ` | ${SITE_NAME}`,
  seo_default_description: "Brave Syntax designs and builds fast, conversion-focused websites, web apps, e-commerce stores and brands for growing businesses.",
  // Sized so every active city/service combination lands in the 30–60 / 120–160 character ranges.
  seo_loc_city_title: "Web Design & Development in {city}{suffix}",
  seo_loc_city_description: "{site} is a digital agency in {city}, {state}: websites, web apps, e-commerce, UI/UX and branding. Free consultation and fixed quotes.",
  seo_loc_service_title: "{service} in {city}{suffix}",
  seo_loc_service_description: "Professional {keyword} in {city}, {state} by {site}. Fast, SEO-ready and built to convert. Free consultation, fixed quotes.",
} as const;

/** Built-in share image (scripts/make-brand-images.mjs), so no link is ever shared without a preview. */
export const DEFAULT_SHARE_IMAGE = "/brand/og-default.png";

export type SeoSettings = {
  titleSuffix: string;
  defaultDescription: string;
  defaultImage: string;
  googleVerification: string;
  bingVerification: string;
  locCityTitle: string;
  locCityDescription: string;
  locServiceTitle: string;
  locServiceDescription: string;
  orgName: string;
  orgType: string;
  orgLogo: string;
};

export const getSeoSettings = cache(async (): Promise<SeoSettings> => {
  const s = await getSiteSettings();
  const v = (k: keyof typeof SEO_SETTING_DEFAULTS) => (s[k] ?? "").trim() || SEO_SETTING_DEFAULTS[k];
  return {
    titleSuffix: s.seo_title_suffix ?? SEO_SETTING_DEFAULTS.seo_title_suffix,
    defaultDescription: v("seo_default_description"),
    defaultImage: s.default_og_image || DEFAULT_SHARE_IMAGE,
    googleVerification: s.google_search_console || "",
    bingVerification: s.bing_site_verification || "",
    locCityTitle: v("seo_loc_city_title"),
    locCityDescription: v("seo_loc_city_description"),
    locServiceTitle: v("seo_loc_service_title"),
    locServiceDescription: v("seo_loc_service_description"),
    orgName: s.global_schema_org_name || s.site_name || SITE_NAME,
    orgType: s.global_schema_org_type || "ProfessionalService",
    orgLogo: s.global_schema_logo || "",
  };
});

/** Replaces {city}, {state}, {service}, {keyword}, {site} and {suffix} in a template. */
export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m)).replace(/\s{2,}/g, " ").trim();
}

// ── Resolution ───────────────────────────────────────────────────────────────

export type SeoDefaults = {
  /** Default title. With `suffix`, the site title suffix is appended (only to the default, never to a custom title). */
  title: string;
  suffix?: boolean;
  description?: string;
  /** Path of the URL, e.g. "/blog/my-post". */
  path: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
};

export type ResolvedSeo = {
  title: string;
  description: string;
  canonical: string;
  image: string;
  noindex: boolean;
  focusKeyword: string;
  schemaJson: string | null;
  isCustom: boolean;
};

const abs = (url: string) => (!url ? "" : /^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`);

/** Pure resolution of one URL's SEO from its saved record (if any), the site settings and its defaults. */
export function applySeo(rec: SeoRecord | null, settings: SeoSettings, d: SeoDefaults): ResolvedSeo {
  const defaultTitle = d.suffix ? `${d.title}${settings.titleSuffix}` : d.title;
  return {
    title: rec?.title?.trim() || defaultTitle,
    description: rec?.description?.trim() || d.description?.trim() || settings.defaultDescription,
    canonical: abs(rec?.canonical_url?.trim() || (d.path === "/" ? SITE_URL : `${SITE_URL}${d.path}`)),
    image: abs(rec?.og_image?.trim() || d.image || settings.defaultImage),
    noindex: !!rec?.noindex,
    focusKeyword: rec?.focus_keyword?.trim() ?? "",
    schemaJson: rec?.schema_json?.trim() || null,
    isCustom: !!rec,
  };
}

export async function resolveSeo(type: SeoEntity, key: string, d: SeoDefaults): Promise<ResolvedSeo> {
  const [rec, settings] = await Promise.all([getSeoRecord(type, key).catch(() => null), getSeoSettings()]);
  return applySeo(rec, settings, d);
}

/** Next.js metadata for a URL. `forceNoindex` keeps a page out of search regardless of admin settings. */
export async function buildMetadata(type: SeoEntity, key: string, d: SeoDefaults, opts: { forceNoindex?: boolean } = {}): Promise<Metadata> {
  const [seo, settings] = await Promise.all([resolveSeo(type, key, d), getSeoSettings()]);
  const noindex = seo.noindex || !!opts.forceNoindex;
  const images = seo.image ? [seo.image] : undefined;
  const verification: Metadata["verification"] = {};
  if (settings.googleVerification) verification.google = settings.googleVerification;
  if (settings.bingVerification) verification.other = { "msvalidate.01": settings.bingVerification };

  return {
    title: { absolute: seo.title },
    description: seo.description,
    robots: { index: !noindex, follow: true, googleBot: { index: !noindex, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    alternates: { canonical: seo.canonical },
    openGraph: {
      type: d.type ?? "website",
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      siteName: settings.orgName,
      locale: "en_IN",
      images,
      ...(d.type === "article" && d.publishedTime ? { publishedTime: new Date(d.publishedTime).toISOString() } : {}),
      ...(d.type === "article" && d.modifiedTime ? { modifiedTime: new Date(d.modifiedTime).toISOString() } : {}),
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: seo.title, description: seo.description, images },
    verification: Object.keys(verification).length ? verification : undefined,
  };
}

// ── Static pages (lib/seo-pages.ts registry) ─────────────────────────────────

export function pageDefaults(slug: string): SeoDefaults {
  const def = seoPageDef(slug);
  return { title: def?.title ?? SITE_NAME, description: def?.description, path: def?.path ?? `/${slug}` };
}

export function pageMetadata(slug: string): Promise<Metadata> {
  return buildMetadata("page", slug, pageDefaults(slug));
}

/** JSON-LD for a static page: the admin's custom JSON-LD if set, otherwise generated schema + breadcrumbs. */
export async function pageSchema(slug: string): Promise<object[]> {
  const [seo, settings, contact] = await Promise.all([resolveSeo("page", slug, pageDefaults(slug)), getSeoSettings(), getContactInfo()]);
  if (seo.schemaJson) {
    try {
      const custom = JSON.parse(seo.schemaJson);
      return Array.isArray(custom) ? custom : [custom];
    } catch {
      // invalid JSON is rejected on save; fall back to generated schema just in case
    }
  }
  const def = seoPageDef(slug);
  const type = slug === "home" ? "Organization" : (def?.schemaType ?? "WebPage");
  const schema: Record<string, unknown> = { "@context": "https://schema.org", "@type": type, name: seo.title, description: seo.description, url: seo.canonical };

  if (type === "Organization") {
    Object.assign(schema, {
      "@type": settings.orgType === "WebSite" ? "Organization" : settings.orgType,
      name: settings.orgName,
      url: SITE_URL,
      ...(settings.orgLogo ? { logo: settings.orgLogo } : {}),
      contactPoint: {
        "@type": "ContactPoint",
        email: contact.email,
        ...(contact.phone ? { telephone: contact.phone } : {}),
        contactType: "customer service",
        availableLanguage: ["English", "Hindi"],
      },
      ...(contact.address ? { address: { "@type": "PostalAddress", streetAddress: contact.address, addressCountry: "IN" } } : {}),
      ...(contact.socials.length ? { sameAs: contact.socials.map((x) => x.url) } : {}),
    });
  }
  if (type === "WebApplication") Object.assign(schema, { applicationCategory: "UtilityApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } });

  const crumbs: object[] = [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }];
  if (slug !== "home") crumbs.push({ "@type": "ListItem", position: 2, name: def?.label ?? slug, item: seo.canonical });
  return [schema, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs }];
}

/** Custom JSON-LD saved for a non-page URL (post, project, location), parsed; [] if none. */
export async function customSchema(type: SeoEntity, key: string): Promise<object[]> {
  const rec = await getSeoRecord(type, key).catch(() => null);
  if (!rec?.schema_json) return [];
  try {
    const v = JSON.parse(rec.schema_json);
    return Array.isArray(v) ? v : [v];
  } catch {
    return [];
  }
}

// ── Blog posts and case studies ──────────────────────────────────────────────

export function postSeoDefaults(post: { title: string; slug: string; excerpt: string | null; featured_image: string | null; published_at?: Date | null; updated_at?: Date | null }): SeoDefaults {
  return {
    title: post.title,
    suffix: true,
    description: post.excerpt ?? "",
    path: `/blog/${encodeURIComponent(post.slug)}`,
    image: post.featured_image ? absoluteMediaUrl("blog", post.featured_image, SITE_URL) : "",
    type: "article",
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
  };
}

export function projectSeoDefaults(project: { title: string; slug: string | null; description: string | null; category: string | null; image: string | null }): SeoDefaults {
  return {
    title: `${project.title} — Case Study`,
    suffix: true,
    description: project.description || `A ${project.category ?? "web"} project delivered by ${SITE_NAME}.`,
    path: `/portfolio/${project.slug ?? ""}`,
    image: project.image ? absoluteMediaUrl("portfolio", project.image, SITE_URL) : "",
  };
}

// ── Location pages ───────────────────────────────────────────────────────────

type LocationTarget = { city: string; state: string; service?: { label: string; keyword: string } | null };

/** Default title/description for a location page, from the admin templates. */
export async function locationSeoDefaults(p: LocationTarget) {
  return fillLocationTemplates(await getSeoSettings(), p);
}

export function fillLocationTemplates(s: SeoSettings, p: LocationTarget) {
  if (p.state === p.city) {
    // "Delhi, Delhi" → "Delhi"; a lone {state} becomes the country.
    const strip = (t: string) => t.replace(/\{city\},\s*\{state\}/g, "{city}");
    s = { ...s, locCityTitle: strip(s.locCityTitle), locCityDescription: strip(s.locCityDescription), locServiceTitle: strip(s.locServiceTitle), locServiceDescription: strip(s.locServiceDescription) };
    p = { ...p, state: "India" };
  }
  const vars = { city: p.city, state: p.state, service: p.service?.label ?? "", keyword: p.service?.keyword ?? "", site: s.orgName, suffix: s.titleSuffix };
  return p.service
    ? { title: fillTemplate(s.locServiceTitle, vars), description: fillTemplate(s.locServiceDescription, vars) }
    : { title: fillTemplate(s.locCityTitle, vars), description: fillTemplate(s.locCityDescription, vars) };
}

/** URLs an admin set to noindex, grouped by type (used by the sitemap). */
export async function noindexKeys(): Promise<Record<SeoEntity, Set<string>>> {
  const out: Record<SeoEntity, Set<string>> = { page: new Set(), post: new Set(), project: new Set(), location: new Set() };
  const rows = (await sql`SELECT entity_type, entity_key FROM seo_meta WHERE noindex = 1`) as { entity_type: SeoEntity; entity_key: string }[];
  rows.forEach((r) => out[r.entity_type]?.add(r.entity_key));
  return out;
}
