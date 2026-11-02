import "server-only";
import { cache } from "react";
import { sql } from "./db";

// Location SEO pages: /{city} and /{city}/{service} (pages/location.php + router.php).

export type City = { name: string; slug: string; state: string; sort_order: number };
export type LocationService = {
  slug: string;
  label: string;
  keyword: string;
  contact_param: string | null;
  features_json: string | null;
};
export type Feature = { icon: string; title: string; desc: string };

/** Same slug rule as router.php. */
export const CITY_SLUG_RE = /^[a-z][a-z0-9-]{0,49}$/;

/** Only the top N cities (by sort_order, name) are indexable and in the sitemap; the rest are noindex,follow. */
export const LOCATION_INDEXABLE_CITY_LIMIT = Number(process.env.LOCATION_INDEXABLE_CITY_LIMIT ?? 20);

export const ALSO_AVAILABLE_LIMIT = 6;

export const getActiveCity = cache(async (slug: string): Promise<City | null> => {
  if (!CITY_SLUG_RE.test(slug)) return null;
  const rows = (await sql`
    SELECT name, slug, state, sort_order FROM location_cities WHERE slug = ${slug} AND is_active = 1 LIMIT 1
  `) as City[];
  return rows[0] ?? null;
});

/** Active service by slug; '' is the "all services" row used on city root pages. */
export const getLocationService = cache(async (slug: string): Promise<LocationService | null> => {
  const rows = (await sql`
    SELECT slug, label, keyword, contact_param, features_json FROM location_services
    WHERE slug = ${slug} AND is_active = 1 LIMIT 1
  `) as LocationService[];
  return rows[0] ?? null;
});

export const FALLBACK_SERVICE: LocationService = {
  slug: "",
  label: "Digital Agency",
  keyword: "digital agency",
  contact_param: "",
  features_json: null,
};

export async function getOverride(citySlug: string, serviceSlug: string) {
  const rows = (await sql`
    SELECT custom_h1, custom_intro FROM location_page_overrides WHERE city_slug = ${citySlug} AND service_slug = ${serviceSlug} LIMIT 1
  `) as { custom_h1: string | null; custom_intro: string | null }[];
  return rows[0] ?? null;
}

export async function getActiveLocationServices(): Promise<{ slug: string; label: string }[]> {
  return (await sql`SELECT slug, label FROM location_services WHERE is_active = 1 ORDER BY sort_order ASC`) as {
    slug: string;
    label: string;
  }[];
}

/** "Also available in": same-state cities first, topped up with the highest-priority others (max 6). */
export async function getNearbyCities(city: City): Promise<{ name: string; slug: string }[]> {
  const same = (await sql`
    SELECT name, slug FROM location_cities
    WHERE is_active = 1 AND slug <> ${city.slug} AND state = ${city.state}
    ORDER BY sort_order ASC, name ASC LIMIT ${ALSO_AVAILABLE_LIMIT}
  `) as { name: string; slug: string }[];
  const needed = ALSO_AVAILABLE_LIMIT - same.length;
  if (needed <= 0) return same;
  const others = (await sql`
    SELECT name, slug FROM location_cities
    WHERE is_active = 1 AND slug <> ${city.slug} AND state <> ${city.state}
    ORDER BY sort_order ASC, name ASC LIMIT ${needed}
  `) as { name: string; slug: string }[];
  return [...same, ...others];
}

/** Active cities in priority order (home page "cities we serve"). */
export async function getActiveCities(limit = 12): Promise<{ name: string; slug: string; state: string }[]> {
  return (await sql`
    SELECT name, slug, state FROM location_cities WHERE is_active = 1 ORDER BY sort_order ASC, name ASC LIMIT ${limit}
  `) as { name: string; slug: string; state: string }[];
}

/** True when the city ranks inside the indexable tier (0-based rank by sort_order, then name). */
export async function isIndexableCity(city: City): Promise<boolean> {
  try {
    const [{ rank }] = (await sql`
      SELECT COUNT(*)::int AS rank FROM location_cities
      WHERE is_active = 1
        AND (sort_order < ${city.sort_order} OR (sort_order = ${city.sort_order} AND name < ${city.name}))
    `) as { rank: number }[];
    return rank < LOCATION_INDEXABLE_CITY_LIMIT;
  } catch {
    return false; // fail safe: don't index if the tier can't be verified
  }
}

export function parseFeatures(json: string | null): Feature[] {
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length) return parsed as Feature[];
    } catch {
      // fall through to defaults
    }
  }
  return [
    { icon: "palette", title: "Custom Design", desc: "Tailored to your brand and audience" },
    { icon: "code", title: "Clean Code", desc: "Fast, secure, and maintainable" },
    { icon: "search", title: "SEO Included", desc: "Optimized from the first commit" },
    { icon: "smartphone", title: "Mobile-First", desc: "Perfect on all devices" },
    { icon: "zap", title: "Fast Delivery", desc: "Most projects done in days" },
    { icon: "handshake", title: "Ongoing Support", desc: "We stay with you after launch" },
  ];
}

/** Top-tier cities and all non-root services, for static generation and the sitemap. */
export async function getIndexableLocationPaths(): Promise<{ cities: string[]; services: string[] }> {
  const cities = (await sql`
    SELECT slug FROM location_cities WHERE is_active = 1 ORDER BY sort_order ASC, name ASC LIMIT ${LOCATION_INDEXABLE_CITY_LIMIT}
  `) as { slug: string }[];
  const services = (await sql`
    SELECT slug FROM location_services WHERE is_active = 1 AND slug <> '' ORDER BY sort_order ASC
  `) as { slug: string }[];
  return { cities: cities.map((c) => c.slug), services: services.map((s) => s.slug) };
}
