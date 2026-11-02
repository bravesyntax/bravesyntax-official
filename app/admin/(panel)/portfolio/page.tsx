import { ExternalLink, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BulkDeleteButton,
  ConfirmButton,
  RowCheckbox,
  SelectAll,
  SubmitButton,
} from "@/components/admin/client";
import ImageUpload from "@/components/admin/ImageUpload";
import { uploadMode } from "@/lib/admin/images";
import {
  AdminPage,
  BackLink,
  Card,
  EmptyState,
  FilterTabs,
  inputCls,
  labelCls,
  Pagination,
  primaryBtn,
  smallPrimaryBtn,
  StatGrid,
  Th,
  Toggle,
} from "@/components/admin/ui";
import type { Portfolio } from "@/lib/content";
import { rows, sql } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import {
  bulkDeleteProjects,
  deleteProject,
  saveProject,
  toggleProject,
} from "./actions";

export const metadata = { title: "Portfolio" };

const PER_PAGE = 20;
const FILTERS = ["design", "development", "active", "hidden"];
const METRIC_PLACEHOLDERS = [
  "+34% conversion",
  "1.2s load time",
  "98 PageSpeed",
];

type Project = Portfolio & { sort_order: number; is_active: number };
type Props = {
  searchParams: Promise<{
    edit?: string;
    form?: string;
    cat?: string;
    page?: string;
  }>;
};

function TextArea({
  name,
  label,
  hint,
  rows: r = 3,
  value,
  placeholder,
}: {
  name: string;
  label: string;
  hint: string;
  rows?: number;
  value?: string | null;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label} <span className="text-zinc-600">({hint})</span>
      </label>
      <textarea
        id={name}
        name={name}
        rows={r}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        className={`${inputCls} resize-y`}
      />
    </div>
  );
}

function ProjectForm({ row }: { row: Project | null }) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <BackLink href="/admin/portfolio">Back to Portfolio</BackLink>
        {row && (
          <div className="flex items-center gap-3">
            {row.slug && (
              <Link href={`/admin/seo/edit?type=project&key=${row.id}`} className="text-xs text-accent hover:underline">
                SEO for this case study →
              </Link>
            )}
            <span className="px-2.5 py-1 text-xs font-mono bg-amber-500/15 text-amber-400 rounded-lg border border-amber-500/25">
              Editing #{row.id}
            </span>
          </div>
        )}
      </div>
      <Card>
        <div className="px-6 py-5 border-b border-zinc-800">
          <h2 className="text-xl font-display font-bold text-white">
            {row ? `Edit — ${row.title}` : "Add New Project"}
          </h2>
        </div>
        <form action={saveProject} className="p-6 lg:p-8 space-y-6">
          {row && <input type="hidden" name="id" value={row.id} />}
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="title" className={labelCls}>
                Title <span className="text-emerald-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                name="title"
                required
                defaultValue={row?.title}
                placeholder="e.g. PetalCo Shopify Store"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="category" className={labelCls}>
                Category <span className="text-emerald-400">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                defaultValue={row?.category ?? "development"}
                className={inputCls}
              >
                <option value="development">Development</option>
                <option value="design">Design</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="tags" className={labelCls}>
                Tags <span className="text-zinc-600">(comma-separated)</span>
              </label>
              <input
                id="tags"
                type="text"
                name="tags"
                defaultValue={row?.tags ?? ""}
                placeholder="Shopify, Custom Theme, Liquid"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className={labelCls}>
                  Year <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="year"
                  type="number"
                  name="year"
                  required
                  min={2000}
                  max={2100}
                  defaultValue={row?.year ?? new Date().getFullYear()}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="sort_order" className={labelCls}>
                  Sort Order
                </label>
                <input
                  id="sort_order"
                  type="number"
                  name="sort_order"
                  min={0}
                  defaultValue={row?.sort_order ?? 0}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="live_url" className={labelCls}>
              Live Project URL{" "}
              <span className="text-zinc-600">
                (opens when clicking project name)
              </span>
            </label>
            <input
              id="live_url"
              type="url"
              name="live_url"
              defaultValue={row?.live_url ?? ""}
              placeholder="https://example.com"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="description" className={labelCls}>
              Description <span className="text-emerald-400">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              required
              defaultValue={row?.description ?? ""}
              placeholder="Project scope and results..."
              className={`${inputCls} resize-y`}
            />
          </div>
          <ImageUpload
            kind="portfolio"
            current={row?.image ?? null}
            mode={uploadMode()}
            hint="JPG, PNG, WebP, GIF · max 5 MB"
          />
          <div>
            <span className={labelCls}>Key Metrics</span>
            <div className="grid sm:grid-cols-3 gap-4">
              {METRIC_PLACEHOLDERS.map((ph, i) => {
                const name = `metric_${i + 1}` as "metric_1" | "metric_2" | "metric_3";
                return (
                  <input
                    key={name}
                    type="text"
                    name={name}
                    aria-label={`Metric ${i + 1}`}
                    defaultValue={row?.[name] ?? ""}
                    placeholder={ph}
                    className={inputCls}
                  />
                );
              })}
            </div>
          </div>

          <div className="border border-zinc-800 rounded-xl p-5 space-y-5">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              Case Study
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="client_name" className={labelCls}>
                  Client Name{" "}
                  <span className="text-zinc-600">
                    (shown on the case study; leave blank to omit)
                  </span>
                </label>
                <input
                  id="client_name"
                  type="text"
                  name="client_name"
                  defaultValue={row?.client_name ?? ""}
                  placeholder="e.g. Subhot Enterprises"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="slug" className={labelCls}>
                  URL Slug{" "}
                  <span className="text-zinc-600">
                    (blank = auto-generate from title)
                  </span>
                </label>
                <input
                  id="slug"
                  type="text"
                  name="slug"
                  defaultValue={row?.slug ?? ""}
                  placeholder="petalco-shopify-store"
                  className={inputCls}
                />
              </div>
            </div>
            <TextArea
              name="challenge"
              label="Challenge"
              hint="what problem was the client facing? leave blank to hide this section"
              value={row?.challenge}
              placeholder="e.g. Their old site took 6+ seconds to load and had no mobile checkout, losing most mobile traffic."
            />
            <TextArea
              name="approach"
              label="Approach"
              hint="what did you actually do? leave blank to hide this section"
              value={row?.approach}
              placeholder="e.g. Rebuilt on a lightweight Shopify theme, added a single-page checkout, optimized images."
            />
            <TextArea
              name="results_detail"
              label="Results — detail"
              hint="only add real, verified outcomes — the 3 metric boxes already cover short stats"
              value={row?.results_detail}
              placeholder="e.g. Site now loads in 1.8s on 4G; mobile checkout completion is up since launch."
            />
            <div>
              <label htmlFor="tech_stack" className={labelCls}>
                Tech Stack{" "}
                <span className="text-zinc-600">
                  (comma-separated, shown as pills on the case study)
                </span>
              </label>
              <input
                id="tech_stack"
                type="text"
                name="tech_stack"
                defaultValue={row?.tech_stack ?? ""}
                placeholder="Shopify, Liquid, JavaScript"
                className={inputCls}
              />
            </div>
          </div>

          <Toggle
            name="is_active"
            label="Active (visible on site)"
            defaultChecked={row ? !!row.is_active : true}
          />
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
            <SubmitButton className={primaryBtn}>
              {row ? "Update Project" : "Add Project"}
            </SubmitButton>
            <Link
              href="/admin/portfolio"
              className="px-4 py-3 text-sm font-mono text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </>
  );
}

async function ProjectList({
  cat,
  page: requested,
}: {
  cat: string;
  page: number;
}) {
  const [counts] = await rows<{
    total: number;
    active: number;
    design: number;
    development: number;
    hidden: number;
  }>(sql`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active = 1)::int AS active, COUNT(*) FILTER (WHERE is_active = 0)::int AS hidden,
           COUNT(*) FILTER (WHERE category = 'design')::int AS design, COUNT(*) FILTER (WHERE category = 'development')::int AS development
    FROM portfolios
  `);
  const total =
    cat === "all" ? counts.total : counts[cat as keyof typeof counts];
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, requested), totalPages);
  const list = await rows<Project>(sql`
    SELECT * FROM portfolios
    WHERE (${cat} <> 'design' OR category = 'design') AND (${cat} <> 'development' OR category = 'development')
      AND (${cat} <> 'active' OR is_active = 1) AND (${cat} <> 'hidden' OR is_active = 0)
    ORDER BY sort_order ASC, year DESC, id DESC LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}
  `);
  const href = (p: number, c = cat) =>
    `/admin/portfolio?cat=${c}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <>
      <StatGrid
        cols="grid-cols-2 sm:grid-cols-4"
        stats={[
          [counts.total, "Total", "text-white"],
          [counts.active, "Active", "text-accent"],
          [counts.design, "Design", "text-purple-400"],
          [counts.development, "Dev", "text-blue-400"],
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
          hrefFor={(k) => href(1, k)}
        />
        <div className="flex items-center gap-2">
          <form id="bulk-projects" action={bulkDeleteProjects}>
            <BulkDeleteButton formId="bulk-projects" noun="project(s)" />
          </form>
          <Link href="/admin/portfolio?form=add" className={smallPrimaryBtn}>
            + Add Project
          </Link>
        </div>
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState>
            No projects{cat !== "all" ? " in this filter" : " yet"}.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  <th className="w-8 px-4 py-3">
                    <SelectAll formId="bulk-projects" />
                  </th>
                  <Th>Image</Th>
                  <Th>Project</Th>
                  <Th>Category</Th>
                  <Th hide="hidden md:table-cell">URL</Th>
                  <Th hide="hidden lg:table-cell">Metrics</Th>
                  <Th className="text-center">Year</Th>
                  <Th className="text-center">Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {list.map((p) => (
                  <tr
                    key={p.id}
                    className={`group transition-colors hover:bg-zinc-800/30 ${!p.is_active ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3 w-8">
                      <RowCheckbox formId="bulk-projects" value={p.id} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-14 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                          <img
                            src={mediaUrl("portfolio", p.image)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-white font-semibold truncate max-w-[220px]">
                        {p.title}
                      </div>
                      {p.client_name && (
                        <div className="font-mono text-[10px] text-zinc-600 truncate max-w-[220px]">
                          {p.client_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border uppercase tracking-wider ${
                          p.category === "design"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {p.category === "design" ? "Design" : "Dev"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.live_url ? (
                        <a
                          href={p.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-accent hover:underline truncate block max-w-[180px]"
                        >
                          {p.live_url.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-[10px] text-zinc-500">
                        {[p.metric_1, p.metric_2, p.metric_3]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-xs text-zinc-500">
                        {p.year}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${
                          p.is_active
                            ? "bg-accent/10 text-accent border-accent/20"
                            : "bg-zinc-700/50 text-zinc-500 border-zinc-700"
                        }`}
                      >
                        {p.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.is_active && p.slug ? (
                          <Link
                            href={`/portfolio/${p.slug}`}
                            target="_blank"
                            className="text-xs text-zinc-400 hover:text-white transition-colors"
                            title="View case study"
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                        <Link
                          href={`/admin/portfolio?edit=${p.id}`}
                          className="text-xs text-accent hover:text-accent-light transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <form action={toggleProject} className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                            title={p.is_active ? "Hide" : "Show"}
                          >
                            {p.is_active ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        </form>
                        <form action={deleteProject} className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmButton
                            message={`Delete "${p.title}"?`}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
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
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          perPage={PER_PAGE}
          hrefFor={(p) => href(p)}
        />
      </Card>
    </>
  );
}

export default async function PortfolioAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const editId = Number(sp.edit) || 0;
  let row: Project | null = null;
  if (editId) {
    [row] = await rows<Project>(
      sql`SELECT * FROM portfolios WHERE id = ${editId}`,
    );
    if (!row) redirect("/admin/portfolio");
  }
  const cat = FILTERS.includes(sp.cat ?? "") ? sp.cat! : "all";

  return (
    <AdminPage title="Portfolio">
      {row || sp.form !== undefined ? (
        <ProjectForm row={row} />
      ) : (
        <ProjectList cat={cat} page={Number(sp.page) || 1} />
      )}
    </AdminPage>
  );
}
