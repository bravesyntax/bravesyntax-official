// Image references in blog_posts.featured_image / portfolios.image are either a filename from the PHP site
// (served from public/uploads/<kind>/) or, for images uploaded through the new admin, a full Vercel Blob URL.

export type MediaKind = "blog" | "portfolio";

export function mediaUrl(kind: MediaKind, value: string): string {
  return /^https?:\/\//.test(value) ? value : `/uploads/${kind}/${value}`;
}

/** Absolute URL, for structured data and Open Graph tags. */
export function absoluteMediaUrl(kind: MediaKind, value: string, siteUrl: string): string {
  const url = mediaUrl(kind, value);
  return url.startsWith("/") ? siteUrl + url : url;
}
