import { ExternalLink, Eye, EyeOff, FolderGit2, Globe, Lock, Pencil, Plus, Star, WandSparkles } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "@/components/admin/client";
import { AdminPage, Card, EmptyState, FilterTabs, inputCls, smallPrimaryBtn, StatGrid, Th, timeAgo } from "@/components/admin/ui";
import { GitHubError, GITHUB_USERNAME, listRepos, sameSite, type Repo } from "@/lib/admin/github";
import { rows, sql } from "@/lib/db";
import { addRepo, fillRepoDetails, setRepoVisibility } from "./actions";

export const metadata = { title: "GitHub Projects" };

type Props = { searchParams: Promise<{ view?: string; q?: string }> };
type Linked = { id: number; slug: string | null; title: string; is_active: number; live_url: string | null; github_repo: string | null };

const NEW_DAYS = 30;
const ghostBtn = "inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-brand/50 hover:text-brand";

const isNew = (r: Repo) => Date.now() - new Date(r.createdAt).getTime() < NEW_DAYS * 864e5;

export default async function GitHubPage({ searchParams }: Props) {
  const { view = "new", q = "" } = await searchParams;
  const search = q.trim().toLowerCase();

  let repos: Repo[] = [];
  let problem = "";
  try {
    repos = await listRepos();
  } catch (err) {
    problem = err instanceof GitHubError ? err.message : "GitHub couldn't be reached. Check back in a moment.";
    if (!(err instanceof GitHubError)) console.error("[admin/github]", err);
  }
  const projects = await rows<Linked>(sql`SELECT id, slug, title, is_active, live_url, github_repo FROM portfolios`);
  const linkOf = (r: Repo) => projects.find((p) => p.github_repo === r.name) ?? projects.find((p) => !p.github_repo && sameSite(p.live_url, r.homepage));

  const counts = {
    all: repos.length,
    shown: repos.filter((r) => linkOf(r)?.is_active).length,
    available: repos.filter((r) => !linkOf(r)).length,
  };
  const list = repos
    .filter((r) => (view === "shown" ? linkOf(r)?.is_active : view === "hidden" ? linkOf(r) && !linkOf(r)!.is_active : view === "all" ? true : !linkOf(r)))
    .filter((r) => !search || `${r.name} ${r.description} ${r.language} ${r.topics.join(" ")}`.toLowerCase().includes(search));
  const hrefFor = (key: string) => `/admin/github?view=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <AdminPage title="GitHub Projects">
      <p className="mb-6 max-w-3xl text-sm text-zinc-400">
        Every repository on{" "}
        <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
          github.com/{GITHUB_USERNAME}
        </a>{" "}
        appears here automatically, within about two minutes of being pushed. Nothing shows on the website until you choose it.
      </p>

      {problem && (
        <p role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {problem}
        </p>
      )}

      <StatGrid
        stats={[
          [counts.all, "On GitHub", "text-white"],
          [counts.available, "Not added yet", "text-amber-400"],
          [counts.shown, "Showing in Our Work", "text-emerald-400"],
        ]}
      />

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterTabs
          tabs={[
            ["new", "Not added"],
            ["shown", "In Our Work"],
            ["hidden", "Hidden"],
            ["all", "All"],
          ]}
          active={view}
          hrefFor={hrefFor}
        />
        <form className="flex gap-2 md:w-72">
          <input type="hidden" name="view" value={view} />
          <input type="search" name="q" defaultValue={q} aria-label="Search repositories" placeholder="Search repositories" className={inputCls} />
        </form>
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        {list.length === 0 ? (
          <EmptyState>{problem ? "Repositories will show here once GitHub responds." : search ? "No repositories match that search." : view === "new" ? "Every repository has been added." : "Nothing here yet."}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead className="border-b border-zinc-800">
                <tr>
                  <Th>Repository</Th>
                  <Th hide="hidden md:table-cell">Language</Th>
                  <Th hide="hidden md:table-cell">Last push</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {list.map((r) => {
                  const link = linkOf(r);
                  return (
                    <tr key={r.name} data-repo={r.name} className="align-top hover:bg-zinc-800/20">
                      <td className="max-w-md px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <FolderGit2 className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-brand">
                            {r.name}
                          </a>
                          {!link && isNew(r) && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">New</span>}
                          {r.isPrivate && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                              <Lock className="size-3" aria-hidden="true" /> Private
                            </span>
                          )}
                          {r.isFork && <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">Fork</span>}
                          {r.isArchived && <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">Archived</span>}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{r.description || "No description on GitHub."}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                          {r.homepage ? (
                            <a href={r.homepage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand">
                              <Globe className="size-3" aria-hidden="true" /> Live site
                            </a>
                          ) : (
                            <span>No live site</span>
                          )}
                          {r.stars > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Star className="size-3" aria-hidden="true" /> {r.stars}
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-zinc-400 md:table-cell">{r.language || "-"}</td>
                      <td className="hidden px-4 py-3 text-xs whitespace-nowrap text-zinc-400 md:table-cell">{timeAgo(r.pushedAt)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{!link ? <span className="text-zinc-500">Not added</span> : link.is_active ? <span className="text-emerald-400">In Our Work</span> : <span className="text-amber-400">Hidden</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {!link ? (
                            <form action={addRepo}>
                              <input type="hidden" name="repo" value={r.name} />
                              <SubmitButton className={smallPrimaryBtn} pending="Reading project…">
                                <span className="inline-flex items-center gap-1">
                                  <Plus className="size-3.5" aria-hidden="true" /> Add to Our Work
                                </span>
                              </SubmitButton>
                            </form>
                          ) : (
                            <>
                              <form action={setRepoVisibility}>
                                <input type="hidden" name="id" value={link.id} />
                                <input type="hidden" name="show" value={link.is_active ? "0" : "1"} />
                                <button type="submit" className={ghostBtn}>
                                  {link.is_active ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />} {link.is_active ? "Hide" : "Show"}
                                </button>
                              </form>
                              <form action={fillRepoDetails}>
                                <input type="hidden" name="id" value={link.id} />
                                <input type="hidden" name="repo" value={r.name} />
                                <SubmitButton className={ghostBtn} pending="Filling…">
                                  <span className="inline-flex items-center gap-1.5">
                                    <WandSparkles className="size-3.5" aria-hidden="true" /> Fill empty details
                                  </span>
                                </SubmitButton>
                              </form>
                              <Link href={`/admin/portfolio?edit=${link.id}`} className={ghostBtn}>
                                <Pencil className="size-3.5" aria-hidden="true" /> Edit
                              </Link>
                              {link.is_active && link.slug ? (
                                <a href={`/portfolio/${link.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${link.title} on the website`} className={ghostBtn}>
                                  <ExternalLink className="size-3.5" aria-hidden="true" />
                                </a>
                              ) : null}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-4 text-xs text-zinc-500">Adding a project fills its page from the repository&apos;s README, languages and live site, including a screenshot of the site. This takes up to a minute. Nothing about clients or results is made up, so use Edit to add those yourself.</p>
    </AdminPage>
  );
}
