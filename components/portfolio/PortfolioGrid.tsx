"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { mediaUrl } from "@/lib/media";

export type PortfolioCard = {
  id: number;
  title: string;
  slug: string | null;
  cat: string;
  tags: string[];
  desc: string | null;
  year: number | null;
  image: string | null;
  liveUrl: string | null;
};
type Filter = "all" | "design" | "development";

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["design", "Design"],
  ["development", "Development"],
];
const EXTERNAL = "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14";
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Reads ?filter= from the URL. Rendered inside <Suspense> so the page itself stays static. */
export function FilteredPortfolioGrid({ projects }: { projects: PortfolioCard[] }) {
  const raw = useSearchParams().get("filter");
  const filter: Filter = raw === "design" || raw === "development" ? raw : "all";
  return <PortfolioGrid projects={projects} filter={filter} />;
}

export default function PortfolioGrid({ projects, filter }: { projects: PortfolioCard[]; filter: Filter }) {
  const shown = filter === "all" ? projects : projects.filter((p) => p.cat === filter);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 py-10">
        <div className="pf2-tabs">
          {FILTERS.map(([k, label]) => (
            <Link key={k} href={`/portfolio?filter=${k}`} scroll={false} className={`pf2-tab ${filter === k ? "active" : ""}`}>
              {label}
            </Link>
          ))}
        </div>
        <span className="pf2-mut2 text-sm">
          {shown.length} {shown.length === 1 ? "project" : "projects"}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {shown.map((p, i) => (
          <article
            key={`${filter}-${p.id}`}
            className="pf2-card pf2-card-hover group"
            style={{ animation: `slide-up .5s ease-out ${i * 0.05}s forwards`, opacity: 0 }}
          >
            <div className="pf2-thumb">
              {p.image ? (
                <Image src={mediaUrl("portfolio", p.image)} alt={p.title} fill sizes="(min-width: 768px) 50vw, 100vw" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="pf2-ph-icon">
                    <span style={{ color: "var(--p-mut2)" }}>
                      <Icon
                        d={
                          p.cat === "design"
                            ? "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                            : "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        }
                        className="w-5 h-5"
                      />
                    </span>
                  </div>
                  <span className="pf2-mut2 text-xs text-center px-4">{p.title}</span>
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="pf2-badge">{capitalize(p.cat)}</span>
                <span className="pf2-mut2 text-xs ml-auto">{p.year}</span>
              </div>

              {p.liveUrl ? (
                <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 group/link mb-2">
                  <h2 className="pf2-h text-[15px] group-hover/link:text-emerald-400 transition-colors">{p.title}</h2>
                  <span style={{ color: "var(--p-primary)" }}>
                    <Icon d={EXTERNAL} className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-all flex-shrink-0" strokeWidth={2} />
                  </span>
                </a>
              ) : (
                <h2 className="pf2-h text-[15px] mb-2">{p.title}</h2>
              )}

              {p.desc && <p className="pf2-mut text-[13px] leading-relaxed mb-4 line-clamp-2">{p.desc}</p>}

              {(p.tags.length > 0 || p.slug) && (
                <div className="pf2-divider pt-4 flex flex-wrap items-center gap-1.5">
                  {p.tags.slice(0, 3).map((t) => (
                    <span key={t} className="pf2-badge pf2-badge-outline">
                      {t}
                    </span>
                  ))}
                  {p.slug && (
                    <Link href={`/portfolio/${p.slug}`} className={`pf2-btn pf2-btn-ghost ${!p.liveUrl ? "ml-auto" : ""} text-xs`}>
                      Case Study &rarr;
                    </Link>
                  )}
                  {p.liveUrl && (
                    <a
                      href={p.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`pf2-btn pf2-btn-ghost ${!p.slug ? "ml-auto" : ""} text-xs`}
                    >
                      Visit
                      <Icon d="M14 5l7 7m0 0l-7 7m7-7H3" className="w-3.5 h-3.5" strokeWidth={2} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="text-center py-24">
          <p className="pf2-h text-lg mb-2">No projects here yet</p>
          <p className="pf2-mut text-sm mb-6">Nothing in this category for now. Browse everything instead.</p>
          <Link href="/portfolio?filter=all" scroll={false} className="pf2-btn pf2-btn-outline">
            View all work
          </Link>
        </div>
      )}
    </>
  );
}
