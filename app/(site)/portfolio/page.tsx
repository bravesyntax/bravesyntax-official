import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import JsonLd from "@/components/JsonLd";
import PortfolioGrid, { FilteredPortfolioGrid, type PortfolioCard } from "@/components/portfolio/PortfolioGrid";
import Icon, { ICONS, PingDot, SectionBadge } from "@/components/ui/Icon";
import { SITE_URL } from "@/lib/config";
import { getPortfolios, splitList } from "@/lib/content";
import { pageMetadata, pageSchema } from "@/lib/seo";
import "./portfolio.css";
import { absoluteMediaUrl } from "@/lib/media";

export async function generateMetadata(): Promise<Metadata> {
  // ?filter= tabs show subsets of the same list, so they all share one canonical.
  return pageMetadata("portfolio");
}

const RESULTS = [
  ["M13 10V3L4 14h7v7l9-11h-7z", "Page Speed", "Optimized images, minimal JS, fast first paint"],
  ["M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", "Conversion-Focused", "Layouts built around your enquiry funnel, not just looks"],
  [
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    "Accessible by Default",
    "Semantic HTML, proper contrast, keyboard navigation",
  ],
  [
    "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3c0-1.657-3.134-3-7-3s-7 1.343-7 3v2h14v-2z",
    "Long-Term Partner",
    "Support after launch, not just at handover",
  ],
];

export default async function PortfolioPage() {
  const [rows, schema] = await Promise.all([getPortfolios(), pageSchema("portfolio")]);

  const projects: PortfolioCard[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug || null,
    cat: r.category,
    tags: splitList(r.tags),
    desc: r.description,
    year: r.year,
    image: r.image || null,
    liveUrl: r.live_url || null,
  }));

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
    <div className="pg-portfolio">
      <JsonLd data={collectionSchema ? [...schema, collectionSchema] : schema} />

      {/* ═══ HERO ═══ */}
      <section className="pf-hero-section relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden" aria-label="Portfolio">
        <div className="pf-dots absolute inset-0" style={{ backgroundSize: "28px 28px" }} />
        <div className="pf-fade-b absolute inset-0" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center mb-10">
            <div className="pf-badge-pill inline-flex items-center gap-2.5 px-4 py-2 bg-zinc-900/80 border border-zinc-700/60 rounded-full backdrop-blur-sm">
              <PingDot />
              <span className="pf-badge-text text-xs font-mono text-zinc-300">Selected work — design &amp; development</span>
            </div>
          </div>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="pf-t-p text-5xl lg:text-7xl font-display font-bold text-white leading-none mb-6">
              Work That
              <br />
              <span className="text-gradient">Speaks for Itself</span>
            </h1>
            <p className="pf-t-s text-lg text-zinc-400 font-mono max-w-2xl mx-auto leading-relaxed">
              A curated selection of projects across design, development, and branding. Every piece here was designed and built by us.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ FILTER + GRID ═══ */}
      <section className="pf2-sec pf2-sec-alt pb-24" id="portfolioGrid">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Suspense fallback={<PortfolioGrid projects={projects} filter="all" />}>
            <FilteredPortfolioGrid projects={projects} />
          </Suspense>
        </div>
      </section>

      {/* ═══ RESULTS ═══ */}
      <section className="py-24 lg:py-32 relative overflow-hidden" aria-label="Results">
        <div className="pf-grid absolute inset-0" style={{ backgroundSize: "40px 40px" }} />
        <div className="pf-fade absolute inset-0" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <SectionBadge>Results We Deliver</SectionBadge>
            <h2 className="pf-t-p text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              Numbers Behind
              <br />
              <span className="text-gradient">The Work</span>
            </h2>
            <p className="pf-t-s text-zinc-400 font-mono text-sm leading-relaxed">What every project is built around, regardless of size or budget.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {RESULTS.map(([icon, title, desc]) => (
              <div key={title} className="pf-card group bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 text-center hover:border-emerald-500/30 transition-all hover:-translate-y-1">
                <div className="w-11 h-11 mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Icon d={icon} className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-base font-display font-bold text-white mb-2">{title}</div>
                <p className="pf-t-s text-xs text-zinc-500 font-mono leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SEE THE REAL WORK ═══ */}
      <section className="py-20 pf-alt relative" aria-label="See the real work">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="pf-t-p text-2xl lg:text-3xl font-display font-bold text-white mb-4">No Fake Reviews Here</h2>
          <p className="pf-t-s text-zinc-400 font-mono text-sm leading-relaxed">
            Where a project has a live URL above, click through and see it running for yourself — that&apos;s more useful than any quote we could put on this
            page.
          </p>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="pf-cta py-24 lg:py-32 relative overflow-hidden" aria-label="Start a project">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle,rgba(16,185,129,.1) 1px,transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="pf-fade absolute inset-0" />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="pf-t-p text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Like What You See?
            <br />
            <span className="text-gradient">Let&apos;s Build Yours.</span>
          </h2>
          <p className="pf-t-s text-zinc-400 font-mono mb-10 leading-relaxed">Every one of these projects started with a simple email. Yours could be next.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl transition-all shadow-[0_0_50px_rgba(16,185,129,.25)]"
            >
              Start a Project
              <Icon d={ICONS.arrowRight} className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <Link
              href="/services"
              className="pf-outline inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-400 font-mono text-sm rounded-xl transition-all hover:border-zinc-500 hover:text-white"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
