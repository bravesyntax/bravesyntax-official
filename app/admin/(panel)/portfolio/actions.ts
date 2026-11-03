"use server";

import { requireAdmin } from "@/lib/admin/auth";
import {
  checkbox,
  finish,
  idsField,
  intField,
  refreshPublicSite,
} from "@/lib/admin/common";
import { deleteImage, resolveImage } from "@/lib/admin/images";
import { rows, sql } from "@/lib/db";
import { field, isValidHttpUrl } from "@/lib/validation";

const PAGE = "/admin/portfolio";

/** Unique slug from the requested slug or the title, adding -2, -3… on clashes (pf_make_slug on the PHP site). */
async function uniqueSlug(title: string, requested: string, excludeId: number) {
  const base =
    (requested || title)
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "project";
  const taken = new Set(
    (
      await rows<{ slug: string }>(
        sql`SELECT slug FROM portfolios WHERE (slug = ${base} OR slug LIKE ${`${base}-%`}) AND id <> ${excludeId}`,
      )
    ).map((r) => r.slug),
  );
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

export async function saveProject(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const back = id ? `${PAGE}?edit=${id}` : `${PAGE}?form=add`;
  const opt = (name: string) => field(fd, name) || null;

  const title = field(fd, "title");
  const description = field(fd, "description");
  if (!title || !description)
    await finish("error", "Title and description are required.", back);
  const category =
    field(fd, "category") === "design" ? "design" : "development";
  const liveUrl = opt("live_url");
  if (liveUrl && !isValidHttpUrl(liveUrl))
    await finish(
      "error",
      "Live project URL must start with http:// or https://.",
      back,
    );
  const githubUrl = opt("github_url");
  if (githubUrl && !/^https:\/\/github\.com\//i.test(githubUrl))
    await finish("error", "GitHub URL must start with https://github.com/.", back);
  const year = intField(fd, "year", new Date().getFullYear());
  const sortOrder = intField(fd, "sort_order");
  const active = checkbox(fd, "is_active");
  const featured = checkbox(fd, "is_featured");

  const [old] = id
    ? await rows<{ image: string | null }>(
        sql`SELECT image FROM portfolios WHERE id = ${id}`,
      )
    : [];
  if (id && !old) await finish("error", "Project not found.", PAGE);
  const img = await resolveImage(fd, "portfolio", old?.image ?? null);
  if ("error" in img) await finish("error", img.error, back);
  const image = "value" in img ? img.value : null;
  const slug = await uniqueSlug(title, field(fd, "slug"), id);

  const v = {
    title,
    slug,
    category,
    client_name: opt("client_name"),
    tags: field(fd, "tags"),
    description,
    challenge: opt("challenge"),
    approach: opt("approach"),
    results_detail: opt("results_detail"),
    tech_stack: opt("tech_stack"),
    metric_1: opt("metric_1"),
    metric_2: opt("metric_2"),
    metric_3: opt("metric_3"),
    image,
    live_url: liveUrl,
    github_url: githubUrl,
    year,
    sort_order: sortOrder,
    is_active: active,
    is_featured: featured,
  };
  try {
    if (id) {
      await sql`
        UPDATE portfolios SET title = ${v.title}, slug = ${v.slug}, category = ${v.category}, client_name = ${v.client_name}, tags = ${v.tags},
          description = ${v.description}, challenge = ${v.challenge}, approach = ${v.approach}, results_detail = ${v.results_detail},
          tech_stack = ${v.tech_stack}, metric_1 = ${v.metric_1}, metric_2 = ${v.metric_2}, metric_3 = ${v.metric_3}, image = ${v.image},
          live_url = ${v.live_url}, github_url = ${v.github_url}, year = ${v.year}, sort_order = ${v.sort_order}, is_active = ${v.is_active}, is_featured = ${v.is_featured}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO portfolios (title, slug, category, client_name, tags, description, challenge, approach, results_detail, tech_stack,
                                metric_1, metric_2, metric_3, image, live_url, github_url, year, sort_order, is_active, is_featured)
        VALUES (${v.title}, ${v.slug}, ${v.category}, ${v.client_name}, ${v.tags}, ${v.description}, ${v.challenge}, ${v.approach},
                ${v.results_detail}, ${v.tech_stack}, ${v.metric_1}, ${v.metric_2}, ${v.metric_3}, ${v.image}, ${v.live_url}, ${v.github_url}, ${v.year},
                ${v.sort_order}, ${v.is_active}, ${v.is_featured})
      `;
    }
  } catch (err) {
    console.error("[saveProject]", err);
    if (!id) await deleteImage(image, "portfolio");
    await finish("error", "DB error saving the project.", back);
  }
  refreshPublicSite();
  await finish(
    "success",
    id ? "Project updated." : "Project added successfully.",
    PAGE,
  );
}

export async function toggleProject(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  await sql`UPDATE portfolios SET is_active = 1 - is_active WHERE id = ${id}`;
  refreshPublicSite();
  await finish("success", "Visibility updated.", PAGE);
}

export async function deleteProject(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const [row] = await rows<{ image: string | null }>(
    sql`DELETE FROM portfolios WHERE id = ${id} RETURNING image`,
  );
  await sql`DELETE FROM seo_meta WHERE entity_type = 'project' AND entity_key = ${String(id)}`;
  await deleteImage(row?.image ?? null, "portfolio");
  refreshPublicSite();
  await finish("success", "Project deleted.", PAGE);
}

export async function bulkDeleteProjects(fd: FormData) {
  await requireAdmin();
  const ids = idsField(fd);
  if (ids.length) {
    const deleted = await rows<{ image: string | null }>(
      sql`DELETE FROM portfolios WHERE id = ANY(${ids}) RETURNING image`,
    );
    await sql`DELETE FROM seo_meta WHERE entity_type = 'project' AND entity_key = ANY(${ids.map(String)})`;
    for (const r of deleted) await deleteImage(r.image, "portfolio");
  }
  refreshPublicSite();
  await finish("success", `${ids.length} project(s) deleted.`, PAGE);
}
