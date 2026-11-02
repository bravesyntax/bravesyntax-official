import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { container, Section, SectionHeading, ShimmerLink } from "@/components/site/ui";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { BlurFade } from "@/components/velora/blur-fade";
import { BorderBeam } from "@/components/velora/border-beam";
import { TracingBeam } from "@/components/velora/tracing-beam";
import { SITE_URL } from "@/lib/config";
import { categoryLabel, formatDate, getBlogPostBySlug, getBlogSlugs, getRelatedPosts, splitList } from "@/lib/content";
import { decodeEntities } from "@/lib/html";
import { buildMetadata, customSchema, postSeoDefaults, resolveSeo } from "@/lib/seo";
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
    <>
      <JsonLd data={[articleSchema, breadcrumb, ...extraSchema]} />

      <section className="relative isolate overflow-hidden">
        <AuroraBackground intensity="subtle" />
        <div className={`${container} max-w-4xl py-16 lg:py-20`}>
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to blog
          </Link>
          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">{categoryLabel(post.category)}</span>
            <span>{formatDate(post.published_at)}</span>
            {post.read_time ? <span>· {post.read_time} min read</span> : null}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="mt-5 text-lg text-pretty text-muted-foreground">{post.excerpt}</p>}
          <div className="mt-6 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary" aria-hidden="true">
              {(post.author || "B").charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-medium">{post.author}</span>
          </div>
        </div>
      </section>

      {post.featured_image && (
        <div className={`${container} max-w-5xl`}>
          <BlurFade>
            <Image src={mediaUrl("blog", post.featured_image)} alt={post.title} width={1600} height={900} priority sizes="(min-width: 1024px) 1024px, 100vw" className="w-full rounded-3xl border" />
          </BlurFade>
        </div>
      )}

      <section className={`${container} py-14`}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0">
            <TracingBeam>
              {/* Post HTML is written by admins in the blog editor; sanitized before rendering. */}
              <article className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />
            </TracingBeam>

            {tags.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t pt-6">
                {tags.map((t) => (
                  <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    {t}
                  </Link>
                ))}
              </div>
            )}

            <div className="relative mt-10 overflow-hidden rounded-3xl border bg-card p-8">
              <BorderBeam />
              <h2 className="text-xl font-semibold tracking-tight">Need help with this?</h2>
              <p className="mt-2 text-muted-foreground">Tell us about your project and we&apos;ll send a clear plan and a fixed quote.</p>
              <ShimmerLink href="/contact" className="mt-5">
                Start a project
              </ShimmerLink>
            </div>
          </div>

          {toc.length > 0 && (
            <aside className="hidden lg:block">
              <nav aria-label="On this page" className="sticky top-24 rounded-2xl border bg-card p-5">
                <h2 className="text-sm font-medium">On this page</h2>
                <ul className="mt-3 max-h-[70vh] space-y-2 overflow-y-auto">
                  {toc.map((label, i) => (
                    <li key={i}>
                      <a href={`#section${i}`} className="block text-sm leading-snug text-muted-foreground transition-colors hover:text-primary">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <Section muted label="Related articles">
          <SectionHeading eyebrow="Keep reading" title="Related articles" />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {related.map((rp) => (
              <Link key={rp.id} href={`/blog/${encodeURIComponent(rp.slug)}`} className="group flex flex-col overflow-hidden rounded-2xl border bg-card">
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  {rp.featured_image && <Image src={mediaUrl("blog", rp.featured_image)} alt={rp.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-2 font-medium group-hover:text-primary">{rp.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(rp.published_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
