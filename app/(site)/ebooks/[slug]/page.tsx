import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Gift,
  Languages,
  Link2,
  Lock,
  Mail,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyEbook } from "@/components/ebooks/BuyEbook";
import JsonLd from "@/components/JsonLd";
import Logo from "@/components/Logo";
import { BookMockup } from "@/components/store/BookMockup";
import { PreviewGallery } from "@/components/store/PreviewGallery";
import { StickyBuyBar } from "@/components/store/StickyBuyBar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { container, Section, SectionHeading } from "@/components/site/ui";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import { EBOOKS, EBOOKS_URL, getEbook, rupees } from "@/lib/ebooks";

export const dynamicParams = false;
export const generateStaticParams = () => EBOOKS.map((e) => ({ slug: e.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const ebook = getEbook((await params).slug);
  if (!ebook) return {};
  const title = `${ebook.title}: ${ebook.subtitle}`;
  const description = `${ebook.subtitle}. ${ebook.pages}, ${ebook.language} mein, 38 visuals aur ready templates ke saath. Sirf ${rupees(ebook.price)}.`;
  const url = `${EBOOKS_URL}/${ebook.slug}`;
  const image = `${SITE_URL}${ebook.cover}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website", images: [{ url: image, width: 1100, height: 1561, alt: ebook.title }] } };
}

const TRUST = [
  { icon: Lock, text: "Razorpay se secure payment" },
  { icon: Zap, text: "Payment ke turant baad download" },
  { icon: Mail, text: "Download link email par bhi" },
  { icon: Smartphone, text: "Phone, laptop, tablet par padho" },
];

export default async function EbookPage({ params }: { params: Promise<{ slug: string }> }) {
  const ebook = getEbook((await params).slug);
  if (!ebook) notFound();
  const price = rupees(ebook.price);
  const mrp = ebook.mrp ? rupees(ebook.mrp) : undefined;
  const off = ebook.mrp ? Math.round((1 - ebook.price / ebook.mrp) * 100) : 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ebook.title,
    description: ebook.subtitle,
    image: `${SITE_URL}${ebook.cover}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: { "@type": "Offer", price: ebook.price, priceCurrency: "INR", availability: "https://schema.org/InStock", url: `${EBOOKS_URL}/${ebook.slug}` },
  };

  return (
    <>
      <JsonLd data={schema} />

      {/* ── Hero: product + buy box ─────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_70%),radial-gradient(50%_50%_at_90%_80%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_70%)]" />
        <div className={`${container} pt-6 pb-14 lg:pt-8 lg:pb-20`}>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/ebooks" className="hover:text-foreground">Store</Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span>Ebooks</span>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-foreground">{ebook.title}</span>
          </nav>

          <div className="mt-8 grid items-start gap-12 lg:grid-cols-[1fr_460px] lg:gap-16">
            {/* product visual */}
            <div className="relative lg:sticky lg:top-24">
              <div className="relative mx-auto max-w-[360px] py-6 lg:max-w-[400px]">
                <BookMockup src={ebook.cover} alt={`${ebook.title} ebook cover`} priority className="w-52 sm:w-64 lg:w-72" />
                <span className="absolute top-10 -left-1 hidden rounded-full border bg-background/90 px-3 py-1.5 text-sm font-medium shadow-lg backdrop-blur sm:inline-flex sm:items-center sm:gap-1.5">
                  <Sparkles className="size-4 text-primary" aria-hidden /> 38 visuals
                </span>
                <span className="absolute top-1/2 -right-2 hidden rounded-full border bg-background/90 px-3 py-1.5 text-sm font-medium shadow-lg backdrop-blur sm:inline-flex sm:items-center sm:gap-1.5">
                  <Gift className="size-4 text-primary" aria-hidden /> 6 templates
                </span>
                <span className="absolute bottom-16 left-2 hidden rounded-full border bg-background/90 px-3 py-1.5 text-sm font-medium shadow-lg backdrop-blur sm:inline-flex sm:items-center sm:gap-1.5">
                  <Link2 className="size-4 text-primary" aria-hidden /> 40+ free tools
                </span>
              </div>
            </div>

            {/* details + buy */}
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary"><BookOpen className="size-3.5" aria-hidden /> Ebook · PDF</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Languages className="size-3.5" aria-hidden /> {ebook.language}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><FileText className="size-3.5" aria-hidden /> {ebook.pages}</span>
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{ebook.title}</h1>
              <p className="mt-3 text-lg text-pretty text-muted-foreground">{ebook.subtitle}. Zero portfolio se pehla paying client tak, ready templates ke saath.</p>

              <ul className="mt-6 space-y-2.5">
                {ebook.outcomes.slice(0, 4).map((o) => (
                  <li key={o} className="flex gap-2.5">
                    <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>

              <div id="buy" className="mt-8 scroll-mt-24 rounded-2xl border bg-card p-5 shadow-xl shadow-primary/5 sm:p-6">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-4xl font-semibold tracking-tight">{price}</span>
                  {mrp && <span className="text-lg text-muted-foreground line-through">{mrp}</span>}
                  {off > 0 && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">{off}% off</span>}
                </div>
                <p className="mt-1 mb-5 text-sm text-muted-foreground">Ek baar payment · PDF hamesha aapki</p>
                <BuyEbook slug={ebook.slug} priceLabel={price} />
              </div>

              <ul className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {TRUST.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-muted-foreground">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" aria-hidden /></span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section aria-label="Book ek nazar mein" className="border-b bg-muted/30">
        <div className={`${container} grid grid-cols-2 gap-px sm:grid-cols-5`}>
          {ebook.stats.map(([v, l]) => (
            <div key={l} className="px-4 py-7 text-center">
              <p className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{v}</p>
              <p className="mt-1 text-sm text-muted-foreground uppercase tracking-wide">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem → solution ───────────────────────────────── */}
      <Section label="Kya ye aapki situation hai" className="!py-16 lg:!py-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 sm:p-8">
            <p className="text-sm font-semibold tracking-wide text-destructive uppercase">Kya ye aapki situation hai?</p>
            <ul className="mt-5 space-y-4">
              {ebook.painPoints.map((p) => (
                <li key={p} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"><X className="size-3.5" aria-hidden /></span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6 sm:p-8">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Is book ke baad aap</p>
            <ul className="mt-5 space-y-4">
              {ebook.outcomes.map((o) => (
                <li key={o} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" aria-hidden /></span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── Journey ──────────────────────────────────────────── */}
      <Section muted label="Pehle client tak ka raasta" className="!py-16 lg:!py-24">
        <SectionHeading eyebrow="Step by step" title="Zero portfolio se pehle paying client tak" center>
          Book aapko ek-ek step mein le jaati hai. Har step ka apna chapter, apna Action Task.
        </SectionHeading>
        <ol className="relative mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {ebook.journey.map(([s, ch], i) => (
            <li key={s} className="relative rounded-2xl border bg-background p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between">
                <span className={`inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold ${i === 4 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>{i + 1}</span>
                <span className="text-xs font-medium text-muted-foreground">{ch}</span>
              </div>
              <p className="mt-4 font-medium">{s}</p>
              {i === 4 && <p className="mt-1 text-sm text-primary">Yahan pehla paisa aata hai</p>}
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Preview ──────────────────────────────────────────── */}
      <Section label="Andar ki jhalak" className="!py-16 lg:!py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Andar ki jhalak" title={`${ebook.previews.length} asli pages, khareedne se pehle dekho`}>
            Diagrams, tables aur templates: har point samjhaane ke liye visual. Kisi bhi page par click karke bada dekho.
          </SectionHeading>
        </div>
        <div className="mt-10">
          <PreviewGallery items={ebook.previews} title={ebook.title} />
        </div>
      </Section>

      {/* ── Chapters ─────────────────────────────────────────── */}
      <Section muted label="Chapters" className="!py-16 lg:!py-24">
        <SectionHeading eyebrow="Andar kya hai" title="9 chapters, 30-din plan aur bonus" />
        <ol className="mt-10 grid gap-3 sm:grid-cols-2">
          {ebook.chapters.map((c, i) => (
            <li key={c.title} className="flex gap-4 rounded-2xl border bg-background p-5">
              <span className="text-2xl font-semibold tabular-nums text-primary/70">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Bonus ────────────────────────────────────────────── */}
      <Section label="Bonus" className="!py-16 lg:!py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <SectionHeading eyebrow="Bonus" title="Copy karo, naam badlo, bhej do">
            Messages, proposal, invoice, agreement aur pricing calculator: sab ready. Saath mein 40+ free tools ke clickable links.
          </SectionHeading>
          <ul className="grid gap-3 sm:grid-cols-2">
            {ebook.bonuses.map((b) => (
              <li key={b} className="flex gap-3 rounded-xl border bg-card p-4 text-sm">
                <Gift className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── Fit ──────────────────────────────────────────────── */}
      <Section muted label="Kiske liye" className="!py-16 lg:!py-24">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border bg-background p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Ye book aapke liye hai agar aap</h2>
            <ul className="mt-5 space-y-3">
              {ebook.audience.map((a) => (
                <li key={a} className="flex gap-3"><BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /><span>{a}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-background p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Aapke liye nahi agar</h2>
            <ul className="mt-5 space-y-3">
              {ebook.notFor.map((a) => (
                <li key={a} className="flex gap-3 text-muted-foreground"><X className="mt-0.5 size-5 shrink-0" aria-hidden /><span>{a}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── Author ───────────────────────────────────────────── */}
      <Section label="Author" className="!py-16 lg:!py-24">
        <div className="grid items-center gap-8 rounded-3xl border bg-card p-6 sm:p-10 lg:grid-cols-[auto_1fr]">
          <div className="flex size-24 items-center justify-center rounded-2xl bg-muted p-3">
            <Logo className="h-auto w-full" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Likhne wale</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Brave Syntax</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Ghaziabad (Delhi NCR) ka design aur development studio, 2025 se. Businesses ke liye websites, web apps aur online stores banate hain. Is book mein wahi process hai jo hum apne clients ke saath follow karte hain: likhit scope, fixed quote, 50% advance aur launch ke baad support.
            </p>
            <Link href={`${SITE_URL}/portfolio`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Hamara kaam dekho <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <Section muted label="FAQ" className="!py-16 lg:!py-24">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Aapke sawaal" center />
          <Accordion type="single" collapsible className="mt-8">
            {ebook.faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section aria-label="Abhi khareedo" className="relative isolate overflow-hidden bg-[#0b1220] text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_80%_20%,rgba(16,185,129,0.35),transparent_70%)]" />
        <div className={`${container} grid items-center gap-10 py-16 lg:grid-cols-[1fr_260px] lg:py-20`}>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Pehla client dhoondhna aaj se shuru karo</h2>
            <p className="mt-3 max-w-xl text-white/70">{ebook.pages}, 9 chapters, 38 visuals, 6 templates aur 40+ free tools. Ek baar ka payment, PDF hamesha aapki.</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a href="#buy" className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90">
                {price} mein abhi khareedo <ArrowRight className="size-4" aria-hidden />
              </a>
              {mrp && <span className="text-white/60"><span className="line-through">{mrp}</span> · {off}% off</span>}
            </div>
          </div>
          <BookMockup src={ebook.cover} alt="" className="hidden w-48 lg:block" />
        </div>
      </section>

      <StickyBuyBar title={ebook.title} price={price} mrp={mrp} />
    </>
  );
}
