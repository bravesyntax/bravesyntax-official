import SeoShell from "@/components/admin/SeoShell";
import SeoTargetList from "@/components/admin/SeoTargetList";
import { loadSeoTargets } from "@/lib/admin/seo-audit";

export const metadata = { title: "SEO · Case studies" };

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function Page({ searchParams }: Props) {
  const [{ filter = "all" }, { targets }] = await Promise.all([searchParams, loadSeoTargets("project")]);
  return (
    <SeoShell active="portfolio">
      <SeoTargetList targets={targets} title="Case studies" description="Defaults come from each project's title, description and image." filter={filter} baseHref="/admin/seo/portfolio" />
    </SeoShell>
  );
}
