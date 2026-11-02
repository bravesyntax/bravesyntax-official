import { Brain, Handshake, Microscope, Sprout, Target, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Icon, { ICONS, PingDot, SectionBadge } from "@/components/ui/Icon";
import { SITE_URL } from "@/lib/config";
import { getContactInfo } from "@/lib/contact";
import { pageMetadata, pageSchema } from "@/lib/seo";
import "./about.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("about");
}

const CARD_STATS = [
  ["Direct Access", "No account managers", "Work with who builds it"],
  ["Fixed Quotes", "No hidden costs", "Price agreed before we start"],
  ["Full Stack", "Design + development", "One team, start to finish"],
  ["Post-Launch", "Support included", "We stick around after go-live"],
];

const FOCUS_AREAS = ["Design Quality", "Code Cleanliness", "Client Communication"];

const BELIEFS = [
  "Design and engineering are not separate disciplines — the best products treat them as one.",
  "Speed without quality is just expensive failure. We ship fast AND right.",
  "Clients aren't just payroll. They're collaborators whose success is our success.",
  "The best code is code you never have to read twice. We write for humans first.",
];

const TIMELINE = [
  ["Scope", "Every project starts with a clear, written brief", "What's being built, why, and how success is measured — agreed before any code is written."],
  ["Build", "Design and development, done together", "No handoff between separate design and dev teams losing details in translation."],
  ["Ship", "Launch with documentation, not a black box", "You get a walkthrough of what was built and how to manage it going forward."],
  ["Support", "Available after launch, not just before", "Questions and fixes after go-live are part of the deal, not a separate invoice."],
];

const VALUES = [
  [Zap, "Speed Is a Feature", "We believe fast delivery and high quality aren't mutually exclusive. Our processes are built to eliminate waste without cutting corners."],
  [Target, "Precision Over Perfection", "We ship great work on time, then iterate. Perfection is a moving target; precision is a discipline."],
  [Handshake, "Radical Transparency", "Fixed pricing, no hidden fees, honest timelines. If we mess up, we own it, fix it, and make it right."],
  [Microscope, "Craft at Every Level", "From pixel spacing to database indexing, we care about the details that most clients never see — because they make everything better."],
  [Sprout, "Client Growth = Our Growth", "We measure our success by our clients' results, not invoice count. Long-term relationships over short-term billing."],
  [Brain, "Always Learning", "The web moves fast. We dedicate time every week to learning new tools, patterns, and approaches so our clients always get current best practice."],
] as const;

const DIFFERENTIATORS = [
  ["No-template policy", "Every project is built from scratch. No drag-and-drop builders, no recycled themes. Your product is unique because your business is."],
  ["Senior-only execution", "Your work is done by our senior team, not outsourced or handed to juniors. The person in your kickoff call is the person building your product."],
  ["Flat pricing, zero surprises", "We quote a fixed price before we start. No time-and-materials billing, no scope creep invoices. What we quote is what you pay."],
  ["Built for performance", "Lighthouse scores of 90+ on every project. We optimise images, fonts, and JavaScript as standard. Fast sites rank better and convert better."],
  ["Handover & training included", "Every project includes documentation, CMS training, and a 30-day support window. We don't disappear after launch."],
  ["We speak plain English", "No buzzwords, no jargon. We explain technical decisions in language that makes sense, so you're always in control."],
];

const PROMISES = [
  "Fixed price agreed before work begins",
  "Revisions continue until you're happy",
  "You work directly with who builds it",
  "Support window included after launch",
];

const ENGAGEMENT: [string, string, string[]][] = [
  [
    "Before We Start",
    "We send a detailed brief template. Once you fill it in, we schedule a 30-min kickoff call, quote a fixed price, and agree a timeline. No work starts until you've approved everything in writing.",
    ["Discovery call", "Detailed brief", "Fixed quote", "Signed agreement"],
  ],
  [
    "During the Project",
    "Weekly progress updates via email or WhatsApp. A shared Notion board with tasks, status, and decisions. You can review designs before a single line of code is written.",
    ["Weekly updates", "Staging access", "Design sign-off", "Open Notion board"],
  ],
  [
    "After Launch",
    "30-day support window for bugs and tweaks. Full CMS training session (recorded). Documentation for your team. And a standing offer to help with anything new.",
    ["30-day support", "Video training", "Documentation", "Priority access"],
  ],
];

const ABOUT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Brave Syntax",
  description:
    "Brave Syntax is a full-service design and development studio based in Ghaziabad, India, offering web development, UI/UX design, Shopify, WordPress, and brand identity work.",
  url: `${SITE_URL}/about`,
  mainEntity: { "@type": "Organization", name: "Brave Syntax", foundingLocation: "Ghaziabad, India" },
};

export default async function AboutPage() {
  const [schema, contact] = await Promise.all([pageSchema("about"), getContactInfo()]);

  return (
    <div className="pg-about">
      <JsonLd data={[...schema, ABOUT_SCHEMA]} />

      {/* ═══ HERO ═══ */}
      <section className="ab-hero-section relative pt-32 pb-24 lg:pt-44 lg:pb-36 overflow-hidden" aria-label="About Brave Syntax">
        <div className="ab-hero-dots absolute inset-0" style={{ backgroundSize: "28px 28px" }} />
        <div className="ab-fade-b absolute inset-0" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center mb-10">
            <div className="ab-badge-pill inline-flex items-center gap-2.5 px-4 py-2 bg-zinc-900/80 border border-zinc-700/60 rounded-full backdrop-blur-sm">
              <PingDot />
              <span className="ab-badge-text text-xs font-mono text-zinc-300">Ghaziabad-based · Design &amp; Development Studio</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <SectionBadge className="">About Us</SectionBadge>
              <h1 className="ab-t-primary text-5xl lg:text-7xl font-display font-bold text-white leading-none">
                We Build
                <br />
                <span className="text-gradient">Digital Things</span>
                <br />
                That Last
              </h1>
              <p className="ab-t-secondary text-lg text-zinc-400 font-mono leading-relaxed max-w-lg">
                Brave Syntax is a full-service design &amp; development studio from Ghaziabad, India. We craft websites, brands, and tools for ambitious
                businesses — ones that care about quality, speed, and conversion.
              </p>
              <p className="ab-t-muted text-sm text-zinc-500 font-mono leading-relaxed max-w-lg">
                From scrappy startup landing pages to full e-commerce builds, every project gets the same attention to detail — every pixel, every function,
                built with intent.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl transition-all shadow-[0_0_40px_rgba(16,185,129,.2)]"
                >
                  Work With Us &rarr;
                </Link>
                <Link
                  href="/portfolio"
                  className="ab-outline-btn inline-flex items-center gap-2 px-6 py-3 border border-zinc-700 text-zinc-300 font-mono text-sm rounded-xl transition-all hover:border-zinc-500 hover:text-white"
                >
                  See Our Work
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="ab-card relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/60 rounded-3xl p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/8 rounded-full blur-2xl pointer-events-none" />
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {CARD_STATS.map(([n, l, sub]) => (
                    <div key={n} className="ab-stat-card bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                      <div className="text-sm font-display font-bold text-emerald-400 mb-0.5">{n}</div>
                      <div className="ab-t-primary text-xs font-mono font-semibold text-white">{l}</div>
                      <div className="ab-t-muted text-[10px] font-mono text-zinc-600 mt-0.5">{sub}</div>
                    </div>
                  ))}
                </div>
                {FOCUS_AREAS.map((m) => (
                  <div key={m} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 text-xs font-mono mb-1">
                      <Icon d={ICONS.check} className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" strokeWidth={2.5} />
                      <span className="ab-t-secondary text-zinc-400">{m} — non-negotiable on every project</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ OUR STORY ═══ */}
      <section className="py-24 lg:py-32 relative" aria-label="Our story">
        <div className="ab-grid-lg absolute inset-0" style={{ backgroundSize: "48px 48px" }} />
        <div className="ab-fade-tb absolute inset-0" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <SectionBadge className="mb-6">Our Story</SectionBadge>
              <h2 className="ab-t-primary text-4xl lg:text-5xl font-display font-bold text-white mb-6">
                How We
                <br />
                <span className="text-gradient">Actually Work</span>
              </h2>
              <div className="space-y-5 ab-t-secondary text-zinc-400 font-mono text-sm leading-relaxed">
                <p>
                  Brave Syntax is a Ghaziabad-based design &amp; development studio built on a simple conviction: small and growing businesses deserve the
                  same quality of digital work as enterprise brands, without the enterprise price tag or the layers of account managers.
                </p>
                <p>
                  The name comes from the belief that writing code is an act of bravery: you&apos;re translating messy human ideas into precise machine logic,
                  often under pressure, always under scrutiny. And syntax is the language that bridges the two worlds.
                </p>
                <p>Every project — big or small — gets worked on directly, with clear communication and no disappearing after launch.</p>
              </div>

              <div className="mt-8 space-y-3">
                {BELIEFS.map((belief) => (
                  <div key={belief} className="flex items-start gap-3">
                    <div className="ab-check-bg mt-0.5 w-5 h-5 bg-emerald-500/15 border border-emerald-500/25 rounded-md flex items-center justify-center flex-shrink-0">
                      <Icon d={ICONS.check} className="w-3 h-3 text-emerald-400" strokeWidth={3} />
                    </div>
                    <p className="ab-t-secondary text-xs text-zinc-500 font-mono leading-relaxed">{belief}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="ab-timeline-line absolute left-6 top-0 bottom-0 w-px bg-zinc-800/60" />
              <div className="space-y-6 pl-16">
                {TIMELINE.map(([tag, title, desc]) => (
                  <div key={tag} className="relative group">
                    <div className="ab-timeline-dot absolute -left-10 top-4 w-4 h-4 rounded-full bg-zinc-900 border-2 border-emerald-500/40 group-hover:border-emerald-400 transition-colors" />
                    <div className="ab-timeline-item bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-5 hover:border-emerald-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-emerald-400 font-mono font-bold text-sm">{tag}</span>
                        <span className="text-zinc-700 text-xs">·</span>
                        <span className="ab-t-primary text-xs font-mono font-semibold text-white">{title}</span>
                      </div>
                      <p className="ab-t-muted text-[11px] font-mono text-zinc-600 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VALUES ═══ */}
      <section className="pt-24 lg:pt-32 ab-section-alt relative" aria-label="Our values">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <SectionBadge>What We Stand For</SectionBadge>
            <h2 className="ab-t-primary text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              The Values Behind
              <br />
              <span className="text-gradient">Every Decision</span>
            </h2>
            <p className="ab-t-secondary text-zinc-400 font-mono text-sm leading-relaxed">
              These aren&apos;t posters on a wall — they&apos;re the principles that shape how we hire, how we work, and how we measure success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map(([ValueIcon, title, desc]) => (
              <div
                key={title}
                className="ab-value-card group bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                  <ValueIcon className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                </span>
                <h3 className="ab-t-primary text-base font-display font-bold text-white group-hover:text-emerald-300 transition-colors mb-2">{title}</h3>
                <p className="ab-t-muted text-xs text-zinc-500 font-mono leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY CLIENTS CHOOSE US ═══ */}
      <section className="py-24 lg:py-32 ab-section-alt relative" aria-label="Why clients choose Brave Syntax">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionBadge className="mb-6">Why Choose Us</SectionBadge>
              <h2 className="ab-t-primary text-4xl lg:text-5xl font-display font-bold text-white mb-8">
                What Makes Us
                <br />
                <span className="text-gradient">Different</span>
              </h2>
              <div className="space-y-5">
                {DIFFERENTIATORS.map(([t, d]) => (
                  <div key={t} className="flex gap-4 group">
                    <div className="ab-check-bg flex-shrink-0 w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mt-0.5">
                      <Icon d={ICONS.check} className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="ab-t-primary text-sm font-mono font-semibold text-white mb-1">{t}</div>
                      <p className="ab-t-muted text-xs text-zinc-500 font-mono leading-relaxed">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="ab-card-accent relative bg-gradient-to-br from-emerald-500/8 to-transparent border border-emerald-500/15 rounded-3xl p-8">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative space-y-6">
                  <h3 className="ab-t-primary text-xl font-display font-bold text-white">Our Promise</h3>
                  <p className="ab-t-secondary text-sm font-mono text-zinc-400 leading-relaxed">
                    Every project we take on gets the same attention whether it&apos;s an ₹8,000 landing page or a ₹5,00,000 SaaS platform. The scale changes. The care
                    doesn&apos;t.
                  </p>
                  <div className="space-y-4 pt-2">
                    {PROMISES.map((l) => (
                      <div key={l} className="flex items-center gap-3 py-3 border-b border-emerald-500/10 last:border-0 ab-border">
                        <Icon d={ICONS.check} className="w-4 h-4 text-emerald-400 flex-shrink-0" strokeWidth={2.5} />
                        <span className="ab-t-secondary text-xs font-mono text-zinc-400">{l}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/portfolio" className="inline-flex items-center gap-2 text-sm font-mono text-emerald-400 hover:text-emerald-300 transition-colors">
                    Browse our work &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WORKING WITH US ═══ */}
      <section className="py-24 lg:py-32 relative overflow-hidden" aria-label="How we work">
        <div className="ab-grid-lg absolute inset-0" style={{ backgroundSize: "40px 40px" }} />
        <div className="ab-fade-tb absolute inset-0" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <SectionBadge>Working With Us</SectionBadge>
            <h2 className="ab-t-primary text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              What to Expect
              <br />
              <span className="text-gradient">From Day One</span>
            </h2>
            <p className="ab-t-secondary text-zinc-400 font-mono text-sm leading-relaxed">
              Here&apos;s exactly how every engagement works — no surprises, no ambiguity.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {ENGAGEMENT.map(([title, desc, bullets]) => (
              <div key={title} className="ab-card group bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-7 hover:border-emerald-500/30 transition-all duration-300">
                <h3 className="ab-t-primary text-base font-display font-bold text-white group-hover:text-emerald-300 transition-colors mb-3">{title}</h3>
                <p className="ab-t-secondary text-xs text-zinc-400 font-mono leading-relaxed mb-5">{desc}</p>
                <ul className="space-y-2">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="ab-t-muted text-zinc-500">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="ab-cta-section py-24 lg:py-32 relative overflow-hidden" aria-label="Get in touch">
        <div className="ab-cta-dots absolute inset-0" style={{ backgroundSize: "28px 28px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="ab-fade-tb absolute inset-0" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 border border-zinc-700/60 rounded-full backdrop-blur-sm mb-8">
            <PingDot />
            <span className="ab-badge-text text-xs font-mono text-zinc-300">Currently accepting new projects</span>
          </div>

          <h2 className="ab-t-primary text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight">
            Let&apos;s Build Something
            <br />
            <span className="text-gradient">You&apos;re Proud Of</span>
          </h2>
          <p className="ab-t-secondary text-lg text-zinc-400 font-mono mb-10 max-w-2xl mx-auto leading-relaxed">
            Tell us about your project. We&apos;ll reply {contact.responseTime} with a clear proposal, honest timeline, and transparent pricing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2.5 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl transition-all shadow-[0_0_50px_rgba(16,185,129,.25)] hover:shadow-[0_0_70px_rgba(16,185,129,.4)]"
            >
              Start a Project
              <Icon d={ICONS.arrowRight} className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <Link
              href="/services"
              className="ab-outline-btn inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-400 font-mono text-sm rounded-xl transition-all hover:border-zinc-500 hover:text-white"
            >
              Explore Services
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs font-mono text-zinc-600">
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
              <Icon d={ICONS.mail} className="w-3.5 h-3.5" strokeWidth={2} />
              {contact.email}
            </a>
            <span className="hidden sm:inline text-zinc-800">·</span>
            <span className="flex items-center gap-2">
              <Icon d={ICONS.pin} className="w-3.5 h-3.5" strokeWidth={2} />
              {contact.address || "India"}
            </span>
            <span className="hidden sm:inline text-zinc-800">·</span>
            <span className="flex items-center gap-2 text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Reply {contact.responseTime}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
