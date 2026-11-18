import { ArrowRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/site/ui";
import { SITE_NAME } from "@/lib/config";
import { EBOOKS, EBOOKS_URL, rupees } from "@/lib/ebooks";

export const metadata: Metadata = {
  title: "Ebooks",
  description: `${SITE_NAME} ki practical ebooks: freelancing, websites aur online business, Hinglish mein.`,
  alternates: { canonical: EBOOKS_URL },
};

export default function EbooksPage() {
  return (
    <>
      <PageHero eyebrow={<><BookOpen className="size-4" aria-hidden="true" /> {SITE_NAME} Ebooks</>} title="Seekho, banao, kamao">
        Freelancing aur web business ki practical guides, Hinglish mein, ready templates ke saath.
      </PageHero>
      <Section label="Ebooks" className="!pt-4">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EBOOKS.map((e) => (
            <li key={e.slug}>
              <Link href={`/ebooks/${e.slug}`} className="group flex h-full flex-col rounded-2xl border p-6 transition-colors hover:border-primary/60">
                <h2 className="text-xl font-semibold group-hover:text-primary">{e.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{e.subtitle}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-semibold">
                    {rupees(e.price)}
                    {e.mrp && <span className="ml-2 text-sm font-normal text-muted-foreground line-through">{rupees(e.mrp)}</span>}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Dekhein <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
