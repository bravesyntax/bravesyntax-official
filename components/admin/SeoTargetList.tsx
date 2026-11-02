import { ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { editHref, ISSUES, worstSeverity, type SeoTarget } from "@/lib/admin/seo-audit";
import { Pill } from "./SeoShell";
import { Card, EmptyState, FilterTabs } from "./ui";

// One row per URL with its live title/description and what's wrong with it (Admin → SEO list screens).

export default function SeoTargetList({
  targets,
  title,
  description,
  filter,
  baseHref,
  extra,
}: {
  targets: SeoTarget[];
  title: string;
  description: string;
  filter: string;
  baseHref: string;
  extra?: React.ReactNode;
}) {
  const withIssues = targets.filter((t) => t.issues.some((c) => ISSUES[c].severity !== "notice"));
  const custom = targets.filter((t) => t.record);
  const shown = filter === "issues" ? withIssues : filter === "custom" ? custom : targets;
  const join = baseHref.includes("?") ? "&" : "?";

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 px-5 py-4">
        <div>
          <h2 className="font-display font-semibold text-white">{title}</h2>
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {extra}
          <FilterTabs
            tabs={[
              ["all", `All (${targets.length})`],
              ["issues", `Needs work (${withIssues.length})`],
              ["custom", `Customised (${custom.length})`],
            ]}
            active={filter}
            hrefFor={(k) => (k === "all" ? baseHref : `${baseHref}${join}filter=${k}`)}
          />
        </div>
      </div>
      {shown.length === 0 ? (
        <EmptyState>{filter === "issues" ? "Nothing to fix here." : "No URLs."}</EmptyState>
      ) : (
        <div className="divide-y divide-zinc-800/70">
          {shown.map((t) => {
            const worst = worstSeverity(t.issues);
            return (
              <div key={`${t.type}:${t.key}`} className="group relative grid gap-3 px-5 py-4 transition-colors hover:bg-zinc-800/30 lg:grid-cols-[220px_minmax(0,1fr)_260px_24px] lg:items-center">
                <div className="min-w-0">
                  <Link href={editHref(t.type, t.key)} className="block truncate text-sm font-semibold text-white after:absolute after:inset-0">
                    {t.label}
                  </Link>
                  <div className="truncate font-mono text-[11px] text-zinc-500">{t.path}</div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm text-sky-300">{t.seo.title}</div>
                  <div className="truncate text-xs text-zinc-500">{t.seo.description}</div>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-1.5">
                  <Pill tone={t.record ? "ok" : "muted"}>{t.record ? "Custom" : "Default"}</Pill>
                  {t.forcedNoindex && <Pill tone="muted">{t.forcedNoindex} · not indexed</Pill>}
                  {!t.forcedNoindex && !worst && <Pill tone="ok">All good</Pill>}
                  {t.issues
                    .filter((c) => ISSUES[c].severity !== "notice")
                    .map((c) => (
                      <Pill key={c} tone={ISSUES[c].severity}>
                        {ISSUES[c].label}
                      </Pill>
                    ))}
                  <a href={t.path} target="_blank" rel="noopener noreferrer" className="ml-1 text-zinc-500 hover:text-accent" title="Open page" aria-label={`Open ${t.label}`}>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
                <ChevronRight className="hidden h-4 w-4 text-zinc-600 transition-colors group-hover:text-accent lg:block" aria-hidden="true" />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
