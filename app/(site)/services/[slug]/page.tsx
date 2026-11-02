import { ArrowRight, Check, Clock, FileCheck2, MessageCircle, Target } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { CtaLink, IconChip, PageHero, Section, SectionHeading, ShimmerLink } from "@/components/site/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BlurFade } from "@/components/velora/blur-fade";
import { HoverCards } from "@/components/velora/card-hover-effect";
import { LightRays } from "@/components/velora/light-rays";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { Card3D, Card3DItem } from "@/components/velora/3d-card";
import { SITE_URL } from "@/lib/config";
import { getContactInfo } from "@/lib/contact";
import { categoryLabel, getPortfolios } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { contactServiceHref, serviceHref } from "@/lib/navigation";
import { buildMetadata, customSchema, serviceSeoDefaults } from "@/lib/seo";
import { getActiveServices, getServiceBySlug } from "@/lib/services";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const services = await getActiveServices();
  return services.filter((s) => s.slug).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getServiceBySlug((await params).slug);
  if (!service) return {};
  return buildMetadata("page", `services/${service.slug}`, serviceSeoDefaults(service));
}

export default async function ServicePage({ params }: Props) {
  const service = await getServiceBySlug((await params).slug);
  if (!service) notFound();

  const [all, contact, projects, extraSchema] = await Promise.all([getActiveServices(), getContactInfo(), getPortfolios(), customSchema("page", `services/${service.slug}`)]);
  const others = all.filter((s) => s.id !== service.id && s.category === service.category).slice(0, 3);
  const work = projects.filter((p) => p.slug && p.image).slice(0, 2);
  const paragraphs = service.overview.split(/\n{2,}/).filter(Boolean);
  const url = `${SITE_URL}/services/${service.slug}`;

  const schema: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.title,
      description: service.description,
      url,
      serviceType: service.title,
      provider: { "@type": "Organization", name: contact.siteName, url: SITE_URL },
      areaServed: "IN",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
        { "@type": "ListItem", position: 3, name: service.title, item: url },
      ],
    },
    ...(service.faqs.length
      ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: service.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }]
      : []),
  ];

  return (
    <>
      <JsonLd data={[...schema, ...extraSchema]} />
      <PageHero
        center={false}
        eyebrow={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link href="/services" className="hover:text-foreground">
              Services
            </Link>
            <span aria-hidden="true">/</span>
            <span>{categoryLabel(service.category)}</span>
          </nav>
        }
        title={service.title}
        background={<LightRays className="-z-10" />}
        actions={
          <>
            <ShimmerLink href={contactServiceHref(service.title)}>Get a fixed quote</ShimmerLink>
            {contact.whatsappHref && (
              <CtaLink href={contact.whatsappHref} variant="outline" arrow={false}>
                <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp us
              </CtaLink>
            )}
          </>
        }
        aside={
          service.includes.length > 0 ? (
            <Card3D maxTilt={6} cardClassName="rounded-3xl border bg-card p-7 shadow-xl shadow-primary/5">
              <Card3DItem depth={30}>
                <h2 className="flex items-center gap-2 font-medium">
                  <FileCheck2 className="size-4 text-primary" aria-hidden="true" /> What&apos;s included
                </h2>
              </Card3DItem>
              <Card3DItem depth={15}>
                <ul className="mt-5 space-y-2.5">
                  {service.includes.map((x) => (
                    <li key={x} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {x}
                    </li>
                  ))}
                </ul>
              </Card3DItem>
            </Card3D>
          ) : undefined
        }
      >
        {service.tagline || service.description}
      </PageHero>

      <Section label="About this service">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <BlurFade>
            <h2 className="text-3xl font-semibold tracking-tight">How we approach it</h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted-foreground">
              {paragraphs.length ? paragraphs.map((p) => <p key={p}>{p}</p>) : <p>{service.description}</p>}
            </div>
          </BlurFade>
          <BlurFade delay={0.1} className="space-y-4">
            {service.timeline && (
              <SpotlightCard className="rounded-2xl border bg-card p-5">
                <div className="relative flex gap-4">
                  <IconChip>
                    <Clock className="size-5" aria-hidden="true" />
                  </IconChip>
                  <div>
                    <h3 className="font-medium">Typical timeline</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{service.timeline}</p>
                  </div>
                </div>
              </SpotlightCard>
            )}
            {service.bestFor.length > 0 && (
              <SpotlightCard className="rounded-2xl border bg-card p-5">
                <div className="relative flex gap-4">
                  <IconChip>
                    <Target className="size-5" aria-hidden="true" />
                  </IconChip>
                  <div>
                    <h3 className="font-medium">Best for</h3>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      {service.bestFor.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SpotlightCard>
            )}
          </BlurFade>
        </div>
      </Section>

      {work.length > 0 && (
        <Section muted label="Selected work">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Our work" title="See how we build" />
            <CtaLink href="/portfolio" variant="outline">
              All projects
            </CtaLink>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {work.map((p) => (
              <Link key={p.id} href={`/portfolio/${p.slug}`} className="group overflow-hidden rounded-2xl border bg-card">
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  <Image src={mediaUrl("portfolio", p.image!)} alt={p.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <h3 className="font-medium">{p.title}</h3>
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {service.faqs.length > 0 && (
        <Section label="Frequently asked questions">
          <div className="mx-auto max-w-3xl">
            <SectionHeading center eyebrow="FAQ" title={`${service.title}: common questions`} />
            <Accordion type="single" collapsible className="mt-10">
              {service.faqs.map(([q, a]) => (
                <AccordionItem key={q} value={q}>
                  <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Section>
      )}

      {others.length > 0 && (
        <Section muted label="Related services">
          <SectionHeading eyebrow="Related" title="Often paired with" />
          <HoverCards className="mt-8" columns={3} items={others.map((s) => ({ title: s.title, description: s.tagline || s.description, href: serviceHref(s) }))} />
        </Section>
      )}
    </>
  );
}
