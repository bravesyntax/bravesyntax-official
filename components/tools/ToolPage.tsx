import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { container, CtaLink, Section, SectionHeading } from "@/components/site/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SITE_URL } from "@/lib/config";
import { PDF_TOOL_LIST, TOOL_GROUPS, WEB_TOOL_LIST, type Tool } from "@/lib/tools/registry";
import ToolRunner from "./ToolRunner";

// The page around a tool: the tool comes first, right under a short heading, then the explanation.

const COMMON_FAQ: [string, string][] = [
  ["Is this tool really free?", "Yes. There's no sign-up, no watermark and no paid plan."],
  ["Are my files uploaded anywhere?", "No. The tool runs in your browser, so your files stay on your device. Some language data for OCR is downloaded, but your document isn't sent anywhere."],
];

export const toolHref = (tool: Tool) => (PDF_TOOL_LIST.includes(tool) ? `/pdf-tools/${tool.slug}` : `/tools/${tool.slug}`);

export function ToolLinkGrid({ tools }: { tools: Tool[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {tools.map((t) => (
        <Link key={t.slug} href={toolHref(t)} className="group rounded-2xl border bg-card p-4 transition-colors hover:border-primary/50 sm:p-5">
          <h3 className="font-medium group-hover:text-primary">{t.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t.short}</p>
        </Link>
      ))}
    </div>
  );
}

export default function ToolPage({ tool, kind }: { tool: Tool; kind: "pdf" | "web" }) {
  const parent = kind === "pdf" ? { name: "PDF Tools", href: "/pdf-tools" } : { name: "Free Tools", href: "/tools" };
  const url = `${SITE_URL}${parent.href}/${tool.slug}`;
  const faq = [...tool.faq, ...(kind === "pdf" || tool.group === "image" ? COMMON_FAQ : COMMON_FAQ.slice(0, 1))];
  const list = kind === "pdf" ? PDF_TOOL_LIST : WEB_TOOL_LIST;
  const related = [...list.filter((t) => t.slug !== tool.slug && t.group === tool.group), ...list.filter((t) => t.slug !== tool.slug && t.group !== tool.group)].slice(0, 4);
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.name,
      description: tool.description,
      url,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: parent.name, item: `${SITE_URL}${parent.href}` },
        { "@type": "ListItem", position: 3, name: tool.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <>
      <JsonLd data={schema} />
      <div className={`${container} pt-6 pb-10 sm:pt-8`}>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <Link href={parent.href} className="hover:text-foreground">
            {parent.name}
          </Link>
        </nav>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{tool.name}</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{tool.description}</p>
        <div className="mt-6">
          <ToolRunner slug={tool.slug} kind={kind} />
        </div>
        {tool.group !== "business" && tool.group !== "web" && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden="true" /> Processed on your device. Nothing is uploaded.
          </p>
        )}
      </div>

      <Section muted label={`About ${tool.name}`} className="!py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-primary">{TOOL_GROUPS[tool.group]}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">About {tool.name}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{tool.about}</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Questions</h2>
            <Accordion type="single" collapsible className="mt-2">
              {faq.map(([q, a]) => (
                <AccordionItem key={q} value={q}>
                  <AccordionTrigger className="text-left">{q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </Section>

      <Section label="More tools" className="!py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading title="More free tools" />
          <CtaLink href={parent.href} variant="outline">
            All {parent.name.toLowerCase()}
          </CtaLink>
        </div>
        <div className="mt-6">
          <ToolLinkGrid tools={related} />
        </div>
      </Section>
    </>
  );
}
