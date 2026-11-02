"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { checkbox, finish, idsField, intField, makeSlug, refreshPublicSite } from "@/lib/admin/common";
import { deleteImage, resolveImage } from "@/lib/admin/images";
import { rows, sql } from "@/lib/db";
import { field } from "@/lib/validation";

const PAGE = "/admin/blog";

const stripTags = (html: string) => html.replace(/<[^>]*>/g, " ");
const readTime = (html: string) => Math.max(1, Math.ceil(stripTags(html).split(/\s+/).filter(Boolean).length / 200));

/** The SEO title/description box on the post form writes to seo_meta (the rest is set in Admin → SEO). */
async function saveSeoBasics(postId: number, title: string | null, description: string | null) {
  const key = String(postId);
  if (title || description) {
    await sql`
      INSERT INTO seo_meta (entity_type, entity_key, title, description, updated_at) VALUES ('post', ${key}, ${title}, ${description}, LOCALTIMESTAMP)
      ON CONFLICT (entity_type, entity_key) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = LOCALTIMESTAMP
    `;
    return;
  }
  // Both cleared: drop them, and the whole row if nothing else was customised.
  await sql`UPDATE seo_meta SET title = NULL, description = NULL, updated_at = LOCALTIMESTAMP WHERE entity_type = 'post' AND entity_key = ${key}`;
  await sql`
    DELETE FROM seo_meta WHERE entity_type = 'post' AND entity_key = ${key} AND focus_keyword IS NULL AND og_image IS NULL
      AND canonical_url IS NULL AND COALESCE(noindex, 0) = 0 AND schema_json IS NULL
  `;
}

export async function savePost(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const back = id ? `${PAGE}?edit=${id}` : `${PAGE}?form=add`;

  const title = field(fd, "title");
  const content = String(fd.get("content") ?? "").trim(); // admin-authored HTML, stored as-is like the PHP admin
  if (!title || !content) await finish("error", "Title and content are required.", back);

  const slug = field(fd, "slug") || makeSlug(title) || "post";
  const excerpt = field(fd, "excerpt") || `${stripTags(content).replace(/\s+/g, " ").trim().slice(0, 200)}...`;
  const category = field(fd, "category") || "general";
  const tags = field(fd, "tags");
  const author = field(fd, "author") || "Brave Syntax";
  const seoTitle = field(fd, "seo_title").slice(0, 200) || null;
  const seoDesc = field(fd, "seo_description").replace(/\s+/g, " ").slice(0, 400) || null;
  const published = checkbox(fd, "is_published");
  const featured = checkbox(fd, "is_featured");

  const [old] = id
    ? await rows<{ featured_image: string | null; published_at: Date | null }>(sql`SELECT featured_image, published_at FROM blog_posts WHERE id = ${id}`)
    : [];
  if (id && !old) await finish("error", "Post not found.", PAGE);

  const img = await resolveImage(fd, "blog", old?.featured_image ?? null);
  if ("error" in img) await finish("error", img.error, back);
  const image = "value" in img ? img.value : null;
  // published_at is set on first publish and kept afterwards
  const publishedAt = old?.published_at ?? (published ? new Date() : null);

  let postId = id;
  try {
    if (id) {
      await sql`
        UPDATE blog_posts SET title = ${title}, slug = ${slug}, excerpt = ${excerpt}, content = ${content}, category = ${category},
          tags = ${tags}, featured_image = ${image}, author = ${author}, read_time = ${readTime(content)}, is_published = ${published},
          is_featured = ${featured}, published_at = ${publishedAt}
        WHERE id = ${id}
      `;
    } else {
      [{ id: postId }] = await rows<{ id: number }>(sql`
        INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, featured_image, author, read_time,
                                is_published, is_featured, published_at)
        VALUES (${title}, ${slug}, ${excerpt}, ${content}, ${category}, ${tags}, ${image}, ${author}, ${readTime(content)},
                ${published}, ${featured}, ${publishedAt})
        RETURNING id
      `);
    }
  } catch (err) {
    const dup = err instanceof Error && /duplicate key/i.test(err.message);
    await finish("error", dup ? `Another post already uses the slug "${slug}".` : "DB error saving the post.", back);
  }
  let seoSaved = true;
  try {
    await saveSeoBasics(postId, seoTitle, seoDesc);
  } catch (err) {
    console.error("[savePost] SEO", err);
    seoSaved = false;
  }
  refreshPublicSite();
  if (!seoSaved) await finish("error", "The post was saved, but its SEO title and description weren't. Open it and save again.", `${PAGE}?edit=${postId}`);
  await finish("success", id ? "Blog post updated." : `Blog post "${title}" created.`, PAGE);
}

export async function togglePublish(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const [row] = await rows<{ is_published: number }>(sql`SELECT is_published FROM blog_posts WHERE id = ${id}`);
  if (!row) await finish("error", "Post not found.", PAGE);
  const next = row.is_published ? 0 : 1;
  await sql`
    UPDATE blog_posts SET is_published = ${next}, published_at = CASE WHEN ${next} = 1 THEN COALESCE(published_at, LOCALTIMESTAMP) ELSE published_at END
    WHERE id = ${id}
  `;
  refreshPublicSite();
  await finish("success", next ? "Post published." : "Post unpublished (draft).", PAGE);
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const [row] = await rows<{ featured_image: string | null }>(sql`DELETE FROM blog_posts WHERE id = ${id} RETURNING featured_image`);
  await sql`DELETE FROM seo_meta WHERE entity_type = 'post' AND entity_key = ${String(id)}`;
  await deleteImage(row?.featured_image ?? null, "blog");
  refreshPublicSite();
  await finish("success", "Post deleted.", PAGE);
}

export async function bulkDeletePosts(fd: FormData) {
  await requireAdmin();
  const ids = idsField(fd);
  if (ids.length) {
    const deleted = await rows<{ featured_image: string | null }>(sql`DELETE FROM blog_posts WHERE id = ANY(${ids}) RETURNING featured_image`);
    await sql`DELETE FROM seo_meta WHERE entity_type = 'post' AND entity_key = ANY(${ids.map(String)})`;
    for (const r of deleted) await deleteImage(r.featured_image, "blog");
  }
  refreshPublicSite();
  await finish("success", `${ids.length} post(s) deleted.`, PAGE);
}

/** Adds a blog category from the post editor (the PHP page's ?ajax=add_category endpoint). */
export async function addBlogCategory(label: string): Promise<{ ok: true; slug: string; label: string; existed: boolean } | { ok: false; error: string }> {
  await requireAdmin();
  const name = label.trim();
  if (!name) return { ok: false, error: "Category name is required" };
  const slug = makeSlug(name) || "category";
  const [existing] = await rows<{ slug: string; label: string }>(sql`SELECT slug, label FROM blog_categories WHERE slug = ${slug}`);
  if (existing) return { ok: true, ...existing, existed: true };
  await sql`INSERT INTO blog_categories (slug, label, sort) VALUES (${slug}, ${name}, (SELECT COALESCE(MAX(sort), 0) + 1 FROM blog_categories))`;
  return { ok: true, slug, label: name, existed: false };
}
