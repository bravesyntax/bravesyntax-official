import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SITE_URL } from "@/lib/config";
import { getContactInfo } from "@/lib/contact";
import {
  FALLBACK_SERVICE,
  getActiveCity,
  getActiveLocationServices,
  getLocationService,
  getNearbyCities,
  getOverride,
  isIndexableCity,
  SERVICE_PAGE_CITIES,
  parseFeatures,
  type City,
  type LocationService,
} from "@/lib/locations";
import { getSiteFacts } from "@/lib/content";
import { buildMetadata, customSchema, locationSeoDefaults, resolveSeo, type SeoDefaults } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { CtaLink, IconChip, PageHero, Section, SectionHeading, ShimmerLink } from "@/components/site/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import FeatureIcon from "@/components/ui/FeatureIcon";
import { BlurFade } from "@/components/velora/blur-fade";
import { DottedGlowBackground } from "@/components/velora/dotted-glow-background";
import { GlowingEffect } from "@/components/velora/glowing-effect";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { cn } from "@/lib/utils";

// Shared by app/[city]/page.tsx and app/[city]/[service]/page.tsx (pages/location.php).

type Resolved = { city: City; service: LocationService; serviceSlug: string };

/** Loads the city and service. Unknown city → 404; unknown service → 301 to the city page. */
async function resolve(citySlug: string, serviceSlug: string): Promise<Resolved> {
  const city = await getActiveCity(citySlug.toLowerCase());
  if (!city) notFound();
  if (serviceSlug) {
    const service = await getLocationService(serviceSlug.toLowerCase());
    if (!service) permanentRedirect(`/${city.slug}`);
    return { city, service, serviceSlug: service.slug };
  }
  return { city, service: (await getLocationService("")) ?? FALLBACK_SERVICE, serviceSlug: "" };
}

/** "Pune, Maharashtra", or just "Delhi" when the state has the city's name. */
const placeName = (c: City) => (c.state && c.state !== c.name ? `${c.name}, ${c.state}` : c.name);

function pageStrings({ city, service, serviceSlug }: Resolved) {
  const { name } = city;
  const place = placeName(city);
  if (!serviceSlug) {
    return {
      h1: `Digital Agency in ${name}`,
      intro: `Brave Syntax is a design and development agency working with businesses in ${place}, remotely. We build websites, web apps and brands for small businesses and growing companies, with a fixed quote before work starts.`,
    };
  }
  return {
    h1: `${service.label} in ${name}`,
    intro: `Brave Syntax provides expert ${service.keyword} services for businesses in ${place}, delivered remotely. You work directly with the people building your project, with a fixed quote before work starts.`,
  };
}

const seoKey = (r: Resolved) => (r.serviceSlug ? `${r.city.slug}/${r.serviceSlug}` : r.city.slug);

/** SEO defaults from the location templates (Admin → SEO → Location pages). */
async function seoDefaults(r: Resolved): Promise<SeoDefaults> {
  const t = await locationSeoDefaults({ city: r.city.name, state: r.city.state, service: r.serviceSlug ? r.service : null });
  return { ...t, path: `/${seoKey(r)}` };
}

/** Page copy (H1/intro overrides from Admin → Location Pages) plus the resolved SEO title/description/canonical. */
async function content(r: Resolved) {
  const d = pageStrings(r);
  const [o, seo] = await Promise.all([getOverride(r.city.slug, r.serviceSlug), seoDefaults(r).then((def) => resolveSeo("location", seoKey(r), def))]);
  return {
    ...d,
    h1: o?.custom_h1 || d.h1,
    intro: o?.custom_intro || d.intro,
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
  };
}

export async function locationMetadata(citySlug: string, serviceSlug = ""): Promise<Metadata> {
  const r = await resolve(citySlug, serviceSlug);
  // Only the top-tier cities are indexable, and service pages only in SERVICE_PAGE_CITIES; the rest stay noindex,follow whatever the admin sets.
  const indexable = (await isIndexableCity(r.city)) && (!serviceSlug || SERVICE_PAGE_CITIES.includes(r.city.slug));
  return buildMetadata("location", seoKey(r), await seoDefaults(r), { forceNoindex: !indexable });
}

/** Wraps each occurrence of the city name in the H1 with the accent highlight. */
function HighlightCity({ text, city }: { text: string; city: string }) {
  const parts = text.split(city);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="text-primary">{city}</span>}
        </span>
      ))}
    </>
  );
}

export default async function LocationPage({ citySlug, serviceSlug = "" }: { citySlug: string; serviceSlug?: string }) {
  const r = await resolve(citySlug, serviceSlug);
  const { city, service } = r;
  const [c, nearby, allServices, contact, extraSchema, facts] = await Promise.all([content(r), getNearbyCities(city), getActiveLocationServices(), getContactInfo(), customSchema("location", seoKey(r)), getSiteFacts()]);
  const stats: [string | number, string][] = facts
    ? [[facts.projects, "Projects in our portfolio"], [facts.services, "Services offered"], ...(facts.since ? [[facts.since, "Building since"] as [number, string]] : [])]
    : [];

  const features = parseFeatures(service.features_json);
  const contactParam = (service.contact_param ?? "").trim();
  const contactUrl = `/contact${contactParam ? `?service=${encodeURIComponent(contactParam)}` : ""}`;
  const kw = service.keyword;

  const breadcrumbs = [
    { name: "Home", url: SITE_URL },
    { name: city.name, url: `${SITE_URL}/${city.slug}` },
    ...(r.serviceSlug ? [{ name: service.label, url: c.canonical }] : []),
  ];

  const faqs: [string, string][] = [
    ...service.faqs,
    [
      `How much does ${kw} cost in ${city.name}?`,
      `Our ${kw} packages start at ₹8,000 for small businesses in ${city.name}. The final cost depends on scope, features, and timeline. We offer a free consultation and a fixed quote with no obligation.`,
    ],
    [
      `Do you work with clients remotely in ${city.name}?`,
      `Yes, we serve clients across ${placeName(city)} and all of India fully remotely. We use Zoom, WhatsApp, and project management tools to keep you in the loop at every stage.`,
    ],
    [
      `How long does a ${kw} project take?`,
      `Timelines vary by project size. A typical ${kw} project for a ${city.name} business takes 1–3 weeks. We always share a clear timeline before we begin.`,
    ],
    [
      "Do you offer post-launch support?",
      `Yes. Every project includes a support window after launch (30–90 days depending on the package), and we offer monthly maintenance plans for updates, backups and fixes after that.`,
    ],
  ];

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "Brave Syntax",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/logo-on-light.png`,
      description: c.description,
      email: contact.email,
      ...(contact.phone ? { telephone: contact.phone } : {}),
      areaServed: { "@type": "City", name: city.name, containedIn: { "@type": "State", name: city.state } },
      ...(contact.address ? { address: { "@type": "PostalAddress", streetAddress: contact.address, addressCountry: "IN" } } : {}),
      priceRange: "₹₹",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: b.url })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <>
      <JsonLd data={[...schema, ...extraSchema]} />

      <PageHero
        center={false}
        eyebrow={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            {breadcrumbs.map((b, i) => (
              <span key={b.url} className="contents">
                {i > 0 && <span aria-hidden="true">/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={b.url.replace(SITE_URL, "") || "/"} className="hover:text-foreground">
                    {b.name}
                  </Link>
                ) : (
                  <span className="text-foreground">{b.name}</span>
                )}
              </span>
            ))}
          </nav>
        }
        title={<HighlightCity text={c.h1} city={city.name} />}
        background={<DottedGlowBackground className="absolute inset-0 -z-10" />}
        actions={
          <>
            <ShimmerLink href={contactUrl}>Get a free quote</ShimmerLink>
            <CtaLink href="/portfolio" variant="outline">
              See our work
            </CtaLink>
          </>
        }
      >
        {c.intro}
      </PageHero>

      {stats.length > 0 && (
        <div className="border-y">
          <dl className="mx-auto grid max-w-5xl grid-cols-3 divide-x px-5 py-8 text-center sm:px-6">
            {stats.map(([v, l]) => (
              <div key={l}>
                <dd className="text-3xl font-semibold tracking-tight">{v}</dd>
                <dt className="mt-1 px-2 text-sm text-muted-foreground">{l}</dt>
              </div>
            ))}
          </dl>
        </div>
      )}

      {(city.about || city.sectors.length > 0) && (
        <Section label={`Doing business in ${city.name}`}>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <BlurFade>
              <p className="text-sm font-medium text-primary">Serving {placeName(city)}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">{r.serviceSlug ? `${service.label} for ${city.name} businesses` : `Building for businesses in ${city.name}`}</h2>
              {city.about && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{city.about}</p>}
              {service.about && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{service.about}</p>}
            </BlurFade>
            {city.sectors.length > 0 && (
              <BlurFade delay={0.1} className="space-y-3">
                <h3 className="text-sm font-medium">What {city.name} businesses often need</h3>
                {city.sectors.map((s) => (
                  <SpotlightCard key={s.name} className="rounded-2xl border bg-card p-5">
                    <div className="relative">
                      <h4 className="font-medium">{s.name}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.serviceSlug ? `${service.label} here should give them ${s.need}.` : `A good site gives them ${s.need}.`}
                      </p>
                    </div>
                  </SpotlightCard>
                ))}
              </BlurFade>
            )}
          </div>
        </Section>
      )}

      <Section muted label="What we offer">
        <SectionHeading eyebrow="What we offer" title={r.serviceSlug ? `What's included in ${service.keyword}` : `Services for businesses in ${city.name}`}>
          Pick a service to see how it applies in {city.name}.
        </SectionHeading>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/${city.slug}`} aria-current={!r.serviceSlug ? "page" : undefined} className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", !r.serviceSlug ? "border-transparent bg-primary font-medium text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>
            All services
          </Link>
          {allServices
            .filter((s) => s.slug !== "")
            .map((s) => (
              <Link key={s.slug} href={`/${city.slug}/${s.slug}`} aria-current={r.serviceSlug === s.slug ? "page" : undefined} className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", r.serviceSlug === s.slug ? "border-transparent bg-primary font-medium text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>
                {s.label}
              </Link>
            ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="relative rounded-2xl border bg-card p-5">
              <GlowingEffect />
              <IconChip>
                <FeatureIcon name={f.icon} className="size-5" />
              </IconChip>
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Frequently asked questions">
        <div className="mx-auto max-w-3xl">
          <SectionHeading center eyebrow="Common questions" title={`${service.label} in ${city.name}: FAQ`} />
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {nearby.length > 0 && (
        <Section muted label="Other cities">
          <SectionHeading center eyebrow="Across India" title="Also available in" />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {nearby.map((n) => (
              <Link key={n.slug} href={`/${n.slug}${r.serviceSlug ? `/${r.serviceSlug}` : ""}`} className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                {n.name}
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
