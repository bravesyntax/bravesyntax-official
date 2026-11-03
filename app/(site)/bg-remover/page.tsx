import { Bolt, Image as ImageIcon, Layers, Lock, Megaphone, MonitorPlay, Palette, PenTool, ShoppingBag, Sparkles, UserRound, Wand2 } from "lucide-react";
import type { Metadata } from "next";
import BgRemoverTool from "@/components/bg-remover/BgRemoverTool";
import JsonLd from "@/components/JsonLd";
import { container, CtaLink, IconChip, PageHero, Section, SectionHeading, RelatedLinks } from "@/components/site/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BlurFade } from "@/components/velora/blur-fade";
import { FlickeringGrid } from "@/components/velora/flickering-grid";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { Timeline } from "@/components/velora/timeline";
import { pageMetadata, pageSchema } from "@/lib/seo";
import "./bg-remover.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("bg-remover");
}

const FEATURES = [
  [Lock, "Private"],
  [Sparkles, "No watermark"],
  [ImageIcon, "Transparent PNG"],
  [Bolt, "Runs in your browser"],
  [Palette, "Custom background"],
] as const;

const STEPS: [string, string][] = [
  ["Upload your image", "Drag and drop, or click to choose, a JPG, PNG or WEBP file up to 15 MB."],
  ["AI removes the background", "A neural network running in your browser detects and removes the background. No data is sent anywhere."],
  ["Download or change the background", "Download a transparent PNG, or apply a solid colour with one click."],
  ["Use it anywhere", "Product listings, ID photos, social posts, presentations and more."],
];

const USE_CASES = [
  ["E-commerce", ShoppingBag, "Clean product photos"],
  ["LinkedIn and ID", UserRound, "Professional headshots"],
  ["Presentations", MonitorPlay, "Insert into slide decks"],
  ["Social media", Megaphone, "Stickers and thumbnails"],
  ["Web design", Layers, "Transparent assets"],
  ["Graphic design", PenTool, "Compose custom artwork"],
] as const;

const FAQS: [string, string][] = [
  ["Is this tool really free?", "Yes, with no account, no watermarks and no daily cap. Brave Syntax offers it as a free utility for designers and businesses."],
  ["Do my images get uploaded to a server?", "No. The AI model runs entirely inside your browser using WebAssembly, so your image never leaves your device."],
  ["What image formats are supported?", "JPG, PNG, WEBP and GIF up to 15 MB. The result is always exported as a transparent PNG."],
  ["Why does the first removal take longer?", "The AI model (about 50 MB) is downloaded on first use and cached in your browser. Later removals use the cached model and are much faster."],
  ["Does it work on mobile?", "Yes, on modern Android and iOS browsers. It may be slower on low-end devices, but the result quality is the same."],
  ["Can I use the result for commercial projects?", "Yes. There are no licensing restrictions on the output from this tool."],
];

export default async function BgRemoverPage() {
  const schema = await pageSchema("bg-remover");

  return (
    <div className="tool-scope pg-bgremover">
      <JsonLd data={schema} />
      <PageHero
        eyebrow={
          <>
            <Wand2 className="size-3.5 text-primary" aria-hidden="true" /> Free AI tool · No sign-up
          </>
        }
        title="Remove image backgrounds in seconds"
        background={<FlickeringGrid className="absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] sm:opacity-100" />}
      >
        Upload a photo and get a clean transparent PNG. Everything happens in your browser, so your image stays on your device.
        <span className="mt-6 flex flex-wrap justify-center gap-2">
          {FEATURES.map(([Icon, label]) => (
            <span key={label} className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <Icon className="size-3.5 text-primary" aria-hidden="true" /> {label}
            </span>
          ))}
        </span>
      </PageHero>

      <section className={`${container} max-w-4xl pb-10`} aria-label="Background remover">
        <BgRemoverTool />
      </section>

      <Section muted label="How it works">
        <SectionHeading eyebrow="How it works" title="Four simple steps" />
        <Timeline className="mt-8" items={STEPS.map(([title, desc], i) => ({ title: `${i + 1}. ${title}`, content: <p className="max-w-xl text-muted-foreground">{desc}</p> }))} />
      </Section>

      <Section label="Use cases">
        <SectionHeading center eyebrow="Use cases" title="What people use it for" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map(([title, Icon, desc], i) => (
            <BlurFade key={title} delay={(i % 3) * 0.06} className="h-full">
              <SpotlightCard className="h-full rounded-2xl border bg-card p-5">
                <div className="relative flex items-center gap-4">
                  <IconChip>
                    <Icon className="size-5" aria-hidden="true" />
                  </IconChip>
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              </SpotlightCard>
            </BlurFade>
          ))}
        </div>
      </Section>

      <Section muted label="Frequently asked questions">
        <div className="mx-auto max-w-3xl">
          <SectionHeading center eyebrow="FAQ" title="Questions about the tool" />
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 text-center">
            <p className="text-muted-foreground">Need a website or design work, not just a cutout?</p>
            <CtaLink href="/services" variant="outline" className="mt-3">
              See our services
            </CtaLink>
          </div>
        </div>
      </Section>

      <RelatedLinks
        title="More free tools and services"
        links={[
          ["Free PDF tools", "/pdf-tools"],
          ["UI/UX design", "/services/ui-ux-design"],
          ["Custom website development", "/services/custom-website-development"],
        ]}
      />
    </div>
  );
}
