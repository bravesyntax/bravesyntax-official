import { ArrowRight, Pencil, Power, Trash2 } from "lucide-react";
import Link from "next/link";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import SeoShell, { Pill } from "@/components/admin/SeoShell";
import { Card, EmptyState, iconBtnDelete, iconBtnEdit, iconBtnToggle, inputCls, labelCls, smallPrimaryBtn, Th, timeAgo, Toggle } from "@/components/admin/ui";
import { rows, sql } from "@/lib/db";
import { deleteRedirect, saveRedirect, toggleRedirect } from "../actions";

export const metadata = { title: "SEO · Redirects" };

type Redirect = { id: number; source_path: string; destination: string; status_code: number; is_active: number; hits: number; last_hit_at: Date | null; note: string | null; created_at: Date };
type Props = { searchParams: Promise<{ edit?: string; q?: string }> };

const STATUS: Record<number, [string, string]> = {
  301: ["301 Permanent", "Page moved for good. Passes ranking to the new URL."],
  302: ["302 Temporary", "Short-term move; Google keeps the old URL indexed."],
  410: ["410 Gone", "Removed on purpose; Google drops it faster than a 404."],
};

export default async function RedirectsPage({ searchParams }: Props) {
  const { edit, q = "" } = await searchParams;
  const term = `%${q.trim()}%`;
  const list = await rows<Redirect>(sql`
    SELECT id, source_path, destination, status_code, is_active, hits, last_hit_at, note, created_at FROM seo_redirects
    WHERE ${q.trim()} = '' OR source_path ILIKE ${term} OR destination ILIKE ${term} OR COALESCE(note, '') ILIKE ${term}
    ORDER BY created_at DESC, id DESC
  `);
  const editing = edit ? (await rows<Redirect>(sql`SELECT * FROM seo_redirects WHERE id = ${Number(edit) || 0}`))[0] ?? null : null;

  return (
    <SeoShell active="redirects">
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="h-fit p-6">
          <h2 className="font-display font-semibold text-white">{editing ? "Edit redirect" : "Add a redirect"}</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Send visitors and Google from an old URL to a new one. Use <code className="font-mono text-brand">/old-blog/*</code> to move a whole section; a{" "}
            <code className="font-mono text-brand">*</code> in the destination receives the rest of the path.
          </p>
          <form key={editing?.id ?? "new"} action={saveRedirect} className="mt-5 space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label htmlFor="source_path" className={labelCls}>
                Old path
              </label>
              <input id="source_path" name="source_path" required defaultValue={editing?.source_path} placeholder="/old-page" className={inputCls} />
            </div>
            <div>
              <label htmlFor="destination" className={labelCls}>
                Redirect to <span className="text-zinc-600">(not needed for 410)</span>
              </label>
              <input id="destination" name="destination" defaultValue={editing?.destination} placeholder="/new-page or https://…" className={inputCls} />
            </div>
            <fieldset>
              <legend className={labelCls}>Type</legend>
              <div className="space-y-2">
                {Object.entries(STATUS).map(([code, [label, help]]) => (
                  <label key={code} className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 p-3 has-[:checked]:border-brand/50 has-[:checked]:bg-brand/5">
                    <input type="radio" name="status_code" value={code} defaultChecked={(editing?.status_code ?? 301) === Number(code)} className="mt-0.5 accent-emerald-500" />
                    <span>
                      <span className="block text-sm text-white">{label}</span>
                      <span className="block text-[11px] text-zinc-500">{help}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="note" className={labelCls}>
                Note <span className="text-zinc-600">(optional)</span>
              </label>
              <input id="note" name="note" maxLength={255} defaultValue={editing?.note ?? ""} placeholder="Why this exists" className={inputCls} />
            </div>
            <Toggle name="is_active" label="Active" defaultChecked={editing ? !!editing.is_active : true} />
            <div className="flex items-center gap-3 pt-2">
              <SubmitButton className={smallPrimaryBtn}>{editing ? "Update redirect" : "Add redirect"}</SubmitButton>
              {editing && (
                <Link href="/admin/seo/redirects" className="text-xs text-zinc-400 hover:text-white">
                  Cancel
                </Link>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">Changes reach the live site within about a minute.</p>
          </form>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
            <div>
              <h2 className="font-display font-semibold text-white">Redirects</h2>
              <p className="mt-0.5 text-xs text-zinc-500">{list.length} {q ? "matching" : "total"} · hits count every visit that was redirected</p>
            </div>
            <form action="/admin/seo/redirects" className="flex gap-2">
              <input name="q" defaultValue={q} placeholder="Search paths or notes" aria-label="Search redirects" className="w-56 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 font-mono text-xs text-white focus:border-brand focus:outline-none" />
            </form>
          </div>
          {list.length === 0 ? (
            <EmptyState>{q ? "No redirects match." : "No redirects yet. Add one when you rename or remove a page."}</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-800/40">
                  <tr>
                    <Th>From → To</Th>
                    <Th>Type</Th>
                    <Th className="text-right">Hits</Th>
                    <Th hide="hidden md:table-cell">Last hit</Th>
                    <Th className="text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {list.map((r) => (
                    <tr key={r.id} className={r.is_active ? "" : "opacity-50"}>
                      <td className="max-w-md px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                          <span className="text-white">{r.source_path}</span>
                          {r.status_code !== 410 && (
                            <>
                              <ArrowRight className="h-3 w-3 text-zinc-600" aria-hidden="true" />
                              <span className="break-all text-brand">{r.destination}</span>
                            </>
                          )}
                        </div>
                        {r.note && <div className="mt-1 text-[11px] text-zinc-500">{r.note}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={r.status_code === 410 ? "error" : r.status_code === 302 ? "warning" : "ok"}>{r.status_code}</Pill>
                        {!r.is_active && <span className="ml-1.5 text-[10px] text-zinc-500">off</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">{r.hits.toLocaleString("en-IN")}</td>
                      <td className="hidden px-4 py-3 text-xs text-zinc-500 md:table-cell">{r.last_hit_at ? timeAgo(r.last_hit_at) : "Never"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link href={`/admin/seo/redirects?edit=${r.id}`} className={iconBtnEdit} title="Edit" aria-label="Edit">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <form action={toggleRedirect}>
                            <input type="hidden" name="id" value={r.id} />
                            <button type="submit" className={iconBtnToggle} title={r.is_active ? "Turn off" : "Turn on"} aria-label={r.is_active ? "Turn off" : "Turn on"}>
                              <Power className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </form>
                          <form action={deleteRedirect}>
                            <input type="hidden" name="id" value={r.id} />
                            <ConfirmButton message={`Delete the redirect for ${r.source_path}?`} className={iconBtnDelete} title="Delete">
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </ConfirmButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </SeoShell>
  );
}
