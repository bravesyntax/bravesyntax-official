import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolPage from "@/components/tools/ToolPage";
import { buildMetadata } from "@/lib/seo";
import { getWebTool, WEB_TOOL_LIST } from "@/lib/tools/registry";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
// The Website Audit tool's server action fetches the visitor's site and Google PageSpeed (up to about a minute).
export const maxDuration = 90;

export function generateStaticParams() {
  return WEB_TOOL_LIST.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = getWebTool((await params).slug);
  if (!tool) return {};
  return buildMetadata("page", `tools/${tool.slug}`, { title: `${tool.name}: Free Online Tool`, suffix: true, description: tool.description, path: `/tools/${tool.slug}` });
}

export default async function Page({ params }: Props) {
  const tool = getWebTool((await params).slug);
  if (!tool) notFound();
  return <ToolPage tool={tool} kind="web" />;
}
