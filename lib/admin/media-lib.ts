import "server-only";
import { rows, sql } from "@/lib/db";

// The media library (table `media`): every uploaded image or video, and where on the site each one is used.

export type MediaRow = {
  id: number;
  url: string;
  name: string;
  kind: "image" | "video";
  mime: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  source: "blob" | "local";
  created_at: Date;
};
export type Usage = { label: string; href: string };

/** Free Vercel Blob storage on the Hobby plan. */
export const BLOB_FREE_BYTES = 1024 * 1024 * 1024;

const BLOB_URL_RE = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/(blog|portfolio|media)\/[\w.-]+$/i;
export const isOurBlobUrl = (u: string) => BLOB_URL_RE.test(u);

/** How a field value (filename from the old site, /uploads path or Blob URL) maps to a media URL. */
export function fieldToUrl(kind: "blog" | "portfolio", value: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//.test(value) || value.startsWith("/")) return value;
  return `/uploads/${kind}/${value}`;
}

/**
 * Where each media URL is used: blog featured images and article bodies, portfolio images, share images in
 * Admin → SEO and the default share image in settings. Read in one go for the whole library.
 */
export async function mediaUsage(): Promise<Map<string, Usage[]>> {
  const [posts, projects, seo, settings] = await Promise.all([
    rows<{ id: number; title: string; featured_image: string | null; content: string }>(sql`SELECT id, title, featured_image, content FROM blog_posts`),
    rows<{ id: number; title: string; image: string | null }>(sql`SELECT id, title, image FROM portfolios`),
    rows<{ entity_type: string; entity_key: string; og_image: string }>(sql`SELECT entity_type, entity_key, og_image FROM seo_meta WHERE COALESCE(og_image, '') <> ''`),
    rows<{ setting_key: string; setting_value: string }>(sql`SELECT setting_key, setting_value FROM site_settings WHERE setting_value ILIKE '%/uploads/%' OR setting_value ILIKE '%blob.vercel-storage.com%'`),
  ]);
  const map = new Map<string, Usage[]>();
  const add = (url: string | null, u: Usage) => {
    if (!url) return;
    const key = url.replace(/^https?:\/\/(www\.)?bravesyntax\.com/, "");
    const list = map.get(key) ?? [];
    if (!list.some((x) => x.label === u.label)) list.push(u);
    map.set(key, list);
  };
  const urlsIn = (html: string) => [...html.matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/gi)].map((m) => m[1]);
  for (const p of posts) {
    const u = { label: `Blog: ${p.title}`, href: `/admin/blog?edit=${p.id}` };
    add(fieldToUrl("blog", p.featured_image), u);
    for (const src of urlsIn(p.content ?? "")) add(src, { ...u, label: `Blog (in article): ${p.title}` });
  }
  for (const p of projects) add(fieldToUrl("portfolio", p.image), { label: `Portfolio: ${p.title}`, href: `/admin/portfolio?edit=${p.id}` });
  for (const s of seo) add(s.og_image, { label: `SEO share image: ${s.entity_type} ${s.entity_key}`, href: `/admin/seo/edit?type=${s.entity_type}&key=${encodeURIComponent(s.entity_key)}` });
  for (const s of settings) for (const m of s.setting_value.match(/(https:\/\/[^\s"']+|\/uploads\/[^\s"']+)/g) ?? []) add(m, { label: `Settings: ${s.setting_key}`, href: "/admin/settings" });
  return map;
}

/** Whether a value submitted from an image field is a file in the media library (or an old-site upload). */
export async function isLibraryFile(url: string): Promise<boolean> {
  const [r] = await rows<{ n: number }>(sql`SELECT COUNT(*)::int AS n FROM media WHERE url = ${url}`);
  return r.n > 0;
}
