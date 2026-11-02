import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { container, CtaLink, Section, SectionHeading, ShimmerLink } from "@/components/site/ui";
import { AuroraBackground } from "@/components/velora/aurora-background";
import { BlurFade } from "@/components/velora/blur-fade";
import { BrowserMockup } from "@/components/velora/browser-mockup";
import { ContainerScroll } from "@/components/velora/container-scroll";
import { FocusCards } from "@/components/velora/focus-cards";
import { Lens } from "@/components/velora/lens";
import { SITE_URL } from "@/lib/config";
import { capitalize, getPortfolioBySlug, getPortfolios, getPortfolioSlugs, splitList } from "@/lib/content";
import { absoluteMediaUrl, mediaUrl } from "@/lib/media";
import { buildMetadata, customSchema, projectSeoDefaults, resolveSeo } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPortfolioSlugs()).map((slug) => ({ slug }));
}

/** Built-in SEO for a project; anything saved in Admin → SEO → Case studies overrides it. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getPortfolioBySlug((await params).slug);
  if (!project) return {};
  return buildMetadata("project", String(project.id), projectSeoDefaults(project));
}

export default async function CaseStudyPage({ params }: Props) {
  const project = await getPortfolioBySlug((await params).slug);
  if (!project) notFound();

  const tags = splitList(project.tags);
  const stack = splitList(project.tech_stack);
  const metrics = [project.metric_1, project.metric_2, project.metric_3].filter((m): m is string => !!m);
  const [seo, extraSchema, all] = await Promise.all([resolveSeo("project", String(project.id), projectSeoDefaults(project)), customSchema("project", String(project.id)), getPortfolios()]);
  const url = seo.canonical;
  const next = all.filter((p) => p.slug && p.id !== project.id);
  const nextProject = next[(next.findIndex((p) => p.id > project.id) + next.length) % next.length] ?? null;
  const more = next.filter((p) => p.image).slice(0, 3);
  const host = project.live_url ? project.live_url.replace(/^https?:\/\//, "").replace(/\/$/, "") : url.replace(/^https?:\/\//, "");
  const sections: [string, string | null][] = [
    ["The challenge", project.challenge],
    ["Our approach", project.approach],
    ["The outcome", project.results_detail],
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: seo.description,
    url,
    ...(project.image && { image: absoluteMediaUrl("portfolio", project.image, SITE_URL) }),
    ...(project.year && { dateCreated: String(project.year) }),
    ...(tags.length && { keywords: tags.join(", ") }),
    ...(project.live_url && { mainEntityOfPage: project.live_url }),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Portfolio", item: `${SITE_URL}/portfolio` },
      { "@type": "ListItem", position: 3, name: project.title, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={[schema, breadcrumbs, ...extraSchema]} />

      <section className="relative isolate overflow-hidden">
        <AuroraBackground intensity="subtle" />
        {project.image ? (
          <ContainerScroll
            header={
              <div className="mx-auto max-w-3xl px-5 text-center">
                <Link href="/portfolio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="size-4" aria-hidden="true" /> All projects
                </Link>
                <p className="mt-5 text-sm font-medium text-primary">
                  {capitalize(project.category)}
                  {project.year ? ` · ${project.year}` : ""}
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{project.title}</h1>
              </div>
            }
          >
            <BrowserMockup url={host} className="size-full">
              <Lens zoomFactor={1.6} className="relative aspect-[16/10] w-full bg-muted">
                <Image src={mediaUrl("portfolio", project.image)} alt={`${project.title} website`} fill priority sizes="(min-width: 1024px) 1000px, 100vw" className="object-cover object-top" />
              </Lens>
            </BrowserMockup>
          </ContainerScroll>
        ) : (
          <div className={`${container} py-20 text-center`}>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{project.title}</h1>
          </div>
        )}
      </section>

      <Section label="About the project" className="!pt-8">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <BlurFade className="space-y-8">
            {project.description && <p className="text-lg leading-relaxed text-muted-foreground">{project.description}</p>}
            {sections
              .filter(([, text]) => text)
              .map(([title, text]) => (
                <div key={title}>
                  <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                  <p className="mt-3 leading-relaxed whitespace-pre-line text-muted-foreground">{text}</p>
                </div>
              ))}
          </BlurFade>
          <BlurFade delay={0.1}>
            <aside className="space-y-6 rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
              {project.client_name && (
                <div>
                  <h2 className="text-sm font-medium">Client</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{project.client_name}</p>
                </div>
              )}
              {metrics.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium">Highlights</h2>
                  <ul className="mt-2 space-y-2">
                    {metrics.map((m) => (
                      <li key={m} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(stack.length > 0 || tags.length > 0) && (
                <div>
                  <h2 className="text-sm font-medium">{stack.length ? "Built with" : "Tags"}</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(stack.length ? stack : tags).map((t) => (
                      <span key={t} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {project.live_url && (
                <CtaLink href={project.live_url} variant="outline" arrow={false} className="w-full">
                  Visit live site <ExternalLink className="size-4" aria-hidden="true" />
                </CtaLink>
              )}
            </aside>
          </BlurFade>
        </div>
      </Section>

      {more.length > 0 && (
        <Section label="More projects">
          <SectionHeading eyebrow="More work" title="Other projects" />
          <FocusCards className="mt-8" cards={more.map((p) => ({ title: p.title, src: mediaUrl("portfolio", p.image!), href: `/portfolio/${p.slug}` }))} />
        </Section>
      )}

      <Section muted label="Next steps">
        <div className="grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
          <SectionHeading title="Want something like this?">Tell us about your project and we&apos;ll send a fixed quote.</SectionHeading>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <ShimmerLink href="/contact">Start a project</ShimmerLink>
            {nextProject?.slug && (
              <CtaLink href={`/portfolio/${nextProject.slug}`} variant="outline">
                Next project
              </CtaLink>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
