"use client";

import { ArrowUpRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BlurFade } from "@/components/velora/blur-fade";
import { FollowingPointer } from "@/components/velora/following-pointer";
import { mediaUrl } from "@/lib/media";
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
};
type Filter = "all" | "design" | "development";

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["design", "Design"],
  ["development", "Development"],
];

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-full border bg-muted/50 p-1">
          {FILTERS.map(([k, label]) => (
            <Link
              key={k}
              href={`/portfolio?filter=${k}`}
              scroll={false}
              aria-current={filter === k ? "page" : undefined}
              className={cn("rounded-full px-4 py-1.5 text-sm transition-colors", filter === k ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {label}
            </Link>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {shown.length} {shown.length === 1 ? "project" : "projects"}
        </span>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {shown.map((p, i) => (
          <BlurFade key={`${filter}-${p.id}`} delay={(i % 2) * 0.08} className="h-full">
            <article className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-xl hover:shadow-primary/5">
              <FollowingPointer label="View project" className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Link href={p.slug ? `/portfolio/${p.slug}` : p.liveUrl || "#"} aria-label={p.title} className="block size-full">
                  {p.image && <Image src={mediaUrl("portfolio", p.image)} alt={p.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
                </Link>
              </FollowingPointer>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-primary capitalize">{p.cat}</span>
                  {p.year && <span>· {p.year}</span>}
                </div>
                <h2 className="mt-2 text-xl font-medium tracking-tight">{p.title}</h2>
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
    </>
  );
}
