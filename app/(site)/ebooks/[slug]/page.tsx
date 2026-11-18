import { BookOpen, Check, FileText, Gift, Languages } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuyEbook } from "@/components/ebooks/BuyEbook";
import JsonLd from "@/components/JsonLd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHero, Section, SectionHeading } from "@/components/site/ui";
import { SITE_NAME } from "@/lib/config";
import { EBOOKS, EBOOKS_URL, getEbook, rupees } from "@/lib/ebooks";

export const dynamicParams = false;
export const generateStaticParams = () => EBOOKS.map((e) => ({ slug: e.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const ebook = getEbook((await params).slug);
  if (!ebook) return {};
  const title = `${ebook.title}: ${ebook.subtitle}`;
  const description = `${ebook.subtitle}. ${ebook.pages}, ${ebook.language} mein, ready templates ke saath. Sirf ${rupees(ebook.price)}.`;
  const url = `${EBOOKS_URL}/${ebook.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website" } };
}

export default async function EbookPage({ params }: { params: Promise<{ slug: string }> }) {
  const ebook = getEbook((await params).slug);
  if (!ebook) notFound();
  const priceLabel = rupees(ebook.price);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ebook.title,
    description: ebook.subtitle,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: { "@type": "Offer", price: ebook.price, priceCurrency: "INR", availability: "https://schema.org/InStock", url: `${EBOOKS_URL}/${ebook.slug}` },
  };

  const buyBox = (
    <div id="buy" className="scroll-mt-24">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-4xl font-semibold">{priceLabel}</span>
        {ebook.mrp && <span className="text-lg text-muted-foreground line-through">{rupees(ebook.mrp)}</span>}
        {ebook.mrp && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
            {Math.round((1 - ebook.price / ebook.mrp) * 100)}% off
          </span>
        )}
      </div>
      <BuyEbook slug={ebook.slug} priceLabel={priceLabel} />
    </div>
  );

  return (
    <>
      <JsonLd data={schema} />
      <PageHero
        center={false}
        eyebrow={
          <>
            <BookOpen className="size-4" aria-hidden="true" /> Ebook by {SITE_NAME}
          </>
        }
        title={ebook.title}
        aside={buyBox}
      >
        <p>{ebook.subtitle}. Zero portfolio se pehle paying client tak, ready templates ke saath.</p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-base">
          <li className="flex items-center gap-2">
            <FileText className="size-4 text-primary" aria-hidden="true" /> {ebook.pages} PDF
          </li>
          <li className="flex items-center gap-2">
            <Languages className="size-4 text-primary" aria-hidden="true" /> {ebook.language}
          </li>
          <li className="flex items-center gap-2">
            <Gift className="size-4 text-primary" aria-hidden="true" /> {ebook.bonuses.length} bonus templates
          </li>
        </ul>
      </PageHero>

      <Section label="Is book se kya milega" className="!py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Results" title="Is book ke baad aap" />
            <ul className="mt-6 space-y-3">
              {ebook.outcomes.map((o) => (
                <li key={o} className="flex gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Kiske liye" title="Ye book aapke liye hai agar aap" />
            <ul className="mt-6 space-y-3">
              {ebook.audience.map((a) => (
                <li key={a} className="flex gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section muted label="Chapters" className="!py-12">
        <SectionHeading eyebrow="Andar kya hai" title={`${ebook.chapters.length} chapters, step by step`} />
        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {ebook.chapters.map((c, i) => (
            <li key={c.title} className="rounded-2xl border bg-background p-5">
              <span className="text-sm font-medium text-primary">Chapter {i + 1}</span>
              <h3 className="mt-1 font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="Bonus" className="!py-12">
        <SectionHeading eyebrow="Bonus" title="Copy-paste karke use karne wale templates" />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ebook.bonuses.map((b) => (
            <li key={b} className="flex gap-3 rounded-xl border p-4">
              <Gift className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-sm">{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section muted label="FAQ" className="!py-12">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Aapke sawaal" center />
          <Accordion type="single" collapsible className="mt-6">
            {ebook.faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 text-center">
            <a href="#buy" className="inline-flex h-11 items-center rounded-lg bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90">
              {priceLabel} mein abhi khareedein
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
