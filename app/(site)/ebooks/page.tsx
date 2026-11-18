import { ArrowRight, BookOpen, Clock, Gem, LayoutDashboard, Lock, Mail, Shirt, Sparkles, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookMockup } from "@/components/store/BookMockup";
import { container, Section, SectionHeading } from "@/components/site/ui";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import { EBOOKS_URL, rupees } from "@/lib/ebooks";
import { CATEGORIES, isLive, PRODUCTS, productsIn } from "@/lib/store";

export const metadata: Metadata = {
  title: "Store",
  description: `${SITE_NAME} Store: ebooks and guides now; apparel, fashion and business software coming soon.`,
  alternates: { canonical: EBOOKS_URL },
  openGraph: { images: [{ url: `${SITE_URL}${PRODUCTS[0].cover}`, alt: PRODUCTS[0].title }] },
};

const ICONS = { BookOpen, Shirt, Gem, LayoutDashboard };

const PROMISES = [
  { icon: Lock, title: "Secure payment", text: "Razorpay: UPI, cards, net banking, wallets" },
  { icon: Zap, title: "Instant delivery", text: "Digital products right after payment" },
  { icon: Mail, title: "Sent to your inbox", text: "Every order's link, by email too" },
  { icon: Sparkles, title: "Practical", text: "Step-by-step guides with ready-to-use templates" },
];

export default function StorePage() {
  const featured = PRODUCTS[0];
  const off = featured.mrp ? Math.round((1 - featured.price / featured.mrp) * 100) : 0;
  return (
    <>
      {/* ── Hero with the featured product ─────────────────────── */}
      <section className="relative isolate overflow-hidden bg-[#0b1220] text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(55%_70%_at_75%_30%,rgba(16,185,129,0.35),transparent_70%),radial-gradient(40%_50%_at_10%_90%,rgba(16,185,129,0.18),transparent_70%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(148,163,184,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.08)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_70%)]" />
        <div className={`${container} grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24`}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-emerald-200">
              <BookOpen className="size-4" aria-hidden /> {SITE_NAME} Store
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Learn it. Build it. <span className="text-emerald-400">Earn from it.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-white/70">
              Practical guides, templates and tools for freelancers and small businesses. Ebooks are live now; apparel and business software are coming soon.
            </p>

            <div className="mt-9 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">Featured ebook</p>
              <p className="mt-2 text-2xl font-semibold">{featured.title}</p>
              <p className="mt-1 text-white/70">{featured.subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
                {featured.stats.map(([v, l]) => (
                  <span key={l} className="rounded-full bg-white/10 px-2.5 py-1"><b className="text-white">{v}</b> {l}</span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link href={`/ebooks/${featured.slug}`} className="inline-flex h-12 items-center gap-2 rounded-lg bg-emerald-500 px-6 font-medium text-[#04130d] hover:bg-emerald-400">
                  View and buy <ArrowRight className="size-4" aria-hidden />
                </Link>
                <span className="text-lg font-semibold">{rupees(featured.price)}</span>
                {featured.mrp && <span className="text-white/50 line-through">{rupees(featured.mrp)}</span>}
                {off > 0 && <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-sm font-semibold text-emerald-300">{off}% off</span>}
              </div>
            </div>
          </div>
          <Link href={`/ebooks/${featured.slug}`} aria-label={`View ${featured.title}`} className="order-first block lg:order-none">
            <BookMockup src={featured.cover} alt={`${featured.title} ebook cover`} priority className="w-44 sm:w-56 lg:w-80" />
          </Link>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────── */}
      <Section label="Categories" className="!py-16 lg:!py-24">
        <SectionHeading eyebrow="Shop by category" title="What's in the store" />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.icon];
            const live = isLive(c.slug);
            const count = productsIn(c.slug).length;
            const card = (
              <div className={`group relative flex h-full flex-col rounded-2xl border p-6 transition duration-200 ${live ? "bg-card hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg" : "bg-muted/40"}`}>
                <div className="flex items-start justify-between">
                  <span className={`inline-flex size-12 items-center justify-center rounded-xl ${live ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  {live ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{count} live</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"><Clock className="size-3.5" aria-hidden /> Coming soon</span>
                  )}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{c.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.blurb}</p>
                {live && <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Shop now <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>}
              </div>
            );
            return <li key={c.slug}>{live ? <Link href={`#${c.slug}`} className="block h-full">{card}</Link> : card}</li>;
          })}
        </ul>
      </Section>

      {/* ── Live products by category ──────────────────────────── */}
      {CATEGORIES.filter((c) => isLive(c.slug)).map((c) => (
        <Section key={c.slug} id={c.slug} muted label={c.name} className="!py-16 lg:!py-24">
          <SectionHeading eyebrow={c.name} title="Available now" />
          {/* one product: a wide card; several: a grid */}
          <ul className={`mt-10 grid gap-6 ${productsIn(c.slug).length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
            {productsIn(c.slug).map((p) => (
              <li key={p.slug}>
                <Link href={`/ebooks/${p.slug}`} className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition duration-200 hover:-translate-y-1 hover:shadow-xl ${productsIn(c.slug).length > 1 ? "" : "md:flex-row"}`}>
                  <div className={`relative bg-[#0b1220] px-10 pt-10 pb-6 ${productsIn(c.slug).length > 1 ? "" : "md:w-2/5 md:shrink-0 md:py-12"}`}>
                    <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_30%,rgba(16,185,129,0.35),transparent_70%)]" />
                    <BookMockup src={p.cover} alt={`${p.title} cover`} className="relative w-44 md:w-52" />
                  </div>
                  <div className={`flex flex-1 flex-col p-6 ${productsIn(c.slug).length > 1 ? "" : "md:justify-center md:p-10"}`}>
                    <h3 className="text-xl font-semibold group-hover:text-primary md:text-2xl">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground md:text-base">{p.subtitle}</p>
                    {productsIn(c.slug).length === 1 && (
                      <ul className="mt-4 hidden space-y-1.5 text-sm md:block">
                        {p.outcomes.slice(0, 3).map((o) => (
                          <li key={o} className="flex gap-2"><span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{o}</li>
                        ))}
                      </ul>
                    )}
                    <div className="flex-1" />
                    <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
                      {p.stats.slice(0, 4).map(([v, l]) => (
                        <span key={l} className="rounded-full bg-muted px-2 py-0.5">{v} {l}</span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span>
                        <span className="text-xl font-semibold">{rupees(p.price)}</span>
                        {p.mrp && <span className="ml-2 text-sm text-muted-foreground line-through">{rupees(p.mrp)}</span>}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">View <ArrowRight className="size-4" aria-hidden /></span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ))}

      {/* ── Promises ───────────────────────────────────────────── */}
      <Section label="Why buy here" className="!py-16 lg:!py-20">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden /></span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
