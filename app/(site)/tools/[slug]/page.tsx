import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolPage from "@/components/tools/ToolPage";
import { buildMetadata } from "@/lib/seo";
import { getWebTool } from "@/lib/tools/registry";

type Props = { params: Promise<{ slug: string }> };

// The Website Audit tool's server action fetches the visitor's site and Google PageSpeed (up to about a minute).
export const maxDuration = 90;

// Not built at deploy time: each page is rendered and cached on its first visit. Building every page on every
// deployment cost ~9,000 Vercel ISR write units per deploy (the free plan allows 200K a month). Unknown slugs never
// get here: proxy.ts answers them with the pre-built 404 page.
export function generateStaticParams() {
  return [];
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
