import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolPage from "@/components/tools/ToolPage";
import { buildMetadata } from "@/lib/seo";
import { getPdfTool } from "@/lib/tools/registry";

type Props = { params: Promise<{ tool: string }> };


// Not built at deploy time: each page is rendered and cached on its first visit. Building every page on every
// deployment cost ~9,000 Vercel ISR write units per deploy (the free plan allows 200K a month). Unknown slugs never
// get here: proxy.ts answers them with the pre-built 404 page.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = getPdfTool((await params).tool);
  if (!tool) return {};
  return buildMetadata("page", `pdf-tools/${tool.slug}`, { title: `${tool.name}: Free Online Tool`, suffix: true, description: tool.description, path: `/pdf-tools/${tool.slug}` });
}

export default async function Page({ params }: Props) {
  const tool = getPdfTool((await params).tool);
  if (!tool) notFound();
  return <ToolPage tool={tool} kind="pdf" />;
}
