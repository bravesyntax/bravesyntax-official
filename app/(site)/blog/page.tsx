import { ArrowRight, Clock, Search, X } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BlogSearch from "@/components/blog/BlogSearch";
import JsonLd from "@/components/JsonLd";
import { container, PageHero, Section } from "@/components/site/ui";
import { BlurFade } from "@/components/velora/blur-fade";
import { HyperText } from "@/components/velora/hyper-text";
import { TiltCard } from "@/components/velora/tilt-card";
import { WavyBackground } from "@/components/velora/wavy-background";
import { SITE_URL } from "@/lib/config";
import { BLOG_LANGS } from "@/lib/blog-lang";
import { categoryLabel, formatDate, getBlogCategories, getBlogListing, hasPostsIn } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { pageMetadata, pageSchema } from "@/lib/seo";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ cat?: string; tag?: string; q?: string; page?: string; lang?: string }> };

// The default listing shows original posts only; ?lang=hi lists every Hindi post (translations included).
const listLang = (v?: string) => (v === "hi" ? "hi" : null);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const base = await pageMetadata("blog");
  if (sp.q || sp.tag) return { ...base, robots: { index: false, follow: true } };
  if (listLang(sp.lang)) {
    const title = "हिंदी लेख: वेबसाइट, SEO और बिज़नेस गाइड | Brave Syntax";
    const description = "Brave Syntax के हिंदी लेख: वेबसाइट, ई-कॉमर्स, SEO और टेक्नोलॉजी को आसान भाषा में समझें।";
    const url = `${SITE_URL}/blog?lang=hi`;
    return { ...base, title: { absolute: title }, description, alternates: { canonical: url }, openGraph: { ...base.openGraph, title, description, url, locale: "hi_IN" }, twitter: { ...base.twitter, title, description } };
  }

  const cat = sp.cat && sp.cat !== "all" ? sp.cat : "";
  const page = Math.max(1, Number(sp.page) || 1);
  if (!cat && page === 1) return base;

  const label = cat ? categoryLabel(cat) : "";
  const pageText = page > 1 ? ` (Page ${page})` : "";
  const title = `${cat ? `${label} Articles` : "Blog"}${pageText} | Brave Syntax`;
  const description = cat ? `Practical ${label} guides for business owners from the Brave Syntax team.${pageText}` : `${base.description}${pageText}`;
  const qs = new URLSearchParams();
  if (cat) qs.set("cat", cat);
  if (page > 1) qs.set("page", String(page));
  const url = `${SITE_URL}/blog?${qs}`;
  return { ...base, title: { absolute: title }, description, alternates: { canonical: url }, openGraph: { ...base.openGraph, title, description, url }, twitter: { ...base.twitter, title, description } };
}

const pagerBtn = "rounded-full border px-4 py-2 text-sm transition-colors hover:bg-muted";

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const cat = sp.cat ?? "all";
  const tag = (sp.tag ?? "").trim();
  const q = (sp.q ?? "").trim().slice(0, 80);
  const lang = listLang(sp.lang);
  const [{ posts, total, totalPages, page, featured }, schema, categories, hasHindi] = await Promise.all([
    getBlogListing({ cat: lang ? "all" : cat, tag, q, page: Number(sp.page) || 1, lang }),
    pageSchema("blog"),
    getBlogCategories(),
    hasPostsIn("hi"),
  ]);
  const filters: [string, string][] = [["all", "All"], ...categories.map((c): [string, string] => [c.slug, c.label])];
  const list = featured ? posts.filter((p) => p.id !== featured.id) : posts;

  const pageHref = (p: number) => {
    const qs = new URLSearchParams({ page: String(p), ...(lang ? { lang } : { cat }) });
    if (tag) qs.set("tag", tag);
    if (q) qs.set("q", q);
    return `/blog?${qs}`;
  };

  return (
    <>
      <JsonLd data={schema} />
      <PageHero eyebrow={<HyperText>The Brave Syntax Blog</HyperText>} title="Practical guides for growing businesses" background={<WavyBackground className="absolute inset-0 -z-10" opacity={0.25} />}>
        Websites, e-commerce, SEO and AI tools, explained without the jargon.
      </PageHero>

      {featured && (
        <section className={`${container} pb-4`} aria-label="Featured article">
          <BlurFade>
            <Link href={`/blog/${encodeURIComponent(featured.slug)}`} className="group grid overflow-hidden rounded-3xl border bg-card md:grid-cols-2">
              <div className="relative aspect-[16/9] bg-muted md:aspect-auto md:min-h-72">
                {featured.featured_image ? (
                  <Image src={mediaUrl("blog", featured.featured_image)} alt={featured.title} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-contain" />
                ) : (
                  <div className="grid h-full place-items-center bg-linear-to-br from-brand-from/15 via-brand-via/5 to-brand-to/15">
                    <Search className="size-14 text-primary/50" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <p className="text-sm font-medium text-primary">Featured · {categoryLabel(featured.category)}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance group-hover:text-primary sm:text-3xl">{featured.title}</h2>
                {featured.excerpt && <p className="mt-3 line-clamp-3 text-muted-foreground">{featured.excerpt}</p>}
                <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Read article <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </p>
              </div>
            </Link>
          </BlurFade>
        </section>
      )}

      <Section label="All articles" className="!pt-10">
        <div className="mb-6">
          <BlogSearch />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map(([k, label]) => (
            <Link
              key={k}
              href={`/blog?cat=${k}`}
              scroll={false}
              aria-current={!lang && cat === k ? "page" : undefined}
              className={cn("rounded-full border px-4 py-1.5 text-sm transition-colors", !lang && cat === k ? "border-transparent bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
            >
              {label}
            </Link>
          ))}
          {hasHindi && (
            <Link
              href="/blog?lang=hi"
              scroll={false}
              lang="hi"
              hrefLang="hi"
              aria-current={lang ? "page" : undefined}
              className={cn("rounded-full border px-4 py-1.5 text-sm transition-colors", lang ? "border-transparent bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
            >
              {BLOG_LANGS.hi.native}
            </Link>
          )}
          {q && (
            <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary">
              Search: {q}
              <Link href="/blog" aria-label="Clear search">
                <X className="size-3.5" aria-hidden="true" />
              </Link>
            </span>
          )}
          {tag && (
            <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary">
              Tag: {tag}
              <Link href="/blog" aria-label="Clear tag filter">
                <X className="size-3.5" aria-hidden="true" />
              </Link>
            </span>
          )}
        </div>

        {list.length === 0 && !featured ? (
          <p className="py-20 text-center text-muted-foreground">No articles found. Try a different search or category.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((bp, i) => (
              <BlurFade key={bp.id} delay={(i % 3) * 0.06} className="h-full">
                <TiltCard maxTilt={3} className="h-full">
                  <Link href={`/blog/${encodeURIComponent(bp.slug)}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      {bp.featured_image ? (
                        <Image src={mediaUrl("blog", bp.featured_image)} alt={bp.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-contain" />
                      ) : (
                        <div className="grid h-full place-items-center bg-linear-to-br from-brand-from/15 via-brand-via/5 to-brand-to/15">
                          <Search className="size-10 text-primary/50" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-medium text-primary">
                        {categoryLabel(bp.category)}
                        {bp.language === "hi" && <span lang="hi" className="ml-2 rounded-full bg-primary/10 px-2 py-0.5">{BLOG_LANGS.hi.native}</span>}
                      </p>
                      <div lang={bp.language === "hi" ? "hi" : undefined}>
                        <h2 className="mt-2 line-clamp-2 font-medium group-hover:text-primary">{bp.title}</h2>
                        {bp.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{bp.excerpt}</p>}
                      </div>
                      <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted-foreground">
                        {formatDate(bp.published_at)}
                        {bp.read_time ? (
                          <>
                            <Clock className="ml-1 size-3" aria-hidden="true" /> {bp.read_time} min
                          </>
                        ) : null}
                      </p>
                    </div>
                  </Link>
                </TiltCard>
              </BlurFade>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-between gap-3" aria-label="Pagination">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · {total} articles
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className={pagerBtn}>
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={pageHref(page + 1)} className={pagerBtn}>
                  Next
                </Link>
              )}
            </div>
          </nav>
        )}
      </Section>
    </>
  );
}
