import { Brain, Check, Handshake, Microscope, Sprout, Target, Zap } from "lucide-react";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { CtaLink, IconChip, PageHero, Section, SectionHeading, ShimmerLink, RelatedLinks } from "@/components/site/ui";
import { BlurFade } from "@/components/velora/blur-fade";
import { BorderBeam } from "@/components/velora/border-beam";
import { CodeBlock } from "@/components/velora/code-block";
import { FileTree } from "@/components/velora/file-tree";
import { GlareCard } from "@/components/velora/glare-card";
import { Particles } from "@/components/velora/particles";
import { PointerHighlight } from "@/components/velora/pointer-highlight";
import { SparklesText } from "@/components/velora/sparkles-text";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { TextReveal } from "@/components/velora/text-reveal";
import { TracingBeam } from "@/components/velora/tracing-beam";
import { SITE_URL } from "@/lib/config";
import { getContactInfo } from "@/lib/contact";
import { getSiteFacts } from "@/lib/content";
import { NumberTicker } from "@/components/velora/number-ticker";
import { pageMetadata, pageSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("about");
}

const VALUES = [
  [Zap, "Speed is a feature", "Fast delivery and high quality aren't mutually exclusive. Our process is built to eliminate waste without cutting corners."],
  [Target, "Precision over perfection", "We ship good work on time, then improve it. Perfection is a moving target; precision is a discipline."],
  [Handshake, "Radical transparency", "Fixed pricing, no hidden fees, honest timelines. If we make a mistake, we own it and fix it."],
  [Microscope, "Craft at every level", "From pixel spacing to database indexing, we care about the details most clients never see, because they make everything better."],
  [Sprout, "Your growth is our growth", "We'd rather have one long working relationship than ten one-off invoices."],
  [Brain, "Always learning", "The web moves fast. We keep learning new tools and approaches so you get current best practice."],
] as const;

const DIFFERENTIATORS = [
  ["No templates", "Every project is built for you, with no drag-and-drop builders or recycled themes."],
  ["No outsourcing", "Your work isn't passed to a third party. The person in your kickoff call is the person building your product."],
  ["No surprise invoices", "We quote a fixed price before we start. New requests are quoted before we do them."],
  ["Built for performance", "We optimise images, fonts and JavaScript as standard, because fast sites rank better and convert better."],
  ["Handover included", "Documentation, training and a support window come with every project."],
  ["Plain language", "No buzzwords. We explain technical decisions in a way that keeps you in control."],
];

const ENGAGEMENT: [string, string, string[]][] = [
  ["Before we start", "You fill in a short brief, we have a kickoff call, and you get a fixed quote and a timeline. No work starts until you've approved it in writing.", ["Discovery call", "Written brief", "Fixed quote"]],
  ["During the project", "Weekly updates by email or WhatsApp, and a staging link you can open any time. You review the designs before a line of code is written.", ["Weekly updates", "Staging access", "Design sign-off"]],
  ["After launch", "A support window for bugs and small changes, a training session, and documentation for your team.", ["30–90 day support", "Training", "Documentation"]],
];

const HANDOVER = [
  {
    name: "your-project",
    children: [
      { name: "source-code", children: [{ name: "in your repository" }] },
      { name: "design", children: [{ name: "figma-file" }, { name: "logo-and-assets" }] },
      { name: "accounts", children: [{ name: "domain, in your name" }, { name: "hosting, in your name" }] },
      { name: "documentation", children: [{ name: "how-to-update-content" }, { name: "training-session" }] },
    ],
  },
];

const PRINCIPLES_CODE = `const project = {
  quote: "fixed, agreed in writing",
  contact: "the person building it",
  code: "yours, with no lock-in",
  afterLaunch: "still here",
};`;

const ABOUT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Brave Syntax",
  description: "Brave Syntax is a design and development studio based in Ghaziabad, India, offering web development, UI/UX design, Shopify, WordPress and brand identity work.",
  url: `${SITE_URL}/about`,
  mainEntity: { "@type": "Organization", name: "Brave Syntax", foundingLocation: "Ghaziabad, India" },
};

export default async function AboutPage() {
  const [schema, contact, facts] = await Promise.all([pageSchema("about"), getContactInfo(), getSiteFacts()]);

  return (
    <>
      <JsonLd data={[...schema.filter((s) => (s as { "@type"?: string })["@type"] !== "AboutPage"), ABOUT_SCHEMA]} />
      <PageHero
        eyebrow="Ghaziabad-based · Design and development studio"
        title={
          <>
            We build digital things <SparklesText className="text-primary">that last</SparklesText>
          </>
        }
        background={<Particles className="absolute inset-0 -z-10" quantity={60} />}
        actions={
          <>
            <ShimmerLink href="/contact">Work with us</ShimmerLink>
            <CtaLink href="/portfolio" variant="outline">
              See our work
            </CtaLink>
          </>
        }
      >
        Brave Syntax is a design and development studio from Ghaziabad, India. We make websites, brands and tools for businesses that care about quality, speed and getting results.
      </PageHero>

      {facts && (
        <div className="border-y">
          <dl className="mx-auto grid max-w-5xl grid-cols-3 divide-x px-5 py-8 text-center sm:px-6">
            {[
              [facts.projects, "Projects in our portfolio"],
              [facts.services, "Services offered"],
            ].map(([n, l]) => (
              <div key={l}>
                <dd className="text-3xl font-semibold tracking-tight">
                  <NumberTicker value={n as number} />
                </dd>
                <dt className="mt-1 px-2 text-sm text-muted-foreground">{l}</dt>
              </div>
            ))}
            {facts.since && (
              <div>
                <dd className="text-3xl font-semibold tracking-tight">{facts.since}</dd>
                <dt className="mt-1 px-2 text-sm text-muted-foreground">Building since</dt>
              </div>
            )}
          </dl>
        </div>
      )}

      <Section label="Our story">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <TracingBeam>
            <p className="text-sm font-medium text-primary">Our story</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">How we actually work</h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                Brave Syntax is built on a simple conviction: small and growing businesses deserve the same quality of digital work as big brands, <PointerHighlight>without the enterprise price tag</PointerHighlight> or the layers of account managers.
              </p>
              <p>The name comes from the idea that writing code takes some bravery. You&apos;re turning messy human ideas into precise logic, often under pressure. Syntax is the language that connects the two.</p>
              <p>Every project, big or small, gets worked on directly, with clear communication and no disappearing after launch.</p>
            </div>
          </TracingBeam>
          <BlurFade delay={0.1} className="relative overflow-hidden rounded-2xl">
            <BorderBeam />
            <CodeBlock code={PRINCIPLES_CODE} language="ts" filename="how-we-work.ts" />
          </BlurFade>
        </div>
      </Section>

      <Section muted label="Our values">
        <SectionHeading center eyebrow="What we stand for" title="The values behind every decision" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map(([Icon, title, desc], i) => (
            <BlurFade key={title} delay={(i % 3) * 0.06} className="h-full">
              <SpotlightCard className="h-full rounded-2xl border bg-card p-6">
                <div className="relative">
                  <IconChip>
                    <Icon className="size-5" aria-hidden="true" />
                  </IconChip>
                  <h3 className="mt-4 font-medium">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              </SpotlightCard>
            </BlurFade>
          ))}
        </div>
      </Section>

      <Section label="What makes us different">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Why choose us" title="What makes us different" />
            <ul className="mt-8 space-y-5">
              {DIFFERENTIATORS.map(([title, desc]) => (
                <li key={title} className="flex gap-3">
                  <Check className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <span className="font-medium">{title}.</span> <span className="text-muted-foreground">{desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <BlurFade delay={0.1}>
            <p className="mb-3 text-sm font-medium">What you receive when we finish</p>
            <FileTree tree={HANDOVER} className="rounded-2xl border bg-card p-5" />
          </BlurFade>
        </div>
      </Section>

      <Section muted label="Our promise">
        <div className="mx-auto max-w-3xl text-center">
          <TextReveal as="p" className="text-2xl font-medium tracking-tight text-balance sm:text-3xl" text="Every project gets the same attention, whether it's an ₹8,000 landing page or a ₹5,00,000 platform. The scale changes. The care doesn't." />
        </div>
      </Section>

      <Section label="Working with us">
        <SectionHeading center eyebrow="Working with us" title="What to expect from day one">
          Here&apos;s how every engagement works.
        </SectionHeading>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {ENGAGEMENT.map(([title, desc, tags], i) => (
            <BlurFade key={title} delay={i * 0.08} className="h-full">
              <GlareCard className="h-full rounded-2xl border bg-card p-6">
                <h3 className="text-lg font-medium">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </GlareCard>
            </BlurFade>
          ))}
        </div>
        <p className="mt-10 text-center text-muted-foreground">
          Tell us about your project and we&apos;ll reply {contact.responseTime}.
        </p>
      </Section>

      <RelatedLinks
        title="Explore"
        links={[
          ["Our services", "/services"],
          ["Recent projects", "/portfolio"],
          ["Industries we serve", "/industries"],
          ["Blog", "/blog"],
          ["Careers", "/careers"],
        ]}
      />
    </>
  );
}
