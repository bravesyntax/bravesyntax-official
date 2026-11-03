import { ArrowRight, Check, ClipboardList, MessageSquareText, PenTool, Rocket, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import ConnectedSystems from "@/components/services/ConnectedSystems";
import { CtaLink, PageHero, Section, SectionHeading, ShimmerLink } from "@/components/site/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedTabs } from "@/components/velora/animated-tabs";
import { BlurFade } from "@/components/velora/blur-fade";
import { BorderBeam } from "@/components/velora/border-beam";
import { GlowingEffect } from "@/components/velora/glowing-effect";
import { LogoCloud } from "@/components/velora/logo-cloud";
import { RetroGrid } from "@/components/velora/retro-grid";
import { StickyScroll } from "@/components/velora/sticky-scroll";
import { getContactInfo } from "@/lib/contact";
import { serviceHref } from "@/lib/navigation";
import { pageMetadata, pageSchema } from "@/lib/seo";
import { getActiveServices, type DbService } from "@/lib/services";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("services");
}

type Tier = { tier: string; price: string; tagline: string; features: string[]; popular?: boolean; cta: string };

const TIERS: Tier[] = [
  {
    tier: "Starter",
    price: "₹8,000 – ₹20,000",
    tagline: "For solopreneurs and small businesses.",
    features: ["Landing page or 3-page website", "Mobile-responsive design", "Basic SEO setup", "Contact form integration", "2 rounds of revisions", "7-day delivery", "30-day support"],
    cta: "Get started",
  },
  {
    tier: "Professional",
    price: "₹20,000 – ₹60,000",
    tagline: "For growing businesses that need more than a brochure.",
    features: ["5–10 page custom website", "UI/UX design from scratch", "Advanced SEO and schema", "Admin panel or CMS", "Performance optimisation", "Unlimited revisions within scope", "60-day support", "Brand guidelines"],
    popular: true,
    cta: "Discuss your site",
  },
  {
    tier: "Enterprise",
    price: "₹60,000+",
    tagline: "For web applications and larger platforms.",
    features: ["Custom web application", "Full-stack development", "Database design", "API integrations", "Testing and deployment setup", "A single point of contact", "90-day support", "NDA available"],
    cta: "Discuss your project",
  },
];

const FAQS: [string, string][] = [
  ["Do you work on a fixed price or hourly rate?", "Fixed price. We quote the agreed scope before we start, and any new requests are quoted separately before we do them."],
  ["What's your minimum project size?", "There's no strict minimum. Most websites start at ₹8,000, and smaller design jobs are quoted individually."],
  ["Can I see examples of past work?", "Yes. Our work page shows a selection of projects, with links to the live sites."],
  ["Do you offer monthly plans?", "Yes. Maintenance plans start at ₹5,000 per month, depending on the size of the site."],
  ["How do you handle revisions?", "Starter includes 2 rounds of revisions. Professional and Enterprise include unlimited rounds within the agreed scope."],
  ["Do you sign NDAs?", "Yes, on request, before you share anything sensitive."],
  ["Can you take over someone else's project?", "Yes. We review what exists first, then quote for fixing it or rebuilding the parts that need it."],
];

function ServiceGrid({ list }: { list: DbService[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {list.map((s) => (
        <Link key={s.id} href={serviceHref(s)} className="group relative flex flex-col rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
          <GlowingEffect />
          <h3 className="font-medium group-hover:text-primary">{s.title}</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.tagline || s.description}</p>
          <span className="mt-4 hidden items-center gap-1.5 text-sm font-medium text-primary sm:inline-flex">
            View service <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export default async function ServicesPage() {
  const [services, schema, contact] = await Promise.all([getActiveServices(), pageSchema("services"), getContactInfo()]);
  const design = services.filter((s) => s.category === "design");
  const development = services.filter((s) => s.category !== "design");
  const panel = (Icon: typeof Rocket) => (
    <div className="grid size-full min-h-56 place-items-center rounded-2xl border bg-linear-to-br from-brand-from/15 via-brand-via/5 to-brand-to/15">
      <Icon className="size-14 text-primary" aria-hidden="true" />
    </div>
  );
  const steps = [
    { title: "You tell us what you need", description: `Fill in the form, send an email or message us on WhatsApp. We reply ${contact.responseTime} (${contact.hours}).`, content: panel(MessageSquareText) },
    { title: "We send a fixed quote", description: "You get the scope in writing, a fixed price and a realistic timeline, so you know exactly what you're paying for.", content: panel(ClipboardList) },
    { title: "You approve and we design", description: "Nothing starts without your approval. You see the designs and sign them off before development begins.", content: panel(PenTool) },
    { title: "We build it with you", description: "Weekly check-ins, a staging link you can open any time, and revision rounds built into the plan.", content: panel(Wrench) },
    { title: "We launch and support you", description: "Deployment, training and documentation, followed by 30–90 days of support depending on your package.", content: panel(Rocket) },
  ];

  return (
    <>
      <JsonLd data={schema} />
      <PageHero
        eyebrow={`${services.length} services · Design and development`}
        title="Everything you need, under one roof"
        background={<RetroGrid className="-z-10" opacity={0.4} />}
        actions={
          <>
            <ShimmerLink href="/contact">Get a free quote</ShimmerLink>
            <CtaLink href="#pricing" variant="outline" arrow={false}>
              See pricing
            </CtaLink>
          </>
        }
      >
        From a single landing page to a full online store, we handle design, development and branding, with fixed prices and direct communication.
      </PageHero>

      <Section label="All services">
        <SectionHeading eyebrow="Services" title="What we can do for you">
          Pick a service to see what&apos;s included, how long it takes and who it&apos;s right for.
        </SectionHeading>
        <AnimatedTabs
          className="mt-8"
          peek={0}
          tabs={[
            { title: "All", value: "all", content: <ServiceGrid list={services} /> },
            { title: "Design", value: "design", content: <ServiceGrid list={design} /> },
            { title: "Development", value: "development", content: <ServiceGrid list={development} /> },
          ]}
        />
      </Section>

      <Section muted id="pricing" label="Pricing">
        <SectionHeading center eyebrow="Pricing" title="Simple, fixed pricing">
          No hourly rates and no surprise invoices. All prices are in INR and are starting points: you get an exact quote for your project.
        </SectionHeading>
        <div className="mt-12 grid items-start gap-5 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <BlurFade key={t.tier} delay={i * 0.08} className="h-full">
              <div className={`relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card p-7 ${t.popular ? "shadow-xl shadow-primary/10" : ""}`}>
                {t.popular && <BorderBeam />}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">{t.tier}</h3>
                  {t.popular && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Most popular</span>}
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight">{t.price}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t.tagline}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <CtaLink href={`/contact?plan=${encodeURIComponent(t.tier)}`} variant={t.popular ? "default" : "outline"} className="mt-7 w-full">
                  {t.cta}
                </CtaLink>
              </div>
            </BlurFade>
          ))}
        </div>
      </Section>

      <Section muted label="Connected systems">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <SectionHeading eyebrow="Built to connect" title="Stop typing the same order into three places">
            We connect your site to the payment, CRM and email tools you already use, so leads and orders reach the right place on their own.{" "}
            <Link href="/services/api-backend-development" className="font-medium text-primary underline-offset-4 hover:underline">
              API and backend development
            </Link>
          </SectionHeading>
          <ConnectedSystems />
        </div>
      </Section>

      <Section label="Tools we use">
        <SectionHeading center eyebrow="Our toolkit" title="Proven tools, chosen for the job" />
        <LogoCloud
          className="mt-8"
          logos={["Next.js", "React", "TypeScript", "Tailwind CSS", "Postgres", "Figma", "Shopify", "WordPress", "Laravel", "Vercel"].map((name) => ({
            name,
            logo: <span className="text-sm font-semibold whitespace-nowrap">{name}</span>,
          }))}
        />
      </Section>

      <Section label="How it works">
        <SectionHeading eyebrow="How it works" title="From enquiry to live, in five steps" />
        <StickyScroll className="mt-10" items={steps} />
      </Section>

      <Section muted label="Frequently asked questions">
        <div className="mx-auto max-w-3xl">
          <SectionHeading center eyebrow="FAQ" title="Before you ask" />
          <Accordion type="single" collapsible className="mt-10">
            {FAQS.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>
    </>
  );
}
