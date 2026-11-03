import { BadgeCheck, Languages, Lock, UserX } from "lucide-react";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PdfToolGrid from "@/components/tools/PdfToolGrid";
import { PageHero, Section, RelatedLinks } from "@/components/site/ui";
import { BlurFade } from "@/components/velora/blur-fade";
import { RetroGrid } from "@/components/velora/retro-grid";
import { Typewriter } from "@/components/velora/typewriter";
import { PDF_TOOL_COUNT } from "@/lib/tools/registry";
import { pageMetadata, pageSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("pdf-tools");
}

const TRUST_BADGES = [
  [Lock, "Files stay on your device"],
  [BadgeCheck, "No watermarks"],
  [UserX, "No sign-up"],
  [Languages, "OCR in 12 languages"],
] as const;

const HOW_IT_WORKS: [string, string, string][] = [
  ["1", "Pick a tool", "Choose from the tools above."],
  ["2", "Add your file", "It's processed in your browser, not uploaded."],
  ["3", "Download", "Save the result straight away. No account needed."],
];

export default async function PdfToolsPage() {
  const schema = await pageSchema("pdf-tools");
  return (
    <div>
      <JsonLd data={schema} />
      <PageHero
        eyebrow={
          <>
            Free tools to <Typewriter className="text-primary" words={["merge", "split", "compress", "convert", "sign", "protect"]} />
          </>
        }
        title="Free online PDF tools"
        background={<RetroGrid className="-z-10" opacity={0.35} />}
      >
        {PDF_TOOL_COUNT} PDF tools that run entirely in your browser. Your files never leave your device.
        <span className="mt-6 flex flex-wrap justify-center gap-2">
          {TRUST_BADGES.map(([Icon, label]) => (
            <span key={label} className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <Icon className="size-3.5 text-primary" aria-hidden="true" /> {label}
            </span>
          ))}
        </span>
      </PageHero>

      <Section label="All PDF tools" className="!pt-4">
        <PdfToolGrid />
      </Section>

      <Section label="How it works" className="!py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map(([n, t, d], i) => (
            <BlurFade key={n} delay={i * 0.06}>
              <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">{n}</span>
                <span>
                  <span className="block text-sm font-medium">{t}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{d}</span>
                </span>
              </div>
            </BlurFade>
          ))}
        </div>
      </Section>

      <RelatedLinks
        title="More from Brave Syntax"
        links={[
          ["AI background remover", "/bg-remover"],
          ["Custom website development", "/services/custom-website-development"],
          ["Web application development", "/services/web-application-development"],
          ["All services", "/services"],
        ]}
      />
    </div>
  );
}
