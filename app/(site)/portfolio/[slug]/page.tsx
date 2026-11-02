import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Icon from "@/components/ui/Icon";
import { SITE_URL } from "@/lib/config";
import { capitalize, getPortfolioBySlug, getPortfolioSlugs, splitList } from "@/lib/content";
import { buildMetadata, customSchema, projectSeoDefaults, resolveSeo } from "@/lib/seo";
import "../portfolio.css";
import { absoluteMediaUrl, mediaUrl } from "@/lib/media";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPortfolioSlugs()).map((slug) => ({ slug }));
}

/** Built-in SEO for a case study; anything saved in Admin → SEO → Portfolio overrides it. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getPortfolioBySlug((await params).slug);
  if (!project) return {};
  return buildMetadata("project", String(project.id), projectSeoDefaults(project));
}

const BodyHeading = ({ children, mb = "mb-3" }: { children: React.ReactNode; mb?: string }) => (
  <div className={`text-xs font-mono text-emerald-400 uppercase tracking-wider ${mb}`}>{children}</div>
);

export default async function CaseStudyPage({ params }: Props) {
  const project = await getPortfolioBySlug((await params).slug);
  if (!project) notFound();

  const tags = splitList(project.tags);
  const stack = splitList(project.tech_stack);
  const metrics = [project.metric_1, project.metric_2, project.metric_3].filter((m): m is string => !!m);
  const [seo, extraSchema] = await Promise.all([resolveSeo("project", String(project.id), projectSeoDefaults(project)), customSchema("project", String(project.id))]);
  const url = seo.canonical;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: seo.description,
    url,
    ...(project.image && { image: absoluteMediaUrl("portfolio", project.image, SITE_URL) }),
    ...(project.year && { dateCreated: String(project.year) }),
    ...(tags.length && { keywords: tags.join(", ") }),
    ...(project.live_url && { mainEntityOfPage: project.live_url }),
  };

  return (
    <div className="pg-case-study">
      <JsonLd data={[schema, ...extraSchema]} />

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden bg-black">
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-emerald-500/[.07] rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8">
          <Link href="/portfolio" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-emerald-400 transition-colors mb-8">
            <Icon d="M15 19l-7-7 7-7" className="w-3.5 h-3.5" strokeWidth={2} />
            All Work
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
              {capitalize(project.category)}
            </span>
            {project.year ? <span className="text-xs font-mono text-zinc-500">{project.year}</span> : null}
            {project.client_name && <span className="text-xs font-mono text-zinc-500">&middot; {project.client_name}</span>}
          </div>

          <h1 className="cs-t-p text-4xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">{project.title}</h1>

          {project.description && <p className="cs-t-s text-lg text-zinc-400 font-mono leading-relaxed max-w-2xl">{project.description}</p>}

          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl transition-all"
            >
              View Live Site
              <Icon d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="w-4 h-4" strokeWidth={2} />
            </a>
          )}
        </div>
      </section>

      {project.image && (
        <section className="relative bg-black pb-16 lg:pb-20">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="rounded-2xl overflow-hidden border border-zinc-800">
              <Image
                src={mediaUrl("portfolio", project.image)}
                alt={project.title}
                width={1600}
                height={1000}
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>
      )}

      {/* ═══ BODY ═══ */}
      <section className="relative pb-20 lg:pb-28" style={{ backgroundColor: "var(--sb)" }}>
        <div className="max-w-3xl mx-auto px-6 lg:px-8 space-y-14">
          {project.challenge && (
            <div>
              <BodyHeading>The Challenge</BodyHeading>
              <p className="cs-t-s text-base text-zinc-300 font-mono leading-relaxed whitespace-pre-line">{project.challenge}</p>
            </div>
          )}

          {project.approach && (
            <div>
              <BodyHeading>Our Approach</BodyHeading>
              <p className="cs-t-s text-base text-zinc-300 font-mono leading-relaxed whitespace-pre-line">{project.approach}</p>
            </div>
          )}

          {(metrics.length > 0 || project.results_detail) && (
            <div>
              <BodyHeading mb="mb-4">Results</BodyHeading>
              {metrics.length > 0 && (
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  {metrics.map((m) => (
                    <div key={m} className="cs-card border rounded-xl p-4 text-center" style={{ borderColor: "#27272a" }}>
                      <div className="text-sm font-mono font-bold text-emerald-400">{m}</div>
                    </div>
                  ))}
                </div>
              )}
              {project.results_detail && (
                <p className="cs-t-s text-base text-zinc-300 font-mono leading-relaxed whitespace-pre-line">{project.results_detail}</p>
              )}
            </div>
          )}

          {(stack.length > 0 || tags.length > 0) && (
            <div>
              <BodyHeading>Tech &amp; Tags</BodyHeading>
              <div className="flex flex-wrap gap-2">
                {[...stack, ...tags].map((t, i) => (
                  <span key={`${t}-${i}`} className="px-3 py-1 text-xs font-mono bg-zinc-800/60 text-zinc-400 rounded-full border border-zinc-700/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 lg:py-28 relative overflow-hidden border-t border-zinc-900">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="cs-t-p text-3xl lg:text-4xl font-display font-bold text-white mb-5">Want Something Like This?</h2>
          <p className="cs-t-s text-zinc-400 font-mono mb-8 leading-relaxed">Tell us about your project — we&apos;ll send a scoped, fixed quote.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/contact?ref=case-study&project=${encodeURIComponent(project.slug ?? "")}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl transition-all"
            >
              Start Your Project
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-400 font-mono text-sm rounded-xl transition-all hover:border-zinc-500 hover:text-white"
            >
              See More Work
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
