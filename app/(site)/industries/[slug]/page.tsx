import { AlertTriangle, Check, MessageCircle, Scale } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { CtaLink, IconChip, PageHero, RelatedLinks, Section, SectionHeading, ShimmerLink } from "@/components/site/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BlurFade } from "@/components/velora/blur-fade";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { SITE_URL } from "@/lib/config";
import { getContactInfo } from "@/lib/contact";
import { getPortfolios } from "@/lib/content";
import { INDUSTRIES } from "@/lib/industries";
import { INDUSTRY_GUIDES } from "@/lib/industry-guides";
import { isExternalImage, mediaUrl } from "@/lib/media";
import { contactServiceHref } from "@/lib/navigation";
import { buildMetadata, customSchema } from "@/lib/seo";
import { GUIDES_UPDATED } from "@/lib/service-guides";
import { getActiveServices } from "@/lib/services";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 86400; // admin edits refresh it immediately
export const dynamicParams = false;

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

const find = (slug: string) => {
  const industry = INDUSTRIES.find((i) => i.slug === slug);
  const guide = INDUSTRY_GUIDES[slug];
  return industry && guide ? { industry, guide } : null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = find(slug);
  if (!found) return {};
  return buildMetadata("page", `industries/${slug}`, { title: `${found.industry.title} Websites`, suffix: true, description: found.industry.desc, path: `/industries/${slug}` });
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const found = find(slug);
  if (!found) notFound();
  const { industry, guide } = found;

  const [services, projects, contact, extraSchema] = await Promise.all([getActiveServices(), getPortfolios(), getContactInfo(), customSchema("page", `industries/${slug}`)]);
  const related = guide.services.flatMap((s) => services.filter((x) => x.slug === s));
  const work = guide.projects.flatMap((s) => projects.filter((p) => p.slug === s && p.image));
  const url = `${SITE_URL}/industries/${slug}`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${industry.title} website design and development`,
      description: guide.answer,
      url,
      dateModified: GUIDES_UPDATED,
      about: industry.title,
      publisher: { "@type": "Organization", name: contact.siteName, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Industries", item: `${SITE_URL}/industries` },
        { "@type": "ListItem", position: 3, name: industry.title, item: url },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: guide.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <>
      <JsonLd data={[...schema, ...extraSchema]} />
      <PageHero
        center={false}
        eyebrow={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link href="/industries" className="hover:text-foreground">
              Industries
            </Link>
            <span aria-hidden="true">/</span>
            <span>{industry.title}</span>
          </nav>
        }
        title={`Websites for ${industry.title}`}
        actions={
          <>
            <ShimmerLink href={contactServiceHref(industry.title)}>Discuss your project</ShimmerLink>
            {contact.whatsappHref && (
              <CtaLink href={contact.whatsappHref} variant="outline" arrow={false}>
                <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp us
              </CtaLink>
            )}
          </>
        }
      >
        {industry.desc}
      </PageHero>

      <Section label="Overview">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight">What does a good {industry.title.toLowerCase()} website need?</h2>
          <p className="mt-5 text-lg leading-relaxed">{guide.answer}</p>
          <h2 className="mt-12 text-3xl font-semibold tracking-tight">How do your customers decide?</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{guide.howBuyersDecide}</p>
          <p className="mt-6 text-sm text-muted-foreground">
            Last updated <time dateTime={GUIDES_UPDATED}>{new Date(GUIDES_UPDATED).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</time>
          </p>
        </div>
      </Section>

      <Section muted label="What to include">
        <SectionHeading center eyebrow="What to include" title="Pages and features that matter most" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guide.mustHaves.map(([title, desc], i) => (
            <BlurFade key={title} delay={(i % 3) * 0.06} className="h-full">
              <SpotlightCard className="h-full rounded-2xl border bg-card p-6">
                <div className="relative">
                  <IconChip>
                    <Check className="size-5" aria-hidden="true" />
                  </IconChip>
                  <h3 className="mt-4 font-medium">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              </SpotlightCard>
            </BlurFade>
          ))}
        </div>
      </Section>

      <Section label="Common problems">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Common problems" title="What usually goes wrong, and the fix" />
            <dl className="mt-8 space-y-6">
              {guide.problems.map(([problem, fix]) => (
                <div key={problem} className="flex gap-3">
                  <AlertTriangle className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <dt className="font-medium">{problem}</dt>
                    <dd className="mt-1 text-muted-foreground">{fix}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
          <div className="self-start rounded-2xl border bg-card p-6">
            <h2 className="flex items-center gap-2 text-xl font-medium tracking-tight">
              <Scale className="size-5 text-primary" aria-hidden="true" /> Rules to keep in mind
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              {guide.rules.map((r) => (
                <li key={r} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t pt-4 text-xs text-muted-foreground">General guidance, not legal advice. Please confirm what applies to you with a qualified adviser.</p>
          </div>
        </div>
      </Section>

      {work.length > 0 && (
        <Section muted label="Related work">
          <SectionHeading eyebrow="Related work" title="Projects in or close to this industry" />
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {work.map((p) => (
              <Link key={p.id} href={`/portfolio/${p.slug}`} className="group overflow-hidden rounded-2xl border bg-card">
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <Image unoptimized={isExternalImage(p.image)} src={mediaUrl("portfolio", p.image!)} alt={p.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-contain" />
                </div>
                <h3 className="p-4 font-medium group-hover:text-primary">{p.title}</h3>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section label="Frequently asked questions">
        <div className="mx-auto max-w-3xl">
          <SectionHeading center eyebrow="FAQ" title="Common questions" />
          <Accordion type="single" collapsible className="mt-10">
            {guide.faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      <RelatedLinks
        title="Useful next steps"
        links={[...related.map((s): [string, string] => [s.title, `/services/${s.slug}`]), ["All industries", "/industries"], ["Our work", "/portfolio"]]}
      />
    </>
  );
}
