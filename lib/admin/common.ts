import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setFlash } from "./flash";

/** Flash a message and redirect back (set_flash() + redirect() on the PHP site). */
export async function finish(type: "success" | "error", message: string, to: string): Promise<never> {
  await setFlash(type, message);
  redirect(to);
}

/**
 * Pages that show each kind of content. Refreshing only these after an edit, instead of the whole site, keeps
 * Vercel ISR writes down: every cached page that is dropped is written again on its next visit.
 * Changes that can touch every page (settings, SEO, legal pages, services in the menu) still refresh everything.
 */
const SCOPES = {
  blog: ["/", "/blog", "/blog/[slug]"],
  portfolio: ["/", "/about", "/portfolio", "/portfolio/[slug]", "/services/[slug]", "/industries/[slug]", "/[city]", "/[city]/[service]", "/llms.txt"],
  careers: ["/", "/careers"],
  locations: ["/", "/[city]", "/[city]/[service]"],
} as const;
export type RefreshScope = keyof typeof SCOPES | "all";

/** After content changes, drop the cached public pages that show it, so edits show up immediately. */
export function refreshPublicSite(scope: RefreshScope = "all") {
  revalidatePath("/sitemap.xml"); // a route handler, not under the layout
  if (scope === "all") {
    revalidatePath("/", "layout");
    return;
  }
  for (const path of SCOPES[scope]) {
    if (path.includes("[")) revalidatePath(path, "page");
    else revalidatePath(path);
  }
}

export const intField = (fd: FormData, name: string, fallback = 0) => {
  const n = Number.parseInt(String(fd.get(name) ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
};
export const checkbox = (fd: FormData, name: string) => (fd.get(name) ? 1 : 0);
export const idsField = (fd: FormData) =>
  fd
    .getAll("ids")
    .map((v) => Number.parseInt(String(v), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

/** Slug from a title, as blog_make_slug()/career_slug() on the PHP site. */
export const makeSlug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
