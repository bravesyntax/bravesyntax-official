"use client";

import { ArrowUpRight, ExternalLink, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { BlurFade } from "@/components/velora/blur-fade";
import { FollowingPointer } from "@/components/velora/following-pointer";
import { mediaUrl, isExternalImage } from "@/lib/media";
import { cn } from "@/lib/utils";

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
  featured: boolean;
};
type Filter = "all" | "design" | "development";
type Active = { filter: Filter; year: number | null; tech: string | null };

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["design", "Design"],
  ["development", "Development"],
];
const TECH_CHIPS = 8;

/** Reads ?filter=, ?year= and ?tech= from the URL. Rendered inside <Suspense> so the page itself stays static. */
export function FilteredPortfolioGrid({ projects }: { projects: PortfolioCard[] }) {
  const params = useSearchParams();
  const raw = params.get("filter");
  const filter: Filter = raw === "design" || raw === "development" ? raw : "all";
  const year = Number(params.get("year"));
  const tech = params.get("tech");
  return <PortfolioGrid projects={projects} filter={filter} year={projects.some((p) => p.year === year) ? year : null} tech={projects.some((p) => tech && p.tags.includes(tech)) ? tech : null} />;
}

export default function PortfolioGrid({ projects, filter, year = null, tech = null }: { projects: PortfolioCard[]; filter: Filter; year?: number | null; tech?: string | null }) {
  const [query, setQuery] = useState("");

  const { years, techs, cats } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return {
      years: [...new Set(projects.map((p) => p.year).filter((y): y is number => y !== null))].sort((a, b) => b - a),
      techs: [...counts].sort((a, b) => b[1] - a[1]).slice(0, TECH_CHIPS).map(([t]) => t),
      cats: FILTERS.filter(([k]) => k === "all" || projects.some((p) => p.cat === k)),
    };
  }, [projects]);

  const search = query.trim().toLowerCase();
  const shown = projects.filter(
    (p) =>
      (filter === "all" || p.cat === filter) &&
      (year === null || p.year === year) &&
      (tech === null || p.tags.includes(tech)) &&
      (!search || `${p.title} ${p.desc ?? ""} ${p.tags.join(" ")}`.toLowerCase().includes(search)),
  );
  const groups = [...new Set(shown.map((p) => p.year))].sort((a, b) => (b ?? 0) - (a ?? 0));
  const filtered = filter !== "all" || year !== null || tech !== null || !!search;

  const hrefFor = (next: Partial<Active>) => {
    const a = { filter, year, tech, ...next };
    const qs = new URLSearchParams();
    if (a.filter !== "all") qs.set("filter", a.filter);
    if (a.year) qs.set("year", String(a.year));
    if (a.tech) qs.set("tech", a.tech);
    const s = qs.toString();
    return s ? `/portfolio?${s}` : "/portfolio";
  };
  const pill = (active: boolean) => cn("rounded-full px-3.5 py-1.5 text-sm transition-colors", active ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground");

  return (
    <>
      <div className="rounded-3xl border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Search projects</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or technology" className="h-10 w-full rounded-full border bg-background pr-4 pl-10 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" />
          </label>
          <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <span aria-live="polite">
              {shown.length} {shown.length === 1 ? "project" : "projects"}
            </span>
            {filtered && (
              <Link href="/portfolio" scroll={false} onClick={() => setQuery("")} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                <X className="size-3.5" aria-hidden="true" /> Clear filters
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t pt-4">
          {cats.length > 2 && (
            <nav aria-label="Filter by type" className="flex flex-wrap gap-1">
              {cats.map(([k, label]) => (
                <Link key={k} href={hrefFor({ filter: k })} scroll={false} aria-current={filter === k ? "page" : undefined} className={pill(filter === k)}>
                  {label}
                </Link>
              ))}
            </nav>
          )}
          <nav aria-label="Filter by year" className="flex flex-wrap gap-1">
            {[null, ...years].map((y) => (
              <Link key={y ?? "all"} href={hrefFor({ year: y })} scroll={false} aria-current={year === y ? "page" : undefined} className={pill(year === y)}>
                {y ?? "All years"}
              </Link>
            ))}
          </nav>
          {techs.length > 0 && (
            <nav aria-label="Filter by technology" className="flex flex-wrap gap-1">
              {[null, ...techs].map((t) => (
                <Link key={t ?? "all"} href={hrefFor({ tech: t })} scroll={false} aria-current={tech === t ? "page" : undefined} className={pill(tech === t)}>
                  {t ?? "All technology"}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>

      {shown.length === 0 && <p className="mt-10 text-center text-muted-foreground">No projects match these filters. Try clearing them.</p>}

      {groups.map((group) => (
        <div key={group ?? "undated"} className="mt-10">
          <h2 className="flex items-center gap-4 text-2xl font-semibold tracking-tight">
            {group ?? "Earlier"}
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {shown.filter((p) => p.year === group).map((p, i) => (
              <BlurFade key={p.id} delay={(i % 2) * 0.08} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5">
                  <FollowingPointer label="View project" className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <Link href={p.slug ? `/portfolio/${p.slug}` : p.liveUrl || "#"} aria-label={p.title} className="block size-full">
                      {p.image && <Image unoptimized={isExternalImage(p.image)} src={mediaUrl("portfolio", p.image)} alt={p.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain" />}
                    </Link>
                  </FollowingPointer>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {p.featured && <span className="rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground">Featured</span>}
                      <span className="font-medium text-primary capitalize">{p.cat}</span>
                      {p.year && <span>· {p.year}</span>}
                    </div>
                    <h3 className="mt-2 text-xl font-medium tracking-tight">{p.title}</h3>
                    {p.desc && <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{p.desc}</p>}
                    {p.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {p.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-5 flex items-center gap-4 border-t pt-4 text-sm font-medium">
                      {p.slug && (
                        <Link href={`/portfolio/${p.slug}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                          Project details <ArrowUpRight className="size-4" aria-hidden="true" />
                        </Link>
                      )}
                      {p.liveUrl && (
                        <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          Live site <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              </BlurFade>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
