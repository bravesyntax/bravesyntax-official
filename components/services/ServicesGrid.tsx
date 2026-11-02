"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { contactServiceHref } from "@/lib/navigation";

type Service = { id: number; title: string; description: string; category: string; icon: string };
type Filter = "all" | "design" | "development";

const FILTERS: [Filter, string][] = [
  ["all", "All Services"],
  ["design", "Design"],
  ["development", "Development"],
];
const DEFAULT_ICON = "M13 10V3L4 14h7v7l9-11h-7z";
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Reads ?filter= from the URL. Rendered inside <Suspense> so the page itself stays static. */
export function FilteredServicesGrid({ services }: { services: Service[] }) {
  const raw = useSearchParams().get("filter");
  const filter: Filter = raw === "design" || raw === "development" ? raw : "all";
  return <ServicesGrid services={services} filter={filter} />;
}

export default function ServicesGrid({ services, filter }: { services: Service[]; filter: Filter }) {
  const filtered = filter === "all" ? services : services.filter((s) => s.category === filter);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-10 pt-4">
        {FILTERS.map(([k, label]) => (
          <Link
            key={k}
            href={`/services?filter=${k}`}
            scroll={false}
            className={`px-5 py-2.5 rounded-xl font-mono text-sm transition-all ${
              filter === k
                ? "bg-emerald-500 text-black font-bold shadow-[0_0_20px_rgba(16,185,129,.3)]"
                : "sv-filter-btn bg-zinc-900/60 border border-zinc-800/60 text-zinc-400 hover:text-white hover:border-zinc-600"
            }`}
          >
            {label}
          </Link>
        ))}
        <span className="ml-auto self-center sv-t-m text-xs font-mono text-zinc-600">{filtered.length} services shown</span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((s, i) => (
          <article
            key={`${filter}-${s.id}`}
            className="sv-card group relative bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 hover:border-emerald-500/40 hover:bg-zinc-900/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(16,185,129,.08)]"
            style={{ animation: `slide-up .5s ease-out ${i * 0.04}s forwards`, opacity: 0 }}
          >
            <div className="absolute top-4 right-4">
              <span
                className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  s.category === "design"
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                {capitalize(s.category)}
              </span>
            </div>
            <div className="sv-icon-box mb-5 w-11 h-11 bg-emerald-500/10 border border-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Icon d={s.icon || DEFAULT_ICON} className="w-5 h-5" />
            </div>
            <h2 className="sv-t-p text-base font-display font-bold text-white group-hover:text-emerald-300 transition-colors mb-2">{s.title}</h2>
            <p className="sv-t-s text-xs text-zinc-400 font-mono leading-relaxed">{s.description}</p>
            <div className="mt-5 pt-4 sv-border border-t border-zinc-800/50 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-mono sv-t-m text-zinc-600 uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
                Fixed-price quote
              </span>
              <Link
                href={contactServiceHref(s.title)}
                className="text-[11px] font-mono text-emerald-400 lg:opacity-0 lg:group-hover:opacity-100 transition-all hover:text-emerald-300 flex items-center gap-1"
              >
                Get Quote <span>&rarr;</span>
              </Link>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="sv-t-s text-zinc-400 font-mono">
            No services in this category.{" "}
            <Link href="/services?filter=all" scroll={false} className="text-emerald-400 hover:underline">
              View all →
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
