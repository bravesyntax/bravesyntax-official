import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { CtaLink } from "@/components/site/ui";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/velora/glowing-effect";
import { Meteors } from "@/components/velora/meteors";
import { TextHoverEffect } from "@/components/velora/text-hover-effect";
import { WordRotate } from "@/components/velora/word-rotate";
import { getContactInfo } from "@/lib/contact";
import { serviceHref } from "@/lib/navigation";
import { getActiveServices } from "@/lib/services";

// Site footer. Services, contact details and social profiles all come from the admin (Services / Settings).

const SOCIAL_ICONS: Record<string, string> = Object.fromEntries([
  ["X", "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"],
  ["Facebook", "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"],
  ["Instagram", "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"],
  ["GitHub", "M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"],
  ["LinkedIn", "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"],
]);

const COMPANY: [string, string][] = [
  ["About us", "/about"],
  ["Work", "/portfolio"],
  ["Industries", "/industries"],
  ["Blog", "/blog"],
  ["Careers", "/careers"],
  ["Contact", "/contact"],
];

const TOOLS: [string, string][] = [
  ["All PDF tools", "/pdf-tools"],
  ["Merge PDF", "/pdf-tools?tool=merge"],
  ["Compress PDF", "/pdf-tools?tool=compress"],
  ["Image to PDF", "/pdf-tools?tool=img2pdf"],
  ["AI background remover", "/bg-remover"],
];

const linkCls = "text-sm text-muted-foreground transition-colors hover:text-foreground";

function Column({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className={linkCls}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Footer() {
  const [services, contact] = await Promise.all([getActiveServices(), getContactInfo()]);

  const contactRows = [
    contact.email && { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { icon: Phone, label: contact.phone, href: contact.phoneHref },
    contact.address && { icon: MapPin, label: contact.address, href: "" },
    { icon: Clock, label: contact.hours, href: "" },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href: string }[];

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl border bg-zinc-950 px-6 py-12 text-white sm:px-12">
          <Meteors number={12} className="-z-10" />
          <GlowingEffect />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Let&apos;s build your <WordRotate words={["website", "web app", "online store", "brand"]} className="text-emerald-300" />
              </h2>
              <p className="mt-2 text-sm text-zinc-300">Tell us what you&apos;re building. We reply {contact.responseTime} with a clear plan and a fixed quote.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/contact" className="bg-white text-zinc-950 hover:bg-zinc-200">
                Start a project
              </CtaLink>
              {contact.whatsappHref && (
                <Button asChild variant="ghost" className="h-11 rounded-full border border-white/20 px-5 text-white hover:bg-white/10 hover:text-white">
                  <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle aria-hidden="true" /> WhatsApp us
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-5 py-14 sm:px-6 lg:grid-cols-12 lg:gap-x-10 lg:px-8">
        <div className="col-span-2 lg:col-span-4">
          <Link href="/" className="inline-block" aria-label={`${contact.siteName} home`}>
            <Logo className="h-8" />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">A design and development studio building fast, conversion-focused websites, web apps and brands for growing businesses.</p>
          <ul className="mt-6 space-y-3">
            {contactRows.map((row) => {
              const inner = (
                <>
                  <row.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{row.label}</span>
                </>
              );
              return (
                <li key={row.label}>
                  {row.href ? (
                    <a href={row.href} className={`flex items-start gap-2.5 ${linkCls}`}>
                      {inner}
                    </a>
                  ) : (
                    <span className="flex items-start gap-2.5 text-sm text-muted-foreground">{inner}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {contact.socials.length > 0 && (
            <div className="mt-6 flex gap-2">
              {contact.socials.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="grid size-9 place-items-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                    <path d={SOCIAL_ICONS[s.name]} />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="col-span-2 lg:col-span-4">
          <h3 className="text-sm font-medium">Services</h3>
          <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.title}>
                <Link href={serviceHref(s)} className={linkCls}>
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2">
          <Column title="Company" links={COMPANY} />
        </div>
        <div className="lg:col-span-2">
          <Column title="Free tools" links={TOOLS} />
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {contact.siteName}. All rights reserved.
          </p>
          <nav className="flex gap-5" aria-label="Legal">
            <Link href="/privacy-policy" className={linkCls}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={linkCls}>
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5 pb-6 sm:px-6 lg:px-8" aria-hidden="true">
        <TextHoverEffect text="BRAVE</SYNTAX>" />
      </div>
    </footer>
  );
}
