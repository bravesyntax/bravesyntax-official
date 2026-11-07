import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import Link from "next/link";
import { AdminPage, Card, EmptyState, FilterTabs, StatGrid, Th, timeAgo } from "@/components/admin/ui";
import { rows, sql } from "@/lib/db";
import type { LeadMethod } from "@/lib/analytics";

export const metadata = { title: "Leads" };

type Props = { searchParams: Promise<{ days?: string }> };

const RANGES: [string, string][] = [
  ["7", "7 days"],
  ["30", "30 days"],
  ["90", "90 days"],
];
const METHODS: Record<LeadMethod, [string, typeof Mail, string]> = {
  contact_form: ["Contact form", Send, "text-brand"],
  whatsapp: ["WhatsApp", MessageCircle, "text-emerald-400"],
  phone: ["Phone call", Phone, "text-sky-400"],
  email: ["Email", Mail, "text-amber-400"],
};
// Days are counted in Indian time; created_at is stored in the database's UTC.
const IST = sql`(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')`;

export default async function LeadsPage({ searchParams }: Props) {
  const { days: raw } = await searchParams;
  const days = RANGES.some(([k]) => k === raw) ? Number(raw) : 30;
  const since = sql`created_at > LOCALTIMESTAMP - make_interval(days => ${days})`;

  const [totals, daily, pages, sources, recent] = await Promise.all([
    rows<{ method: LeadMethod; n: number; today: number }>(sql`
      SELECT method, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE ${IST}::date = (now() AT TIME ZONE 'Asia/Kolkata')::date)::int AS today
      FROM lead_events WHERE ${since} GROUP BY method
    `),
    rows<{ day: string; n: number }>(sql`
      SELECT to_char(${IST}::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS n FROM lead_events WHERE ${since} GROUP BY 1 ORDER BY 1
    `),
    rows<{ page: string; n: number }>(sql`SELECT page, COUNT(*)::int AS n FROM lead_events WHERE ${since} GROUP BY page ORDER BY n DESC, page LIMIT 10`),
    rows<{ source: string; n: number }>(sql`SELECT source, COUNT(*)::int AS n FROM lead_events WHERE ${since} GROUP BY source ORDER BY n DESC, source LIMIT 10`),
    rows<{ id: number; method: LeadMethod; page: string; source: string; created_at: string }>(sql`
      SELECT id, method, page, source, created_at FROM lead_events ORDER BY id DESC LIMIT 15
    `),
  ]);

  const total = totals.reduce((s, t) => s + t.n, 0);
  const today = totals.reduce((s, t) => s + t.today, 0);
  const countOf = (m: LeadMethod) => totals.find((t) => t.method === m)?.n ?? 0;

  // One bar per day, including days with no leads, ending today (IST).
  const byDay = new Map(daily.map((d) => [d.day, d.n]));
  const end = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const bars = Array.from({ length: days }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (days - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { key, n: byDay.get(key) ?? 0, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) };
  });
  const peak = Math.max(1, ...bars.map((b) => b.n));

  return (
    <AdminPage title="Leads">
      <p className="mb-6 max-w-3xl text-sm text-zinc-400">
        Every contact form sent and every WhatsApp, phone or email tap on the website. No personal details are stored here: the people who wrote in
        are in{" "}
        <Link href="/admin/messages" className="text-brand hover:underline">
          Messages
        </Link>
        . The same tap on the same page counts once per visit every 30 minutes.
      </p>

      <div className="mb-6">
        <FilterTabs tabs={RANGES} active={String(days)} hrefFor={(k) => `/admin/leads?days=${k}`} />
      </div>

      <StatGrid
        cols="grid-cols-2 md:grid-cols-3"
        stats={[
          [total, `Leads in ${days} days`, "text-white"],
          [today, "Today (IST)", "text-emerald-400"],
          [countOf("contact_form"), "Contact forms", "text-brand"],
        ]}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {(Object.keys(METHODS) as LeadMethod[]).map((m) => {
          const [label, Icon, tone] = METHODS[m];
          return (
            <Card key={m} className="flex items-center gap-3 p-4">
              <Icon className={`size-5 shrink-0 ${tone}`} aria-hidden="true" />
              <div>
                <div className="font-display text-xl font-bold text-white">{countOf(m)}</div>
                <div className="text-xs text-zinc-500">{label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6 p-5">
        <h2 className="text-sm font-medium text-white">Leads per day</h2>
        {total === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No leads in this period yet.</p>
        ) : (
          <>
            <div className="mt-4 flex h-40 items-end gap-[2px]" role="img" aria-label={`Leads per day over ${days} days, peak ${peak}`}>
              {bars.map((b) => (
                <div key={b.key} title={`${b.label}: ${b.n}`} className="flex h-full flex-1 items-end">
                  <div className={`w-full rounded-t ${b.n ? "bg-brand" : "bg-zinc-800"}`} style={{ height: `${b.n ? Math.max(6, (b.n / peak) * 100) : 2}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
              <span>{bars[0].label}</span>
              <span>Peak: {peak} a day</span>
              <span>{bars[bars.length - 1].label}</span>
            </div>
          </>
        )}
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {(
          [
            ["Top pages", pages.map((p) => [p.page, p.n] as const), "Page"],
            ["Where visits came from", sources.map((s) => [s.source, s.n] as const), "Source"],
          ] as const
        ).map(([title, list, col]) => (
          <Card key={title} className="p-0">
            <h2 className="border-b border-zinc-800 px-4 py-3 text-sm font-medium text-white">{title}</h2>
            {list.length === 0 ? (
              <EmptyState>Nothing yet.</EmptyState>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-800">
                  <tr>
                    <Th>{col}</Th>
                    <Th className="text-right">Leads</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {list.map(([name, n]) => (
                    <tr key={name}>
                      <td className="max-w-0 truncate px-4 py-2.5 font-mono text-xs text-zinc-300">{name}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-300">{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-0">
        <h2 className="border-b border-zinc-800 px-4 py-3 text-sm font-medium text-white">Latest</h2>
        {recent.length === 0 ? (
          <EmptyState>Leads will appear here as soon as someone gets in touch.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="border-b border-zinc-800">
                <tr>
                  <Th>Method</Th>
                  <Th>Page</Th>
                  <Th>Source</Th>
                  <Th className="text-right">When</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 text-zinc-200">{METHODS[r.method]?.[0] ?? r.method}</td>
                    <td className="max-w-[16rem] truncate px-4 py-2.5 font-mono text-xs text-zinc-400">{r.page}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{r.source}</td>
                    <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap text-zinc-500">{timeAgo(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-4 text-xs text-zinc-500">
        Add <span className="font-mono">?utm_source=whatsapp</span> (or instagram, linkedin…) to links you share, and those visits show here by name.
      </p>
    </AdminPage>
  );
}
