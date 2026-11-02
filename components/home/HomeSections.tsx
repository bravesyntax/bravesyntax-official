import { ArrowRight, ArrowUpRight, Briefcase, Clock, Eraser, FileText, MapPin, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SectionBadge } from "@/components/ui/Icon";
import { capitalize, categoryLabel, formatDate, type BlogPost, type Portfolio } from "@/lib/content";
import { INDUSTRIES } from "@/lib/industries";
import { mediaUrl } from "@/lib/media";
import { PDF_TOOL_COUNT, PDF_TOOLS } from "@/lib/navigation";

// Home page sections that showcase the rest of the site: case studies, industries, free tools, the blog,
// cities served, about and careers. Everything comes from the same data as the pages they link to.

const t1 = { color: "var(--bsh-t1)" };
const t2 = { color: "var(--bsh-t2)" };
const t3 = { color: "var(--bsh-t3)" };
const alt = { backgroundColor: "var(--bsh-bg-alt)" };
const border = { borderColor: "var(--bsh-border)" };

function Header({ badge, title, accent, text, href, cta }: { badge: string; title: string; accent: string; text: string; href: string; cta: string }) {
  return (
    <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end bsh-reveal">
      <div className="max-w-xl">
        <SectionBadge>{badge}</SectionBadge>
        <h2 className="mb-4 font-display text-4xl font-bold lg:text-5xl" style={t1}>
          {title} <span className="bsh-grad">{accent}</span>
        </h2>
        <p className="font-mono text-sm leading-relaxed" style={t2}>
          {text}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg border border-emerald-500/30 px-5 py-2.5 font-mono text-sm text-emerald-400 transition-all hover:border-emerald-400/50 hover:text-emerald-300"
      >
        {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

/* ═══ FEATURED WORK ═══ */
export function FeaturedWork({ projects }: { projects: Portfolio[] }) {
  if (!projects.length) return null;
  return (
    <section className="relative py-24 lg:py-32 bsh-lazy" aria-label="Featured work">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <Header badge="Featured Work" title="Recent" accent="Work" text="A selection of websites and stores we've designed and built." href="/portfolio" cta="All projects" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const metrics = [p.metric_1, p.metric_2, p.metric_3].filter(Boolean) as string[];
            return (
              <Link
                key={p.id}
                href={`/portfolio/${p.slug}`}
                className={`bsh-card bsh-reveal bsh-reveal-stagger-${i + 1} group flex flex-col overflow-hidden rounded-2xl border`}
              >
                <div className="relative aspect-[16/10] overflow-hidden" style={alt}>
                  {p.image ? (
                    <Image
                      src={mediaUrl("portfolio", p.image)}
                      alt={p.title}
                      fill
                      sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-3xl font-bold text-emerald-500/30">{p.title.slice(0, 2)}</div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur">{capitalize(p.category)}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-2 font-display text-lg font-semibold transition-colors group-hover:text-emerald-300" style={t1}>
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="mb-4 line-clamp-2 font-mono text-xs leading-relaxed" style={t3}>
                      {p.description}
                    </p>
                  )}
                  {metrics.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {metrics.map((m) => (
                        <span key={m} className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1.5 border-t pt-4 font-mono text-xs text-emerald-400" style={border}>
                    View project <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══ INDUSTRIES ═══ */
export function IndustriesGrid() {
  return (
    <section className="relative py-24 lg:py-32 bsh-lazy" style={alt} aria-label="Industries we serve">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Header badge="Industries" title="Built for" accent="Your Industry" text="We learn how your market buys, then design around it — from storefronts to patient portals." href="/industries" cta="All industries" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => (
            <Link key={ind.title} href="/industries" className={`bsh-card bsh-reveal bsh-reveal-stagger-${(i % 3) + 1} group flex gap-4 rounded-2xl border p-5`}>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  {ind.icon.map((d) => (
                    <path key={d} d={d} />
                  ))}
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="mb-1 font-display text-base font-semibold transition-colors group-hover:text-emerald-300" style={t1}>
                  {ind.title}
                </h3>
                <p className="line-clamp-2 font-mono text-xs leading-relaxed" style={t3}>
                  {ind.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ FREE TOOLS ═══ */
export function FreeTools() {
  return (
    <section className="relative py-24 lg:py-32 bsh-lazy" aria-label="Free tools">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-5 lg:gap-14">
          <div className="lg:col-span-2 lg:sticky lg:top-28 bsh-reveal">
            <SectionBadge>Free Tools</SectionBadge>
            <h2 className="mb-4 font-display text-4xl font-bold leading-tight lg:text-5xl" style={t1}>
              Free Tools, <span className="bsh-grad">No Sign-Up</span>
            </h2>
            <p className="mb-6 font-mono text-sm leading-relaxed" style={t2}>
              {PDF_TOOL_COUNT} PDF tools and an AI background remover that run right in your browser. Your files never leave your device — no watermarks, no limits.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/pdf-tools" className="bsh-btn-primary inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-mono text-sm font-bold text-black hover:bg-emerald-400">
                All {PDF_TOOL_COUNT} PDF tools <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/bg-remover" className="bsh-btn-outline inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-mono text-sm font-semibold">
                Background remover
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3">
            <Link
              href="/bg-remover"
              className="bsh-reveal group relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[.12] to-transparent p-5 sm:col-span-2"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/20">
                  <Eraser className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold" style={t1}>
                      AI Background Remover
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                      <Sparkles className="h-3 w-3" aria-hidden="true" /> AI
                    </span>
                  </div>
                  <p className="font-mono text-xs leading-relaxed" style={t3}>
                    Remove the background from any photo in seconds — product shots, portraits, logos.
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-emerald-500/50 transition-colors group-hover:text-emerald-400" aria-hidden="true" />
              </div>
            </Link>
            {PDF_TOOLS.map((tool, i) => (
              <Link key={tool.slug} href={`/pdf-tools?tool=${tool.slug}`} className={`bsh-card bsh-reveal bsh-reveal-stagger-${(i % 4) + 1} group flex items-center gap-3 rounded-xl border p-4`}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                  <FileText className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-mono text-sm font-medium transition-colors group-hover:text-emerald-300" style={t1}>
                    {tool.name}
                  </h3>
                  <p className="truncate font-mono text-[11px]" style={t3}>
                    {tool.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══ LATEST INSIGHTS ═══ */
export function LatestInsights({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;
  return (
    <section className="relative py-24 lg:py-32 bsh-lazy" style={alt} aria-label="Latest from the blog">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Header badge="Insights" title="From the" accent="Blog" text="Practical guides on websites, e-commerce, SEO and AI tools for business owners." href="/blog" cta="All articles" />
        <div className="grid gap-5 md:grid-cols-3">
          {posts.map((post, i) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className={`bsh-card bsh-reveal bsh-reveal-stagger-${i + 1} group flex flex-col overflow-hidden rounded-2xl border`}>
              <div className="relative aspect-[16/9] overflow-hidden" style={alt}>
                {post.featured_image ? (
                  <Image
                    src={mediaUrl("blog", post.featured_image)}
                    alt={post.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="h-8 w-8 text-emerald-500/30" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider" style={t3}>
                  <span className="text-emerald-400">{categoryLabel(post.category)}</span>
                  {post.read_time && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" /> {post.read_time} min
                    </span>
                  )}
                </div>
                <h3 className="mb-2 line-clamp-2 font-display text-lg font-semibold leading-snug transition-colors group-hover:text-emerald-300" style={t1}>
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mb-4 line-clamp-2 font-mono text-xs leading-relaxed" style={t3}>
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-auto border-t pt-4 font-mono text-[11px]" style={{ ...border, ...t3 }}>
                  {formatDate(post.published_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ CITIES WE SERVE ═══ */
export function CitiesServed({ cities }: { cities: { name: string; slug: string; state: string }[] }) {
  if (!cities.length) return null;
  return (
    <section className="relative py-20 lg:py-28 bsh-lazy" style={alt} aria-label="Cities we serve">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center bsh-reveal">
          <SectionBadge>Where We Work</SectionBadge>
          <h2 className="mb-4 font-display text-4xl font-bold lg:text-5xl" style={t1}>
            Working Across <span className="bsh-grad">India, Remotely</span>
          </h2>
          <p className="font-mono text-sm leading-relaxed" style={t2}>
            We work remotely, so your city is never a barrier. Pick yours to see how we can help.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5 bsh-reveal">
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="bsh-card group inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs transition-colors hover:border-emerald-500/40"
              style={t2}
              title={`Web design & development in ${c.name}, ${c.state}`}
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-500/70 group-hover:text-emerald-400" aria-hidden="true" />
              <span className="group-hover:text-emerald-300">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ ABOUT + CAREERS ═══ */
export function AboutAndCareers({ jobs }: { jobs: { title: string; type: string; location: string }[] }) {
  const roles = jobs.slice(0, 3);
  return (
    <section className="relative py-24 lg:py-32 bsh-lazy" aria-label="About us and careers">
      <div className="mx-auto grid max-w-7xl gap-5 px-6 lg:grid-cols-2 lg:px-8">
        <Link href="/about" className="bsh-card bsh-reveal group relative flex flex-col overflow-hidden rounded-2xl border p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/[.06] blur-3xl" aria-hidden="true" />
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
            <Users className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </div>
          <SectionBadge className="mb-3 self-start">About Us</SectionBadge>
          <h2 className="mb-3 font-display text-3xl font-bold" style={t1}>
            A studio, not a <span className="bsh-grad">factory</span>
          </h2>
          <p className="mb-6 font-mono text-sm leading-relaxed" style={t2}>
            A small team of designers and developers. You talk directly to the people building your product, with no account managers in between.
          </p>
          <span className="mt-auto inline-flex items-center gap-2 font-mono text-sm text-emerald-400">
            About us <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </Link>

        <Link href="/careers" className="bsh-card bsh-reveal bsh-reveal-stagger-2 group relative flex flex-col overflow-hidden rounded-2xl border p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
            <Briefcase className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </div>
          <SectionBadge className="mb-3 self-start">{jobs.length ? `${jobs.length} open role${jobs.length === 1 ? "" : "s"}` : "Careers"}</SectionBadge>
          <h2 className="mb-3 font-display text-3xl font-bold" style={t1}>
            Build with <span className="bsh-grad">us</span>
          </h2>
          {roles.length ? (
            <ul className="mb-6 divide-y rounded-xl border" style={border}>
              {roles.map((r) => (
                <li key={r.title} className="flex items-center justify-between gap-3 px-4 py-3" style={border}>
                  <span className="truncate font-mono text-sm" style={t1}>
                    {r.title}
                  </span>
                  <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-wider" style={t3}>
                    {r.type} · {r.location}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-6 font-mono text-sm leading-relaxed" style={t2}>
              No open roles right now, but we&apos;re always happy to hear from talented designers and developers. Send us your portfolio.
            </p>
          )}
          <span className="mt-auto inline-flex items-center gap-2 font-mono text-sm text-emerald-400">
            {jobs.length ? "See open roles" : "Send your CV"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </section>
  );
}

