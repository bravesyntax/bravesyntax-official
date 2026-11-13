"use server";

import { unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { finish, intField, refreshPublicSite } from "@/lib/admin/common";
import { getRepo, GitHubError, repoDetails, sameSite, type Repo } from "@/lib/admin/github";
import { rows, sql } from "@/lib/db";
import { field } from "@/lib/validation";

const PAGE = "/admin/github";

async function uniqueSlug(title: string) {
  const base = title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 170) || "project";
  const taken = new Set((await rows<{ slug: string }>(sql`SELECT slug FROM portfolios WHERE slug = ${base} OR slug LIKE ${`${base}-%`}`)).map((r) => r.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

/** Fills only what is empty, so anything written in Admin → Portfolio stays. A GitHub card counts as empty once a real picture exists. */
async function fillEmpty(id: number, repo: Repo) {
  const d = await repoDetails(repo);
  await sql`
    UPDATE portfolios SET
      github_repo = ${repo.name},
      github_url = ${repo.isPrivate ? null : repo.url},
      tags = COALESCE(NULLIF(tags, ''), ${d.tags}),
      description = COALESCE(NULLIF(description, ''), ${d.description}),
      challenge = COALESCE(NULLIF(challenge, ''), ${d.challenge}),
      approach = COALESCE(NULLIF(approach, ''), ${d.approach}),
      results_detail = COALESCE(NULLIF(results_detail, ''), ${d.results}),
      tech_stack = COALESCE(NULLIF(tech_stack, ''), ${d.techStack || null}),
      metric_1 = COALESCE(NULLIF(metric_1, ''), ${d.metrics[0]}),
      metric_2 = COALESCE(NULLIF(metric_2, ''), ${d.metrics[1]}),
      metric_3 = COALESCE(NULLIF(metric_3, ''), ${d.metrics[2]}),
      image = CASE WHEN image IS NULL OR image = '' OR image LIKE 'https://opengraph.githubassets.com/%' THEN ${d.image} ELSE image END,
      live_url = COALESCE(NULLIF(live_url, ''), ${repo.homepage ? repo.homepage.slice(0, 500) : null})
    WHERE id = ${id}
  `;
}

const githubFailure = (err: unknown) => {
  if (!(err instanceof GitHubError)) console.error("[admin/github]", err);
  return finish("error", err instanceof GitHubError ? err.message : "The project couldn't be saved. Try again.", PAGE);
};

/** Publishes a repo to Our Work with every field filled from GitHub and its live site. An existing project for the same site is linked, not duplicated. */
export async function addRepo(fd: FormData) {
  await requireAdmin();
  let repo;
  try {
    repo = await getRepo(field(fd, "repo"));
  } catch (err) {
    return githubFailure(err);
  }
  if (!repo) return finish("error", "That repository wasn't found on GitHub.", PAGE);

  const existing = await rows<{ id: number; live_url: string | null; github_repo: string | null }>(sql`SELECT id, live_url, github_repo FROM portfolios`);
  if (existing.some((p) => p.github_repo === repo.name)) return finish("error", `"${repo.name}" is already in Our Work.`, PAGE);

  try {
    const match = existing.find((p) => !p.github_repo && sameSite(p.live_url, repo.homepage));
    if (match) {
      await fillEmpty(match.id, repo);
      await sql`UPDATE portfolios SET is_active = 1 WHERE id = ${match.id}`;
      refreshPublicSite("portfolio");
      return finish("success", `Linked "${repo.name}" to the existing project for the same website and filled its empty details.`, PAGE);
    }
    const d = await repoDetails(repo);
    await sql`
      INSERT INTO portfolios (title, slug, category, tags, description, challenge, approach, results_detail, tech_stack, metric_1, metric_2, metric_3, image, live_url, github_repo, github_url, year, is_active)
      VALUES (${d.title}, ${await uniqueSlug(d.title)}, 'development', ${d.tags}, ${d.description}, ${d.challenge}, ${d.approach}, ${d.results}, ${d.techStack || null},
              ${d.metrics[0]}, ${d.metrics[1]}, ${d.metrics[2]}, ${d.image}, ${repo.homepage ? repo.homepage.slice(0, 500) : null}, ${repo.name}, ${repo.isPrivate ? null : repo.url},
              ${new Date(repo.createdAt).getFullYear()}, 1)
    `;
    refreshPublicSite("portfolio");
    return finish("success", `"${d.title}" now shows in Our Work with its details filled in. Check it over and use Edit to change anything.`, PAGE);
  } catch (err) {
    unstable_rethrow(err);
    return githubFailure(err);
  }
}

/** Fills the empty details of a project that is already linked to a repo. */
export async function fillRepoDetails(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  try {
    const repo = await getRepo(field(fd, "repo"));
    if (!repo) return finish("error", "That repository wasn't found on GitHub.", PAGE);
    await fillEmpty(id, repo);
    refreshPublicSite("portfolio");
    return finish("success", `Filled the empty details from "${repo.name}". Anything you had already written was kept.`, PAGE);
  } catch (err) {
    unstable_rethrow(err);
    return githubFailure(err);
  }
}

/** Shows or hides a linked project. Hiding keeps its edits, so showing it again loses nothing. */
export async function setRepoVisibility(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const show = field(fd, "show") === "1" ? 1 : 0;
  await sql`UPDATE portfolios SET is_active = ${show} WHERE id = ${id}`;
  refreshPublicSite("portfolio");
  return finish("success", show ? "Project is showing in Our Work." : "Project hidden from Our Work.", PAGE);
}
