import "server-only";
import { cache } from "react";
import { sql } from "./db";

// Queries for portfolio, blog and careers (ported from pages/*.php).

export const splitList = (s: string | null | undefined, sep = ",") =>
  (s ?? "")
    .split(sep)
    .map((t) => t.trim())
    .filter(Boolean);

/** "16 Jun 2026" — matches PHP date('d M Y'). Dates are stored without a timezone, so format as-is (UTC). */
export function formatDate(d: Date | string | null | undefined, withYear = true): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "artificial-intelligence" → "Artificial Intelligence", for category slugs shown to visitors. */
export const categoryLabel = (slug: string) => (slug === "seo" ? "SEO" : slug.split("-").map(capitalize).join(" "));

// ── Portfolio ─────────────────────────────────────────────────

export type Portfolio = {
  id: number;
  title: string;
  slug: string | null;
  category: string;
  tags: string | null;
  description: string | null;
  metric_1: string | null;
  metric_2: string | null;
  metric_3: string | null;
  year: number | null;
  image: string | null;
  live_url: string | null;
  client_name: string | null;
  challenge: string | null;
  approach: string | null;
  results_detail: string | null;
  tech_stack: string | null;
};

export async function getPortfolios(): Promise<Portfolio[]> {
  try {
    return (await sql`
      SELECT * FROM portfolios WHERE is_active = 1 ORDER BY sort_order ASC, year DESC, id DESC
    `) as Portfolio[];
  } catch (err) {
    console.error("[getPortfolios]", err);
    return [];
  }
}

export const getPortfolioBySlug = cache(async (slug: string): Promise<Portfolio | null> => {
  const rows = (await sql`SELECT * FROM portfolios WHERE slug = ${slug} AND is_active = 1 LIMIT 1`) as Portfolio[];
  return rows[0] ?? null;
});

export async function getPortfolioSlugs(): Promise<string[]> {
  try {
    const rows = (await sql`SELECT slug FROM portfolios WHERE is_active = 1 AND slug IS NOT NULL AND slug <> ''`) as { slug: string }[];
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}

// ── Blog ──────────────────────────────────────────────────────

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string | null;
  featured_image: string | null;
  author: string;
  read_time: number | null;
  is_featured: number;
  meta_title: string | null;
  meta_description: string | null;
  published_at: Date | null;
  updated_at: Date | null;
};

export const BLOG_PER_PAGE = 9;

/** Categories that have published posts, most used first: the blog's filter tabs, so none can be empty. */
export async function getBlogCategories(): Promise<{ slug: string; label: string }[]> {
  try {
    const rows = (await sql`
      SELECT category AS slug, COUNT(*)::int AS n FROM blog_posts
      WHERE is_published = 1 AND COALESCE(category, '') <> ''
      GROUP BY category ORDER BY n DESC, category ASC
    `) as { slug: string }[];
    return rows.map((r) => ({ slug: r.slug, label: categoryLabel(r.slug) }));
  } catch (err) {
    console.error("[getBlogCategories]", err);
    return [];
  }
}

export async function getBlogListing({ cat, tag, page }: { cat: string; tag: string; page: number }) {
  const catFilter = cat !== "all" && /^[a-z0-9-]{1,50}$/.test(cat) ? cat : null;
  const tagLike = tag ? `%${tag}%` : null;
  try {
    // MySQL's LIKE was case-insensitive under its collation, so ILIKE keeps the same matching.
    const [{ total }] = (await sql`
      SELECT COUNT(*)::int AS total FROM blog_posts
      WHERE is_published = 1
        AND (${catFilter}::text IS NULL OR category = ${catFilter})
        AND (${tagLike}::text IS NULL OR tags ILIKE ${tagLike})
    `) as { total: number }[];

    const totalPages = Math.max(1, Math.ceil(total / BLOG_PER_PAGE));
    const current = Math.min(Math.max(1, page), totalPages);
    const offset = (current - 1) * BLOG_PER_PAGE;

    const posts = (await sql`
      SELECT * FROM blog_posts
      WHERE is_published = 1
        AND (${catFilter}::text IS NULL OR category = ${catFilter})
        AND (${tagLike}::text IS NULL OR tags ILIKE ${tagLike})
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT ${BLOG_PER_PAGE} OFFSET ${offset}
    `) as BlogPost[];

    let featured: BlogPost | null = null;
    if (current === 1 && !catFilter && !tag) {
      const rows = (await sql`
        SELECT * FROM blog_posts WHERE is_published = 1 AND is_featured = 1 ORDER BY published_at DESC NULLS LAST LIMIT 1
      `) as BlogPost[];
      featured = rows[0] ?? null;
    }

    return { posts, total, totalPages, page: current, featured };
  } catch (err) {
    console.error("[getBlogListing]", err);
    return { posts: [] as BlogPost[], total: 0, totalPages: 1, page: 1, featured: null };
  }
}

export const getBlogPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const rows = (await sql`SELECT * FROM blog_posts WHERE slug = ${slug} AND is_published = 1 LIMIT 1`) as BlogPost[];
  return rows[0] ?? null;
});

export async function getBlogSlugs(): Promise<string[]> {
  try {
    const rows = (await sql`SELECT slug FROM blog_posts WHERE is_published = 1`) as { slug: string }[];
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}

export async function getRelatedPosts(post: BlogPost) {
  const firstTag = (post.tags ?? "").split(",")[0];
  try {
    return (await sql`
      SELECT id, title, slug, excerpt, featured_image, published_at FROM blog_posts
      WHERE is_published = 1 AND id <> ${post.id}
        AND (category = ${post.category} OR tags ILIKE ${`%${firstTag}%`})
      ORDER BY published_at DESC NULLS LAST LIMIT 3
    `) as Pick<BlogPost, "id" | "title" | "slug" | "excerpt" | "featured_image" | "published_at">[];
  } catch (err) {
    console.error("[getRelatedPosts]", err);
    return [];
  }
}

/** Newest published posts (home page). */
export async function getLatestPosts(limit = 3): Promise<BlogPost[]> {
  try {
    return (await sql`
      SELECT * FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT ${limit}
    `) as BlogPost[];
  } catch (err) {
    console.error("[getLatestPosts]", err);
    return [];
  }
}

// ── Careers ───────────────────────────────────────────────────

export type CareerJob = {
  id: number;
  title: string;
  slug: string;
  type: string;
  department: string;
  location: string;
  description: string;
  requirements: string | null;
  skills: string | null;
  experience: string | null;
  salary_range: string | null;
  is_featured: number;
  deadline: Date | null;
};

export async function getActiveJobs(): Promise<CareerJob[]> {
  try {
    return (await sql`
      SELECT * FROM career_jobs WHERE is_active = 1 ORDER BY is_featured DESC, sort_order ASC, created_at DESC
    `) as CareerJob[];
  } catch (err) {
    console.error("[getActiveJobs]", err);
    return [];
  }
}
