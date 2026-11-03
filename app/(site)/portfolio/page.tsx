import { ArrowUpRight, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import JsonLd from "@/components/JsonLd";
import PortfolioGrid, { FilteredPortfolioGrid, type PortfolioCard } from "@/components/portfolio/PortfolioGrid";
import { container, CtaLink, RelatedLinks, Section, SectionHeading, ShimmerLink } from "@/components/site/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BlurFade } from "@/components/velora/blur-fade";
import { Marquee3D } from "@/components/velora/3d-marquee";
import { MacbookScroll } from "@/components/velora/macbook-scroll";
import { SITE_URL } from "@/lib/config";
import { getPortfolios, splitList } from "@/lib/content";
import { absoluteMediaUrl, isExternalImage, mediaUrl } from "@/lib/media";
import { pageMetadata, pageSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("portfolio");
}

const FAQS: [string, string][] = [
  ["What kinds of projects does Brave Syntax build?", "Business websites, online stores, web applications, landing pages and brand identities. Our Work includes projects for manufacturing, healthcare, real estate, hospitality and retail."],
  ["Can I see the live websites?", "Yes. Where a project has a public site, its card has a Live site link, so you can test its speed and design for yourself."],
  ["Are all of these client projects?", "Not all. Our Work includes websites for real businesses, plus some demos and practice projects that show a particular skill."],
  ["How do I start a similar project?", "Tell us what you need and share any examples you like. We reply with a written scope and a fixed quote before any work starts."],
];
const FAQ_SCHEMA = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };

export default async function PortfolioPage() {
  const [rows, schema] = await Promise.all([getPortfolios(), pageSchema("portfolio")]);

  const projects: PortfolioCard[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    cat: r.category,
    tags: [...new Set([...splitList(r.tags), ...splitList(r.tech_stack)])],
    desc: r.description,
    year: r.year,
    image: r.image || null,
    liveUrl: r.live_url || null,
    featured: !!r.is_featured,
  }));
  const spotlight = rows.find((r) => r.is_featured && r.image) ?? rows.find((r) => r.image);
  const highlights = spotlight ? [spotlight.metric_1, spotlight.metric_2, spotlight.metric_3].filter(Boolean) : [];
  const technologies = new Set(projects.flatMap((p) => p.tags)).size;
  const live = projects.filter((p) => p.liveUrl).length;
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
      <JsonLd data={[...(collectionSchema ? [...schema.filter((s) => (s as { "@type"?: string })["@type"] !== "CollectionPage"), collectionSchema] : schema), FAQ_SCHEMA]} />

      <section className="relative isolate overflow-hidden border-b" aria-label="Our work">
        <div className={`${container} grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-20`}>
          <div>
            <BlurFade>
              <span className="inline-flex rounded-full border bg-background/60 px-3 py-1 text-sm text-muted-foreground">Selected work · {projects.length} projects</span>
            </BlurFade>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">Work we&apos;re proud of</h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">A selection of websites and online stores we&apos;ve designed and built. Open the live sites and judge the work for yourself.</p>
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {[
                [projects.length, "Projects"],
                [live, "Live sites"],
                [technologies, "Technologies"],
              ].map(([n, label]) => (
                <div key={label}>
                  <dd className="text-3xl font-semibold tracking-tight">{n}</dd>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                </div>
              ))}
            </dl>
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
        <>
          <section className="hidden lg:block" aria-label="Featured project preview">
            <MacbookScroll src={mediaUrl("portfolio", spotlight.image)} alt={`${spotlight.title} website`} title="Featured project" />
          </section>
          <Section label="Featured project">
            <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border bg-muted lg:hidden">
                <Image unoptimized={isExternalImage(spotlight.image)} src={mediaUrl("portfolio", spotlight.image)} alt={`${spotlight.title} website`} fill sizes="100vw" className="object-contain" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Featured project · {spotlight.year}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">{spotlight.title}</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{spotlight.description}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {spotlight.slug && (
                    <Link href={`/portfolio/${spotlight.slug}`} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                      Read the case study <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                  {spotlight.live_url && (
                    <a href={spotlight.live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted">
                      Visit live site <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
              {highlights.length > 0 && (
                <ul className="grid gap-3">
                  {highlights.map((h) => (
                    <li key={h} className="rounded-2xl border bg-card px-5 py-4 font-medium">
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>
        </>
      )}

      <Section muted label="All projects" id="projects">
        <SectionHeading eyebrow="All projects" title="Browse by year or technology" className="mb-8" />
        <Suspense fallback={<PortfolioGrid projects={projects} filter="all" />}>
          <FilteredPortfolioGrid projects={projects} />
        </Suspense>
      </Section>

      <Section label="Frequently asked questions">
        <div className="mx-auto max-w-3xl">
          <SectionHeading center eyebrow="FAQ" title="Questions about our work" />
          <Accordion type="single" collapsible className="mt-10">
            {FAQS.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="mt-12 rounded-3xl border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">Want something like this for your business?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Tell us what you need. You&apos;ll get a written scope and a fixed quote before any work starts.</p>
          <div className="mt-6 flex justify-center">
            <ShimmerLink href="/contact">Start a project</ShimmerLink>
          </div>
        </div>
      </Section>

      <RelatedLinks
        title="Explore"
        links={[
          ["Our services", "/services"],
          ["Industries we serve", "/industries"],
          ["About us", "/about"],
          ["Free tools", "/tools"],
        ]}
      />
    </>
  );
}
