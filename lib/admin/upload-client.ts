"use client";

import { registerMedia, type MediaItem } from "@/app/admin/(panel)/media/actions";

export { formatBytes } from "@/lib/format-bytes";

// Uploads from the admin, in the browser: images are resized and converted to WebP first (so the server and the
// free plan's limits do no work), then sent straight to Vercel Blob and recorded in the media library.

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // before optimisation
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_SIDE = 1920;
const QUALITY = 0.82;

type Optimised = { file: File; width: number | null; height: number | null };

/**
 * Longest side at most 1920 px, saved as WebP. GIFs (may be animated) are left alone, and so is any image the
 * conversion would make bigger, or that the browser can't encode as WebP.
 */
export async function optimiseImage(file: File): Promise<Optimised> {
  if (file.type === "image/gif") return { file, ...(await sizeOf(file)) };
  const bitmap = await createImageBitmap(file);
  const original = { width: bitmap.width, height: bitmap.height };
  const scale = Math.min(1, MAX_SIDE / Math.max(original.width, original.height));
  const width = Math.round(original.width * scale);
  const height = Math.round(original.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  if (!blob || blob.type !== "image/webp" || (blob.size >= file.size && scale === 1)) return { file, ...original };
  const name = `${file.name.replace(/\.[^.]+$/, "") || "image"}.webp`;
  return { file: new File([blob], name, { type: "image/webp" }), width, height };
}

async function sizeOf(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    const b = await createImageBitmap(file);
    const out = { width: b.width, height: b.height };
    b.close();
    return out;
  } catch {
    return { width: null, height: null };
  }
}

async function videoSize(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      resolve({ width: v.videoWidth || null, height: v.videoHeight || null });
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });
}

/** A short, safe file name for the storage path: "My Photo (1).PNG" → "my-photo-1". */
const slugName = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "file";

export function checkFile(file: File): string | null {
  if (IMAGE_TYPES.includes(file.type)) return file.size > MAX_IMAGE_BYTES ? "Image too large. Max 15 MB." : null;
  if (VIDEO_TYPES.includes(file.type)) return file.size > MAX_VIDEO_BYTES ? "Video too large. Max 50 MB." : null;
  return "Only JPG, PNG, WebP, GIF images or MP4, WebM videos.";
}

/** Optimises (images), uploads to Vercel Blob and adds the file to the media library. */
export async function uploadMedia(original: File, onProgress?: (percent: number, stage: string) => void): Promise<MediaItem> {
  const problem = checkFile(original);
  if (problem) throw new Error(problem);
  const isVideo = VIDEO_TYPES.includes(original.type);
  onProgress?.(0, isVideo ? "Uploading" : "Optimising");
  const { file, width, height } = isVideo ? { file: original, ...(await videoSize(original)) } : await optimiseImage(original);
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const { upload } = await import("@vercel/blob/client");
  const blob = await upload(`media/${slugName(original.name)}.${ext}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/upload",
    onUploadProgress: ({ percentage }) => onProgress?.(Math.round(percentage), "Uploading"),
  });
  const saved = await registerMedia({ url: blob.url, name: `${slugName(original.name)}.${ext}`, mime: file.type, size: file.size, width, height });
  if ("error" in saved) throw new Error(saved.error);
  return saved.item;
}

