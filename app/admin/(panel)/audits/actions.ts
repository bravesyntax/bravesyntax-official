"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { finish, idsField, intField } from "@/lib/admin/common";
import { sql } from "@/lib/db";
import { field } from "@/lib/validation";

const PAGE = "/admin/audits";
// A "use server" file may export only async functions, so the page keeps its own copy of these labels.
const AUDIT_STATUSES = ["new", "contacted", "won", "not_interested"];

export async function saveAudit(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const status = field(fd, "status");
  if (!AUDIT_STATUSES.includes(status)) await finish("error", "Unknown status.", `${PAGE}?view=${id}`);
  await sql`UPDATE site_audits SET status = ${status}, notes = ${field(fd, "notes").slice(0, 5000) || null} WHERE id = ${id}`;
  await finish("success", "Saved.", `${PAGE}?view=${id}`);
}

/** Deletes audits and any contact details on them (also how to honour a "please delete my data" request). */
export async function deleteAudits(fd: FormData) {
  await requireAdmin();
  const ids = idsField(fd);
  const one = intField(fd, "id");
  const all = one ? [one] : ids;
  if (all.length) await sql`DELETE FROM site_audits WHERE id = ANY(${all})`;
  await finish("success", `${all.length} audit(s) deleted.`, PAGE);
}
