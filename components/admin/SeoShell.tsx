import { ArrowRightLeft, FileText, FolderKanban, Gauge, MapPin, Newspaper, Settings2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminPage } from "./ui";

// Frame for every screen of Admin → SEO: the page header plus the section tabs.

export type SeoTab = "overview" | "pages" | "posts" | "portfolio" | "locations" | "redirects" | "settings";

const TABS: [SeoTab, string, string, LucideIcon][] = [
  ["overview", "Overview", "/admin/seo", Gauge],
  ["pages", "Pages", "/admin/seo/pages", FileText],
  ["posts", "Blog posts", "/admin/seo/posts", Newspaper],
  ["portfolio", "Case studies", "/admin/seo/portfolio", FolderKanban],
  ["locations", "Location pages", "/admin/seo/locations", MapPin],
  ["redirects", "Redirects", "/admin/seo/redirects", ArrowRightLeft],
  ["settings", "Settings", "/admin/seo/settings", Settings2],
];

export default function SeoShell({ active, children }: { active: SeoTab; children: ReactNode }) {
  return (
    <AdminPage title="SEO">
      <nav aria-label="SEO sections" className="-mx-6 -mt-6 mb-6 overflow-x-auto border-b border-zinc-800 px-6">
        <div className="flex min-w-max gap-1">
          {TABS.map(([key, label, href, Icon]) => {
            const on = key === active;
            return (
              <Link
                key={key}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm transition-colors ${
                  on ? "border-accent font-medium text-white" : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${on ? "text-accent" : ""}`} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </AdminPage>
  );
}

const SEVERITY_CLS = {
  error: "border-red-500/25 bg-red-500/10 text-red-400",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  notice: "border-sky-500/25 bg-sky-500/10 text-sky-400",
  ok: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  muted: "border-zinc-700 bg-zinc-800 text-zinc-400",
} as const;

export function Pill({ tone, children }: { tone: keyof typeof SEVERITY_CLS; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-medium ${SEVERITY_CLS[tone]}`}>{children}</span>;
}
