import "server-only";
import { SITE_URL } from "@/lib/config";
import { rows, sql } from "@/lib/db";
import { LOCATION_INDEXABLE_CITY_LIMIT, SERVICE_PAGE_CITIES } from "@/lib/locations";
import {
  applySeo, fillLocationTemplates, getSeoSettings, pageDefaults, postSeoDefaults, projectSeoDefaults, serviceSeoDefaults,
  type ResolvedSeo, type SeoDefaults, type SeoEntity, type SeoRecord, type SeoSettings,
} from "@/lib/seo";
import { DESCRIPTION_RANGE, SEO_PAGES, TITLE_RANGE } from "@/lib/seo-pages";

// Everything the admin SEO module shows: every public URL with its resolved SEO and the problems found.
// All URLs are resolved in memory from one read of seo_meta, so the overview stays a handful of queries.

export type IssueCode =
  | "title_short" | "title_long" | "title_duplicate"
  | "desc_short" | "desc_long" | "desc_duplicate"
  | "noindex" | "no_image" | "keyword_missing" | "keyword_unset" | "canonical_elsewhere";

export type Severity = "error" | "warning" | "notice";

export const ISSUES: Record<IssueCode, { severity: Severity; label: string; help: string }> = {
  title_duplicate: { severity: "error", label: "Duplicate title", help: "Two URLs share a title, so Google has to guess which one to rank." },
  desc_duplicate: { severity: "error", label: "Duplicate description", help: "Several URLs share a meta description. Each page needs its own." },
  noindex: { severity: "error", label: "Hidden from search (noindex)", help: "Set to noindex in the SEO editor; this URL won't appear in Google." },
  title_long: { severity: "warning", label: "Title too long", help: `Over ${TITLE_RANGE[1]} characters; Google will cut it off in results.` },
  title_short: { severity: "warning", label: "Title too short", help: `Under ${TITLE_RANGE[0]} characters; there's room for a keyword or benefit.` },
  desc_long: { severity: "warning", label: "Description too long", help: `Over ${DESCRIPTION_RANGE[1]} characters; it will be truncated.` },
  desc_short: { severity: "warning", label: "Description too short", help: `Under ${DESCRIPTION_RANGE[0]} characters; Google may write its own snippet.` },
  keyword_missing: { severity: "warning", label: "Focus keyword not in title", help: "The focus keyword you set doesn't appear in the title." },
  no_image: { severity: "notice", label: "No social image", help: "Links shared on WhatsApp, LinkedIn or X show no preview image." },
  keyword_unset: { severity: "notice", label: "No focus keyword", help: "Set a focus keyword so the editor can check your title and description against it." },
  canonical_elsewhere: { severity: "notice", label: "Canonical points elsewhere", help: "This URL tells Google another URL is the main version, so it's left out of the sitemap." },
};

const WEIGHT: Record<Severity, number> = { error: 10, warning: 4, notice: 1 };

export type SeoTarget = {
  type: SeoEntity;
  key: string;
  label: string;
  /** Secondary text in lists: path, category, state… */
  meta: string;
  path: string;
  defaults: SeoDefaults;
  record: SeoRecord | null;
  seo: ResolvedSeo;
  /** Kept out of search by the site itself (location pages outside the indexable tier, drafts). */
  forcedNoindex: string | null;
  issues: IssueCode[];
};

export const TYPE_LABEL: Record<SeoEntity, string> = { page: "Page", post: "Blog post", project: "Case study", location: "Location page" };
export const TYPE_PLURAL: Record<SeoEntity, string> = { page: "Pages", post: "Blog posts", project: "Case studies", location: "Location pages" };
export const TYPE_ROUTE: Record<SeoEntity, string> = { page: "pages", post: "posts", project: "portfolio", location: "locations" };

export const editHref = (type: SeoEntity, key: string) => `/admin/seo/edit?type=${type}&key=${encodeURIComponent(key)}`;

type Post = { id: number; title: string; slug: string; excerpt: string | null; featured_image: string | null; is_published: number; published_at: Date | null; updated_at: Date | null; category: string | null };
type Project = { id: number; title: string; slug: string | null; description: string | null; category: string | null; image: string | null; is_active: number };
type City = { slug: string; name: string; state: string };
type Service = { slug: string; label: string; keyword: string };

async function loadRaw() {
  const [records, settings, posts, projects, cities, services, serviceRows] = await Promise.all([
    rows<SeoRecord & { entity_type: SeoEntity; entity_key: string }>(sql`
      SELECT entity_type, entity_key, title, description, focus_keyword, og_image, canonical_url, noindex, schema_json, updated_at FROM seo_meta
    `),
    getSeoSettings(),
    rows<Post>(sql`
      SELECT id, title, slug, excerpt, featured_image, is_published, published_at, updated_at, category FROM blog_posts ORDER BY published_at DESC NULLS LAST, id DESC
    `),
    rows<Project>(sql`SELECT id, title, slug, description, category, image, is_active FROM portfolios ORDER BY sort_order ASC, id DESC`),
    rows<City>(sql`SELECT slug, name, state FROM location_cities WHERE is_active = 1 ORDER BY sort_order ASC, name ASC`),
    rows<Service>(sql`SELECT slug, label, keyword FROM location_services WHERE is_active = 1 AND slug <> '' ORDER BY sort_order ASC`),
    rows<{ title: string; slug: string; tagline: string; description: string }>(sql`
      SELECT title, slug, COALESCE(tagline, '') AS tagline, COALESCE(description, '') AS description FROM services WHERE is_active = 1 AND COALESCE(slug, '') <> '' ORDER BY sort_order ASC
    `),
  ]);
  return { records, settings, posts, projects, cities, services, serviceRows };
}

function build(raw: Awaited<ReturnType<typeof loadRaw>>): SeoTarget[] {
  const recordOf = new Map(raw.records.map((r) => [`${r.entity_type}:${r.entity_key}`, r]));
  const out: SeoTarget[] = [];
  const push = (type: SeoEntity, key: string, label: string, meta: string, defaults: SeoDefaults, forcedNoindex: string | null = null) => {
    const record = recordOf.get(`${type}:${key}`) ?? null;
    out.push({ type, key, label, meta, path: defaults.path, defaults, record, seo: applySeo(record, raw.settings, defaults), forcedNoindex, issues: [] });
  };

  for (const p of SEO_PAGES) push("page", p.slug, p.label, p.path, pageDefaults(p.slug));
  for (const s of raw.serviceRows) push("page", `services/${s.slug}`, s.title, `/services/${s.slug}`, serviceSeoDefaults(s));
  for (const p of raw.posts) push("post", String(p.id), p.title, p.category ?? "", postSeoDefaults(p), p.is_published ? null : "Draft");
  for (const p of raw.projects) {
    if (!p.slug) continue; // no public URL
    push("project", String(p.id), p.title, p.category ?? "", projectSeoDefaults(p), p.is_active ? null : "Hidden");
  }
  raw.cities.forEach((c, rank) => {
    const tier = rank < LOCATION_INDEXABLE_CITY_LIMIT ? null : `Outside top ${LOCATION_INDEXABLE_CITY_LIMIT} cities`;
    push("location", c.slug, c.name, c.state, { ...fillLocationTemplates(raw.settings, { city: c.name, state: c.state }), path: `/${c.slug}` }, tier);
    for (const s of raw.services) {
      const d = fillLocationTemplates(raw.settings, { city: c.name, state: c.state, service: s });
      push("location", `${c.slug}/${s.slug}`, `${s.label} in ${c.name}`, c.state, { ...d, path: `/${c.slug}/${s.slug}` }, tier ?? (SERVICE_PAGE_CITIES.includes(c.slug) ? null : "Service page outside the priority cities"));
    }
  });

  // Issues. Only URLs that can be indexed take part in the duplicate checks.
  const live = out.filter((t) => !t.forcedNoindex && !t.seo.noindex);
  const count = (pick: (t: SeoTarget) => string) => {
    const m = new Map<string, number>();
    live.forEach((t) => m.set(pick(t).toLowerCase(), (m.get(pick(t).toLowerCase()) ?? 0) + 1));
    return m;
  };
  const titles = count((t) => t.seo.title);
  const descs = count((t) => t.seo.description);

  for (const t of out) {
    if (t.forcedNoindex) continue;
    const { title, description, noindex, image, focusKeyword, canonical } = t.seo;
    const i = t.issues;
    if (noindex) i.push("noindex");
    if (title.length > TITLE_RANGE[1]) i.push("title_long");
    else if (title.length < TITLE_RANGE[0]) i.push("title_short");
    if (description.length > DESCRIPTION_RANGE[1]) i.push("desc_long");
    else if (description.length < DESCRIPTION_RANGE[0]) i.push("desc_short");
    if (!noindex && (titles.get(title.toLowerCase()) ?? 0) > 1) i.push("title_duplicate");
    if (!noindex && (descs.get(description.toLowerCase()) ?? 0) > 1) i.push("desc_duplicate");
    if (!image) i.push("no_image");
    if (focusKeyword && !title.toLowerCase().includes(focusKeyword.toLowerCase())) i.push("keyword_missing");
    if (!focusKeyword && t.type !== "location") i.push("keyword_unset");
    if (canonical.replace(/\/$/, "") !== ownUrl(t.path)) i.push("canonical_elsewhere");
  }
  return out;
}

const ownUrl = (path: string) => (path === "/" ? SITE_URL : `${SITE_URL}${path}`).replace(/\/$/, "");

export async function loadSeoTargets(type?: SeoEntity): Promise<{ targets: SeoTarget[]; settings: SeoSettings }> {
  const raw = await loadRaw();
  const all = build(raw);
  return { targets: type ? all.filter((t) => t.type === type) : all, settings: raw.settings };
}

/** Everything about one URL for the editor (duplicate checks still see the whole site). */
export async function loadSeoTarget(type: SeoEntity, key: string) {
  const { targets, settings } = await loadSeoTargets();
  const target = targets.find((t) => t.type === type && t.key === key) ?? null;
  return { target, settings, all: targets };
}

/** 0–100 health score: 100 minus the weighted share of issues across indexable URLs. */
export function healthScore(targets: SeoTarget[]): number {
  const checked = targets.filter((t) => !t.forcedNoindex);
  if (!checked.length) return 100;
  const penalty = checked.reduce((sum, t) => sum + t.issues.reduce((s, c) => s + WEIGHT[ISSUES[c].severity], 0), 0);
  // A URL with one error per page averages ~10 penalty points; scale so that is a score around 50.
  return Math.max(0, Math.round(100 - (penalty / checked.length) * 5));
}

export function worstSeverity(issues: IssueCode[]): Severity | null {
  if (issues.some((c) => ISSUES[c].severity === "error")) return "error";
  if (issues.some((c) => ISSUES[c].severity === "warning")) return "warning";
  if (issues.length) return "notice";
  return null;
}
