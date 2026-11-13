"use server";

import { translatePostToHindi } from "@/lib/admin/ai";
import { requireAdmin } from "@/lib/admin/auth";
import { checkbox, finish, idsField, intField, makeSlug, refreshPublicSite } from "@/lib/admin/common";
import { resolveImage } from "@/lib/admin/images";
import { isBlogLang } from "@/lib/blog-lang";
import { rows, sql } from "@/lib/db";
import { geminiEnabled } from "@/lib/gemini";
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
  const language = isBlogLang(field(fd, "language")) ? field(fd, "language") : "en";
  // "Translation of" must point at a different, original post (translations don't chain).
  const translationOf: number | null = Number(field(fd, "translation_of")) || null;
  if (translationOf) {
    const [orig] = await rows<{ translation_of: number | null }>(sql`SELECT translation_of FROM blog_posts WHERE id = ${translationOf}`);
    if (!orig || translationOf === id || orig.translation_of) await finish("error", "Choose an original post (not a translation) for \"Translation of\".", back);
  }

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
          is_featured = ${featured}, published_at = ${publishedAt}, language = ${language}, translation_of = ${translationOf}
        WHERE id = ${id}
      `;
    } else {
      [{ id: postId }] = await rows<{ id: number }>(sql`
        INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, featured_image, author, read_time,
                                is_published, is_featured, published_at, language, translation_of)
        VALUES (${title}, ${slug}, ${excerpt}, ${content}, ${category}, ${tags}, ${image}, ${author}, ${readTime(content)},
                ${published}, ${featured}, ${publishedAt}, ${language}, ${translationOf})
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
  refreshPublicSite("blog");
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
  refreshPublicSite("blog");
  await finish("success", next ? "Post published." : "Post unpublished (draft).", PAGE);
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  // The featured image stays in Admin → Media (it may be used elsewhere); delete it there if it's no longer needed.
  await sql`DELETE FROM blog_posts WHERE id = ${id}`;
  await sql`DELETE FROM seo_meta WHERE entity_type = 'post' AND entity_key = ${String(id)}`;
  refreshPublicSite("blog");
  await finish("success", "Post deleted.", PAGE);
}

export async function bulkDeletePosts(fd: FormData) {
  await requireAdmin();
  const ids = idsField(fd);
  if (ids.length) {
    await sql`DELETE FROM blog_posts WHERE id = ANY(${ids})`;
    await sql`DELETE FROM seo_meta WHERE entity_type = 'post' AND entity_key = ANY(${ids.map(String)})`;
  }
  refreshPublicSite("blog");
  await finish("success", `${ids.length} post(s) deleted.`, PAGE);
}

/** Creates a Hindi draft of an English post with Gemini, linked to the original, and opens it for review. */
export async function translateToHindi(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const back = `${PAGE}?edit=${id}`;
  if (!geminiEnabled()) await finish("error", "Add GEMINI_API_KEY to translate posts.", back);
  const [post] = await rows<{ title: string; slug: string; excerpt: string | null; content: string; category: string; tags: string | null; featured_image: string | null; author: string; language: string; translation_of: number | null; seo_title: string | null; seo_description: string | null }>(sql`
    SELECT p.title, p.slug, p.excerpt, p.content, p.category, p.tags, p.featured_image, p.author, p.language, p.translation_of,
           m.title AS seo_title, m.description AS seo_description
    FROM blog_posts p LEFT JOIN seo_meta m ON m.entity_type = 'post' AND m.entity_key = p.id::text WHERE p.id = ${id}
  `);
  if (!post) await finish("error", "Post not found.", PAGE);
  if (post.language !== "en" || post.translation_of) await finish("error", "Only original English posts can be translated.", back);
  const [existing] = await rows<{ id: number }>(sql`SELECT id FROM blog_posts WHERE translation_of = ${id} AND language = 'hi' LIMIT 1`);
  if (existing) await finish("error", "This post already has a Hindi version. It is open below.", `${PAGE}?edit=${existing.id}`);

  let hi: Awaited<ReturnType<typeof translatePostToHindi>>;
  try {
    hi = await translatePostToHindi({ title: post.title, excerpt: post.excerpt, content: post.content, seoTitle: post.seo_title, seoDescription: post.seo_description });
  } catch (err) {
    return finish("error", err instanceof Error ? err.message : "The translation failed. Try again.", back);
  }
  const taken = new Set((await rows<{ slug: string }>(sql`SELECT slug FROM blog_posts WHERE slug LIKE ${`${post.slug}-hindi%`}`)).map((r) => r.slug));
  let slug = `${post.slug}-hindi`;
  for (let n = 2; taken.has(slug); n++) slug = `${post.slug}-hindi-${n}`;
  const [{ id: newId }] = await rows<{ id: number }>(sql`
    INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, featured_image, author, read_time, is_published, is_featured, published_at, language, translation_of)
    VALUES (${hi.title}, ${slug}, ${hi.excerpt || null}, ${hi.content}, ${post.category}, ${post.tags}, ${post.featured_image}, ${post.author},
            ${readTime(post.content)}, 0, 0, NULL, 'hi', ${id})
    RETURNING id
  `);
  try {
    await saveSeoBasics(newId, hi.seoTitle || null, hi.seoDescription || null);
  } catch (err) {
    console.error("[translateToHindi] SEO", err);
  }
  await finish("success", "Hindi draft created by AI. Read it carefully, fix anything that sounds wrong, then publish.", `${PAGE}?edit=${newId}`);
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
