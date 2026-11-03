import "server-only";
import { put } from "@vercel/blob";
import { buildDetails, type ProjectDetails } from "./github-details";

// Reads repositories from GitHub for Admin → GitHub Projects. Public repos work without any setup. A read-only
// GITHUB_TOKEN adds private repos and a much higher rate limit (GitHub allows 60 anonymous requests an hour per IP,
// and Vercel's IPs are shared).

export type Repo = {
  name: string;
  url: string;
  description: string;
  language: string;
  topics: string[];
  homepage: string;
  stars: number;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  createdAt: string;
  pushedAt: string;
};

export const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "bravesyntax";
const API = "https://api.github.com";
const CACHE_SECONDS = 120;

export class GitHubError extends Error {}

type ApiRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  homepage: string | null;
  stargazers_count: number;
  private: boolean;
  fork: boolean;
  archived: boolean;
  created_at: string;
  pushed_at: string;
  owner: { login: string };
};

const toRepo = (r: ApiRepo): Repo => ({
  name: r.name,
  url: r.html_url,
  description: r.description?.trim() ?? "",
  language: r.language ?? "",
  topics: r.topics ?? [],
  homepage: /^https?:\/\//i.test(r.homepage ?? "") ? r.homepage!.trim() : "",
  stars: r.stargazers_count,
  isPrivate: r.private,
  isFork: r.fork,
  isArchived: r.archived,
  createdAt: r.created_at,
  pushedAt: r.pushed_at,
});

async function request(path: string, fresh = false) {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "bravesyntax-admin" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`${API}${path}`, { headers, ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: CACHE_SECONDS } }) });
  if (res.status === 403 || res.status === 429) {
    throw new GitHubError(process.env.GITHUB_TOKEN ? "GitHub's rate limit was reached. Try again in a few minutes." : "GitHub's rate limit for anonymous requests was reached. Try again later, or add a read-only GITHUB_TOKEN in Vercel.");
  }
  if (res.status === 401) throw new GitHubError("GitHub rejected the GITHUB_TOKEN. Check or replace it in Vercel.");
  return res;
}

/** Every repo, newest push first. With a token this includes the private repos that token can see. */
export async function listRepos(): Promise<Repo[]> {
  const out: Repo[] = [];
  const base = process.env.GITHUB_TOKEN ? "/user/repos?affiliation=owner&visibility=all" : `/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?type=owner`;
  for (let page = 1; page <= 5; page++) {
    let res: Response;
    try {
      res = await request(`${base}&sort=pushed&per_page=100&page=${page}`);
    } catch (err) {
      if (err instanceof GitHubError) throw err;
      throw new GitHubError("GitHub couldn't be reached. Check back in a moment.");
    }
    if (res.status === 404) throw new GitHubError(`The GitHub account "${GITHUB_USERNAME}" wasn't found.`);
    if (!res.ok) throw new GitHubError(`GitHub returned an error (${res.status}). Try again in a moment.`);
    const batch = (await res.json()) as ApiRepo[];
    out.push(...batch.map(toRepo));
    if (batch.length < 100) break;
  }
  return out;
}

/** One repo, always fresh, so what gets published comes from GitHub rather than from the submitted form. */
export async function getRepo(name: string): Promise<Repo | null> {
  if (!/^[\w.-]{1,100}$/.test(name)) return null;
  const res = await request(`/repos/${encodeURIComponent(GITHUB_USERNAME)}/${encodeURIComponent(name)}`, true);
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubError(`GitHub returned an error (${res.status}). Try again in a moment.`);
  return toRepo((await res.json()) as ApiRepo);
}

/** GitHub's generated share card, for projects with no live site to take a screenshot of. */
export const repoCardImage = (name: string) => `https://opengraph.githubassets.com/1/${encodeURIComponent(GITHUB_USERNAME)}/${encodeURIComponent(name)}`;

/** Compares two site addresses, ignoring protocol, www and a trailing slash. */
export const sameSite = (a?: string | null, b?: string | null) => {
  const norm = (u?: string | null) => (u ?? "").trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
  return !!norm(a) && norm(a) === norm(b);
};

/** Everything needed for a project page, read fresh from the repo and its live site. */
export const repoDetails = (repo: Repo): Promise<ProjectDetails> =>
  buildDetails(repo, {
    api: (path) => request(path, true),
    cardImage: repoCardImage(repo.name),
    saveImage: async (bytes, contentType) => {
      if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
      const ext = contentType.includes("jpeg") ? "jpg" : "png";
      const blob = await put(`portfolio/${repo.name}.${ext}`, bytes, { access: "public", contentType, addRandomSuffix: true });
      return blob.url;
    },
  });
