import type { Metadata } from "next";
import Link from "next/link";
import FaqList from "@/components/home/FaqList";
import { AboutAndCareers, CitiesServed, FeaturedWork, FreeTools, IndustriesGrid, LatestInsights } from "@/components/home/HomeSections";
import HomeEffects from "@/components/home/HomeEffects";
import ServicesAccordion from "@/components/home/ServicesAccordion";
import StickyCta from "@/components/home/StickyCta";
import JsonLd from "@/components/JsonLd";
import Icon, { SectionBadge } from "@/components/ui/Icon";
import { SITE_URL } from "@/lib/config";
import { pageMetadata, pageSchema } from "@/lib/seo";
import { getContactInfo, type ContactInfo } from "@/lib/contact";
import { getActiveJobs, getLatestPosts, getPortfolios } from "@/lib/content";
import { getActiveCities } from "@/lib/locations";
import { PDF_TOOL_COUNT } from "@/lib/navigation";
import { getActiveServices, type DbService } from "@/lib/services";
import "./home.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home");
}

const t1 = { color: "var(--bsh-t1)" };
const t2 = { color: "var(--bsh-t2)" };
const t3 = { color: "var(--bsh-t3)" };

const ARROW = "M13 7l5 5m0 0l-5 5m5-5H6";
const DEFAULT_ICON = "M13 10V3L4 14h7v7l9-11h-7z";

const TRUST_BADGES = [
  ["M5 13l4 4L19 7", "Custom-Built", "No templates, no shortcuts"],
  ["M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", "Direct Access", "Work with who's building it"],
  ["M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", "Ongoing Support", "Here after launch, too"],
];

const SERVICE_ICONS = [
  "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
];

const STEPS = [
  ["01", "Discovery", "Analyze goals, audience, competitors. Get a detailed brief and timeline before we code."],
  ["02", "Design", "High-fidelity Figma mockups. Interactive prototypes so you see exactly what you're getting."],
  ["03", "Development", "Pixel-perfect, clean code. Cross-browser testing, mobile-first, performance, accessibility."],
  ["04", "Launch", "Smooth deployment with zero downtime, plus training, documentation and 30–90 days of support."],
];

const COMMITMENTS = [
  ["M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", "Fixed-Price Quotes", "No surprise costs. What we quote is what you pay."],
  ["M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", "You Own Everything", "Full source code and design files. No lock-in."],
  ["M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", "One Direct Contact", "You work with the person building your project."],
  ["M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", "Milestone Check-Ins", "Real progress at each stage, not just a reveal."],
  ["M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", "Documented Handover", "Clear docs and a walkthrough when we ship."],
  ["M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", "Honest Scoping", "If something won't move the needle, we'll say so."],
];

const TECHS = [
  ["PHP", "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"],
  ["JavaScript", "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"],
  ["React", "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"],
  ["Tailwind CSS", "bg-sky-500/10 border-sky-500/20 text-sky-400"],
  ["WordPress", "bg-blue-500/10 border-blue-500/20 text-blue-400"],
  ["Shopify", "bg-green-500/10 border-green-500/20 text-green-400"],
  ["Figma", "bg-pink-500/10 border-pink-500/20 text-pink-400"],
  ["MySQL", "bg-orange-500/10 border-orange-500/20 text-orange-400"],
  ["Laravel", "bg-red-500/10 border-red-500/20 text-red-400"],
  ["Next.js", "bg-zinc-500/10 border-zinc-500/30 text-zinc-300"],
  ["Adobe XD", "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400"],
  ["Google Analytics", "bg-amber-500/10 border-amber-500/20 text-amber-400"],
  ["Vercel", "bg-zinc-500/10 border-zinc-500/30 text-zinc-300"],
  ["AWS", "bg-orange-500/10 border-orange-500/20 text-orange-300"],
  ["GitHub", "bg-zinc-500/10 border-zinc-500/30 text-zinc-300"],
];

const FAQS: [string, string][] = [
  ["How much does a website cost?", "A landing page or 3-page site starts at ₹8,000, a custom 5–10 page website is ₹20,000–₹60,000, and web apps or large e-commerce builds start at ₹60,000. You get a fixed quote once we understand your requirements — see Services for what each package includes."],
  ["How long does a project take?", "It depends on scope: landing pages usually take 3–5 days, business websites 1–3 weeks, and e-commerce or custom web apps 3–8 weeks. You get a milestone-based timeline before we start."],
  ["Do you work with international clients?", "Yes. We work remotely, communicate in English and adjust meeting times to your timezone."],
  ["What do you need to get started?", "Brand assets (logo, colors if you have them), your goals, and examples of designs you like. We handle the rest."],
  ["Can I get revisions?", "Yes. Every package includes revisions: 2 rounds on Starter, and unlimited rounds within the agreed scope on Professional and Enterprise."],
  ["Do you provide hosting and maintenance?", "Yes. We set up hosting (AWS, Vercel, Hostinger, etc.) and offer monthly maintenance packages for updates, backups, monitoring."],
  ["Are your PDF tools really free?", `Yes — ${PDF_TOOL_COUNT} PDF tools plus an AI background remover, 100% free, browser-based, local processing. No registration, no watermarks, no file limits.`],
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
    areaServed: ["IN", "GB", "US", "AE", "AU"],
    serviceType: services.map((x) => x.title),
    ...(c.socials.length ? { sameAs: c.socials.map((x) => x.url) } : {}),
  };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function HomePage() {
  const [schema, services, contact, projects, posts, jobs, cities] = await Promise.all([
    pageSchema("home"),
    getActiveServices(),
    getContactInfo(),
    getPortfolios(),
    getLatestPosts(3),
    getActiveJobs(),
    getActiveCities(16),
  ]);
  // Case studies with a public page, in the order set in Admin → Portfolio.
  const featuredWork = projects.filter((p) => p.slug).slice(0, 3);
  // The first six active services (Admin → Services, by sort order) are featured; the full list follows below.
  const top6 = services.slice(0, 6).map((s, i) => ({ ...s, icon: s.icon || SERVICE_ICONS[i] || DEFAULT_ICON }));
  const marquee = services.map((s) => s.title);

  return (
    <>
      <JsonLd data={[...schema, localBusinessSchema(contact, services)]} />
      <HomeEffects />

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 overflow-hidden" aria-label="Hero">
        <div className="bsh-dots-sm absolute inset-0 bsh-hero-parallax opacity-40" aria-hidden="true" data-parallax-speed="0.5" />
        <div className="bsh-fade-b absolute inset-0" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-[560px] h-[560px] bg-emerald-500/[.07] rounded-full blur-[120px] pointer-events-none bsh-hero-parallax" data-parallax-speed="0.3" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-emerald-600/[.05] rounded-full blur-[100px] pointer-events-none bsh-hero-parallax" data-parallax-speed="0.4" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center mb-10">
            <div className="bsh-hero-badge bsh-badge inline-flex items-center gap-2.5 px-4 py-2 rounded-full">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] sm:text-xs font-mono" style={{ color: "var(--bsh-badge-text)" }}>
                Available for new projects
              </span>
            </div>
          </div>

          <div className="text-center max-w-5xl mx-auto">
            <h1 className="bsh-hero-title text-5xl sm:text-6xl lg:text-8xl font-display font-bold leading-[1.05] tracking-tight mb-8" style={t1}>
              Build Digital
              <br />
              <span className="bsh-grad">Products That</span>
              <br />
              Convert &amp; Scale
            </h1>

            <p className="bsh-hero-desc text-lg lg:text-xl font-mono max-w-3xl mx-auto leading-relaxed mb-10" style={t2}>
              Strategic design and precise development for brands that want to stand out, grow fast, and dominate their market.
            </p>

            <div className="bsh-hero-buttons flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <Link
                href="/contact"
                className="bsh-btn-primary group inline-flex items-center gap-2.5 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl shadow-[0_0_40px_rgba(16,185,129,.25)]"
              >
                Start Your Project
                <Icon d={ARROW} className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </Link>
              <Link href="/portfolio" className="bsh-btn-outline inline-flex items-center gap-2 px-8 py-4 bg-transparent border font-mono font-semibold text-sm rounded-xl backdrop-blur-sm">
                View Our Work
              </Link>
            </div>

            <div className="bsh-hero-stats bsh-stat-bar grid grid-cols-3 gap-px rounded-2xl overflow-hidden border max-w-2xl mx-auto">
              {TRUST_BADGES.map(([icon, title, label]) => (
                <div key={title} className="bsh-stat-cell backdrop-blur-sm px-4 py-5 text-center flex flex-col items-center gap-2">
                  <Icon d={icon} className="w-5 h-5 text-emerald-400" />
                  <div className="text-sm lg:text-base font-display font-bold" style={t1}>
                    {title}
                  </div>
                  <div className="text-[10px] font-mono" style={t3}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className="bsh-mq-section border-y overflow-hidden py-4" aria-hidden="true">
        <div className="bsh-mq-fade-l absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" />
        <div className="bsh-mq-fade-r absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" />
        <div className="bsh-mq-track flex whitespace-nowrap gap-0">
          {[...marquee, ...marquee, ...marquee].map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-5 text-[11px] font-mono uppercase tracking-widest" style={t3}>
              <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ SERVICES ═══ */}
      <section id="services" className="py-24 lg:py-32 relative bsh-lazy" aria-label="Services">
        <div className="bsh-grid-md absolute inset-0" aria-hidden="true" />
        <div className="bsh-fade-b absolute inset-0" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14 bsh-reveal">
            <div className="max-w-xl">
              <SectionBadge>What We Build</SectionBadge>
              <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4" style={t1}>
                End-to-End <span className="bsh-grad">Design &amp; Dev</span>
              </h2>
              <p className="font-mono text-sm leading-relaxed" style={t2}>
                From concept to deployment. Design, development, deployment, and everything in between.
              </p>
            </div>
            <Link
              href="/services"
              className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-mono text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 px-5 py-2.5 rounded-lg transition-all"
            >
              All Services &rarr;
            </Link>
          </div>

          {/* Desktop card grid (hidden on mobile via CSS) */}
          <div className="bsh-grid-cards grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {top6.map((s, i) => (
              <article key={s.title} className={`bsh-card bsh-reveal bsh-reveal-stagger-${(i % 6) + 1} group relative border rounded-2xl p-6 backdrop-blur-sm cursor-default`}>
                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden rounded-tr-2xl pointer-events-none" aria-hidden="true">
                  <div className="absolute top-0 right-0 w-px h-6 bg-gradient-to-b from-emerald-500/40 to-transparent group-hover:from-emerald-400/60 transition-colors" />
                  <div className="absolute top-0 right-0 h-px w-6 bg-gradient-to-l from-emerald-500/40 to-transparent group-hover:from-emerald-400/60 transition-colors" />
                </div>
                <div className="mb-5 w-11 h-11 bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl flex items-center justify-center transition-all">
                  <Icon d={s.icon} className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-display font-semibold group-hover:text-emerald-300 transition-colors mb-2" style={t1}>
                  {s.title}
                </h3>
                <p className="text-xs font-mono leading-relaxed mb-5" style={t3}>
                  {s.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--bsh-border)" }}>
                  <span className="text-[10px] font-mono uppercase tracking-widest inline-flex items-center gap-1.5" style={t3}>
                    <span className="w-1 h-1 rounded-full bg-emerald-500/50" aria-hidden="true" />
                    {capitalize(s.category)}
                  </span>
                  <span className="text-emerald-500/40 group-hover:text-emerald-400 transition-colors text-base leading-none">&rarr;</span>
                </div>
              </article>
            ))}
          </div>

          {/* Mobile accordion (shown only on mobile via CSS) */}
          <ServicesAccordion items={top6} />

          <div className="mt-12 text-center bsh-reveal">
            <Link href="/contact" className="bsh-btn-primary inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl">
              Discuss Your Project
              <Icon d={ARROW} className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ WHY US ═══ */}
      <section className="py-24 lg:py-32 relative bsh-lazy" style={{ backgroundColor: "var(--bsh-bg-alt)" }} aria-label="Why choose Brave Syntax">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 bsh-reveal">
            <SectionBadge>Why Us</SectionBadge>
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4" style={t1}>
              Built Different,
              <br />
              <span className="bsh-grad">Delivered Better</span>
            </h2>
            <p className="font-mono text-sm leading-relaxed" style={t2}>
              Technical excellence meets creative design — products that don&apos;t just look good, they perform and convert.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              className="bsh-card-solid bsh-reveal lg:col-span-2 relative border rounded-2xl p-8 overflow-hidden group hover:border-emerald-500/30 transition-all duration-300"
              style={{ borderColor: "var(--bsh-border)", background: "var(--bsh-card-solid)" }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[.03] rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
              <div className="bsh-code-wrap relative mb-6 rounded-xl p-4 font-mono text-xs border">
                <div className="flex items-center gap-1.5 mb-3" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-2 text-[10px]" style={t3}>
                    brave-syntax.php
                  </span>
                </div>
                <div className="space-y-1 text-[11px]" aria-label="Code example">
                  <div>
                    <span className="bsh-ck">function</span> <span className="bsh-cf">deliver</span>
                    <span style={t2}>(</span>
                    <span className="bsh-cv">$project</span>
                    <span style={t2}>) {"{"}</span>
                  </div>
                  <div className="pl-4">
                    <span className="bsh-cc">{"// Clean code · On time · Within budget"}</span>
                  </div>
                  <div className="pl-4">
                    <span className="bsh-ckw">return</span> <span className="text-emerald-300">$this</span>
                    <span style={t2}>-&gt;</span>
                    <span className="text-yellow-300">buildExceptional</span>
                    <span style={t2}>($project);</span>
                  </div>
                  <div style={t2}>{"}"}</div>
                </div>
              </div>
              <h3 className="text-xl font-display font-bold group-hover:text-emerald-300 transition-colors mb-2" style={t1}>
                Clean Code. Real Results.
              </h3>
              <p className="font-mono text-sm leading-relaxed" style={t2}>
                Hand-crafted with semantic, maintainable code. No templates, no shortcuts — purpose-built solutions that perform.
              </p>
            </div>

            <div className="bsh-card bsh-reveal border rounded-2xl p-6 group">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-5">
                <Icon d="M13 10V3L4 14h7v7l9-11h-7z" className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-3xl font-display font-bold text-emerald-400 mb-1">3–5</div>
              <div className="text-xs font-mono mb-3" style={t3}>
                Days for a landing page
              </div>
              <h3 className="text-base font-display font-semibold group-hover:text-emerald-300 transition-colors mb-2" style={t1}>
                Lightning Fast
              </h3>
              <p className="text-xs font-mono leading-relaxed" style={t3}>
                Business websites in 1–3 weeks. A streamlined process gets you live quickly without cutting corners.
              </p>
            </div>

            <div className="bsh-card bsh-reveal border rounded-2xl p-6 group">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-5">
                <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-display font-semibold group-hover:text-emerald-300 transition-colors mb-2" style={t1}>
                Quick, Real Replies
              </h3>
              <p className="text-xs font-mono leading-relaxed" style={t3}>
                We reply {contact.responseTime} on WhatsApp, email or phone ({contact.hours}), and adjust meetings to your timezone.
              </p>
            </div>

            <div className="bsh-card bsh-reveal border rounded-2xl p-6 group">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-5">
                <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-display font-semibold group-hover:text-emerald-300 transition-colors mb-2" style={t1}>
                SEO-First
              </h3>
              <p className="text-xs font-mono leading-relaxed" style={t3}>
                Schema, Core Web Vitals, semantic HTML, fast load times baked in.
              </p>
            </div>

            <div className="bsh-card bsh-reveal border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[.08] to-transparent rounded-2xl p-6 group">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-5">
                <Icon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-xs font-mono text-emerald-600 mb-3 uppercase tracking-wider">Our Promise</div>
              <h3 className="text-base font-display font-semibold mb-2" style={t1}>
                Revisions Included
              </h3>
              <p className="text-xs font-mono leading-relaxed" style={t3}>
                Every package includes revision rounds, so what we ship matches what you pictured.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FeaturedWork projects={featuredWork} />
      <IndustriesGrid />

      {/* ═══ PROCESS ═══ */}
      <section id="process" className="py-24 lg:py-32 relative bsh-lazy overflow-hidden" aria-label="Our process">
        <div className="bsh-dots-md absolute inset-0" aria-hidden="true" />
        <div className="bsh-fade-b absolute inset-0" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 bsh-reveal">
            <SectionBadge>How It Works</SectionBadge>
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4" style={t1}>
              Our <span className="bsh-grad">4-Step Process</span>
            </h2>
            <p className="font-mono text-sm leading-relaxed" style={t2}>
              Clear steps, with your sign-off at each stage, so you always know where the project stands.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="hidden lg:block absolute top-[2.6rem] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent pointer-events-none" aria-hidden="true" />
            {STEPS.map(([n, title, desc], idx) => (
              <div key={n} className={`bsh-card bsh-reveal bsh-reveal-stagger-${idx + 1} group relative border rounded-2xl p-6 h-full`} role="article">
                <div className="bsh-step-num relative w-12 h-12 border-2 rounded-2xl flex items-center justify-center mb-5 z-10 transition-colors">
                  <span className="text-lg font-display font-bold text-emerald-400">{n}</span>
                </div>
                <h3 className="text-base font-display font-bold group-hover:text-emerald-300 transition-colors mb-3" style={t1}>
                  {title}
                </h3>
                <p className="text-xs font-mono leading-relaxed" style={t3}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW WE WORK ═══ */}
      <section className="py-24 lg:py-32 relative bsh-lazy overflow-hidden" style={{ backgroundColor: "var(--bsh-bg-alt)" }} aria-label="What working with us looks like">
        <div className="bsh-dots-md absolute inset-0" aria-hidden="true" />
        <div className="bsh-fade-b absolute inset-0" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 bsh-reveal">
            <SectionBadge>How We Work</SectionBadge>
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4" style={t1}>
              Straightforward,
              <br />
              <span className="bsh-grad">By Design</span>
            </h2>
            <p className="font-mono text-sm leading-relaxed" style={t2}>
              No jargon, no surprise invoices, no disappearing after launch. Here&apos;s what to expect.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMMITMENTS.map(([icon, title, desc], idx) => (
              <div key={title} className={`bsh-card bsh-reveal bsh-reveal-stagger-${(idx % 3) + 1} border rounded-2xl p-6 h-full flex flex-col`}>
                <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-5">
                  <Icon d={icon} className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-display font-semibold mb-2" style={t1}>
                  {title}
                </h3>
                <p className="text-xs font-mono leading-relaxed" style={t3}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FreeTools />
      <LatestInsights posts={posts} />

      {/* ═══ TECH STACK ═══ */}
      <section className="bsh-tech-section py-20 border-y bsh-lazy" aria-label="Technologies we use">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="bsh-tech-label text-center text-[10px] font-mono uppercase tracking-[.2em] mb-10">Technologies &amp; Platforms We Master</p>
          <div className="flex flex-wrap justify-center gap-3">
            {TECHS.map(([name, cls], i) => (
              <span key={name} className={`bsh-reveal bsh-reveal-stagger-${(i % 6) + 1} inline-flex items-center gap-2 px-4 py-2 ${cls} border rounded-lg text-xs font-mono font-medium`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <CitiesServed cities={cities} />
      <AboutAndCareers jobs={jobs} />

      {/* ═══ FAQ ═══ */}
      <section className="py-24 lg:py-32 relative bsh-lazy" aria-label="Frequently asked questions">
        <div className="bsh-grid-md absolute inset-0" style={{ backgroundSize: "40px 40px" }} aria-hidden="true" />
        <div className="bsh-fade-b absolute inset-0" aria-hidden="true" />

        <div className="relative max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 bsh-reveal">
            <SectionBadge>FAQ</SectionBadge>
            <h2 className="text-4xl font-display font-bold" style={t1}>
              Common <span className="bsh-grad">Questions</span>
            </h2>
          </div>
          <FaqList faqs={FAQS} />
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 lg:py-32 relative overflow-hidden" aria-label="Get started">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[260px] bg-emerald-500/[.07] rounded-full blur-[80px] pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center bsh-reveal">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
            <span className="text-xs font-mono text-emerald-400">Currently accepting new projects</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold mb-6 leading-tight" style={t1}>
            Ready to Build
            <br />
            <span className="bsh-grad">Something Great?</span>
          </h2>
          <p className="text-lg font-mono mb-10 max-w-2xl mx-auto leading-relaxed" style={t2}>
            Tell us about your project. We&apos;ll reply {contact.responseTime} with a tailored proposal, timeline, and transparent pricing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/contact"
              className="bsh-btn-primary group inline-flex items-center gap-2.5 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl shadow-[0_0_60px_rgba(16,185,129,.3)]"
            >
              Start Your Project
              <Icon d={ARROW} className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <Link href="/pdf-tools" className="bsh-btn-outline inline-flex items-center gap-2 px-8 py-4 border font-mono text-sm rounded-xl backdrop-blur-sm">
              Try Free PDF Tools
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 text-xs font-mono" style={t3}>
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
              <Icon d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" className="w-3.5 h-3.5" strokeWidth={2} />
              {contact.email}
            </a>
            <span className="hidden sm:inline" aria-hidden="true" style={{ color: "var(--bsh-border)" }}>
              ·
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {contact.address || "India"}
            </span>
            <span className="hidden sm:inline" aria-hidden="true" style={{ color: "var(--bsh-border)" }}>
              ·
            </span>
            <span className="flex items-center gap-2 text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              Reply {contact.responseTime}
            </span>
          </div>
        </div>
      </section>

      <StickyCta />
    </>
  );
}
