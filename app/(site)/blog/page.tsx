import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Icon from "@/components/ui/Icon";
import { categoryLabel, formatDate, getBlogCategories, getBlogListing } from "@/lib/content";
import { pageMetadata, pageSchema } from "@/lib/seo";
import "./blog.css";
import { mediaUrl } from "@/lib/media";

type Props = { searchParams: Promise<{ cat?: string; tag?: string; page?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("blog");
}

const pagerBtn =
  "px-5 py-2.5 rounded-xl text-sm font-medium transition-all border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 hover:shadow-sm";

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const cat = sp.cat ?? "all";
  const tag = (sp.tag ?? "").trim();
  const [{ posts, total, totalPages, page, featured }, schema, categories] = await Promise.all([
    getBlogListing({ cat, tag, page: Number(sp.page) || 1 }),
    pageSchema("blog"),
    getBlogCategories(),
  ]);
  const filters: [string, string][] = [["all", "All"], ...categories.map((c): [string, string] => [c.slug, c.label])];

  const pageHref = (p: number) => {
    const q = new URLSearchParams({ page: String(p), cat });
    if (tag) q.set("tag", tag);
    return `/blog?${q}`;
  };

  return (
    <div className="pg-blog">
      <JsonLd data={schema} />

      {/* ═══ HERO ═══ */}
      <section className="relative pt-28 pb-16 lg:pt-44 lg:pb-32 overflow-hidden bg-white dark:bg-zinc-950">
        <div className="dot-grid absolute inset-0 opacity-30 dark:opacity-100" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Insights · Tutorials · Industry Tips</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-none mb-6 tracking-tight text-zinc-950 dark:text-zinc-50">
            The Brave
            <br />
            <span className="text-emerald-500">Syntax Blog</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-normal text-zinc-500 dark:text-zinc-400">
            Practical insights on web development, design, branding, and growing your business online.
          </p>
        </div>
      </section>

      {/* ═══ FEATURED POST ═══ */}
      {featured && (
        <section className="bg-white dark:bg-zinc-950 pb-12 sm:pb-16 -mt-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href={`/blog/${encodeURIComponent(featured.slug)}`}
              className="group block rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-2xl dark:hover:shadow-zinc-900/80 transition-all duration-500"
            >
              <div className="grid lg:grid-cols-2">
                {featured.featured_image && (
                  <div className="relative aspect-video lg:aspect-auto overflow-hidden">
                    <Image
                      src={mediaUrl("blog", featured.featured_image)}
                      alt={featured.title}
                      fill
                      sizes="(min-width: 1024px) 640px, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-8 sm:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/25">
                      Featured
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {categoryLabel(featured.category)}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl xl:text-4xl font-bold leading-tight mb-4 text-zinc-950 dark:text-zinc-50 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-base leading-relaxed mb-6 line-clamp-3 text-zinc-500 dark:text-zinc-400">{featured.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-400 dark:text-zinc-500">
                    <span className="text-zinc-700 dark:text-zinc-300">{featured.author}</span>
                    <span>·</span>
                    <span>{formatDate(featured.published_at)}</span>
                    {featured.read_time ? <span>· {featured.read_time} min read</span> : null}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ═══ FILTER + GRID ═══ */}
      <section className="bg-white dark:bg-zinc-950 pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 mb-10 sm:mb-12">
            {filters.map(([k, label]) => (
              <Link
                key={k}
                href={`/blog?cat=${k}`}
                scroll={false}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                  cat === k
                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-105"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
                }`}
              >
                {label}
              </Link>
            ))}

            {tag && (
              <span className="ml-2 px-4 py-2 text-xs font-semibold rounded-full flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/25">
                Tag: {tag}
                <Link href="/blog" className="hover:text-red-500 transition-colors" aria-label="Clear tag filter">
                  &times;
                </Link>
              </span>
            )}

            <span className="ml-auto text-sm font-medium text-zinc-400 dark:text-zinc-500">{total} articles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {posts.map((bp, i) => (
              <Link
                key={bp.id}
                href={`/blog/${encodeURIComponent(bp.slug)}`}
                className="anim-card group flex flex-col rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-xl dark:hover:shadow-zinc-900/60 hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {bp.featured_image ? (
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={mediaUrl("blog", bp.featured_image)}
                      alt={bp.title}
                      fill
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                    <Icon
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      className="w-12 h-12 text-zinc-300 dark:text-zinc-600"
                      strokeWidth={1.2}
                    />
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {categoryLabel(bp.category)}
                    </span>
                    {bp.read_time ? <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{bp.read_time} min</span> : null}
                  </div>

                  <h3 className="text-base font-bold leading-snug mb-2 line-clamp-2 flex-1 text-zinc-950 dark:text-zinc-50 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    {bp.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-4 line-clamp-3 text-zinc-500 dark:text-zinc-400">{bp.excerpt}</p>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex items-center justify-between mt-auto">
                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{formatDate(bp.published_at)}</span>
                    <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Read <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-24">
              <p className="text-lg text-zinc-400 dark:text-zinc-500">No posts found.</p>
              <Link href="/blog" className="mt-3 inline-block text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
                View all articles →
              </Link>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-16">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className={pagerBtn}>
                  ← Prev
                </Link>
              )}
              <span className="px-5 py-2.5 text-sm font-bold rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/25">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={pageHref(page + 1)} className={pagerBtn}>
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
