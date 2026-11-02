import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Icon, { ICONS } from "@/components/ui/Icon";
import { SITE_URL } from "@/lib/config";
import { categoryLabel, formatDate, getBlogPostBySlug, getBlogSlugs, getRelatedPosts, splitList } from "@/lib/content";
import { decodeEntities } from "@/lib/html";
import { buildMetadata, customSchema, postSeoDefaults, resolveSeo } from "@/lib/seo";
import "../blog.css";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { mediaUrl } from "@/lib/media";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getBlogSlugs()).map((slug) => ({ slug }));
}

/** Built-in SEO for a post; anything saved in Admin → SEO → Blog posts overrides it. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostBySlug((await params).slug);
  if (!post) return {};
  return buildMetadata("post", String(post.id), postSeoDefaults(post));
}

/** Gives every <h2> in the post an id (section0, section1, …) and returns the TOC labels. */
function withHeadingIds(html: string): { html: string; toc: string[] } {
  const toc: string[] = [];
  const out = html.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, inner: string) => {
    toc.push(decodeEntities(inner.replace(/<[^>]+>/g, "")).trim());
    return `<h2 id="section${toc.length - 1}">${inner}</h2>`;
  });
  return { html: out, toc };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getBlogPostBySlug((await params).slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post);
  const tags = splitList(post.tags);
  const { html, toc } = withHeadingIds(sanitizeRichHtml(post.content));
  const [seo, extraSchema] = await Promise.all([resolveSeo("post", String(post.id), postSeoDefaults(post)), customSchema("post", String(post.id))]);
  const canonical = seo.canonical;
  const ogImage = seo.image;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: seo.description,
    mainEntityOfPage: canonical,
    url: canonical,
    ...(post.published_at && { datePublished: new Date(post.published_at).toISOString() }),
    ...(post.updated_at && { dateModified: new Date(post.updated_at).toISOString() }),
    author: { "@type": "Person", name: post.author || "Brave Syntax" },
    publisher: {
      "@type": "Organization",
      name: "Brave Syntax",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo-on-light.png` },
    },
    ...(ogImage && { image: ogImage }),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonical },
    ],
  };

  return (
    <div className="pg-blog">
      <JsonLd data={[articleSchema, breadcrumb, ...extraSchema]} />

      {/* ═══ HERO ═══ */}
      <section className="relative pt-28 pb-14 lg:pt-44 lg:pb-28 overflow-hidden bg-white dark:bg-zinc-950">
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors mb-8 group"
          >
            <Icon d="M15 19l-7-7 7-7" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            Back to Blog
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
            <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/25">
              {categoryLabel(post.category)}
            </span>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{formatDate(post.published_at)}</span>
            {post.read_time ? <span className="text-xs text-zinc-400 dark:text-zinc-500">· {post.read_time} min read</span> : null}
            {post.updated_at && <span className="text-xs text-zinc-400 dark:text-zinc-500">· Updated {formatDate(post.updated_at)}</span>}
          </div>

          <h1 className="text-zinc-950 dark:text-zinc-50 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-5 max-w-4xl tracking-tight">
            {post.title}
          </h1>

          {post.excerpt && <p className="text-zinc-600 dark:text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-3xl font-normal">{post.excerpt}</p>}

          <div className="flex items-center gap-3 mt-8">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              {(post.author || "B").charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{post.author}</span>
          </div>
        </div>
      </section>

      {post.featured_image && (
        <section className="bg-white dark:bg-zinc-950 pb-8 sm:pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-zinc-900/60">
              <Image
                src={mediaUrl("blog", post.featured_image)}
                alt={post.title}
                width={1600}
                height={900}
                priority
                sizes="(min-width: 1280px) 1216px, 100vw"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* ═══ ARTICLE + SIDEBAR ═══ */}
      <section className="bg-white dark:bg-zinc-950 pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
            <div className="w-full lg:flex-1 min-w-0">
              {/* Post HTML is written by admins in the blog editor; sanitized before rendering. */}
              <article className="blog-content text-zinc-700 dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: html }} />

              {tags.length > 0 && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 mt-12 pt-8">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-4">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <Link
                        key={t}
                        href={`/blog?tag=${encodeURIComponent(t)}`}
                        className="px-4 py-1.5 text-xs font-medium rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all"
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {related.length > 0 && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 mt-16 pt-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-2">Related Articles</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-zinc-50 mb-8">Continue Reading</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {related.map((rp) => (
                      <Link
                        key={rp.id}
                        href={`/blog/${encodeURIComponent(rp.slug)}`}
                        className="group flex flex-col rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-xl dark:hover:shadow-zinc-900/60 transition-all duration-300"
                      >
                        {rp.featured_image && (
                          <div className="relative aspect-video overflow-hidden">
                            <Image
                              src={mediaUrl("blog", rp.featured_image)}
                              alt={rp.title}
                              fill
                              sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          </div>
                        )}
                        <div className="p-5 flex flex-col flex-1">
                          <h4 className="font-bold text-base leading-snug mb-2 line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            {rp.title}
                          </h4>
                          <p className="text-sm leading-relaxed line-clamp-3 flex-1 text-zinc-500 dark:text-zinc-400">{rp.excerpt}</p>
                          <div className="mt-4 text-xs font-medium text-zinc-400 dark:text-zinc-500">{formatDate(rp.published_at)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-12 rounded-2xl p-8 text-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <p className="text-xl font-bold mb-2 text-zinc-950 dark:text-zinc-50">Enjoyed this article?</p>
                <p className="mb-6 max-w-md mx-auto text-zinc-500 dark:text-zinc-400">
                  Let&apos;s collaborate and turn your ideas into a stellar digital product.
                </p>
                <Link
                  href={`/contact?ref=blog&project=${encodeURIComponent(post.title)}`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  Start a Project
                  <Icon d={ICONS.arrowRight} className="w-4 h-4" strokeWidth={2.5} />
                </Link>
              </div>
            </div>

            {toc.length > 0 && (
              <aside className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-28 order-first lg:order-last">
                <div className="rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <h4 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">On this page</h4>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {toc.map((label, i) => (
                      <li key={i}>
                        <a
                          href={`#section${i}`}
                          className="block py-1.5 pl-3 border-l-2 border-transparent text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/50 dark:hover:border-emerald-400/50 transition-all duration-150"
                        >
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
