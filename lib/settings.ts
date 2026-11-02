import "server-only";
import { cache } from "react";
import { sql } from "./db";
import { decodeEntities } from "./html";

export type SiteSettings = Record<string, string>;

// One query per request, shared by layout, header, footer and page metadata. Errors are rethrown (see
// getActiveServices) so a DB hiccup never caches a page without contact details.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = (await sql`SELECT setting_key, setting_value FROM site_settings`) as {
      setting_key: string;
      setting_value: string | null;
    }[];
    return Object.fromEntries(rows.map((r) => [r.setting_key, decodeEntities(r.setting_value ?? "")]));
  } catch (err) {
    console.error("[getSiteSettings]", err);
    throw err;
  }
});

export async function setting(key: string, fallback = ""): Promise<string> {
  const s = await getSiteSettings();
  return s[key] || fallback;
}
