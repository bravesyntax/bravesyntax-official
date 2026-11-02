"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { checkbox, finish, idsField, intField, refreshPublicSite } from "@/lib/admin/common";
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
    active: checkbox(fd, "is_active"),
  };
}

export async function saveService(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const s = read(fd);
  if (!s.title || !s.description) await finish("error", "Title and description are required.", id ? `${PAGE}?edit=${id}` : `${PAGE}?form=add`);

  if (id) {
    await sql`
      UPDATE services SET title = ${s.title}, category = ${s.category}, description = ${s.description}, icon = ${s.icon},
        sort_order = ${s.sort}, is_active = ${s.active}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      INSERT INTO services (title, category, description, icon, sort_order, is_active)
      VALUES (${s.title}, ${s.category}, ${s.description}, ${s.icon}, ${s.sort}, ${s.active})
    `;
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
