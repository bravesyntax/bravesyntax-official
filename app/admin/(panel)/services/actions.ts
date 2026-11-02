"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { checkbox, finish, idsField, intField, refreshPublicSite, makeSlug } from "@/lib/admin/common";
import { linesToJson, pairsToJson } from "@/lib/admin/lines";
import { sql } from "@/lib/db";
import { field } from "@/lib/validation";

const PAGE = "/admin/services";

function read(fd: FormData) {
  const category = field(fd, "category");
  return {
    title: field(fd, "title"),
    category: category === "design" ? "design" : "development",
    description: field(fd, "description"),
    icon: field(fd, "icon") || null,
    sort: intField(fd, "sort_order"),
    slug: makeSlug(field(fd, "slug") || field(fd, "title")),
    tagline: field(fd, "tagline").slice(0, 200) || null,
    overview: String(fd.get("overview") ?? "").trim() || null,
    includes: linesToJson(String(fd.get("includes") ?? "")),
    bestFor: linesToJson(String(fd.get("best_for") ?? "")),
    timeline: field(fd, "timeline").slice(0, 120) || null,
    faqs: pairsToJson(String(fd.get("faqs") ?? "")),
    active: checkbox(fd, "is_active"),
  };
}

export async function saveService(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const s = read(fd);
  if (!s.title || !s.description) await finish("error", "Title and description are required.", id ? `${PAGE}?edit=${id}` : `${PAGE}?form=add`);

  try {
    if (id) {
      await sql`
        UPDATE services SET title = ${s.title}, slug = ${s.slug}, category = ${s.category}, description = ${s.description}, icon = ${s.icon},
          sort_order = ${s.sort}, is_active = ${s.active}, tagline = ${s.tagline}, overview = ${s.overview}, includes_json = ${s.includes},
          best_for_json = ${s.bestFor}, timeline = ${s.timeline}, faq_json = ${s.faqs}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO services (title, slug, category, description, icon, sort_order, is_active, tagline, overview, includes_json, best_for_json, timeline, faq_json)
        VALUES (${s.title}, ${s.slug}, ${s.category}, ${s.description}, ${s.icon}, ${s.sort}, ${s.active}, ${s.tagline}, ${s.overview}, ${s.includes}, ${s.bestFor}, ${s.timeline}, ${s.faqs})
      `;
    }
  } catch (err) {
    const dup = err instanceof Error && /duplicate key/i.test(err.message);
    await finish("error", dup ? `Another service already uses the URL "${s.slug}".` : "Couldn't save the service.", id ? `${PAGE}?edit=${id}` : `${PAGE}?form=add`);
  }
  refreshPublicSite();
  await finish("success", id ? "Service updated." : `Service "${s.title}" added.`, PAGE);
}

export async function toggleService(fd: FormData) {
  await requireAdmin();
  await sql`UPDATE services SET is_active = 1 - is_active WHERE id = ${intField(fd, "id")}`;
  refreshPublicSite();
  await finish("success", "Visibility toggled.", PAGE);
}

export async function deleteService(fd: FormData) {
  await requireAdmin();
  await sql`DELETE FROM services WHERE id = ${intField(fd, "id")}`;
  refreshPublicSite();
  await finish("success", "Service deleted.", PAGE);
}

export async function bulkDeleteServices(fd: FormData) {
  await requireAdmin();
  const ids = idsField(fd);
  if (ids.length) await sql`DELETE FROM services WHERE id = ANY(${ids})`;
  refreshPublicSite();
  await finish("success", `${ids.length} service(s) deleted.`, PAGE);
}
