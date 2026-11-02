import "server-only";
import { randomBytes } from "node:crypto";
import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del } from "@vercel/blob";
import type { MediaKind } from "@/lib/media";

// Blog/portfolio images uploaded in the admin go to one of two places:
//   blob  – Vercel Blob (when BLOB_READ_WRITE_TOKEN is set; required on Vercel, whose disk is read-only)
//   local – public/uploads/<kind>/ on this server's disk, named like the PHP site did (blog_<time>_<hex>.jpg)
// The database stores a Blob URL or a bare filename; lib/media.ts turns either into a URL.

export type UploadMode = "blob" | "local" | null;

export function uploadMode(): UploadMode {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (!process.env.VERCEL) return "local";
  return null;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // same limit as the PHP admin
export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PREFIX: Record<MediaKind, string> = { blog: "blog", portfolio: "pf" };
/** Files this admin wrote (and may delete). Legacy files from the PHP site use the same pattern. */
export const LOCAL_NAME_RE = /^(blog|pf)_\d{9,11}_[a-f0-9]{12}\.(jpg|png|webp|gif)$/;

const exists = (file: string) => access(file).then(() => true, () => false);

const isBlobUrl = (v: string | null) =>
  !!v && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(v);

/** Image type from the file's first bytes (the browser's MIME type and extension are not trusted). */
export function sniffImage(buf: Buffer): "jpg" | "png" | "webp" | "gif" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a") return "gif";
  return null;
}

/** Saves an uploaded image under public/uploads/<kind>/ and returns its new filename. */
export async function saveLocalImage(kind: MediaKind, buf: Buffer, ext: string): Promise<string> {
  const name = `${PREFIX[kind]}_${Math.floor(Date.now() / 1000)}_${randomBytes(6).toString("hex")}.${ext}`;
  const dir = path.join(UPLOAD_DIR, kind);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf, { flag: "wx" });
  return name;
}

/** Best-effort delete of an image we own (Blob URL, or a file in public/uploads). */
export async function deleteImage(value: string | null, kind?: MediaKind) {
  if (!value) return;
  if (isBlobUrl(value)) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return;
    try {
      await del(value);
    } catch (err) {
      console.error("[deleteImage]", err);
    }
    return;
  }
  if (!kind || !LOCAL_NAME_RE.test(value) || process.env.VERCEL) return;
  try {
    await unlink(path.join(UPLOAD_DIR, kind, value));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") console.error("[deleteImage]", err);
  }
}

/**
 * Works out the image column after a form submit: a fresh upload (validated as ours) replaces the old image,
 * "remove image" clears it, otherwise the old value stays. Returns { value } or { error }.
 */
export async function resolveImage(
  fd: FormData,
  kind: MediaKind,
  old: string | null,
): Promise<{ value: string | null } | { error: string }> {
  const uploaded = String(fd.get("image_url") ?? "").trim();
  if (uploaded) {
    let ok = false;
    if (isBlobUrl(uploaded)) {
      try {
        ok = new URL(uploaded).pathname.startsWith(`/${kind}/`);
      } catch {
        ok = false;
      }
    } else {
      // A filename returned by /api/admin/upload-local for this kind of image.
      ok = LOCAL_NAME_RE.test(uploaded) && uploaded.startsWith(`${PREFIX[kind]}_`) && (await exists(path.join(UPLOAD_DIR, kind, uploaded)));
    }
    if (!ok) return { error: "Invalid image upload." };
    if (old && old !== uploaded) await deleteImage(old, kind);
    return { value: uploaded };
  }
  if (fd.get("remove_image")) {
    await deleteImage(old, kind);
    return { value: null };
  }
  return { value: old };
}
