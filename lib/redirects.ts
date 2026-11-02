// Redirect rules from Admin → SEO → Redirects. Dependency-free so proxy.ts can import it.
//   source "/old-page"     matches exactly that path (trailing slash ignored, query string ignored)
//   source "/old-blog/*"   matches everything under /old-blog/; a "*" in the destination receives the rest
//                          ("/old-blog/*" → "/blog/*" sends /old-blog/seo-tips to /blog/seo-tips)

export type RedirectRule = { id: number; source_path: string; destination: string; status_code: 301 | 302 | 410 };

/** "/About/" → "/About" (case kept: URLs are case-sensitive). Returns "" for anything that isn't a path. */
export function normalizePath(input: string): string {
  let p = input.trim();
  if (!p) return "";
  try {
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname; // allow pasting a full URL of this site
  } catch {
    return "";
  }
  p = p.split(/[?#]/)[0];
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return /^\/[^\s]*$/.test(p) ? p : "";
}

export type RedirectMatch = { rule: RedirectRule; location: string };

export function matchRedirect(rules: RedirectRule[], pathname: string): RedirectMatch | null {
  const path = normalizePath(pathname);
  for (const rule of rules) {
    if (rule.source_path === path) return { rule, location: rule.destination };
  }
  // Wildcards: longest prefix wins.
  let best: RedirectMatch | null = null;
  for (const rule of rules) {
    if (!rule.source_path.endsWith("/*")) continue;
    const prefix = rule.source_path.slice(0, -1); // keep the trailing "/"
    if (path.startsWith(prefix) && (!best || prefix.length > best.rule.source_path.length - 1)) {
      const rest = path.slice(prefix.length);
      best = { rule, location: rule.destination.includes("*") ? rule.destination.replace("*", rest) : rule.destination };
    }
  }
  return best;
}
