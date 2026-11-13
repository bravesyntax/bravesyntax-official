import "server-only";

// The free Website Audit tool's checks. Only public web addresses are fetched (every redirect hop is checked too),
// with size and time limits. Google PageSpeed Insights adds real mobile speed numbers when it answers in time.

export type CheckStatus = "pass" | "warn" | "fail";
export type CategoryKey = "seo" | "speed" | "mobile" | "security" | "leads";
export type AuditCheck = { id: string; category: CategoryKey; label: string; status: CheckStatus; detail: string; fix?: string };
export type AuditReport = {
  url: string;
  finalUrl: string;
  checkedAt: string;
  score: number;
  categories: { key: CategoryKey; label: string; score: number }[];
  checks: AuditCheck[];
  metrics: { responseMs: number; htmlKb: number; status: number; title: string; description: string; platform: string };
  pagespeed: { performance: number; lcpMs: number | null; cls: number | null; tbtMs: number | null } | null;
  summary?: string;
};

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  seo: "Google & SEO",
  speed: "Speed",
  mobile: "Mobile",
  security: "Security & trust",
  leads: "Getting enquiries",
};

const UA = "Mozilla/5.0 (compatible; BraveSyntaxAudit/1.0; +https://bravesyntax.com/tools/website-audit)";
const MAX_HTML = 3_000_000;

/** Turns what a visitor typed ("example.com", "http://www.example.com/page") into a URL, or null. */
export function normaliseUrl(input: string): string | null {
  let s = input.trim();
  if (!s || s.length > 500) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!isPublicHost(u)) return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

function isPublicHost(u: URL): boolean {
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  if (u.username || u.password) return false;
  if (u.port && !["80", "443"].includes(u.port)) return false;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h === "localhost" || /\.(local|internal|localhost|lan|home|corp|test|invalid)$/.test(h)) return false;
  if (/^[\d.]+$/.test(h) || h.includes(":") || h.startsWith("[")) return false; // IP addresses: real sites have names
  return true;
}

/** fetch() that follows redirects itself, so every hop is checked to be a public site. */
async function safeFetch(url: string, init: RequestInit & { timeoutMs: number }): Promise<{ res: Response; finalUrl: string; hops: string[] }> {
  let current = url;
  const hops: string[] = [];
  const signal = AbortSignal.timeout(init.timeoutMs);
  for (let i = 0; i < 6; i++) {
    const u = new URL(current);
    if (!isPublicHost(u)) throw new Error("This address isn't a public website.");
    const res = await fetch(current, { ...init, redirect: "manual", signal, headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*", ...(init.headers ?? {}) }, cache: "no-store" });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      hops.push(current);
      current = new URL(loc, current).toString();
      continue;
    }
    return { res, finalUrl: current, hops };
  }
  throw new Error("Too many redirects.");
}

async function readCapped(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < max) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function exists(url: string): Promise<boolean> {
  try {
    const { res } = await safeFetch(url, { method: "GET", timeoutMs: 6000 });
    const ok = res.ok && !/text\/html/i.test(res.headers.get("content-type") ?? "");
    await res.body?.cancel().catch(() => {});
    return ok;
  } catch {
    return false;
  }
}

async function pagespeed(url: string): Promise<AuditReport["pagespeed"]> {
  const key = process.env.PAGESPEED_API_KEY;
  const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance${key ? `&key=${key}` : ""}`;
  try {
    const res = await fetch(api, { signal: AbortSignal.timeout(40_000), cache: "no-store" });
    if (!res.ok) return null;
    const j = (await res.json()) as { lighthouseResult?: { categories?: { performance?: { score?: number } }; audits?: Record<string, { numericValue?: number }> } };
    const lr = j.lighthouseResult;
    const perf = lr?.categories?.performance?.score;
    if (typeof perf !== "number") return null;
    const num = (k: string) => (typeof lr?.audits?.[k]?.numericValue === "number" ? lr.audits[k].numericValue! : null);
    return { performance: Math.round(perf * 100), lcpMs: num("largest-contentful-paint"), cls: num("cumulative-layout-shift"), tbtMs: num("total-blocking-time") };
  } catch {
    return null;
  }
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? null;
const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

/** Runs every check on a site. Throws with a friendly message if the site can't be reached at all. */
export async function runSiteAudit(url: string): Promise<AuditReport> {
  const psi = pagespeed(url); // runs while we do our own checks
  const t0 = Date.now();
  let fetched: Awaited<ReturnType<typeof safeFetch>>;
  try {
    fetched = await safeFetch(url, { method: "GET", timeoutMs: 15_000 });
  } catch (err) {
    throw new Error(err instanceof Error && err.message.includes("public") ? err.message : "We couldn't open this website. Check the address and try again.");
  }
  const { res, finalUrl } = fetched;
  const html = await readCapped(res, MAX_HTML);
  const responseMs = Date.now() - t0;
  const htmlKb = Math.round(Buffer.byteLength(html) / 1024);
  const final = new URL(finalUrl);
  const head = html.split(/<\/head>/i)[0] ?? "";
  const metaTags = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const meta = (name: string) => decode(attr(metaTags.find((t) => (attr(t, "name") ?? attr(t, "property") ?? "").toLowerCase() === name) ?? "", "content") ?? "");
  const linkTags = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const title = decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const description = meta("description");
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, "")));
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => attr(t, "alt") === null).length;
  const robotsMeta = meta("robots").toLowerCase();
  const xRobots = (res.headers.get("x-robots-tag") ?? "").toLowerCase();
  // React puts <!-- --> between "©" and a year written as {year}; &nbsp; and spaces also appear in between.
  const years = [...html.replace(/<!--\s*-->|&nbsp;|&#160;/g, " ").matchAll(/(?:©|&copy;|&#169;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => Number(m[1])).filter((y) => y > 1995 && y < 2100);
  const copyright = years.length ? Math.max(...years) : null;
  const thisYear = new Date().getFullYear();
  const generator = meta("generator").toLowerCase();
  // Judged from file paths and the generator tag, not page text (a page can mention "WordPress" as a service).
  const platform = /\/_next\/static\//.test(html)
    ? "Next.js"
    : /wordpress/.test(generator) || /\/wp-(content|includes)\//.test(html)
      ? "WordPress"
      : /static\.wixstatic\.com|\bwix\.com/.test(html)
        ? "Wix"
        : /cdn\.shopify\.com/.test(html)
          ? "Shopify"
          : /\.blogspot\.com|blogger\.com/.test(html)
            ? "Blogger"
            : /squarespace\.com|static1\.squarespace/.test(html)
              ? "Squarespace"
              : /webflow/.test(generator)
                ? "Webflow"
                : generator.split(" ")[0] || "";
  const encoding = res.headers.get("content-encoding") ?? "";
  const mixed = final.protocol === "https:" ? [...html.matchAll(/\b(?:src|href)=["']http:\/\/[^"']+\.(?:js|css|png|jpe?g|gif|webp|svg)["']/gi)].length : 0;

  const origin = final.origin;
  const [robotsTxt, sitemap, httpRedirects] = await Promise.all([
    exists(`${origin}/robots.txt`),
    exists(`${origin}/sitemap.xml`).then(async (ok) => ok || exists(`${origin}/sitemap_index.xml`)),
    // Does the plain http:// address move people to the secure one?
    final.protocol === "https:"
      ? safeFetch(`http://${final.host}/`, { method: "GET", timeoutMs: 6000 })
          .then(({ finalUrl: f, res: r }) => {
            r.body?.cancel().catch(() => {});
            return f.startsWith("https://");
          })
          .catch(() => true)
      : Promise.resolve(false),
  ]);

  const checks: AuditCheck[] = [];
  const add = (c: AuditCheck) => checks.push(c);
  const range = (n: number, lo: number, hi: number): CheckStatus => (n >= lo && n <= hi ? "pass" : "warn");

  // Google & SEO
  add(title ? { id: "title", category: "seo", label: "Page title", status: range(title.length, 25, 65), detail: `"${title.slice(0, 90)}" (${title.length} characters)`, fix: title.length > 65 ? "Shorten the title to about 50–60 characters so Google shows all of it." : title.length < 25 ? "Make the title more descriptive: your main service and city, then your business name." : undefined } : { id: "title", category: "seo", label: "Page title", status: "fail", detail: "No page title found.", fix: "Add a title with your main service, city and business name." });
  add(description ? { id: "description", category: "seo", label: "Meta description", status: range(description.length, 70, 165), detail: `${description.length} characters`, fix: description.length > 165 ? "Trim the description to under 160 characters." : description.length < 70 ? "Write a fuller 120–160 character description that makes people want to click." : undefined } : { id: "description", category: "seo", label: "Meta description", status: "fail", detail: "Missing.", fix: "Add a 120–160 character description: Google shows it under your link." });
  add({ id: "h1", category: "seo", label: "Main heading (H1)", status: h1s.length === 1 ? "pass" : h1s.length === 0 ? "fail" : "warn", detail: h1s.length === 0 ? "No H1 heading." : h1s.length === 1 ? `"${h1s[0].slice(0, 80)}"` : `${h1s.length} H1 headings`, fix: h1s.length === 1 ? undefined : "Use exactly one H1 that says what you offer." });
  add({ id: "indexable", category: "seo", label: "Visible to Google", status: /noindex/.test(robotsMeta + xRobots) ? "fail" : "pass", detail: /noindex/.test(robotsMeta + xRobots) ? "This page tells Google not to index it (noindex)." : "Google is allowed to index this page.", fix: /noindex/.test(robotsMeta + xRobots) ? "Remove the noindex tag, or the page will never appear in Google." : undefined });
  add({ id: "canonical", category: "seo", label: "Canonical link", status: linkTags.some((t) => /rel=["']canonical["']/i.test(t)) ? "pass" : "warn", detail: linkTags.some((t) => /rel=["']canonical["']/i.test(t)) ? "Set." : "Not set.", fix: "Add a canonical link so Google knows the main address of each page." });
  add({ id: "sitemap", category: "seo", label: "XML sitemap", status: sitemap ? "pass" : "warn", detail: sitemap ? "Found." : "No sitemap.xml found.", fix: sitemap ? undefined : "Add a sitemap.xml and submit it in Google Search Console." });
  add({ id: "robots", category: "seo", label: "robots.txt", status: robotsTxt ? "pass" : "warn", detail: robotsTxt ? "Found." : "Not found.", fix: robotsTxt ? undefined : "Add a robots.txt that points to your sitemap." });
  add({ id: "schema", category: "seo", label: "Structured data (rich results)", status: /application\/ld\+json/i.test(html) ? "pass" : "warn", detail: /application\/ld\+json/i.test(html) ? "Found." : "None found.", fix: "Add LocalBusiness / Organization schema so Google can show your details richly." });
  add({ id: "alts", category: "seo", label: "Image descriptions (alt text)", status: noAlt === 0 ? "pass" : noAlt <= 3 ? "warn" : "fail", detail: imgs.length ? `${imgs.length - noAlt} of ${imgs.length} images described` : "No images on the page.", fix: noAlt ? "Describe each image in its alt text; it helps Google Images and screen readers." : undefined });
  add({ id: "social", category: "seo", label: "Social share preview", status: meta("og:image") && meta("og:title") ? "pass" : "warn", detail: meta("og:image") ? "Share image set." : "No share image (og:image).", fix: "Add Open Graph tags so links shared on WhatsApp and Facebook show a picture and title." });

  // Speed
  add({ id: "response", category: "speed", label: "Server response", status: responseMs < 1200 ? "pass" : responseMs < 3000 ? "warn" : "fail", detail: `${(responseMs / 1000).toFixed(1)} s to load the page's HTML`, fix: responseMs >= 1200 ? "Faster hosting or caching would make every page open quicker." : undefined });
  add({ id: "weight", category: "speed", label: "Page HTML size", status: htmlKb < 250 ? "pass" : htmlKb < 800 ? "warn" : "fail", detail: `${htmlKb} KB`, fix: htmlKb >= 250 ? "The page's HTML is heavy; remove unused page-builder code and inline styles." : undefined });
  add({ id: "compression", category: "speed", label: "Compression", status: /gzip|br|zstd/.test(encoding) ? "pass" : "warn", detail: encoding ? `Compressed (${encoding}).` : "Not compressed.", fix: /gzip|br|zstd/.test(encoding) ? undefined : "Turn on gzip or Brotli compression on the server." });

  // Mobile
  const viewport = meta("viewport");
  const mobileReady = /width\s*=\s*device-width|initial-scale/.test(viewport);
  add({ id: "viewport", category: "mobile", label: "Works on phones", status: mobileReady ? "pass" : "fail", detail: mobileReady ? "Mobile viewport set." : "No mobile viewport tag.", fix: mobileReady ? undefined : "The site isn't built for phones; most of your visitors use one." });
  add({ id: "lang", category: "mobile", label: "Page language", status: /<html\b[^>]*\blang=/i.test(html) ? "pass" : "warn", detail: /<html\b[^>]*\blang=/i.test(html) ? "Declared." : "Not declared.", fix: "Set the page language so browsers and screen readers handle it correctly." });
  add({ id: "favicon", category: "mobile", label: "Site icon (favicon)", status: linkTags.some((t) => /rel=["'][^"']*icon/i.test(t)) ? "pass" : "warn", detail: linkTags.some((t) => /rel=["'][^"']*icon/i.test(t)) ? "Set." : "Not set.", fix: "Add a favicon so your site is recognisable in tabs and Google results." });

  // Security & trust
  add({ id: "https", category: "security", label: "Secure connection (HTTPS)", status: final.protocol === "https:" ? "pass" : "fail", detail: final.protocol === "https:" ? "The site uses HTTPS." : "Browsers show this site as \"Not secure\".", fix: final.protocol === "https:" ? undefined : "Install a free SSL certificate; Chrome warns visitors away from HTTP sites." });
  if (final.protocol === "https:") add({ id: "http-redirect", category: "security", label: "HTTP sends visitors to HTTPS", status: httpRedirects ? "pass" : "warn", detail: httpRedirects ? "Yes." : "The http:// address doesn't redirect to https://.", fix: httpRedirects ? undefined : "Redirect every http:// address to https://." });
  add({ id: "mixed", category: "security", label: "No insecure files on a secure page", status: mixed ? "warn" : "pass", detail: mixed ? `${mixed} file(s) load over http://` : "None.", fix: mixed ? "Load every image, script and style over https://." : undefined });
  add({ id: "hsts", category: "security", label: "Security headers", status: res.headers.get("strict-transport-security") && res.headers.get("x-content-type-options") ? "pass" : "warn", detail: [res.headers.get("strict-transport-security") ? "HSTS on" : "no HSTS", res.headers.get("x-content-type-options") ? "nosniff on" : "no nosniff"].join(", "), fix: "Add HSTS and X-Content-Type-Options headers." });
  add({ id: "fresh", category: "security", label: "Looks up to date", status: copyright === null ? "warn" : copyright >= thisYear - 1 ? "pass" : "warn", detail: copyright ? `Copyright year ${copyright}` : "No copyright year found.", fix: copyright !== null && copyright < thisYear - 1 ? "An old copyright year makes the business look inactive; update the footer." : undefined });

  // Getting enquiries
  add({ id: "phone", category: "leads", label: "Tap-to-call link", status: /href=["']tel:/i.test(html) ? "pass" : "fail", detail: /href=["']tel:/i.test(html) ? "Found." : "No clickable phone number.", fix: /href=["']tel:/i.test(html) ? undefined : "Make your phone number a tap-to-call link; phone users expect it." });
  add({ id: "whatsapp", category: "leads", label: "WhatsApp button", status: /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\//i.test(html) ? "pass" : "warn", detail: /wa\.me\/|api\.whatsapp\.com/i.test(html) ? "Found." : "No WhatsApp link.", fix: "Add a WhatsApp chat button: in India it's how most customers prefer to ask." });
  add({ id: "form", category: "leads", label: "Enquiry form", status: /<form[\s>]/i.test(html) ? "pass" : "warn", detail: /<form[\s>]/i.test(html) ? "Found on this page." : "No form on this page.", fix: "Add a short enquiry form (name, phone, what they need)." });
  add({ id: "email", category: "leads", label: "Email link", status: /href=["']mailto:/i.test(html) ? "pass" : "warn", detail: /href=["']mailto:/i.test(html) ? "Found." : "No clickable email address.", fix: "Show a clickable business email address." });

  const ps = await psi;
  if (ps) {
    add({ id: "pagespeed", category: "speed", label: "Google mobile speed score", status: ps.performance >= 90 ? "pass" : ps.performance >= 50 ? "warn" : "fail", detail: `${ps.performance}/100 on Google PageSpeed (mobile)`, fix: ps.performance < 90 ? "Compress images, remove unused scripts and use good hosting to reach 90+." : undefined });
    if (ps.lcpMs !== null) add({ id: "lcp", category: "speed", label: "Main content shows in", status: ps.lcpMs <= 2500 ? "pass" : ps.lcpMs <= 4000 ? "warn" : "fail", detail: `${(ps.lcpMs / 1000).toFixed(1)} s on a phone (Largest Contentful Paint)`, fix: ps.lcpMs > 2500 ? "Google wants the main content visible within 2.5 seconds." : undefined });
    if (ps.cls !== null) add({ id: "cls", category: "speed", label: "Layout stays still while loading", status: ps.cls <= 0.1 ? "pass" : ps.cls <= 0.25 ? "warn" : "fail", detail: `Layout shift ${ps.cls.toFixed(2)}`, fix: ps.cls > 0.1 ? "Give images and banners fixed sizes so the page doesn't jump." : undefined });
  }

  const pts = { pass: 1, warn: 0.5, fail: 0 } as const;
  const categories = (Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => {
    const list = checks.filter((c) => c.category === key);
    return { key, label: CATEGORY_LABELS[key], score: list.length ? Math.round((list.reduce((n, c) => n + pts[c.status], 0) / list.length) * 100) : 100 };
  });
  const weights: Record<CategoryKey, number> = { seo: 0.25, speed: 0.25, mobile: 0.15, security: 0.15, leads: 0.2 };
  const score = Math.round(categories.reduce((n, c) => n + c.score * weights[c.key], 0));

  return {
    url,
    finalUrl,
    checkedAt: new Date().toISOString(),
    score,
    categories,
    checks,
    metrics: { responseMs, htmlKb, status: res.status, title, description, platform },
    pagespeed: ps,
  };
}
