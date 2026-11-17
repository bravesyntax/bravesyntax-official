import "server-only";
import { SITE_URL } from "./config";

// IndexNow tells Bing (which also feeds Yahoo, DuckDuckGo, Ecosia and ChatGPT search), Yandex, Seznam and Naver
// that a page is new or changed, so they crawl it within hours instead of weeks. Free, no account needed.
// Ownership is proven by the key file public/<key>.txt, which contains the key itself.
// (Google doesn't use IndexNow: for Google, submit the sitemap and use URL Inspection in Search Console.)

export const INDEXNOW_KEY = "dc9313db289cf537268da0b21f79e586";

/** Notifies IndexNow about up to 10,000 URLs of this site. Never throws; returns the HTTP status (0 on failure). */
export async function submitToIndexNow(urls: string[]): Promise<number> {
  const host = new URL(SITE_URL).host;
  const list = [...new Set(urls.map((u) => (u.startsWith("/") ? `${SITE_URL}${u}` : u)).filter((u) => new URL(u).host === host))].slice(0, 10_000);
  if (!list.length || process.env.VERCEL_ENV !== "production") return 0; // only the live site, never previews or local
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList: list }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.status;
  } catch (err) {
    console.error("[indexnow]", err);
    return 0;
  }
}
