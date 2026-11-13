"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { finish, idsField, intField } from "@/lib/admin/common";
import { isOurBlobUrl, mediaUsage, type MediaRow } from "@/lib/admin/media-lib";
import { rows, sql } from "@/lib/db";
import { formatBytes } from "@/lib/format-bytes";
import { field } from "@/lib/validation";

const PAGE = "/admin/media";
const MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];

export type MediaItem = Pick<MediaRow, "id" | "url" | "name" | "kind" | "width" | "height" | "alt" | "size_bytes">;

/** Records a file the browser just uploaded to Vercel Blob. */
export async function registerMedia(input: { url: string; name: string; mime: string; size: number; width: number | null; height: number | null }): Promise<{ item: MediaItem } | { error: string }> {
  await requireAdmin();
  if (!isOurBlobUrl(input.url)) return { error: "Unknown file address." };
  if (!MIMES.includes(input.mime)) return { error: "Unsupported file type." };
  const kind = input.mime.startsWith("video/") ? "video" : "image";
  const int = (n: number | null) => (Number.isInteger(n) && n! > 0 && n! < 100_000_000 ? n : null);
  const [item] = await rows<MediaItem>(sql`
    INSERT INTO media (url, name, kind, mime, size_bytes, width, height, source)
    VALUES (${input.url}, ${input.name.slice(0, 250)}, ${kind}, ${input.mime}, ${int(input.size)}, ${int(input.width)}, ${int(input.height)}, 'blob')
    ON CONFLICT (url) DO UPDATE SET size_bytes = EXCLUDED.size_bytes
    RETURNING id, url, name, kind, width, height, alt, size_bytes
  `);
  revalidatePath(PAGE);
  return { item };
}

/** Files for the "Choose from Media" picker, newest first. */
export async function pickerList(kind: "image" | "video" | "all"): Promise<MediaItem[]> {
  await requireAdmin();
  return rows<MediaItem>(sql`
    SELECT id, url, name, kind, width, height, alt, size_bytes FROM media
    WHERE ${kind} = 'all' OR kind = ${kind}
    ORDER BY created_at DESC LIMIT 300
  `);
}

export async function saveMediaAlt(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  await sql`UPDATE media SET alt = ${field(fd, "alt").slice(0, 300) || null} WHERE id = ${id}`;
  await finish("success", "Description saved.", `${PAGE}?${field(fd, "back") || ""}`);
}

/**
 * Deletes several files at once: the ticked ones, or (with all_unused) every uploaded file nothing uses. Each one
 * is checked again here, so a file that is in use, or part of the site code, is skipped rather than deleted.
 */
export async function deleteMediaBulk(fd: FormData) {
  await requireAdmin();
  const back = `${PAGE}?${field(fd, "back") || ""}`;
  const all = fd.get("all_unused") === "1";
  const ids = idsField(fd);
  if (!all && !ids.length) await finish("error", "Tick the files to delete first.", back);
  const [candidates, usage] = await Promise.all([
    all ? rows<{ id: number; url: string; source: string; size_bytes: number | null }>(sql`SELECT id, url, source, size_bytes FROM media WHERE source = 'blob'`)
      : rows<{ id: number; url: string; source: string; size_bytes: number | null }>(sql`SELECT id, url, source, size_bytes FROM media WHERE id = ANY(${ids})`),
    mediaUsage(),
  ]);
  const doomed = candidates.filter((m) => m.source === "blob" && !(usage.get(m.url) ?? []).length);
  const skipped = candidates.length - doomed.length;
  if (!doomed.length) await finish("error", skipped ? "Nothing deleted: those files are in use or part of the site code." : "There are no unused files to delete.", back);
  try {
    await del(doomed.map((m) => m.url)); // one storage call for all of them
  } catch (err) {
    console.error("[deleteMediaBulk]", err);
    await finish("error", "Couldn't delete the files from storage. Try again.", back);
  }
  await sql`DELETE FROM media WHERE id = ANY(${doomed.map((m) => m.id)})`;
  const freed = doomed.reduce((n, m) => n + (m.size_bytes ?? 0), 0);
  await finish("success", `Deleted ${doomed.length} file(s), freeing ${formatBytes(freed) || "0 KB"}.${skipped ? ` Skipped ${skipped} in use or part of the site code.` : ""}`, back);
}

/** Deletes a file from storage and the library, only when nothing on the site uses it. */
export async function deleteMedia(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const back = `${PAGE}?${field(fd, "back") || ""}`;
  const [m] = await rows<{ url: string; source: string }>(sql`SELECT url, source FROM media WHERE id = ${id}`);
  if (!m) await finish("error", "File not found.", back);
  if (m.source !== "blob") await finish("error", "This file is part of the site code (from the old site) and can't be deleted here.", back);
  const used = (await mediaUsage()).get(m.url) ?? [];
  if (used.length) await finish("error", `Still used in ${used.length} place(s). Remove it there first.`, back);
  try {
    await del(m.url);
  } catch (err) {
    console.error("[deleteMedia]", err);
    await finish("error", "Couldn't delete the file from storage. Try again.", back);
  }
  await sql`DELETE FROM media WHERE id = ${id}`;
  await finish("success", "File deleted.", back);
}
