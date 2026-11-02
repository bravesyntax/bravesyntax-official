import SeoShell from "@/components/admin/SeoShell";
import SeoTargetList from "@/components/admin/SeoTargetList";
import { loadSeoTargets } from "@/lib/admin/seo-audit";

export const metadata = { title: "SEO · Blog posts" };

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function Page({ searchParams }: Props) {
  const [{ filter = "all" }, { targets }] = await Promise.all([searchParams, loadSeoTargets("post")]);
  return (
    <SeoShell active="posts">
      <SeoTargetList targets={targets} title="Blog posts" description="Defaults come from each post's title, excerpt and featured image. Drafts are never indexed." filter={filter} baseHref="/admin/seo/posts" />
    </SeoShell>
  );
}
