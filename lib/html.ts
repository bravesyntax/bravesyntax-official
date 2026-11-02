// HTML entity helpers. The PHP admin ran htmlspecialchars() on many fields before saving them (settings,
// SEO titles, contact messages), and the PHP pages decoded on output. React escapes on output by itself,
// so stored text is decoded once when read; values saved by the new admin are plain text already.

export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Decodes every string field of a row. */
export function decodeRow<T extends Record<string, unknown>>(row: T): T {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === "string" ? decodeEntities(v) : v])) as T;
}
