"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { checkbox, finish, intField, refreshPublicSite } from "@/lib/admin/common";
import { rows, sql } from "@/lib/db";
import { CITY_SLUG_RE } from "@/lib/locations";
import { NOT_CITIES } from "@/lib/reserved";
import { field } from "@/lib/validation";

const tabUrl = (tab: string, extra = "") => `/admin/location?tab=${tab}${extra}`;
const cleanSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const isDuplicate = (err: unknown) => err instanceof Error && /duplicate key/i.test(err.message);

// Note: deactivating a city turns its pages into 410 Gone; the middleware caches that list for up to 10 minutes.

export async function saveCity(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const back = tabUrl("cities", id ? `&edit_city=${id}` : "");
  const name = field(fd, "name");
  const slug = cleanSlug(field(fd, "slug"));
  if (!name || !slug) await finish("error", "Name and slug are required.", back);
  if (!CITY_SLUG_RE.test(slug)) await finish("error", "Slug must start with a letter (max 50 characters).", back);
  if (NOT_CITIES.has(slug)) await finish("error", `"${slug}" is a site page, not usable as a city slug.`, back);
  const state = field(fd, "state");
  const lat = field(fd, "latitude") || null;
  const lng = field(fd, "longitude") || null;
  const sortOrder = intField(fd, "sort_order");

  try {
    if (id) {
      const [old] = await rows<{ slug: string }>(sql`SELECT slug FROM location_cities WHERE id = ${id}`);
      await sql`
        UPDATE location_cities SET name = ${name}, slug = ${slug}, state = ${state}, latitude = ${lat}, longitude = ${lng},
          sort_order = ${sortOrder}, is_active = ${checkbox(fd, "is_active")}
        WHERE id = ${id}
      `;
      if (old && old.slug !== slug) await sql`UPDATE location_page_overrides SET city_slug = ${slug} WHERE city_slug = ${old.slug}`;
    } else {
      await sql`INSERT INTO location_cities (name, slug, state, latitude, longitude, sort_order) VALUES (${name}, ${slug}, ${state}, ${lat}, ${lng}, ${sortOrder})`;
    }
  } catch (err) {
    console.error("[saveCity]", err);
    await finish("error", isDuplicate(err) ? `Slug "${slug}" already exists.` : id ? "Update failed." : "Failed to add city.", back);
  }
  refreshPublicSite();
  await finish("success", id ? "City updated." : `City "${name}" added.`, tabUrl("cities"));
}

export async function toggleCity(fd: FormData) {
  await requireAdmin();
  await sql`UPDATE location_cities SET is_active = 1 - is_active WHERE id = ${intField(fd, "id")}`;
  refreshPublicSite();
  await finish("success", "Visibility toggled.", tabUrl("cities"));
}

export async function deleteCity(fd: FormData) {
  await requireAdmin();
  await sql`DELETE FROM location_cities WHERE id = ${intField(fd, "id")}`;
  refreshPublicSite();
  await finish("success", "City deleted.", tabUrl("cities"));
}

export async function saveLocationService(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const back = tabUrl("services", id ? `&edit_service=${id}` : "");
  const slug = cleanSlug(field(fd, "slug")); // empty = the city root page
  const label = field(fd, "label");
  const keyword = field(fd, "keyword");
  if (!label || !keyword) await finish("error", "Label and keyword are required.", back);
  const contactParam = field(fd, "contact_param") || null;
  const features = String(fd.get("features_json") ?? "").trim() || null;
  if (features) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(features);
    } catch {
      /* reported below */
    }
    if (!Array.isArray(parsed)) await finish("error", "Features JSON is invalid (expected an array of {icon, title, desc}).", back);
  }
  const sortOrder = intField(fd, "sort_order");

  try {
    if (id) {
      const [old] = await rows<{ slug: string }>(sql`SELECT slug FROM location_services WHERE id = ${id}`);
      await sql`
        UPDATE location_services SET slug = ${slug}, label = ${label}, keyword = ${keyword}, contact_param = ${contactParam},
          features_json = ${features}, sort_order = ${sortOrder}, is_active = ${checkbox(fd, "is_active")}
        WHERE id = ${id}
      `;
      if (old && old.slug !== slug) await sql`UPDATE location_page_overrides SET service_slug = ${slug} WHERE service_slug = ${old.slug}`;
    } else {
      await sql`
        INSERT INTO location_services (slug, label, keyword, contact_param, features_json, sort_order)
        VALUES (${slug}, ${label}, ${keyword}, ${contactParam}, ${features}, ${sortOrder})
      `;
    }
  } catch (err) {
    console.error("[saveLocationService]", err);
    await finish("error", isDuplicate(err) ? "Failed. Slug may already exist." : "Update failed.", back);
  }
  refreshPublicSite();
  await finish("success", id ? "Service updated." : `Service "${label}" added.`, tabUrl("services"));
}

export async function toggleLocationService(fd: FormData) {
  await requireAdmin();
  await sql`UPDATE location_services SET is_active = 1 - is_active WHERE id = ${intField(fd, "id")}`;
  refreshPublicSite();
  await finish("success", "Toggled.", tabUrl("services"));
}

export async function deleteLocationService(fd: FormData) {
  await requireAdmin();
  await sql`DELETE FROM location_services WHERE id = ${intField(fd, "id")}`;
  refreshPublicSite();
  await finish("success", "Service deleted.", tabUrl("services"));
}

export async function saveOverride(fd: FormData) {
  await requireAdmin();
  const city = field(fd, "city_slug");
  const service = field(fd, "service_slug");
  if (!city) await finish("error", "Pick a city.", tabUrl("overrides"));
  const opt = (name: string) => String(fd.get(name) ?? "").trim() || null;
  // Titles and descriptions are managed in Admin → SEO → Location pages; overrides only change the on-page copy.
  const [h1, intro] = [opt("custom_h1"), opt("custom_intro")];
  const id = intField(fd, "id");
  try {
    if (id) {
      await sql`
        UPDATE location_page_overrides SET city_slug = ${city}, service_slug = ${service}, custom_h1 = ${h1}, custom_intro = ${intro},
          updated_at = LOCALTIMESTAMP
        WHERE id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO location_page_overrides (city_slug, service_slug, custom_h1, custom_intro)
        VALUES (${city}, ${service}, ${h1}, ${intro})
        ON CONFLICT (city_slug, service_slug) DO UPDATE SET
          custom_h1 = EXCLUDED.custom_h1, custom_intro = EXCLUDED.custom_intro, updated_at = LOCALTIMESTAMP
      `;
    }
  } catch (err) {
    console.error("[saveOverride]", err);
    await finish("error", isDuplicate(err) ? "Another override already exists for that page." : "Save failed.", tabUrl("overrides", id ? `&edit_override=${id}` : ""));
  }
  refreshPublicSite();
  await finish("success", `Override saved for ${city}${service ? `/${service}` : ""}.`, tabUrl("overrides"));
}

export async function deleteOverride(fd: FormData) {
  await requireAdmin();
  await sql`DELETE FROM location_page_overrides WHERE id = ${intField(fd, "id")}`;
  refreshPublicSite();
  await finish("success", "Override deleted.", tabUrl("overrides"));
}
