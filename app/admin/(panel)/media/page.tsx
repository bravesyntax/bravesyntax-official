import { Film } from "lucide-react";
import Link from "next/link";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import { CopyLink, MediaUploader } from "@/components/admin/MediaTools";
import { AdminPage, Card, EmptyState, FilterTabs, Pagination, StatGrid, timeAgo } from "@/components/admin/ui";
import { BLOB_FREE_BYTES, mediaUsage, type MediaRow } from "@/lib/admin/media-lib";
import { uploadMode } from "@/lib/admin/images";
import { formatBytes } from "@/lib/format-bytes";
import { rows, sql } from "@/lib/db";
import { deleteMedia, saveMediaAlt } from "./actions";

export const metadata = { title: "Media" };

const PER_PAGE = 30;
const FILTERS = ["all", "image", "video", "unused"] as const;
type Filter = (typeof FILTERS)[number];
type Props = { searchParams: Promise<{ f?: string; page?: string; q?: string }> };

export default async function MediaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filter: Filter = FILTERS.includes(sp.f as Filter) ? (sp.f as Filter) : "all";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const [all, usage] = await Promise.all([rows<MediaRow>(sql`SELECT * FROM media ORDER BY created_at DESC`), mediaUsage()]);
  const usedIn = (m: MediaRow) => usage.get(m.url) ?? [];

  const blobBytes = all.filter((m) => m.source === "blob").reduce((n, m) => n + (m.size_bytes ?? 0), 0);
  const unused = all.filter((m) => !usedIn(m).length);
  const matching = all.filter(
    (m) =>
      (filter === "all" || (filter === "unused" ? !usedIn(m).length : m.kind === filter)) &&
      (!q || m.name.toLowerCase().includes(q.toLowerCase()) || (m.alt ?? "").toLowerCase().includes(q.toLowerCase())),
  );
  const totalPages = Math.max(1, Math.ceil(matching.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(sp.page) || 1), totalPages);
  const list = matching.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const qs = (f: string, p = 1) => new URLSearchParams({ f, ...(p > 1 && { page: String(p) }), ...(q && { q }) }).toString();
  const back = qs(filter, page);
  const pct = Math.min(100, (blobBytes / BLOB_FREE_BYTES) * 100);

  return (
    <AdminPage title="Media">
      <StatGrid
        cols="grid-cols-2 sm:grid-cols-4"
        stats={[
          [all.length, "Files", "text-white"],
          [all.filter((m) => m.kind === "video").length, "Videos", "text-sky-300"],
          [unused.length, "Not used anywhere", unused.length ? "text-amber-300" : "text-zinc-400"],
          [formatBytes(blobBytes) || "0 KB", "Cloud storage used", "text-brand"],
        ]}
      />
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
        <div className="mb-2 flex justify-between text-xs text-zinc-400">
          <span>Vercel Blob storage (free plan: 1 GB)</span>
          <span>
            {formatBytes(blobBytes) || "0 KB"} of 1 GB · {pct.toFixed(pct < 1 ? 2 : 0)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
          <div className={`h-full ${pct > 80 ? "bg-red-400" : pct > 60 ? "bg-amber-400" : "bg-brand"}`} style={{ width: `${Math.max(pct, 0.5)}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">Images from the old site (marked &ldquo;Site file&rdquo;) are part of the website code and don&apos;t use this storage.</p>
      </div>

      {uploadMode() === "blob" ? <MediaUploader /> : <p className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300">Uploads need a Vercel Blob store (BLOB_READ_WRITE_TOKEN).</p>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            ["all", `All (${all.length})`],
            ["image", "Images"],
            ["video", "Videos"],
            ["unused", `Not used (${unused.length})`],
          ]}
          active={filter}
          hrefFor={(k) => `/admin/media?${qs(k)}`}
        />
        <form className="flex gap-2">
          <input type="hidden" name="f" value={filter} />
          <input name="q" defaultValue={q} placeholder="Search name or description" aria-label="Search media" className="h-8 w-56 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 font-mono text-xs text-white focus:border-brand focus:outline-none" />
        </form>
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState>{filter === "unused" ? "Every file is in use." : "No files here yet. Upload some above."}</EmptyState>
        ) : (
          <ul className="grid gap-px bg-zinc-800/50 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((m) => {
              const used = usedIn(m);
              return (
                <li key={m.id} className="flex flex-col bg-zinc-950 p-4">
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-video overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                    {m.kind === "video" ? (
                      <>
                        <video src={m.url} muted preload="metadata" className="size-full object-contain" />
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                          <Film className="size-3" aria-hidden="true" /> Video
                        </span>
                      </>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, straight from storage
                      <img src={m.url} alt={m.alt ?? ""} loading="lazy" className="size-full object-contain" />
                    )}
                  </a>
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-white" title={m.name}>
                        {m.name}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {[m.width && m.height ? `${m.width}×${m.height}` : "", formatBytes(m.size_bytes), (m.mime ?? "").split("/")[1]?.toUpperCase(), timeAgo(m.created_at)].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {m.source === "local" && <span className="shrink-0 rounded border border-zinc-700 px-1.5 text-[10px] text-zinc-400">Site file</span>}
                  </div>
                  <div className="mt-2 text-xs">
                    {used.length ? (
                      <ul className="space-y-0.5">
                        {used.slice(0, 3).map((u) => (
                          <li key={u.label} className="truncate">
                            <Link href={u.href} className="text-sky-300 hover:underline">
                              {u.label}
                            </Link>
                          </li>
                        ))}
                        {used.length > 3 && <li className="text-zinc-500">and {used.length - 3} more</li>}
                      </ul>
                    ) : (
                      <span className="text-amber-300">Not used anywhere</span>
                    )}
                  </div>
                  <form action={saveMediaAlt} className="mt-3 flex gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="back" value={back} />
                    <input name="alt" defaultValue={m.alt ?? ""} maxLength={300} placeholder="Description (for Google & screen readers)" aria-label={`Description of ${m.name}`} className="h-8 min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-white focus:border-brand focus:outline-none" />
                    <SubmitButton pending="…" className="rounded-lg border border-zinc-700 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800">
                      Save
                    </SubmitButton>
                  </form>
                  <div className="mt-3 flex items-center justify-between border-t border-zinc-800/70 pt-3">
                    <CopyLink url={m.url} />
                    {m.source === "blob" &&
                      (used.length ? (
                        <span className="text-[11px] text-zinc-600">In use: can&apos;t delete</span>
                      ) : (
                        <form action={deleteMedia}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="back" value={back} />
                          <ConfirmButton message={`Delete ${m.name} permanently? This can't be undone.`} className="text-xs text-red-400 hover:text-red-300">
                            Delete
                          </ConfirmButton>
                        </form>
                      ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} totalPages={totalPages} total={matching.length} perPage={PER_PAGE} hrefFor={(p) => `/admin/media?${qs(filter, p)}`} />
      </Card>
    </AdminPage>
  );
}
