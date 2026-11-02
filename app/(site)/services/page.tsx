import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import JsonLd from "@/components/JsonLd";
import ServicesFaq from "@/components/services/ServicesFaq";
import ServicesGrid, { FilteredServicesGrid } from "@/components/services/ServicesGrid";
import Icon, { ICONS, PingDot, SectionBadge } from "@/components/ui/Icon";
import { pageMetadata, pageSchema } from "@/lib/seo";
import { getActiveServices } from "@/lib/services";
import "./services.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("services");
}

const HIGHLIGHTS = [
  ["✓ Fixed pricing", "No hourly billing"],
  ["✓ Senior team", "No juniors, no outsourcing"],
  ["✓ Fast delivery", "3–14 day turnarounds"],
  ["✓ Revisions included", "In every package"],
];

type Tier = { tier: string; price: string; tagline: string; features: string[]; popular?: boolean; cta: string };

const TIERS: Tier[] = [
  {
    tier: "Starter",
    price: "₹8,000 – ₹20,000",
    tagline: "Perfect for solopreneurs & small businesses.",
    features: ["Landing page or 3-page website", "Mobile-responsive design", "Basic SEO setup", "Contact form integration", "2 rounds of revisions", "7-day delivery", "30-day support"],
    cta: "Get Started",
  },
  {
    tier: "Professional",
    price: "₹20,000 – ₹60,000",
    tagline: "Our most popular package for growing businesses.",
    features: ["5–10 page custom website", "UI/UX design from scratch", "Advanced SEO + schema", "CMS integration (WP/Shopify)", "Performance optimisation", "Unlimited revisions", "60-day support", "Brand guidelines"],
    popular: true,
    cta: "Most Popular →",
  },
  {
    tier: "Enterprise",
    price: "₹60,000+",
    tagline: "For large-scale platforms, SaaS, and enterprise.",
    features: ["Custom web application", "Full-stack development", "Database architecture", "API integrations", "Load testing & DevOps", "Project manager assigned", "90-day SLA support", "NDA available"],
    cta: "Discuss Project",
  },
];

const STEPS = [
  ["01", "You tell us what you need", "Fill out our brief form or send an email."],
  ["02", "We send a fixed quote", "Within 2 hours — detailed scope, fixed price, realistic timeline."],
  ["03", "You approve & we begin", "Design concepts within 48 hours."],
  ["04", "We refine it together", "Weekly check-ins, staging access and revision rounds built into the plan."],
  ["05", "We launch & support you", "30–90 days of support, training, and documentation."],
];

const PROCESS_POINTS = [
  "On-Time Delivery — we build in buffer, not excuses",
  "Early Design Review — concepts before the finish line",
  "Revisions Until Happy — we iterate until it's right",
  "Built for the Long Term — not a one-project vendor",
  "Fast Replies — usually the same business day",
];

const FAQS: [string, string][] = [
  ["Do you work on a fixed price or hourly rate?", "Always fixed price. We quote before we start and stick to it."],
  ["What's your minimum project size?", "No strict minimum. Resume designs start at ₹1,500, landing pages at ₹8,000."],
  ["Can I see examples of past work?", "Yes — visit our portfolio page for selected case studies."],
  ["Do you offer monthly retainers?", "Yes. Maintenance retainers start at ₹5,000/month."],
  ["How do you handle revisions?", "Design revisions are unlimited within the agreed brief."],
  ["Do you sign NDAs?", "Yes, for all enterprise and Professional-tier projects."],
  ["Can you take over someone else's project?", "Yes — we audit, assess, and quote for fixes or a rebuild."],
];

export default async function ServicesPage() {
  const [services, schema] = await Promise.all([getActiveServices(), pageSchema("services")]);

  return (
    <div className="pg-services">
      <JsonLd data={schema} />

      {/* ═══ HERO ═══ */}
      <section className="sv-hero-section relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden" aria-label="Services">
        <div className="sv-dots absolute inset-0" style={{ backgroundSize: "28px 28px" }} />
        <div className="sv-fade-b absolute inset-0" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center mb-10">
            <div className="sv-badge-pill inline-flex items-center gap-2.5 px-4 py-2 bg-zinc-900/80 border border-zinc-700/60 rounded-full backdrop-blur-sm">
              <PingDot />
              <span className="sv-badge-text text-xs font-mono text-zinc-300">{services.length}+ services · Design &amp; Development</span>
            </div>
          </div>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="sv-t-p text-5xl lg:text-7xl font-display font-bold text-white leading-none mb-6">
              Everything You Need
              <br />
              <span className="text-gradient">Under One Roof</span>
            </h1>
            <p className="sv-t-s text-lg text-zinc-400 font-mono max-w-2xl mx-auto leading-relaxed mb-10">
              From a single landing page to a full e-commerce empire — we handle design, development, branding, and everything between. Fixed prices, senior
              execution, zero surprises.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {HIGHLIGHTS.map(([t, s]) => (
                <div key={t} className="sv-card inline-flex flex-col items-center px-5 py-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
                  <span className="text-emerald-400 text-xs font-mono font-bold">{t}</span>
                  <span className="sv-t-m text-zinc-600 text-[10px] font-mono">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FILTER + SERVICES GRID ═══ */}
      <section className="pb-10 relative sv-alt" id="servicesGrid">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Suspense fallback={<ServicesGrid services={services} filter="all" />}>
            <FilteredServicesGrid services={services} />
          </Suspense>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="py-24 lg:py-32 relative" aria-label="Pricing">
        <div className="sv-grid absolute inset-0" style={{ backgroundSize: "40px 40px" }} />
        <div className="sv-fade absolute inset-0" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <SectionBadge>Transparent Pricing</SectionBadge>
            <h2 className="sv-t-p text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              Simple,<span className="text-gradient"> Fixed Pricing</span>
            </h2>
            <p className="sv-t-s text-zinc-400 font-mono text-sm leading-relaxed">No hourly rates, no surprise invoices. All prices in INR.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TIERS.map((t) => (
              <div
                key={t.tier}
                className={`${t.popular ? "sv-pricing-popular sv-pricing-card" : "sv-pricing-card"} group relative bg-zinc-900/50 border ${
                  t.popular ? "border-emerald-500/40" : "border-zinc-800/60"
                } rounded-2xl p-7 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 flex flex-col`}
              >
                {t.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-mono font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-5">
                  <div className="sv-t-p text-lg font-display font-bold text-white mb-1">{t.tier}</div>
                  <div className="text-2xl font-display font-bold text-emerald-400 mb-2">{t.price}</div>
                  <p className="sv-t-s text-xs font-mono text-zinc-500 leading-relaxed">{t.tagline}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs font-mono">
                      <Icon d={ICONS.check} className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="sv-t-s text-zinc-400">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/contact?plan=${encodeURIComponent(t.tier)}`}
                  className={`block text-center py-3 rounded-xl font-mono font-bold text-sm transition-all ${
                    t.popular
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,.3)]"
                      : "border border-zinc-700 hover:border-emerald-500/50 text-zinc-300 hover:text-white sv-outline-btn"
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center sv-t-m text-zinc-600 text-xs font-mono mt-8">
            All prices are starting rates.{" "}
            <Link href="/contact" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
              Get a free custom quote →
            </Link>
          </p>
        </div>
      </section>

      {/* ═══ HOW WE SCOPE ═══ */}
      <section className="py-24 lg:py-32 sv-alt relative" aria-label="How it works">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionBadge className="mb-6">How It Works</SectionBadge>
              <h2 className="sv-t-p text-4xl lg:text-5xl font-display font-bold text-white mb-6">
                From Enquiry to
                <br />
                <span className="text-gradient">Live in Days</span>
              </h2>
              <div className="space-y-5">
                {STEPS.map(([n, t, d]) => (
                  <div key={n} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-mono font-bold text-emerald-400">{n}</span>
                    </div>
                    <div>
                      <div className="sv-t-p text-sm font-mono font-semibold text-white mb-1">{t}</div>
                      <p className="sv-t-m text-xs text-zinc-500 font-mono leading-relaxed">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="sv-card relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/60 rounded-3xl p-8">
              <h3 className="sv-t-p text-lg font-display font-bold text-white mb-6">Why Our Process Works</h3>
              <div className="space-y-5">
                {PROCESS_POINTS.map((l) => (
                  <div key={l} className="flex items-center gap-4 py-3 sv-border border-b border-zinc-800/50 last:border-0">
                    <Icon d={ICONS.check} className="w-5 h-5 text-emerald-400 flex-shrink-0" strokeWidth={2} />
                    <span className="sv-t-s text-xs font-mono text-zinc-400">{l}</span>
                  </div>
                ))}
              </div>
              <Link href="/contact" className="mt-6 block text-center py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl transition-all">
                Start Now &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-24 lg:py-32 relative" aria-label="FAQ">
        <div className="sv-dots absolute inset-0" style={{ backgroundSize: "32px 32px" }} />
        <div className="sv-fade absolute inset-0" />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="sv-t-p text-4xl font-display font-bold text-white mb-3">
              Service <span className="text-gradient">FAQ</span>
            </h2>
          </div>
          <ServicesFaq faqs={FAQS} />
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="sv-cta py-24 lg:py-32 relative overflow-hidden" aria-label="Get started">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle,rgba(16,185,129,.1) 1px,transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="sv-fade absolute inset-0" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="sv-t-p text-4xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight">
            Don&apos;t See What
            <br />
            <span className="text-gradient">You Need?</span>
          </h2>
          <p className="sv-t-s text-lg text-zinc-400 font-mono mb-10 max-w-xl mx-auto">
            We take on custom projects too. Tell us your idea and we&apos;ll figure out how to build it together.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl transition-all shadow-[0_0_50px_rgba(16,185,129,.25)]"
            >
              Discuss Your Project
              <Icon d={ICONS.arrowRight} className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <Link
              href="/portfolio"
              className="sv-outline-btn inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-400 font-mono text-sm rounded-xl transition-all hover:border-zinc-500 hover:text-white"
            >
              See Our Portfolio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
