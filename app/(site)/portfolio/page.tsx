import type { Metadata } from "next";
import { Suspense } from "react";
import JsonLd from "@/components/JsonLd";
import PortfolioGrid, { FilteredPortfolioGrid, type PortfolioCard } from "@/components/portfolio/PortfolioGrid";
import { container, CtaLink, Section, ShimmerLink } from "@/components/site/ui";
import { BlurFade } from "@/components/velora/blur-fade";
import { Marquee3D } from "@/components/velora/3d-marquee";
import { MacbookScroll } from "@/components/velora/macbook-scroll";
import { SITE_URL } from "@/lib/config";
import { getPortfolios, splitList } from "@/lib/content";
import { absoluteMediaUrl, mediaUrl } from "@/lib/media";
import { pageMetadata, pageSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("portfolio");
}

export default async function PortfolioPage() {
  const [rows, schema] = await Promise.all([getPortfolios(), pageSchema("portfolio")]);

  const projects: PortfolioCard[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    cat: r.category,
    tags: splitList(r.tags),
    desc: r.description,
    year: r.year,
    image: r.image || null,
    liveUrl: r.live_url || null,
  }));
  const spotlight = projects.find((p) => p.image);
  const images = projects.filter((p) => p.image).map((p) => ({ src: mediaUrl("portfolio", p.image!), alt: "" }));

  // CollectionPage + ItemList structured data linking each project to its live URL and image.
  const collectionSchema = projects.length
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Portfolio — Brave Syntax",
        url: `${SITE_URL}/portfolio`,
        about: "Web design, web development and branding projects delivered by Brave Syntax.",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: projects.length,
          itemListElement: projects.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "CreativeWork",
              name: p.title,
              url: p.liveUrl || `${SITE_URL}/portfolio`,
              ...(p.image && { image: absoluteMediaUrl("portfolio", p.image, SITE_URL) }),
              ...(p.desc && { description: p.desc }),
              ...(p.year && { dateCreated: String(p.year) }),
              ...(p.tags.length && { keywords: p.tags.join(", ") }),
            },
          })),
        },
      }
    : null;

  return (
    <>
      <JsonLd data={collectionSchema ? [...schema.filter((s) => (s as { "@type"?: string })["@type"] !== "CollectionPage"), collectionSchema] : schema} />

      <section className="relative isolate overflow-hidden border-b" aria-label="Our work">
        <div className={`${container} grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-20`}>
          <div>
            <BlurFade>
              <span className="inline-flex rounded-full border bg-background/60 px-3 py-1 text-sm text-muted-foreground">Selected work · {projects.length} projects</span>
            </BlurFade>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">Work we&apos;re proud of</h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">A selection of websites and online stores we&apos;ve designed and built. Each one links to the live site, so you can judge the work for yourself.</p>
            <BlurFade delay={0.2}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ShimmerLink href="/contact">Start a project</ShimmerLink>
                <CtaLink href="/services" variant="outline">
                  Our services
                </CtaLink>
              </div>
            </BlurFade>
          </div>
          {images.length > 3 && (
            <div className="hidden h-[26rem] overflow-hidden rounded-3xl border lg:block" aria-hidden="true">
              <Marquee3D images={images} columns={3} className="size-full" />
            </div>
          )}
        </div>
      </section>

      {spotlight?.image && (
        <section className="hidden overflow-hidden lg:block" aria-label="Project spotlight">
          <MacbookScroll src={mediaUrl("portfolio", spotlight.image)} alt={`${spotlight.title} website`} title={spotlight.title} />
        </section>
      )}

      <Section label="All projects">
        <Suspense fallback={<PortfolioGrid projects={projects} filter="all" />}>
          <FilteredPortfolioGrid projects={projects} />
        </Suspense>
      </Section>
    </>
  );
}
