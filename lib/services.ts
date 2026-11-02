import "server-only";
import { cache } from "react";
import { sql } from "./db";

export type DbService = { id: number; title: string; slug: string; tagline: string; description: string; category: string; icon: string };

export type ServiceDetail = DbService & {
  overview: string;
  includes: string[];
  bestFor: string[];
  timeline: string;
  faqs: [string, string][];
};

/**
 * Active services from the admin-managed `services` table. Errors are rethrown on purpose: a failed query during
 * static generation is retried, and a failed background revalidation keeps the last good page, instead of
 * publishing a page with an empty menu.
 */
export async function getActiveServices(): Promise<DbService[]> {
  try {
    return (await sql`
      SELECT id, title, COALESCE(slug, '') AS slug, COALESCE(tagline, '') AS tagline, COALESCE(description, '') AS description, category, COALESCE(icon, '') AS icon
      FROM services WHERE is_active = 1 ORDER BY sort_order ASC, id ASC
    `) as DbService[];
  } catch (err) {
    console.error("[getActiveServices]", err);
    throw err;
  }
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

/** One service with its full page content, or null. */
export const getServiceBySlug = cache(async (slug: string): Promise<ServiceDetail | null> => {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const [r] = (await sql`
    SELECT id, title, slug, COALESCE(tagline, '') AS tagline, COALESCE(description, '') AS description, category, COALESCE(icon, '') AS icon,
      COALESCE(overview, '') AS overview, includes_json, best_for_json, COALESCE(timeline, '') AS timeline, faq_json
    FROM services WHERE slug = ${slug} AND is_active = 1 LIMIT 1
  `) as (DbService & { overview: string; timeline: string; includes_json: string | null; best_for_json: string | null; faq_json: string | null })[];
  if (!r) return null;
  const { includes_json, best_for_json, faq_json, ...rest } = r;
  return { ...rest, includes: parseJson(includes_json, []), bestFor: parseJson(best_for_json, []), faqs: parseJson(faq_json, []) };
});
