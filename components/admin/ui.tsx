import Link from "next/link";
import type { ReactNode } from "react";
import { getAdmin } from "@/lib/admin/auth";
import { readFlash } from "@/lib/admin/flash";
import { FlashMessage } from "./client";

// Server-rendered building blocks for admin pages (styles from admin/*.php).

export { iconBtnDelete, iconBtnEdit, iconBtnToggle, iconBtnView, inputCls, labelCls, primaryBtn, smallPrimaryBtn } from "./styles";

/** Page frame: sticky title bar plus any pending flash message. */
export async function AdminPage({ title, children }: { title: string; children: ReactNode }) {
  const [admin, flash] = await Promise.all([getAdmin(), readFlash()]);
  return (
    <>
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">{title}</h1>
        <span className="text-xs font-mono text-zinc-500">{admin?.username ?? "Admin"}</span>
      </header>
      <main className="p-6">
        {flash && <FlashMessage type={flash.type} message={flash.message} />}
        {children}
      </main>
    </>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden ${className}`}>{children}</div>;
}

export function StatGrid({ stats, cols = "grid-cols-3" }: { stats: [number | string, string, string][]; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-4 mb-6`}>
      {stats.map(([n, label, cls]) => (
        <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-5 py-4 text-center">
          <div className={`text-2xl font-display font-bold ${cls}`}>{n}</div>
          <div className="text-xs font-mono text-zinc-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

export function FilterTabs({ tabs, active, hrefFor }: { tabs: [string, string][]; active: string; hrefFor: (key: string) => string }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map(([k, label]) => (
        <Link
          key={k}
          href={hrefFor(k)}
          className={`px-4 py-2 text-xs font-mono rounded-lg transition-all ${
            active === k ? "bg-brand text-black font-bold" : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-mono text-zinc-400 hover:text-white transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {children}
    </Link>
  );
}

export function Pagination({ page, totalPages, total, perPage, hrefFor }: { page: number; totalPages: number; total: number; perPage: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  const offset = (page - 1) * perPage;
  return (
    <div className="px-5 py-4 border-t border-zinc-800 flex items-center justify-between">
      <span className="text-xs font-mono text-zinc-500">
        Showing {offset + 1}–{Math.min(offset + perPage, total)} of {total}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={hrefFor(page - 1)} className="px-3 py-1.5 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg">
            &laquo; Prev
          </Link>
        )}
        <span className="px-3 py-1.5 text-xs font-mono bg-brand/10 text-brand rounded-lg">
          {page} / {totalPages}
        </span>
        {page < totalPages && (
          <Link href={hrefFor(page + 1)} className="px-3 py-1.5 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg">
            Next &raquo;
          </Link>
        )}
      </div>
    </div>
  );
}

/** On/off switch (checkbox) styled like the PHP admin toggles. */
export function Toggle({ name, label, defaultChecked, color = "peer-checked:bg-emerald-500" }: { name: string; label: string; defaultChecked: boolean; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" name={name} value="1" className="sr-only peer" defaultChecked={defaultChecked} />
        <div
          className={`w-10 h-5 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all ${color} peer-checked:after:bg-white`}
        />
      </label>
      <span className="text-sm font-mono text-zinc-300">{label}</span>
    </div>
  );
}

export const Th = ({ children, className = "text-left", hide = "" }: { children?: ReactNode; className?: string; hide?: string }) => (
  <th className={`${className} ${hide} px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider`}>{children}</th>
);

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="py-20 text-center">
      <p className="text-zinc-500 font-mono text-sm">{children}</p>
    </div>
  );
}

/** "3h ago" style relative time (time_ago() on the PHP site). */
export function timeAgo(d: Date | string | null): string {
  if (!d) return "";
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  const units: [number, string][] = [
    [31536000, "y"],
    [2592000, "mo"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [secs, label] of units) if (s >= secs) return `${Math.floor(s / secs)}${label} ago`;
  return "Just now";
}
