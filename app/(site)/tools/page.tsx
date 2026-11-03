import { ArrowRight, Eraser } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { PageHero, Section, SectionHeading } from "@/components/site/ui";
import { ToolLinkGrid } from "@/components/tools/ToolPage";
import { pageMetadata, pageSchema } from "@/lib/seo";
import { ALL_TOOL_COUNT, PDF_TOOL_COUNT, PDF_TOOL_LIST, WEB_TOOL_LIST } from "@/lib/tools/registry";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("tools");
}

export default async function ToolsPage() {
  const schema = await pageSchema("tools");
  const of = (group: string) => WEB_TOOL_LIST.filter((t) => t.group === group);
  return (
    <>
      <JsonLd data={schema} />
      <PageHero eyebrow={`${ALL_TOOL_COUNT} free tools · No sign-up`} title="Free tools for your business">
        Handy tools for invoices, images, PDFs and your website. They run in your browser, with no sign-up and no watermarks.
      </PageHero>
      <Section label="Business tools" className="!pt-4 !pb-10">
        <SectionHeading eyebrow="Business" title="Run your business" />
        <div className="mt-6">
          <ToolLinkGrid tools={of("business")} />
        </div>
      </Section>
      <Section label="Image tools" className="!py-10">
        <SectionHeading eyebrow="Images" title="Prepare your images" />
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <Link href="/bg-remover" className="group rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary/60 sm:p-5">
            <h3 className="flex items-center gap-1.5 font-medium group-hover:text-primary">
              <Eraser className="size-4 text-primary" aria-hidden="true" /> AI Background Remover
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Transparent PNG in seconds</p>
          </Link>
        </div>
        <div className="mt-3">
          <ToolLinkGrid tools={of("image")} />
        </div>
      </Section>
      <Section label="Web tools" className="!py-10">
        <SectionHeading eyebrow="Web & SEO" title="Improve your website" />
        <div className="mt-6">
          <ToolLinkGrid tools={of("web")} />
        </div>
      </Section>
      <Section muted label="PDF tools" className="!py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="PDF" title={`${PDF_TOOL_COUNT} PDF tools`} />
          <Link href="/pdf-tools" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            See them all <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6">
          <ToolLinkGrid tools={PDF_TOOL_LIST.slice(0, 8)} />
        </div>
      </Section>
    </>
  );
}
