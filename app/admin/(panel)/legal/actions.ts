"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { finish, refreshPublicSite } from "@/lib/admin/common";
import { sql } from "@/lib/db";
import { LEGAL_PAGES, type LegalSlug } from "@/lib/legal";

export async function saveLegalPage(fd: FormData) {
  await requireAdmin();
  const slug = String(fd.get("slug") ?? "") as LegalSlug;
  const page = LEGAL_PAGES[slug];
  if (!page) await finish("error", "Unknown page.", "/admin/legal");
  const back = `/admin/legal?page=${slug}`;
  const html = String(fd.get("content") ?? "").trim();
  if (html.length > 100_000) await finish("error", "Content is too long.", back);
  const reset = fd.get("reset") === "1";

  await sql`
    INSERT INTO site_settings (setting_key, setting_value)
    SELECT * FROM unnest(${[page.key, page.updatedKey]}::text[], ${[reset ? "" : html, reset ? "" : new Date().toISOString()]}::text[])
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value
  `;
  refreshPublicSite();
  await finish("success", reset ? `${page.title} reset to the default text.` : `${page.title} published.`, back);
}
