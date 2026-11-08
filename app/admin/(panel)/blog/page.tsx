import { ExternalLink, Eye, EyeOff, Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CategoryPicker,
  ContentEditor,
  TitleSlugFields,
} from "@/components/admin/BlogFields";
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
import { formatDate } from "@/lib/content";
import { rows, sql } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { AiFill } from "@/components/admin/AiFill";
import { geminiEnabled } from "@/lib/gemini";
import { aiBlogDraft } from "../ai-actions";
import {
  bulkDeletePosts,
  deletePost,
  savePost,
  togglePublish,
} from "./actions";

export const metadata = { title: "Blog" };

const PER_PAGE = 20;
const STATUSES = ["published", "draft", "featured"];

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string | null;
  featured_image: string | null;
  author: string;
  read_time: number | null;
  is_published: number;
  is_featured: number;
  /** From seo_meta (Admin → SEO), not blog_posts. */
  seo_title: string | null;
  seo_description: string | null;
  published_at: Date | null;
  created_at: Date;
};
type Props = {
  searchParams: Promise<{
    edit?: string;
    form?: string;
    status?: string;
    page?: string;
  }>;
};

async function PostForm({ row }: { row: Post | null }) {
  const categories = await rows<{ slug: string; label: string }>(
    sql`SELECT slug, label FROM blog_categories ORDER BY sort ASC, label ASC`,
  );
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <BackLink href="/admin/blog">Back to Blog</BackLink>
        {row ? (
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-mono rounded-lg border ${
                row.is_published
                  ? "bg-brand/15 text-brand border-brand/25"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/25"
              }`}
            >
              {row.is_published ? "Published" : "Draft"}
            </span>
            <span className="px-2.5 py-1 text-xs font-mono bg-zinc-700/50 text-zinc-400 rounded-lg border border-zinc-700">
              ID #{row.id}
            </span>
          </div>
        ) : (
          <span className="px-2.5 py-1 text-xs font-mono bg-brand/15 text-brand rounded-lg border border-brand/25">
            New Post
          </span>
        )}
      </div>
      <Card>
        <div className="px-6 py-5 border-b border-zinc-800">
          <h2 className="text-xl font-display font-bold text-white">
            {row ? `Edit — ${row.title}` : "New Blog Post"}
          </h2>
        </div>
        <form action={savePost} className="p-6 lg:p-8 space-y-6">
          {row && <input type="hidden" name="id" value={row.id} />}
          <TitleSlugFields title={row?.title ?? ""} slug={row?.slug ?? ""}>
            <CategoryPicker
              categories={categories}
              current={row?.category ?? "general"}
            />
          </TitleSlugFields>
          {geminiEnabled() && <AiFill label="Draft post with AI" read={["title", "excerpt", "tags"]} run={aiBlogDraft} hint="Writes the excerpt, content and tags from your title. Add notes in the excerpt first to steer it." />}
          <div>
            <label htmlFor="excerpt" className={labelCls}>
              Excerpt{" "}
              <span className="text-zinc-600">
                (short preview for listing cards — auto-generated if empty)
              </span>
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={2}
              defaultValue={row?.excerpt ?? ""}
              placeholder="A brief summary of this post..."
              className={`${inputCls} resize-y`}
            />
          </div>
          <ContentEditor content={row?.content ?? ""} />
          <ImageUpload
            kind="blog"
            current={row?.featured_image ?? null}
            mode={uploadMode()}
            hint="JPG, PNG, WebP · max 5 MB · 1200×630px recommended"
          />
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
                placeholder="Web Development, Business, SEO"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="author" className={labelCls}>
                Author
              </label>
              <input
                id="author"
                type="text"
                name="author"
                defaultValue={row?.author ?? "Brave Syntax"}
                className={inputCls}
              />
            </div>
          </div>
          <div className="border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Search appearance</div>
              {row && (
                <Link href={`/admin/seo/edit?type=post&key=${row.id}`} className="text-xs text-brand hover:underline">
                  Full SEO editor: focus keyword, previews, share image, schema →
                </Link>
              )}
            </div>
            <div>
              <label htmlFor="seo_title" className={labelCls}>
                SEO title <span className="text-zinc-600">(empty = post title + site suffix)</span>
              </label>
              <input id="seo_title" type="text" name="seo_title" maxLength={200} defaultValue={row?.seo_title ?? ""} placeholder={row ? `${row.title} | Brave Syntax` : "Override the title shown in Google"} className={inputCls} />
            </div>
            <div>
              <label htmlFor="seo_description" className={labelCls}>
                Meta description <span className="text-zinc-600">(empty = excerpt; aim for 120–160 characters)</span>
              </label>
              <textarea id="seo_description" name="seo_description" rows={2} maxLength={400} defaultValue={row?.seo_description ?? ""} placeholder={row?.excerpt ?? "Summary shown under the title in search results"} className={`${inputCls} resize-y`} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Toggle
              name="is_published"
              label="Published"
              defaultChecked={row ? !!row.is_published : true}
              color="peer-checked:bg-brand"
            />
            <Toggle
              name="is_featured"
              label="Featured"
              defaultChecked={!!row?.is_featured}
              color="peer-checked:bg-amber-500"
            />
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
            <SubmitButton className={primaryBtn}>
              {row ? "Update Post" : "Create Post"}
            </SubmitButton>
            <Link
              href="/admin/blog"
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

async function PostList({
  status,
  page: requested,
}: {
  status: string;
  page: number;
}) {
  const [counts] = await rows<{
    total: number;
    published: number;
    draft: number;
    featured: number;
  }>(sql`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_published = 1)::int AS published,
           COUNT(*) FILTER (WHERE is_published = 0)::int AS draft, COUNT(*) FILTER (WHERE is_featured = 1)::int AS featured
    FROM blog_posts
  `);
  const total =
    status === "all"
      ? counts.total
      : counts[status as "published" | "draft" | "featured"];
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, requested), totalPages);
  const posts = await rows<Post>(sql`
    SELECT id, title, slug, category, featured_image, read_time, is_published, is_featured, published_at, created_at FROM blog_posts
    WHERE (${status} <> 'published' OR is_published = 1) AND (${status} <> 'draft' OR is_published = 0) AND (${status} <> 'featured' OR is_featured = 1)
    ORDER BY created_at DESC LIMIT ${PER_PAGE} OFFSET ${(page - 1) * PER_PAGE}
  `);
  const href = (p: number, s = status) =>
    `/admin/blog?status=${s}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <>
      <StatGrid
        stats={[
          [counts.total, "Total Posts", "text-white"],
          [counts.published, "Published", "text-brand"],
          [counts.draft, "Drafts", "text-amber-400"],
        ]}
      />
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <FilterTabs
          tabs={[
            ["all", "All"],
            ["published", "Published"],
            ["draft", "Drafts"],
            ["featured", "Featured"],
          ]}
          active={status}
          hrefFor={(k) => href(1, k)}
        />
        <div className="flex items-center gap-2">
          <form id="bulk-posts" action={bulkDeletePosts}>
            <BulkDeleteButton formId="bulk-posts" noun="post(s)" />
          </form>
          <Link href="/admin/blog?form=add" className={smallPrimaryBtn}>
            + New Post
          </Link>
        </div>
      </div>

      <Card>
        {posts.length === 0 ? (
          <EmptyState>
            No posts{status !== "all" ? " in this filter" : " yet"}.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  <th className="w-8 px-4 py-3">
                    <SelectAll formId="bulk-posts" />
                  </th>
                  <Th>Post</Th>
                  <Th hide="hidden md:table-cell">Category</Th>
                  <Th className="text-center">Status</Th>
                  <Th hide="hidden lg:table-cell">Date</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {posts.map((p) => (
                  <tr
                    key={p.id}
                    className={`group transition-colors hover:bg-zinc-800/30 ${!p.is_published ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3 w-8">
                      <RowCheckbox formId="bulk-posts" value={p.id} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                          {p.featured_image && (
                            // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                            <img
                              src={mediaUrl("blog", p.featured_image)}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-sm text-white font-semibold truncate max-w-[280px]">
                            {p.is_featured ? (
                              <Star className="mr-1 inline h-3.5 w-3.5 -translate-y-px fill-amber-400 text-amber-400" aria-label="Featured" />
                            ) : null}
                            {p.title}
                          </div>
                          <div className="font-mono text-[10px] text-zinc-600 truncate max-w-[280px]">
                            /blog/{p.slug}
                            {p.read_time ? ` · ${p.read_time} min read` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-mono rounded border uppercase tracking-wider bg-zinc-800 text-zinc-400 border-zinc-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${
                          p.is_published
                            ? "bg-brand/10 text-brand border-brand/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {p.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-zinc-500">
                        {formatDate(p.published_at ?? p.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.is_published ? (
                          <Link
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            className="text-xs text-zinc-400 hover:text-white transition-colors"
                            title="View"
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                        <Link
                          href={`/admin/blog?edit=${p.id}`}
                          className="text-xs text-brand hover:text-brand-light transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <form action={togglePublish} className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                            title={p.is_published ? "Unpublish" : "Publish"}
                          >
                            {p.is_published ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        </form>
                        <form action={deletePost} className="inline">
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

export default async function BlogAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const editId = Number(sp.edit) || 0;
  let row: Post | null = null;
  if (editId) {
    [row] = await rows<Post>(
      sql`
        SELECT p.*, m.title AS seo_title, m.description AS seo_description FROM blog_posts p
        LEFT JOIN seo_meta m ON m.entity_type = 'post' AND m.entity_key = p.id::text
        WHERE p.id = ${editId}
      `,
    );
    if (!row) redirect("/admin/blog");
  }
  const status = STATUSES.includes(sp.status ?? "") ? sp.status! : "all";

  return (
    <AdminPage title="Blog">
      {row || sp.form !== undefined ? (
        <PostForm row={row} />
      ) : (
        <PostList status={status} page={Number(sp.page) || 1} />
      )}
    </AdminPage>
  );
}
