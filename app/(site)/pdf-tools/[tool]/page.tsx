import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolPage from "@/components/tools/ToolPage";
import { buildMetadata } from "@/lib/seo";
import { getPdfTool, PDF_TOOL_LIST } from "@/lib/tools/registry";

type Props = { params: Promise<{ tool: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PDF_TOOL_LIST.map((t) => ({ tool: t.slug }));
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
