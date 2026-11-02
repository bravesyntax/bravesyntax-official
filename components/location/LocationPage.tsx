import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import JsonLd from "@/components/JsonLd";
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
  parseFeatures,
  type City,
  type LocationService,
} from "@/lib/locations";
import { buildMetadata, customSchema, locationSeoDefaults, resolveSeo, type SeoDefaults } from "@/lib/seo";
import FeatureIcon from "@/components/ui/FeatureIcon";
import LocationFaq from "./LocationFaq";

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
      h1: `Top Digital Agency in ${name}`,
      intro: `Brave Syntax is a results-driven digital agency trusted by businesses across ${place}. From startups to enterprises, we build websites, brands, and digital experiences that convert.`,
    };
  }
  return {
    h1: `${service.label} in ${name}`,
    intro: `Brave Syntax provides expert ${service.keyword} services for businesses in ${place}. Our team combines technical excellence with strategic thinking to deliver results that matter.`,
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
  // Only the top-tier cities are indexable; the rest stay noindex,follow whatever the admin sets.
  return buildMetadata("location", seoKey(r), await seoDefaults(r), { forceNoindex: !(await isIndexableCity(r.city)) });
}

const STATS = [
  ["50+", "Projects Delivered"],
  ["3+", "Years Experience"],
  ["100%", "Client Satisfaction"],
];

const WHY = [
  ["Premium Quality, Affordable Pricing", "Enterprise-quality work at SME-friendly prices. No hidden charges."],
  ["Fast Turnaround", "Most projects delivered in days, not months. We respect your deadlines."],
  ["Dedicated Point of Contact", "One developer, one designer — no outsourcing maze. Direct communication."],
  ["SEO-First Development", "Every site we build is optimized for search engines right from the start."],
];

/** Wraps each occurrence of the city name in the H1 with the accent highlight. */
function HighlightCity({ text, city }: { text: string; city: string }) {
  const parts = text.split(city);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="hl">{city}</span>}
        </span>
      ))}
    </>
  );
}

export default async function LocationPage({ citySlug, serviceSlug = "" }: { citySlug: string; serviceSlug?: string }) {
  const r = await resolve(citySlug, serviceSlug);
  const { city, service } = r;
  const [c, nearby, allServices, contact, extraSchema] = await Promise.all([content(r), getNearbyCities(city), getActiveLocationServices(), getContactInfo(), customSchema("location", seoKey(r))]);

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
    <div className="pg-location">
      <JsonLd data={[...schema, ...extraSchema]} />

      {/* ═══ HERO ═══ */}
      <section className="loc-hero">
        <div className="loc-grid" />
        <div className="loc-inner">
          <nav className="loc-crumb" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => (
              <span key={b.url} className="contents">
                {i > 0 && <span className="sep">/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={b.url.replace(SITE_URL, "") || "/"}>{b.name}</Link>
                ) : (
                  <span className="current">{b.name}</span>
                )}
              </span>
            ))}
          </nav>

          <div className="loc-badge">
            Serving {placeName(city)}
          </div>

          <h1 className="loc-h1">
            <HighlightCity text={c.h1} city={city.name} />
          </h1>

          <p className="loc-intro">{c.intro}</p>

          <div className="loc-btns">
            <Link href={contactUrl} className="btn-primary">
              Get Free Quote
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/portfolio" className="btn-outline">
              View Our Work
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="loc-sec loc-sec-alt">
        <div className="loc-wrap">
          <div style={{ textAlign: "center" }}>
            <p className="sec-label">By the numbers</p>
            <h2 className="sec-title">Trusted by Businesses in {city.name}</h2>
          </div>
          <div className="loc-stats">
            {STATS.map(([v, l]) => (
              <div key={l} className="loc-stat">
                <div className="loc-stat-v">{v}</div>
                <div className="loc-stat-l">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section className="loc-sec">
        <div className="loc-wrap">
          <p className="sec-label">What we offer</p>
          <h2 className="sec-title">{r.serviceSlug ? `${service.label} in ${city.name}` : `Services We Provide in ${city.name}`}</h2>
          <p className="sec-sub">Everything your business needs to grow online — delivered by a dedicated team that cares about quality.</p>

          <div className="loc-svc-pills">
            <Link href={`/${city.slug}`} className={`svc-pill${!r.serviceSlug ? " active" : ""}`}>
              All Services
            </Link>
            {allServices
              .filter((s) => s.slug !== "")
              .map((s) => (
                <Link key={s.slug} href={`/${city.slug}/${s.slug}`} className={`svc-pill${r.serviceSlug === s.slug ? " active" : ""}`}>
                  {s.label}
                </Link>
              ))}
          </div>

          <div className="loc-features">
            {features.map((f) => (
              <div key={f.title} className="feat-card">
                <span className="feat-icon">
                  <FeatureIcon name={f.icon} className="h-5 w-5" />
                </span>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY US ═══ */}
      <section className="loc-sec loc-sec-alt">
        <div className="loc-wrap">
          <p className="sec-label">Why choose us</p>
          <h2 className="sec-title">Why Businesses in {city.name} Choose Brave Syntax</h2>
          <div className="loc-why-grid">
            <ul className="why-list">
              {WHY.map(([strong, text]) => (
                <li key={strong} className="why-item">
                  <span className="why-check">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <div>
                    <strong>{strong}</strong>
                    <span>{text}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="testimonial-card">
              <p className="testi-quote">
                &quot;Every project starts with a conversation, not a template. We learn how your business in {city.name} actually works — then we design and build
                around it.&quot;
              </p>
              <div className="testi-author">
                <div className="testi-avatar">B</div>
                <div>
                  <div className="testi-name">Brave Syntax</div>
                  <div className="testi-role">Our approach to {service.label.toLowerCase()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="loc-sec">
        <div className="loc-wrap">
          <p className="sec-label">Common questions</p>
          <h2 className="sec-title">
            FAQ — {service.label} in {city.name}
          </h2>
          <LocationFaq faqs={faqs} />
        </div>
      </section>

      {/* ═══ OTHER CITIES ═══ */}
      {nearby.length > 0 && (
        <section className="loc-sec loc-sec-alt">
          <div className="loc-wrap" style={{ textAlign: "center" }}>
            <p className="sec-label">We serve across India</p>
            <h2 className="sec-title">Also Available In</h2>
            <div className="loc-cities-grid">
              {nearby.map((n) => (
                <Link key={n.slug} href={`/${n.slug}${r.serviceSlug ? `/${r.serviceSlug}` : ""}`} className="city-link">
                  {n.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CTA ═══ */}
      <section className="loc-sec">
        <div className="loc-wrap">
          <div className="loc-cta-box">
            <p className="sec-label" style={{ textAlign: "center" }}>
              Ready to grow?
            </p>
            <h2 className="sec-title" style={{ textAlign: "center", margin: "0 auto 14px" }}>
              Start Your {r.serviceSlug ? service.label : "Digital"} Project in {city.name}
            </h2>
            <p className="loc-cta-note">Free consultation · No commitment · Reply {contact.responseTime}</p>
            <div className="loc-btns" style={{ justifyContent: "center" }}>
              <Link href={contactUrl} className="btn-primary">
                Get Free Quote →
              </Link>
              <Link href="/services" className="btn-outline">
                Explore All Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
