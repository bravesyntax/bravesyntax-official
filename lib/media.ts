// Image references in blog_posts.featured_image / portfolios.image are a filename from the PHP site (served from
// public/uploads/<kind>/), a site path picked from the media library (/uploads/...), or a full Vercel Blob URL.

export type MediaKind = "blog" | "portfolio";

export function mediaUrl(kind: MediaKind, value: string): string {
  return /^https?:\/\//.test(value) || value.startsWith("/") ? value : `/uploads/${kind}/${value}`;
}

/** Absolute URL, for structured data and Open Graph tags. */
export function absoluteMediaUrl(kind: MediaKind, value: string, siteUrl: string): string {
  const url = mediaUrl(kind, value);
  return url.startsWith("/") ? siteUrl + url : url;
}

/** Pictures hosted elsewhere (GitHub cards, screenshots of live sites) load straight from the visitor's browser. */
export const isExternalImage = (value: string | null | undefined) => !!value && /^https?:\/\//.test(value) && !/\.public\.blob\.vercel-storage\.com\//.test(value);
