import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BulkDeleteButton, ConfirmButton, RowCheckbox, SelectAll, SubmitButton } from "@/components/admin/client";
import { AdminPage, BackLink, Card, EmptyState, FilterTabs, inputCls, labelCls, Pagination, StatGrid, Th, timeAgo } from "@/components/admin/ui";
import { rows, sql } from "@/lib/db";
import type { AuditReport } from "@/lib/site-audit";
import { deleteAudits, saveAudit } from "./actions";

export const metadata = { title: "Site Audits" };

type Row = {
  id: number;
  url: string;
  domain: string;
  score: number | null;
  report_json: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  consent_contact: boolean;
  consent_at: Date | null;
  status: string;
  notes: string | null;
  created_at: Date;
};
type Props = { searchParams: Promise<{ view?: string; f?: string; page?: string }> };

const PER_PAGE = 30;
const STATUS: Record<string, [string, string]> = {
  new: ["New", "bg-amber-500/10 text-amber-300 border-amber-500/25"],
  contacted: ["Contacted", "bg-sky-500/10 text-sky-300 border-sky-500/25"],
  won: ["Won", "bg-brand/10 text-brand border-brand/25"],
  not_interested: ["Not interested", "bg-zinc-700/40 text-zinc-400 border-zinc-700"],
};
const scoreCls = (n: number | null) => (n === null ? "text-zinc-500" : n >= 80 ? "text-emerald-400" : n >= 50 ? "text-amber-300" : "text-red-400");
const when = (d: Date | null) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : "");

async function AuditView({ id }: { id: number }) {
  const [a] = await rows<Row>(sql`SELECT * FROM site_audits WHERE id = ${id}`);
  if (!a) redirect("/admin/audits");
  const r = JSON.parse(a.report_json) as AuditReport;
  const [label, cls] = STATUS[a.status] ?? STATUS.new;
  const order = { fail: 0, warn: 1, pass: 2 } as const;
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <BackLink href="/admin/audits">Back to Site Audits</BackLink>
        <form action={deleteAudits}>
          <input type="hidden" name="id" value={a.id} />
          <ConfirmButton message="Delete this audit and any contact details on it?" className="text-xs text-red-400 hover:text-red-300">
            Delete
          </ConfirmButton>
        </form>
      </div>
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-white break-all">{a.domain}</h2>
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-300 break-all hover:underline">
              {a.url}
            </a>
            <p className="mt-1 text-xs text-zinc-500">
              Audited {timeAgo(a.created_at)}
              {r.metrics.platform ? ` · ${r.metrics.platform}` : ""} · <span className={`rounded border px-1.5 ${cls}`}>{label}</span>
            </p>
          </div>
          <div className="text-right">
            <div className={`font-display text-4xl font-bold ${scoreCls(a.score)}`}>{a.score ?? "–"}</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Score</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-zinc-800/40 sm:grid-cols-5">
          {r.categories.map((c) => (
            <div key={c.key} className="bg-zinc-900/60 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">{c.label}</div>
              <div className={`text-lg font-semibold ${scoreCls(c.score)}`}>{c.score}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <div className="px-6 py-4">
            {r.summary && <p className="mb-4 rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm text-zinc-200">{r.summary}</p>}
            <ul className="divide-y divide-zinc-800/70">
              {[...r.checks]
                .sort((x, y) => order[x.status] - order[y.status])
                .map((c) => {
                  const Icon = c.status === "pass" ? CheckCircle2 : c.status === "warn" ? AlertTriangle : XCircle;
                  return (
                    <li key={c.id} className="flex gap-3 py-2.5">
                      <Icon className={`mt-0.5 size-4 shrink-0 ${c.status === "pass" ? "text-emerald-400" : c.status === "warn" ? "text-amber-400" : "text-red-400"}`} aria-hidden="true" />
                      <div className="min-w-0 text-sm">
                        <span className="text-white">{c.label}</span> <span className="text-zinc-500">· {c.detail}</span>
                        {c.status !== "pass" && c.fix && <div className="text-xs text-zinc-400">→ {c.fix}</div>}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="px-5 py-4">
              <h3 className="mb-3 text-sm font-semibold text-white">Contact</h3>
              {a.consent_contact ? (
                <dl className="space-y-1.5 text-sm">
                  <div className="text-white">{a.name}</div>
                  {a.email && (
                    <a href={`mailto:${a.email}?subject=${encodeURIComponent(`Your website audit: ${a.domain}`)}`} className="block text-sky-300 hover:underline">
                      {a.email}
                    </a>
                  )}
                  {a.phone && (
                    <div className="flex gap-3">
                      <a href={`tel:${a.phone}`} className="text-sky-300 hover:underline">
                        {a.phone}
                      </a>
                      <a href={`https://wa.me/${a.phone.replace(/\D/g, "").replace(/^0/, "91").replace(/^(\d{10})$/, "91$1")}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                        WhatsApp
                      </a>
                    </div>
                  )}
                  {a.message && <p className="mt-2 rounded-lg bg-zinc-800/50 p-3 whitespace-pre-wrap text-zinc-300">{a.message}</p>}
                  <p className="pt-2 text-[11px] text-brand">Agreed to be contacted on {when(a.consent_at)} IST</p>
                </dl>
              ) : (
                <p className="text-sm text-zinc-500">No contact details: this visitor only ran the audit and didn&apos;t ask to be contacted. Please don&apos;t try to contact them.</p>
              )}
            </div>
          </Card>
          <Card>
            <form action={saveAudit} className="space-y-4 px-5 py-4">
              <input type="hidden" name="id" value={a.id} />
              <div>
                <label htmlFor="status" className={labelCls}>
                  Status
                </label>
                <select id="status" name="status" defaultValue={a.status} className={inputCls}>
                  {Object.entries(STATUS).map(([k, [l]]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="notes" className={labelCls}>
                  Notes
                </label>
                <textarea id="notes" name="notes" rows={4} defaultValue={a.notes ?? ""} className={`${inputCls} resize-y`} />
              </div>
              <SubmitButton className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-black">Save</SubmitButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

async function AuditList({ filter, page }: { filter: string; page: number }) {
  const contactOnly = filter === "requests";
  const [c] = await rows<{ total: number; requests: number; open: number; week: number; avg: number | null }>(sql`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE consent_contact)::int AS requests,
           COUNT(*) FILTER (WHERE consent_contact AND status = 'new')::int AS open,
           COUNT(*) FILTER (WHERE created_at > LOCALTIMESTAMP - INTERVAL '7 days')::int AS week,
           ROUND(AVG(score))::int AS avg
    FROM site_audits
  `);
  const total = contactOnly ? c.requests : c.total;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(Math.max(1, page), totalPages);
  const list = await rows<Row>(sql`
    SELECT id, url, domain, score, name, email, phone, consent_contact, status, created_at, '' AS report_json FROM site_audits
    WHERE NOT ${contactOnly} OR consent_contact
    ORDER BY (consent_contact AND status = 'new') DESC, created_at DESC
    LIMIT ${PER_PAGE} OFFSET ${(current - 1) * PER_PAGE}
  `);
  const href = (f: string, p = 1) => `/admin/audits?f=${f}${p > 1 ? `&page=${p}` : ""}`;
  return (
    <>
      <StatGrid
        cols="grid-cols-2 sm:grid-cols-4"
        stats={[
          [c.total, "Audits run", "text-white"],
          [c.week, "This week", "text-sky-300"],
          [c.requests, "Asked for a review", "text-brand"],
          [c.avg ?? "–", "Average score", "text-amber-300"],
        ]}
      />
      {c.open > 0 && <p className="mb-4 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-brand">{c.open} review request(s) waiting for a reply. They&apos;re listed first.</p>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            ["all", "All audits"],
            ["requests", "Review requests"],
          ]}
          active={contactOnly ? "requests" : "all"}
          hrefFor={(k) => href(k)}
        />
        <form id="bulk-audits" action={deleteAudits}>
          <BulkDeleteButton formId="bulk-audits" noun="audit(s) and any contact details on them" />
        </form>
      </div>
      <Card>
        {list.length === 0 ? (
          <EmptyState>{contactOnly ? "No review requests yet." : "No audits yet. They appear here when someone uses the Free Website Audit tool."}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800 bg-zinc-800/50">
                <tr>
                  <th className="w-8 px-4 py-3">
                    <SelectAll formId="bulk-audits" />
                  </th>
                  <Th>Website</Th>
                  <Th className="text-center">Score</Th>
                  <Th>Contact</Th>
                  <Th hide="hidden md:table-cell">When</Th>
                  <Th className="text-right">Open</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {list.map((a) => {
                  const [label, cls] = STATUS[a.status] ?? STATUS.new;
                  return (
                    <tr key={a.id} className={`hover:bg-zinc-800/30 ${a.consent_contact && a.status === "new" ? "bg-brand/5" : ""}`}>
                      <td className="w-8 px-4 py-3">
                        <RowCheckbox formId="bulk-audits" value={a.id} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[260px] truncate text-sm text-white">{a.domain}</div>
                      </td>
                      <td className={`px-4 py-3 text-center font-mono text-sm ${scoreCls(a.score)}`}>{a.score ?? "–"}</td>
                      <td className="px-4 py-3">
                        {a.consent_contact ? (
                          <>
                            <div className="text-sm text-white">{a.name}</div>
                            <div className="max-w-[220px] truncate text-xs text-zinc-500">{a.email || a.phone}</div>
                            <span className={`mt-1 inline-block rounded border px-1.5 text-[10px] font-mono ${cls}`}>{label}</span>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-600">Not shared</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="font-mono text-xs text-zinc-500">{timeAgo(a.created_at)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/audits?view=${a.id}`} className="text-xs font-mono text-brand hover:text-brand-light">
                          View &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={current} totalPages={totalPages} total={total} perPage={PER_PAGE} hrefFor={(p) => href(contactOnly ? "requests" : "all", p)} />
      </Card>
      <p className="mt-4 text-xs text-zinc-600">
        Only contact people who asked for a review (they agreed to it). If someone asks for their data to be deleted, delete their audit here.{" "}
        <Link href="/tools/website-audit" target="_blank" className="text-brand hover:underline">
          Open the tool
        </Link>
      </p>
    </>
  );
}

export default async function AuditsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const view = Number(sp.view) || 0;
  return <AdminPage title="Site Audits">{view > 0 ? <AuditView id={view} /> : <AuditList filter={sp.f ?? "all"} page={Number(sp.page) || 1} />}</AdminPage>;
}
