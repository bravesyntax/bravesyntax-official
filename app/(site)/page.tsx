import { ArrowRight, ArrowUpRight, Boxes, Check, Clock, Code2, Eraser, FileText, Gauge, Handshake, LockKeyhole, ShieldCheck, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { container, CtaLink, IconChip, Section, SectionHeading, ShimmerLink } from "@/components/site/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedList } from "@/components/velora/animated-list";
import { BrowserMockup } from "@/components/velora/browser-mockup";
import { BentoCard, BentoGrid } from "@/components/velora/bento-grid";
import { BlurFade } from "@/components/velora/blur-fade";
import { HoverCards } from "@/components/velora/card-hover-effect";
import { DirectionAwareHover } from "@/components/velora/direction-aware-hover";
import { EvervaultCard } from "@/components/velora/evervault-card";
import { GlowingEffect } from "@/components/velora/glowing-effect";
import { GridPattern } from "@/components/velora/grid-pattern";
import { NumberTicker } from "@/components/velora/number-ticker";
import { WordRotate } from "@/components/velora/word-rotate";
import { BorderBeam } from "@/components/velora/border-beam";
import { Marquee } from "@/components/velora/marquee";
import { OrbitingCircles } from "@/components/velora/orbiting-circles";
import { ScrollVelocity } from "@/components/velora/scroll-velocity";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { Terminal } from "@/components/velora/terminal";
import { TextHighlighter } from "@/components/velora/text-highlighter";
import { TextShimmer } from "@/components/velora/text-shimmer";
import { Timeline } from "@/components/velora/timeline";
import { WobbleCard } from "@/components/velora/wobble-card";
import { WorldMap } from "@/components/velora/world-map";
import { SITE_URL } from "@/lib/config";
import { cn } from "@/lib/utils";
import { getContactInfo, type ContactInfo } from "@/lib/contact";
import { CardsCarousel, CarouselCard } from "@/components/velora/apple-cards-carousel";
import { categoryLabel, formatDate, getActiveJobs, getLatestPosts, getPortfolios, getSiteFacts } from "@/lib/content";
import { INDUSTRIES } from "@/lib/industries";
import { getActiveCities } from "@/lib/locations";
import { mediaUrl } from "@/lib/media";
import { PDF_TOOL_COUNT, PDF_TOOLS, serviceHref } from "@/lib/navigation";
import { pageMetadata, pageSchema } from "@/lib/seo";
import { getActiveServices, type DbService } from "@/lib/services";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home");
}

const GHAZIABAD: [number, number] = [28.67, 77.45];
const HUBS: { label: string; lat: number; lng: number }[] = [
  { label: "Mumbai", lat: 19.08, lng: 72.88 },
  { label: "Bangalore", lat: 12.97, lng: 77.59 },
  { label: "Kolkata", lat: 22.57, lng: 88.36 },
  { label: "Ahmedabad", lat: 23.02, lng: 72.57 },
  { label: "Hyderabad", lat: 17.39, lng: 78.49 },
];

const STEPS: [string, string, string][] = [
  ["Discovery", "We learn your goals, audience and competitors, then send a written brief, a fixed quote and a timeline before any work starts.", "Written brief · Fixed quote"],
  ["Design", "You see high-fidelity designs and a clickable prototype, so you know exactly what you're getting before a line of code is written.", "Figma designs · Your sign-off"],
  ["Development", "We build it with clean, tested code on a staging link you can open any time, with weekly updates along the way.", "Staging access · Weekly updates"],
  ["Launch", "A smooth deployment with zero downtime, plus training, documentation and 30–90 days of support afterwards.", "Handover · Support window"],
];

const FAQS: [string, string][] = [
  ["How much does a website cost?", "A landing page or 3-page site starts at ₹8,000, a custom 5–10 page website is ₹20,000–₹60,000, and web apps or large e-commerce builds start at ₹60,000. You get a fixed quote once we understand your requirements. See Services for what each package includes."],
  ["How long does a project take?", "It depends on scope: landing pages usually take 3–5 days, business websites 1–3 weeks, and e-commerce or custom web apps 3–8 weeks. You get a milestone-based timeline before we start."],
  ["Do you work with international clients?", "Yes. We work remotely, communicate in English and adjust meeting times to your timezone."],
  ["What do you need to get started?", "Brand assets (logo and colours if you have them), your goals, and examples of designs you like. We handle the rest."],
  ["Can I get revisions?", "Yes. Every package includes revisions: 2 rounds on Starter, and unlimited rounds within the agreed scope on Professional and Enterprise."],
  ["Do you provide hosting and maintenance?", "Yes. We set up hosting (Vercel, AWS, Hostinger and others) in your own accounts, and offer monthly maintenance plans for updates, backups and monitoring."],
  ["Are your PDF tools really free?", `Yes. ${PDF_TOOL_COUNT} PDF tools plus an AI background remover, all free and running in your browser. No registration, no watermarks, and your files aren't uploaded.`],
];

const FEED = [
  ["Design approved", "Your sign-off, recorded"],
  ["Staging updated", "New build ready to review"],
  ["Weekly update sent", "Progress, next steps, blockers"],
  ["Live on your domain", "Backups and monitoring on"],
];

/** Organisation schema from the admin settings and the live service list (no invented ratings or reviews). */
function localBusinessSchema(c: ContactInfo, services: DbService[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: c.siteName,
    description: `${c.siteName} is a design and development agency building websites, web apps, e-commerce stores and brand identities for growing businesses.`,
    url: SITE_URL,
    email: c.email,
    ...(c.phone ? { telephone: c.phone } : {}),
    ...(c.address ? { address: { "@type": "PostalAddress", streetAddress: c.address, addressCountry: "IN" } } : {}),
    serviceType: services.map((x) => x.title),
    ...(c.socials.length ? { sameAs: c.socials.map((x) => x.url) } : {}),
  };
}

// Tells search engines the site's name, so results show "Brave Syntax" rather than the bare domain.
const WEBSITE_SCHEMA = { "@context": "https://schema.org", "@type": "WebSite", name: "Brave Syntax", alternateName: "BraveSyntax", url: SITE_URL };

export default async function HomePage() {
  const [schema, services, contact, projects, posts, jobs, cities, facts] = await Promise.all([
    pageSchema("home"),
    getActiveServices(),
    getContactInfo(),
    getPortfolios(),
    getLatestPosts(6),
    getActiveJobs(),
    getActiveCities(16),
    getSiteFacts(),
  ]);
  const work = projects.filter((p) => p.slug).slice(0, 3);
  const showcase = projects.filter((p) => p.slug && p.image).slice(0, 1);
  const techs = ["Next.js", "React", "TypeScript", "Tailwind CSS", "Postgres", "Figma", "Shopify", "WordPress", "Laravel", "Vercel"];

  return (
    <>
      <JsonLd data={[...schema, WEBSITE_SCHEMA, localBusinessSchema(contact, services)]} />

      {/* ═══ HERO ═══ */}
      <section className="relative isolate overflow-hidden" aria-label="Introduction">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/15 via-primary/5 to-background" aria-hidden="true" />
        <GridPattern aria-hidden width={64} height={64} className="absolute inset-0 -z-10 size-full stroke-foreground/5 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className={`${container} grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:py-20`}>
          <div>
            <BlurFade>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-background/70 p-1 pr-3 text-sm shadow-sm ring-1 ring-border backdrop-blur transition-colors hover:text-primary">
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">Now booking</span>
                <TextShimmer>Taking on new projects</TextShimmer>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </BlurFade>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl xl:text-6xl">
              Web design and development that <span className="bg-linear-to-r from-brand-from via-brand-via to-brand-to bg-clip-text text-transparent">wins you customers</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">A design and development studio for growing businesses in India. You get a fixed quote, direct access to the people building your project, and code you own.</p>
            <BlurFade delay={0.15}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ShimmerLink href="/contact">Start your project</ShimmerLink>
                <CtaLink href="/portfolio" variant="outline">
                  See our work
                </CtaLink>
              </div>
            </BlurFade>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {["Fixed quote", "Direct access", "You own the code"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <BlurFade delay={0.1}>
            <div className="grid grid-cols-6 gap-3">
              {showcase[0] && (
                <Link href={`/portfolio/${showcase[0].slug}`} className="group relative col-span-6 overflow-hidden rounded-2xl border bg-card/80 p-3 shadow-sm backdrop-blur transition-colors hover:border-primary/50 sm:col-span-4 sm:row-span-2">
                  <BrowserMockup url={(showcase[0].live_url ?? "bravesyntax.com").replace(/^https?:\/\//, "").replace(/\/$/, "")}>
                    <div className="relative aspect-video w-full bg-muted">
                      <Image src={mediaUrl("portfolio", showcase[0].image!)} alt={`${showcase[0].title} website`} fill priority sizes="(min-width: 1024px) 34vw, (min-width: 640px) 66vw, 100vw" className="object-cover object-top" />
                    </div>
                  </BrowserMockup>
                  <p className="mt-3 flex items-center justify-between gap-2 px-1 text-sm">
                    <span className="truncate font-medium">{showcase[0].title}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                      Recent work <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </p>
                </Link>
              )}
              <div className="col-span-3 flex min-h-32 flex-col justify-between rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur sm:col-span-2">
                <p className="text-xs text-muted-foreground">We build</p>
                <p className="text-2xl font-semibold tracking-tight text-primary">
                  <WordRotate words={["Websites", "Web apps", "Stores", "Brands"]} />
                </p>
              </div>
              <div className="relative col-span-3 flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur sm:col-span-2">
                <BorderBeam size={70} duration={8} />
                <Wallet className="size-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">Fixed quote</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Price agreed in writing first.</p>
                </div>
              </div>
              {facts && (
                <dl className="col-span-3 grid grid-cols-2 gap-2 rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur">
                  {[
                    [facts.projects, "Projects"],
                    [facts.services, "Services"],
                  ].map(([value, label]) => (
                    <div key={label} className="flex flex-col-reverse">
                      <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
                      <dd className="text-3xl font-semibold tracking-tight">
                        <NumberTicker value={Number(value)} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <Link href="/pdf-tools" className={cn("group flex items-center gap-3 rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur transition-colors hover:border-primary/50", facts ? "col-span-3" : "col-span-6")}>
                <IconChip>
                  <FileText className="size-5" aria-hidden="true" />
                </IconChip>
                <span className="min-w-0">
                  <span className="block text-sm font-medium group-hover:text-primary">{PDF_TOOL_COUNT} free PDF tools</span>
                  <span className="block text-xs text-muted-foreground">No sign-up, right in your browser.</span>
                </span>
              </Link>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ═══ SERVICE STRIP ═══ */}
      <div className="overflow-hidden border-y bg-muted/30 py-4" aria-hidden="true">
        <ScrollVelocity baseVelocity={2}>
          <span className="flex items-center gap-8 pr-8 text-sm font-medium text-muted-foreground">
            {services.map((s) => (
              <span key={s.title} className="flex items-center gap-8 whitespace-nowrap">
                {s.title}
                <span className="size-1 rounded-full bg-primary" />
              </span>
            ))}
          </span>
        </ScrollVelocity>
      </div>

      {/* ═══ SERVICES ═══ */}
      <Section id="services" label="Services">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="What we do" title="One team, from first sketch to launch day">
            No juggling a separate designer, developer and SEO freelancer. Pick a service to see how it works and what you get.
          </SectionHeading>
          <CtaLink href="/services" variant="outline">
            Services and pricing
          </CtaLink>
        </div>
        <BlurFade delay={0.1} className="mt-10">
          <ul className="divide-y rounded-2xl border bg-card sm:hidden">
            {services.map((s) => (
              <li key={s.title}>
                <Link href={serviceHref(s)} className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium">
                  {s.title}
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden sm:block">
            <HoverCards columns={3} items={services.map((s) => ({ title: s.title, description: s.tagline || s.description, href: serviceHref(s) }))} />
          </div>
        </BlurFade>
      </Section>

      {/* ═══ WHY US ═══ */}
      <Section muted label="Why Brave Syntax">
        <SectionHeading
          center
          eyebrow="Why Brave Syntax"
          title={
            <>
              Straightforward, <TextHighlighter>by design</TextHighlighter>
            </>
          }
        >
          No jargon, no surprise invoices, and no disappearing after launch.
        </SectionHeading>
        <BentoGrid className="mt-12 md:grid-cols-3">
          <BentoCard
            className="md:col-span-2"
            name="You always know where things stand"
            description="A staging link you can open any time, weekly updates, and your sign-off at every stage."
            icon={<Clock className="size-5 text-primary" aria-hidden="true" />}
            background={
              <div className="absolute inset-x-6 top-5 mx-auto max-w-sm" aria-hidden="true">
                <AnimatedList delay={2400}>
                  {FEED.map(([t, d]) => (
                    <div key={t} className="flex items-center gap-3 rounded-xl border bg-background/90 p-3 shadow-sm">
                      <span className="size-2 rounded-full bg-primary" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{t}</span>
                        <span className="block truncate text-xs text-muted-foreground">{d}</span>
                      </span>
                    </div>
                  ))}
                </AnimatedList>
              </div>
            }
          />
          <BentoCard
            name="Fixed-price quotes"
            description="The scope and price are agreed in writing first. New requests are quoted before we do them."
            icon={<Wallet className="size-5 text-primary" aria-hidden="true" />}
            href="/services#pricing"
            cta="See pricing"
            background={
              <div className="absolute inset-0 flex items-start justify-center pt-10 text-6xl font-semibold tracking-tight text-primary/15" aria-hidden="true">
                ₹8,000+
              </div>
            }
          />
          <BentoCard
            name="Modern, proven tools"
            description="We choose what fits the job, and we explain why in plain language."
            icon={<Code2 className="size-5 text-primary" aria-hidden="true" />}
            background={
              <div className="absolute inset-x-0 top-0 flex h-56 items-center justify-center" aria-hidden="true">
                <OrbitingCircles radius={78} duration={26} iconSize={34}>
                  {["Next", "React", "TS", "SQL"].map((t) => (
                    <span key={t} className="grid size-full place-items-center rounded-full border bg-background font-mono text-[10px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </OrbitingCircles>
                <Boxes className="size-7 text-primary" />
              </div>
            }
          />
          <BentoCard
            className="md:col-span-2"
            name="You own everything"
            description="Full source code, design files and accounts in your name. No lock-in, and a documented handover when we ship."
            icon={<LockKeyhole className="size-5 text-primary" aria-hidden="true" />}
            background={
              <div className="absolute inset-x-6 top-4" aria-hidden="true">
                <Terminal title="handover" lines={["$ deploy --to your-account", "✓ Code in your repository", "✓ Domain and hosting in your name", "✓ Docs and walkthrough delivered"]} />
              </div>
            }
          />
        </BentoGrid>
      </Section>

      {/* ═══ WORK ═══ */}
      {work.length > 0 && (
        <Section label="Selected work">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Selected work" title="Recent projects">
              A selection of websites and stores we&apos;ve designed and built.
            </SectionHeading>
            <CtaLink href="/portfolio" variant="outline">
              All projects
            </CtaLink>
          </div>
          <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
            {work.map((p, i) => (
              <BlurFade key={p.id} delay={i * 0.08} className="w-[85%] shrink-0 snap-center sm:w-[60%] md:w-auto">
                <Link href={`/portfolio/${p.slug}`} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <DirectionAwareHover
                    className="aspect-[4/3] rounded-2xl border"
                    overlay={
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        View project <ArrowUpRight className="size-4" aria-hidden="true" />
                      </span>
                    }
                  >
                    {p.image && <Image src={mediaUrl("portfolio", p.image)} alt={p.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />}
                  </DirectionAwareHover>
                  <h3 className="mt-4 font-medium">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{categoryLabel(p.category)}</p>
                </Link>
              </BlurFade>
            ))}
          </div>
        </Section>
      )}

      {/* ═══ PROCESS ═══ */}
      <Section muted id="process" label="How we work">
        <SectionHeading eyebrow="How it works" title="Four clear steps, with your sign-off at each">
          You always know what happens next, and nothing moves forward without your approval.
        </SectionHeading>
        <Timeline
          className="mt-10"
          items={STEPS.map(([title, desc, tag], i) => ({
            title: `${i + 1}. ${title}`,
            content: (
              <div className="max-w-xl">
                <p className="text-muted-foreground">{desc}</p>
                <p className="mt-3 inline-flex rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">{tag}</p>
              </div>
            ),
          }))}
        />
      </Section>

      {/* ═══ INDUSTRIES ═══ */}
      <Section label="Industries">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="Industries" title="Built around how your market buys">
            A hospital website and an industrial catalogue have very different jobs. We start from yours.
          </SectionHeading>
          <CtaLink href="/industries" variant="outline">
            All industries
          </CtaLink>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => (
            <BlurFade key={ind.title} delay={(i % 3) * 0.06} className="h-full">
              <SpotlightCard className="h-full rounded-2xl border bg-card p-4 sm:p-5">
                <div className="relative flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <IconChip>
                    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                      {ind.icon.map((d) => (
                        <path key={d} d={d} />
                      ))}
                    </svg>
                  </IconChip>
                  <div className="min-w-0">
                    <h3 className="font-medium">{ind.title}</h3>
                    <p className="mt-1 line-clamp-2 hidden text-sm text-muted-foreground sm:block">{ind.desc}</p>
                  </div>
                </div>
              </SpotlightCard>
            </BlurFade>
          ))}
        </div>
      </Section>

      {/* ═══ FREE TOOLS ═══ */}
      <Section muted label="Free tools">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading eyebrow="Free tools" title="Free tools. No sign-up, no uploads.">
              {PDF_TOOL_COUNT} PDF tools and an AI background remover that run right in your browser. Your files never leave your device.
            </SectionHeading>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/pdf-tools">All {PDF_TOOL_COUNT} PDF tools</CtaLink>
              <CtaLink href="/bg-remover" variant="outline" arrow={false}>
                <Eraser className="size-4" aria-hidden="true" /> Background remover
              </CtaLink>
            </div>
            <EvervaultCard
              className="mt-8 hidden h-40 rounded-2xl border lg:flex"
              label={
                <span className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Processed on your device
                </span>
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PDF_TOOLS.map((tool, i) => (
              <BlurFade key={tool.slug} delay={(i % 2) * 0.06}>
                <Link href={`/pdf-tools?tool=${tool.slug}`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
                  <IconChip className="size-9">
                    <FileText className="size-4" aria-hidden="true" />
                  </IconChip>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium group-hover:text-primary">{tool.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{tool.desc}</span>
                  </span>
                </Link>
              </BlurFade>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ BLOG ═══ */}
      {posts.length > 0 && (
        <Section label="From the blog">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="From the blog" title="Practical guides for business owners">
              Websites, e-commerce, SEO and AI tools, explained without the jargon.
            </SectionHeading>
            <CtaLink href="/blog" variant="outline">
              All articles
            </CtaLink>
          </div>
          <CardsCarousel label="Latest articles" className="mt-10">
            {posts
              .filter((post) => post.featured_image)
              .map((post) => (
                <CarouselCard key={post.id} src={mediaUrl("blog", post.featured_image!)} category={categoryLabel(post.category)} title={post.title}>
                  {post.excerpt && <p className="text-muted-foreground">{post.excerpt}</p>}
                  <p className="mt-4 text-sm text-muted-foreground">
                    {formatDate(post.published_at)}
                    {post.read_time ? ` · ${post.read_time} min read` : ""}
                  </p>
                  <CtaLink href={`/blog/${post.slug}`} className="mt-6">
                    Read article
                  </CtaLink>
                </CarouselCard>
              ))}
          </CardsCarousel>
        </Section>
      )}

      {/* ═══ TECH ═══ */}
      <div className="border-y py-8" aria-label="Technologies we use">
        <Marquee pauseOnHover fade className="[--duration:30s] [--gap:3rem]">
          {techs.map((t) => (
            <span key={t} className="text-sm font-medium whitespace-nowrap text-muted-foreground">
              {t}
            </span>
          ))}
        </Marquee>
      </div>

      {/* ═══ WHERE WE WORK ═══ */}
      {cities.length > 0 && (
        <Section label="Where we work">
          <SectionHeading center eyebrow="Where we work" title="Based in Ghaziabad, working remotely across India">
            Your city is never a barrier. Pick yours to see how we can help businesses there.
          </SectionHeading>
          <BlurFade delay={0.1}>
            <WorldMap
              className="mx-auto mt-8 max-w-4xl"
              label="Map with Ghaziabad connected to major Indian cities"
              markers={[{ lat: GHAZIABAD[0], lng: GHAZIABAD[1], label: "Ghaziabad" }]}
              arcs={HUBS.map((h) => ({ from: GHAZIABAD, to: [h.lat, h.lng] as [number, number] }))}
            />
          </BlurFade>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {cities.map((c) => (
              <Link key={c.slug} href={`/${c.slug}`} className="rounded-full border bg-background px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                {c.name}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ═══ ABOUT + CAREERS ═══ */}
      <Section muted label="About and careers">
        <div className="grid gap-5 lg:grid-cols-2">
          <WobbleCard className="rounded-3xl bg-zinc-950 text-white" contentClassName="p-8 sm:p-10">
            <Handshake className="size-7 text-emerald-400" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">A studio, not a factory</h2>
            <p className="mt-3 max-w-md text-zinc-300">A small team of designers and developers. You talk directly to the people building your product, with no account managers in between.</p>
            <CtaLink href="/about" className="mt-6 bg-white text-zinc-950 hover:bg-zinc-200">
              About us
            </CtaLink>
          </WobbleCard>
          <div className="relative rounded-3xl border bg-card p-8 sm:p-10">
            <GlowingEffect />
            <Gauge className="size-7 text-primary" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">Want to build with us?</h2>
            {jobs.length ? (
              <ul className="mt-4 divide-y rounded-xl border">
                {jobs.slice(0, 3).map((j) => (
                  <li key={j.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="truncate font-medium">{j.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{j.type}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 max-w-md text-muted-foreground">No open roles right now, but we&apos;re always glad to hear from talented designers and developers.</p>
            )}
            <CtaLink href="/careers" variant="outline" className="mt-6">
              {jobs.length ? "See open roles" : "Send your CV"}
            </CtaLink>
          </div>
        </div>
      </Section>

      {/* ═══ FAQ ═══ */}
      <Section label="Frequently asked questions">
        <div className="mx-auto max-w-3xl">
          <SectionHeading center eyebrow="FAQ" title="Questions we get asked most" />
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
