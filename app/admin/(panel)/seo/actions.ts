"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { checkbox, finish, intField, refreshPublicSite } from "@/lib/admin/common";
import { rows, sql } from "@/lib/db";
import { normalizePath } from "@/lib/redirects";
import type { SeoEntity } from "@/lib/seo";
import { loadSeoTarget } from "@/lib/admin/seo-audit";
import { SITE_URL } from "@/lib/config";
import { generate, geminiEnabled } from "@/lib/gemini";
import { DESCRIPTION_RANGE, TITLE_RANGE } from "@/lib/seo-pages";
import { isValidHttpUrl } from "@/lib/validation";
import { field } from "@/lib/validation";

const TYPES: SeoEntity[] = ["page", "post", "project", "location"];
const KEY_RE = /^[a-z0-9][a-z0-9/_-]{0,199}$/i;
const editUrl = (type: string, key: string) => `/admin/seo/edit?type=${type}&key=${encodeURIComponent(key)}`;

/** Accepts an absolute http(s) URL or a site path ("/images/x.png"). */
const isUrlOrPath = (v: string) => (v.startsWith("/") && !v.startsWith("//") && !/\s/.test(v)) || isValidHttpUrl(v);

/** Custom JSON-LD must parse and be an object or an array of objects. */
function checkSchema(raw: string): string | null {
  if (raw.length > 20000) return "Custom JSON-LD is too long (20,000 characters max).";
  try {
    const v = JSON.parse(raw);
    const list = Array.isArray(v) ? v : [v];
    if (!list.length || list.some((x) => !x || typeof x !== "object" || Array.isArray(x))) return "Custom JSON-LD must be an object or an array of objects.";
    return null;
  } catch (err) {
    return `Custom JSON-LD is not valid JSON: ${err instanceof Error ? err.message : "parse error"}.`;
  }
}

// ── Per-URL SEO (seo_meta) ───────────────────────────────────────────────────

export async function saveSeoMeta(fd: FormData) {
  await requireAdmin();
  const type = field(fd, "entity_type") as SeoEntity;
  const key = field(fd, "entity_key");
  if (!TYPES.includes(type) || !KEY_RE.test(key)) await finish("error", "Unknown URL.", "/admin/seo");
  const back = editUrl(type, key);

  const title = field(fd, "title").slice(0, 200) || null;
  const description = field(fd, "description").replace(/\s+/g, " ").slice(0, 400) || null;
  const focus = field(fd, "focus_keyword").slice(0, 100) || null;
  const image = field(fd, "og_image") || null;
  const canonical = field(fd, "canonical_url") || null;
  const noindex = checkbox(fd, "noindex");
  const schema = String(fd.get("schema_json") ?? "").trim() || null;

  if (image && !isUrlOrPath(image)) await finish("error", "Social image must be a full https:// link or a path starting with /.", back);
  if (canonical && !isUrlOrPath(canonical)) await finish("error", "Canonical URL must be a full https:// link or a path starting with /.", back);
  if (schema) {
    const err = checkSchema(schema);
    if (err) await finish("error", err, back);
  }

  if (!title && !description && !focus && !image && !canonical && !noindex && !schema) {
    await sql`DELETE FROM seo_meta WHERE entity_type = ${type} AND entity_key = ${key}`;
  } else {
    await sql`
      INSERT INTO seo_meta (entity_type, entity_key, title, description, focus_keyword, og_image, canonical_url, noindex, schema_json, updated_at)
      VALUES (${type}, ${key}, ${title}, ${description}, ${focus}, ${image}, ${canonical}, ${noindex}, ${schema}, LOCALTIMESTAMP)
      ON CONFLICT (entity_type, entity_key) DO UPDATE SET
        title = EXCLUDED.title, description = EXCLUDED.description, focus_keyword = EXCLUDED.focus_keyword, og_image = EXCLUDED.og_image,
        canonical_url = EXCLUDED.canonical_url, noindex = EXCLUDED.noindex, schema_json = EXCLUDED.schema_json, updated_at = LOCALTIMESTAMP
    `;
  }
  refreshPublicSite();
  await finish("success", "SEO saved. The live page is updated.", back);
}

/** Drops the saved SEO for a URL so it goes back to its defaults. */
export async function resetSeoMeta(fd: FormData) {
  await requireAdmin();
  const type = field(fd, "entity_type");
  const key = field(fd, "entity_key");
  await sql`DELETE FROM seo_meta WHERE entity_type = ${type} AND entity_key = ${key}`;
  refreshPublicSite();
  await finish("success", "Reset to the default title, description and settings.", editUrl(type, key));
}

// ── Redirects ────────────────────────────────────────────────────────────────

const REDIRECTS = "/admin/seo/redirects";
const BLOCKED_SOURCES = /^\/(admin|api|_next)(\/|$)/;

export async function saveRedirect(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const back = id ? `${REDIRECTS}?edit=${id}` : REDIRECTS;
  const rawSource = field(fd, "source_path");
  const wildcard = rawSource.endsWith("/*");
  const source = wildcard ? `${normalizePath(rawSource.slice(0, -2)) || ""}/*` : normalizePath(rawSource);
  const status = [301, 302, 410].includes(intField(fd, "status_code")) ? intField(fd, "status_code") : 301;
  let destination = field(fd, "destination");
  const note = field(fd, "note").slice(0, 255) || null;
  const active = checkbox(fd, "is_active");

  if (!source || source === "/*" || (!wildcard && rawSource.includes("*"))) await finish("error", 'Enter the old path, e.g. "/old-page" or "/old-blog/*".', back);
  if (source === "/") await finish("error", "The home page can't be redirected.", back);
  if (BLOCKED_SOURCES.test(source)) await finish("error", "Admin, API and system paths can't be redirected.", back);

  if (status === 410) {
    destination = "";
  } else {
    if (!destination) await finish("error", "Enter where the old path should go.", back);
    if (destination.startsWith("/")) {
      const hasStar = destination.includes("*");
      if (hasStar && !wildcard) await finish("error", 'Only a wildcard source ("/old/*") can use * in the destination.', back);
      destination = hasStar ? destination : normalizePath(destination) || destination;
      if (!hasStar && destination === source) await finish("error", "A path can't redirect to itself.", back);
    } else if (!isValidHttpUrl(destination)) {
      await finish("error", "Destination must be a path on this site (/new-page) or a full https:// link.", back);
    }
    // A → B while B → A already exists would loop forever.
    const [loop] = await rows<{ id: number }>(sql`
      SELECT id FROM seo_redirects WHERE is_active = 1 AND source_path = ${destination} AND destination = ${source} AND id <> ${id}
    `);
    if (loop) await finish("error", "That would create a redirect loop with an existing rule.", back);
  }

  try {
    if (id) {
      await sql`
        UPDATE seo_redirects SET source_path = ${source}, destination = ${destination}, status_code = ${status}, note = ${note}, is_active = ${active}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO seo_redirects (source_path, destination, status_code, note, is_active) VALUES (${source}, ${destination}, ${status}, ${note}, ${active})
      `;
    }
  } catch (err) {
    const dup = err instanceof Error && /duplicate key/i.test(err.message);
    await finish("error", dup ? `There's already a rule for ${source}.` : "Couldn't save the redirect.", back);
  }
  await finish("success", `Redirect saved for ${source}. It goes live within a minute.`, REDIRECTS);
}

export async function toggleRedirect(fd: FormData) {
  await requireAdmin();
  await sql`UPDATE seo_redirects SET is_active = 1 - is_active WHERE id = ${intField(fd, "id")}`;
  await finish("success", "Redirect updated. The change applies within a minute.", REDIRECTS);
}

export async function deleteRedirect(fd: FormData) {
  await requireAdmin();
  await sql`DELETE FROM seo_redirects WHERE id = ${intField(fd, "id")}`;
  await finish("success", "Redirect deleted. The change applies within a minute.", REDIRECTS);
}

// ── Site-wide settings ───────────────────────────────────────────────────────

const SETTINGS = "/admin/seo/settings";
const ORG_TYPES = ["Organization", "LocalBusiness", "ProfessionalService"];

/** Accepts either the token or the whole <meta … content="token"> tag a search engine hands out. */
function verificationToken(raw: string): string {
  const m = raw.match(/content\s*=\s*["']([^"']+)["']/i);
  return (m ? m[1] : raw).trim().replace(/[^A-Za-z0-9_\-=+/.]/g, "").slice(0, 200);
}

export async function saveSeoSettings(fd: FormData) {
  await requireAdmin();
  const v = (k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);

  const image = v("default_og_image");
  const logo = v("global_schema_logo");
  if (image && !isValidHttpUrl(image)) await finish("error", "Default social image must be a full https:// link.", SETTINGS);
  if (logo && !isValidHttpUrl(logo)) await finish("error", "Logo URL must be a full https:// link.", SETTINGS);
  const orgType = ORG_TYPES.includes(v("global_schema_org_type")) ? v("global_schema_org_type") : "ProfessionalService";

  const values: [string, string][] = [
    // Suffix keeps its leading space (" | Brave Syntax"); only trailing whitespace is trimmed.
    ["seo_title_suffix", String(fd.get("seo_title_suffix") ?? "").replace(/\s+$/, "").slice(0, 60)],
    ["seo_default_description", v("seo_default_description", 400)],
    ["default_og_image", image],
    ["google_search_console", verificationToken(v("google_search_console"))],
    ["bing_site_verification", verificationToken(v("bing_site_verification"))],
    ["global_schema_org_name", v("global_schema_org_name", 120)],
    ["global_schema_org_type", orgType],
    ["global_schema_logo", logo],
    ["seo_loc_city_title", v("seo_loc_city_title", 200)],
    ["seo_loc_city_description", v("seo_loc_city_description", 400)],
    ["seo_loc_service_title", v("seo_loc_service_title", 200)],
    ["seo_loc_service_description", v("seo_loc_service_description", 400)],
  ].filter(([k]) => fd.has(k)) as [string, string][]; // the settings page and the location templates form each post a subset
  const keys = values.map(([k]) => k);
  const vals = values.map(([, x]) => x);
  if (keys.length) {
    await sql`
      INSERT INTO site_settings (setting_key, setting_value) SELECT * FROM unnest(${keys}::text[], ${vals}::text[])
      ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value
    `;
  }
  refreshPublicSite();
  const back = field(fd, "return_to") === "locations" ? "/admin/seo/locations" : SETTINGS;
  await finish("success", "SEO settings saved. Every page is updated.", back);
}

export type SeoSuggestion = { title: string; description: string; focus_keyword: string } | { error: string };

/** Drafts an SEO title, description and focus keyword with Gemini, from the page's live text. Nothing is saved. */
export async function suggestSeoWithAi(type: string, key: string): Promise<SeoSuggestion> {
  await requireAdmin();
  if (!geminiEnabled()) return { error: "Add GEMINI_API_KEY to turn on AI writing." };
  if (!TYPES.includes(type as SeoEntity) || !KEY_RE.test(key)) return { error: "Unknown page." };
  const { target } = await loadSeoTarget(type as SeoEntity, key);
  if (!target) return { error: "Unknown page." };
  let text = "";
  try {
    const res = await fetch(`${SITE_URL}${target.path}`, { signal: AbortSignal.timeout(15_000), cache: "no-store" });
    const html = await res.text();
    text = (html.split(/<main[^>]*>/)[1] ?? html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ").trim().slice(0, 4000);
  } catch {
    /* fall back to the page's name and default description */
  }
  try {
    const out = await generate({
      json: true,
      system: `You write search snippets for Brave Syntax, a web design and development studio in Ghaziabad, India.
Return JSON: {"title": string, "description": string, "focus_keyword": string}.
- title: ${TITLE_RANGE[0]}-${TITLE_RANGE[1] - 14} characters, the main topic first, no brand name (it is added automatically).
- description: ${DESCRIPTION_RANGE[0]}-${DESCRIPTION_RANGE[1]} characters, plain and specific, ending with a reason to click.
- focus_keyword: the 2-4 word search phrase this page should rank for.
Use only facts in the page text. Never invent prices, numbers, clients, results or guarantees. Natural English, no clickbait, no ALL CAPS.`,
      prompt: `Page: ${target.label} (${target.path})\nCurrent default title: ${target.defaults.title}\nCurrent default description: ${target.defaults.description ?? ""}\n\nPage text:\n${text || "(not available)"}`,
    });
    const j = JSON.parse(out) as Record<string, unknown>;
    const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
    const result = { title: s(j.title, 200), description: s(j.description, 300), focus_keyword: s(j.focus_keyword, 100) };
    if (!result.title || !result.description) return { error: "Gemini's answer was incomplete. Try again." };
    return result;
  } catch (err) {
    return { error: err instanceof Error && err.message.startsWith("Gemini") ? err.message : "AI writing failed. Try again." };
  }
}
