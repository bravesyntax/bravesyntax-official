import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BulkDeleteButton, ConfirmButton, RowCheckbox, SelectAll, SubmitButton } from "@/components/admin/client";
import IconPicker from "@/components/admin/IconPicker";
import { AdminPage, BackLink, Card, EmptyState, FilterTabs, iconBtnDelete, iconBtnEdit, iconBtnToggle, inputCls, labelCls, primaryBtn, smallPrimaryBtn, StatGrid, Th, Toggle } from "@/components/admin/ui";
import { rows, sql } from "@/lib/db";
import { bulkDeleteServices, deleteService, saveService, toggleService } from "./actions";

export const metadata = { title: "Services" };

type Service = { id: number; title: string; category: string; description: string; icon: string | null; sort_order: number; is_active: number };
type Props = { searchParams: Promise<{ edit?: string; form?: string; cat?: string }> };

async function ServiceForm({ row }: { row: Service | null }) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <BackLink href="/admin/services">Back to Services</BackLink>
        {row && <span className="px-2.5 py-1 text-xs font-mono bg-amber-500/15 text-amber-400 rounded-lg border border-amber-500/25">Editing #{row.id}</span>}
      </div>
      <Card>
        <div className="px-6 py-5 border-b border-zinc-800">
          <h2 className="text-xl font-display font-bold text-white">{row ? `Edit — ${row.title}` : "Add New Service"}</h2>
        </div>
        <form action={saveService} className="p-6 lg:p-8 space-y-6">
          {row && <input type="hidden" name="id" value={row.id} />}
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="title" className={labelCls}>
                Service Title <span className="text-emerald-400">*</span>
              </label>
              <input id="title" type="text" name="title" required defaultValue={row?.title} placeholder="e.g. Custom Website Development" className={inputCls} />
            </div>
            <div>
              <label htmlFor="category" className={labelCls}>
                Category <span className="text-emerald-400">*</span>
              </label>
              <select id="category" name="category" required defaultValue={row?.category ?? "development"} className={inputCls}>
                <option value="development">Development</option>
                <option value="design">Design</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="description" className={labelCls}>
              Description <span className="text-emerald-400">*</span>
            </label>
            <textarea id="description" name="description" rows={3} required defaultValue={row?.description} placeholder="What this service includes..." className={`${inputCls} resize-y`} />
          </div>
          <IconPicker defaultValue={row?.icon ?? ""} />
          <div>
            <label htmlFor="sort_order" className={labelCls}>
              Sort Order
            </label>
            <input id="sort_order" type="number" name="sort_order" min={0} defaultValue={row?.sort_order ?? 0} className={`${inputCls} !w-32`} />
          </div>
          <Toggle name="is_active" label="Active" defaultChecked={row ? !!row.is_active : true} />
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
            <SubmitButton className={primaryBtn}>{row ? "Update" : "Add Service"}</SubmitButton>
            <Link href="/admin/services" className="px-4 py-3 text-sm font-mono text-zinc-400 hover:text-white transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </>
  );
}

async function ServiceList({ cat }: { cat: string }) {
  const [counts] = await rows<{ total: number; active: number; design: number; dev: number }>(sql`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active = 1)::int AS active,
           COUNT(*) FILTER (WHERE category = 'design')::int AS design, COUNT(*) FILTER (WHERE category = 'development')::int AS dev
    FROM services
  `);
  const list = await rows<Service>(sql`
    SELECT * FROM services
    WHERE (${cat} <> 'design' OR category = 'design') AND (${cat} <> 'development' OR category = 'development')
      AND (${cat} <> 'active' OR is_active = 1) AND (${cat} <> 'hidden' OR is_active = 0)
    ORDER BY sort_order ASC, id ASC
  `);

  return (
    <>
      <StatGrid
        cols="grid-cols-2 sm:grid-cols-4"
        stats={[
          [counts.total, "Total", "text-white"],
          [counts.active, "Active", "text-accent"],
          [counts.design, "Design", "text-purple-400"],
          [counts.dev, "Dev", "text-blue-400"],
        ]}
      />
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <FilterTabs
          tabs={[
            ["all", "All"],
            ["design", "Design"],
            ["development", "Development"],
            ["active", "Active"],
            ["hidden", "Hidden"],
          ]}
          active={cat}
          hrefFor={(k) => `/admin/services?cat=${k}`}
        />
        <div className="flex items-center gap-2">
          <form id="bulk-services" action={bulkDeleteServices}>
            <BulkDeleteButton formId="bulk-services" noun="service(s)" />
          </form>
          <Link href="/admin/services?form=add" className={smallPrimaryBtn}>
            + Add Service
          </Link>
        </div>
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState>No services{cat !== "all" ? " in this filter" : ""}.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  <th className="w-8 px-4 py-3">
                    <SelectAll formId="bulk-services" />
                  </th>
                  <Th>Icon</Th>
                  <Th>Service</Th>
                  <Th>Category</Th>
                  <Th hide="hidden lg:table-cell">Description</Th>
                  <Th className="text-center">Order</Th>
                  <Th className="text-center">Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {list.map((s) => (
                  <tr key={s.id} className={`group transition-colors hover:bg-zinc-800/30 ${!s.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 w-8">
                      <RowCheckbox formId="bulk-services" value={s.id} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/15 rounded-lg flex items-center justify-center">
                        {s.icon ? (
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
                          </svg>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-white font-semibold truncate max-w-[200px]">{s.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border uppercase tracking-wider ${
                          s.category === "design" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {s.category === "design" ? "Design" : "Dev"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-zinc-600 truncate block max-w-[250px]">{s.description.slice(0, 60)}…</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-xs text-zinc-500">{s.sort_order}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${
                          s.is_active ? "bg-accent/10 text-accent border-accent/20" : "bg-zinc-700/50 text-zinc-500 border-zinc-700"
                        }`}
                      >
                        {s.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/services?edit=${s.id}`} className={iconBtnEdit} title="Edit" aria-label="Edit">
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <form action={toggleService} className="inline">
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" className={iconBtnToggle} title={s.is_active ? "Hide" : "Show"} aria-label={s.is_active ? "Hide" : "Show"}>
                            {s.is_active ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        </form>
                        <form action={deleteService} className="inline">
                          <input type="hidden" name="id" value={s.id} />
                          <ConfirmButton message={`Delete "${s.title}"?`} className={iconBtnDelete} title="Delete">
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
    </>
  );
}

export default async function ServicesAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const editId = Number(sp.edit) || 0;
  let row: Service | null = null;
  if (editId) {
    [row] = await rows<Service>(sql`SELECT * FROM services WHERE id = ${editId}`);
    if (!row) redirect("/admin/services");
  }
  const cat = ["design", "development", "active", "hidden"].includes(sp.cat ?? "") ? sp.cat! : "all";

  return <AdminPage title="Services">{row || sp.form !== undefined ? <ServiceForm row={row} /> : <ServiceList cat={cat} />}</AdminPage>;
}
