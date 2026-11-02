import { LineChart, Search, Users } from "lucide-react";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { CtaLink, IconChip, PageHero, Section, SectionHeading, ShimmerLink, RelatedLinks } from "@/components/site/ui";
import { BlurFade } from "@/components/velora/blur-fade";
import { GlowingEffect } from "@/components/velora/glowing-effect";
import { Marquee } from "@/components/velora/marquee";
import { ShootingStars, StarsBackground } from "@/components/velora/shooting-stars";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { INDUSTRIES } from "@/lib/industries";
import { contactServiceHref } from "@/lib/navigation";
import { pageMetadata, pageSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("industries");
}

// How we work: parallel principles, not a numbered sequence.
const PRINCIPLES = [
  { title: "We learn your domain first", desc: "Before a single pixel, we map your buyers, your competitors and the words your customers actually use.", Icon: Search },
  { title: "We design for your buyer", desc: "A B2B manufacturer and a D2C brand decide differently. We build for how your audience chooses.", Icon: Users },
  { title: "We focus on what moves revenue", desc: "Enquiries, sales, sign-ups: every build is tied to the number that matters to your business.", Icon: LineChart },
];

const ALSO_SERVED = ["Logistics", "Automotive", "Legal", "Media & Publishing", "Fitness & Sports", "Beauty & Salon", "Travel & Tourism", "Agriculture", "Events", "Interior Design", "Consulting", "Photography"];

export default async function IndustriesPage() {
  const schema = await pageSchema("industries");

  return (
    <>
      <JsonLd data={schema} />
      <PageHero
        eyebrow="Industries"
        title="Websites built around how your industry sells"
        background={
          <div className="absolute inset-0 -z-10 opacity-60 dark:opacity-100" aria-hidden="true">
            <StarsBackground />
            <ShootingStars />
          </div>
        }
        actions={
          <>
            <ShimmerLink href="/contact">Discuss your project</ShimmerLink>
            <CtaLink href="/portfolio" variant="outline">
              See our work
            </CtaLink>
          </>
        }
      >
        A hospital website and an industrial catalogue have very different jobs. We start from how your customers decide, then design around it.
      </PageHero>

      <Section label="Industries we serve">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => (
            <BlurFade key={ind.title} delay={(i % 3) * 0.06} className="h-full">
              <SpotlightCard className="flex h-full flex-col rounded-2xl border bg-card p-6">
                <div className="relative flex h-full flex-col">
                  <IconChip>
                    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                      {ind.icon.map((d) => (
                        <path key={d} d={d} />
                      ))}
                    </svg>
                  </IconChip>
                  <h2 className="mt-4 text-lg font-medium">{ind.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{ind.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {ind.tags.map((t) => (
                      <span key={t} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                  <a href={contactServiceHref(ind.title)} className="mt-5 text-sm font-medium text-primary hover:underline">
                    Discuss a project →
                  </a>
                </div>
              </SpotlightCard>
            </BlurFade>
          ))}
        </div>
      </Section>

      <Section muted label="How we work">
        <SectionHeading center eyebrow="How we work" title="Same craft, tuned to your space">
          What stays constant, whichever industry we&apos;re building for.
        </SectionHeading>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PRINCIPLES.map(({ title, desc, Icon }, i) => (
            <BlurFade key={title} delay={i * 0.08} className="h-full">
              <div className="relative h-full rounded-2xl border bg-card p-6">
                <GlowingEffect />
                <IconChip>
                  <Icon className="size-5" aria-hidden="true" />
                </IconChip>
                <h3 className="mt-4 font-medium">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </Section>

      <Section label="Other industries">
        <SectionHeading center title="Don't see your industry?">
          These are others we can work with. If yours isn&apos;t here, tell us about it.
        </SectionHeading>
        <Marquee pauseOnHover fade className="mt-8 [--duration:35s] [--gap:0.75rem]">
          {ALSO_SERVED.map((a) => (
            <span key={a} className="rounded-full border bg-background px-4 py-2 text-sm whitespace-nowrap text-muted-foreground">
              {a}
            </span>
          ))}
        </Marquee>
      </Section>

      <RelatedLinks
        title="Services for your industry"
        links={[
          ["Custom websites", "/services/custom-website-development"],
          ["E-commerce and Shopify", "/services/ecommerce-shopify"],
          ["Web applications", "/services/web-application-development"],
          ["Landing pages", "/services/landing-page-design"],
          ["WordPress", "/services/wordpress-development"],
        ]}
      />
    </>
  );
}
