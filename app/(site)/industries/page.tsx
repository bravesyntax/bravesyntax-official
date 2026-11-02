import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Icon, { ICONS, PingDot, SectionBadge } from "@/components/ui/Icon";
import { INDUSTRIES } from "@/lib/industries";
import { pageMetadata, pageSchema } from "@/lib/seo";
import "./industries.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("industries");
}

// How we work — parallel principles, not a numbered sequence.
const PRINCIPLES = [
  {
    title: "We Learn Your Domain First",
    desc: "Before a single pixel, we map your buyers, competitors, and the words your customers actually use.",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    title: "We Design For Your Buyer",
    desc: "A B2B manufacturer and a DTC brand decide differently. We build for how your audience chooses.",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    title: "We Measure What Moves Revenue",
    desc: "Enquiries, sales, sign-ups — every build is tied to the metric that matters to your business.",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
];

const ALSO_SERVED = [
  "Logistics", "Automotive", "Legal", "Media & Publishing", "Fitness & Sports", "Beauty & Salon",
  "Travel & Tourism", "Agriculture", "Events", "Interior Design", "Consulting", "Photography",
];

export default async function IndustriesPage() {
  const schema = await pageSchema("industries");

  return (
    <div className="pg-industries">
      <JsonLd data={schema} />

      {/* ═══ HERO ═══ */}
      <section className="in-hero-section relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden" aria-label="Industries we serve">
        <div className="in-dots absolute inset-0" style={{ backgroundSize: "28px 28px" }} />
        <div className="in-fade-b absolute inset-0" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center mb-10">
            <div className="in-badge-pill inline-flex items-center gap-2.5 px-4 py-2 bg-zinc-900/80 border border-zinc-700/60 rounded-full backdrop-blur-sm">
              <PingDot />
              <span className="in-badge-text text-xs font-mono text-zinc-300">Built to fit your industry, not a template</span>
            </div>
          </div>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="in-t-p text-5xl lg:text-7xl font-display font-bold text-white leading-none mb-6">
              Built For
              <br />
              <span className="text-gradient">Your Industry</span>
            </h1>
            <p className="in-t-s text-lg text-zinc-400 font-mono max-w-2xl mx-auto leading-relaxed">
              We don&apos;t ship the same template twice. Every build is shaped around how your customers actually find, trust, and buy in your space.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ INDUSTRIES GRID ═══ */}
      <section className="pb-24 in-alt relative" aria-label="Industries we serve">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INDUSTRIES.map((ind, i) => (
              <article
                key={ind.title}
                className="in-card in-rise group bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-7 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="in-icon-box w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-5">
                  <Icon d={ind.icon} className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="in-t-p text-lg font-display font-bold text-white mb-2">{ind.title}</h2>
                <p className="in-t-s text-sm text-zinc-400 font-mono leading-relaxed mb-5 flex-1">{ind.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {ind.tags.map((t) => (
                    <span key={t} className="in-tag-pill px-2 py-0.5 text-[10px] font-mono bg-zinc-800/60 text-zinc-400 rounded">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="in-border border-t border-zinc-800/40 pt-4">
                  <Link
                    href={`/contact?ref=industries&service=${encodeURIComponent(ind.title)}`}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
                  >
                    Discuss a Project &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW WE WORK ═══ */}
      <section className="py-24 lg:py-32 relative overflow-hidden" aria-label="How we work">
        <div className="in-grid absolute inset-0" style={{ backgroundSize: "40px 40px" }} />
        <div className="in-fade absolute inset-0" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <SectionBadge>How We Work</SectionBadge>
            <h2 className="in-t-p text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              Same Craft,
              <br />
              <span className="text-gradient">Tuned to Your Space</span>
            </h2>
            <p className="in-t-s text-zinc-400 font-mono text-sm leading-relaxed">What stays constant no matter the industry we&apos;re building for.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PRINCIPLES.map((pr) => (
              <div key={pr.title} className="in-card group bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-7 hover:border-emerald-500/30 transition-all hover:-translate-y-1">
                <div className="in-icon-box w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-5">
                  <Icon d={pr.icon} className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="in-t-p text-base font-display font-bold text-white mb-2">{pr.title}</h3>
                <p className="in-t-s text-sm text-zinc-500 font-mono leading-relaxed">{pr.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ALSO SERVED ═══ */}
      <section className="py-24 in-alt relative" aria-label="Other industries">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="in-t-p text-3xl lg:text-4xl font-display font-bold text-white mb-4">Don&apos;t See Your Industry?</h2>
          <p className="in-t-s text-zinc-400 font-mono text-sm mb-10 leading-relaxed max-w-xl mx-auto">
            These are just the ones we work in most. If it lives on the web, we can build it &mdash; tell us about your industry.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {ALSO_SERVED.map((a) => (
              <span key={a} className="in-tag-pill px-3 py-1.5 text-xs font-mono bg-zinc-800/60 text-zinc-400 rounded-lg">
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="in-cta py-24 lg:py-32 relative overflow-hidden" aria-label="Start a project">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle,rgba(16,185,129,.1) 1px,transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="in-fade absolute inset-0" />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="in-t-p text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Let&apos;s Build For
            <br />
            <span className="text-gradient">Your Industry.</span>
          </h2>
          <p className="in-t-s text-zinc-400 font-mono mb-10 leading-relaxed">
            Tell us about your project &mdash; we&apos;ll send a proposal, fixed quote, and timeline, usually within 2 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact?ref=industries"
              className="group inline-flex items-center gap-2 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl transition-all shadow-[0_0_50px_rgba(16,185,129,.25)]"
            >
              Start a Project
              <Icon d={ICONS.arrowRight} className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <Link
              href="/portfolio"
              className="in-outline inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-400 font-mono text-sm rounded-xl transition-all hover:border-zinc-500 hover:text-white"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
