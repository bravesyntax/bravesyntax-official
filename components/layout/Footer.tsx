import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getContactInfo } from "@/lib/contact";
import { contactServiceHref } from "@/lib/navigation";
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
  ["Portfolio", "/portfolio"],
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

const linkCls = "text-[13.5px] leading-snug text-zinc-400 transition-colors hover:text-emerald-400";

function Column({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h3 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{title}</h3>
      {children}
    </div>
  );
}

export default async function Footer() {
  const [services, contact] = await Promise.all([getActiveServices(), getContactInfo()]);
  const featured = services.slice(0, 8);

  const contactRows = [
    contact.email && { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { icon: Phone, label: contact.phone, href: contact.phoneHref },
    contact.address && { icon: MapPin, label: contact.address, href: "" },
    { icon: Clock, label: contact.hours, href: "" },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href: string }[];

  return (
    <footer className="w-full overflow-hidden border-t border-zinc-800 bg-black text-white" style={{ maxWidth: "100vw" }}>
      {/* 1. CTA band */}
      <div className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8 lg:py-12">
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-emerald-500">
              <span className="ft-ping inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
              Available for new projects
            </p>
            <h2 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">Have a project in mind?</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Tell us what you&apos;re building — we reply {contact.responseTime} with a clear plan and quote.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-shrink-0">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 font-mono text-sm font-bold text-black shadow-[0_0_24px_rgba(16,185,129,.25)] transition-all hover:bg-emerald-400"
            >
              Start a conversation
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            {contact.whatsappHref && (
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-6 py-3.5 font-mono text-sm text-white transition-colors hover:border-emerald-500/50 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp us
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main grid */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-5 py-12 sm:px-6 lg:grid-cols-12 lg:gap-x-10 lg:px-8 lg:py-16">
        <div className="col-span-2 lg:col-span-4">
          <Link href="/" className="inline-block" aria-label={`${contact.siteName} — Home`}>
            <Logo className="h-8" />
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
            A design and development studio building fast, conversion-focused websites, web apps and brands for growing businesses.
          </p>
          <ul className="mt-6 space-y-3">
            {contactRows.map(({ icon: Icon, label, href }) => (
              <li key={label} className="flex items-start gap-3 text-sm text-zinc-400">
                <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500/80" aria-hidden="true" />
                {href ? (
                  <a href={href} className="break-all transition-colors hover:text-emerald-400">
                    {label}
                  </a>
                ) : (
                  <span>{label}</span>
                )}
              </li>
            ))}
          </ul>
          {contact.socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {contact.socials.map(({ name, url }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${contact.siteName} on ${name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={SOCIAL_ICONS[name]} />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>

        <Column title="Services" className="col-span-2 lg:col-span-4">
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {featured.map((s) => (
              <li key={s.id}>
                <Link href={contactServiceHref(s.title)} className={linkCls}>
                  {s.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/services" className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-emerald-400 hover:text-emerald-300">
                All services <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </Column>

        <Column title="Company" className="lg:col-span-2">
          <ul className="space-y-2.5">
            {COMPANY.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className={linkCls}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </Column>

        <Column title="Free tools" className="lg:col-span-2">
          <ul className="space-y-2.5">
            {TOOLS.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className={linkCls}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </Column>
      </div>

      {/* 3. Bottom strip */}
      <div className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p className="font-mono text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} {contact.siteName}. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2" aria-label="Legal">
            <Link href="/privacy-policy" className="font-mono text-xs text-zinc-500 transition-colors hover:text-emerald-400">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-mono text-xs text-zinc-500 transition-colors hover:text-emerald-400">
              Terms of Service
            </Link>
            <Link href="/contact" className="font-mono text-xs text-zinc-500 transition-colors hover:text-emerald-400">
              Contact
            </Link>
          </nav>
        </div>
      </div>

      {/* 4. Wordmark */}
      <div className="ft-wordmark-wrap w-full select-none overflow-hidden pb-0.5" aria-hidden="true">
        <Logo className="ft-wordmark mx-auto h-auto w-full max-w-6xl px-5" sizes="(min-width: 1152px) 1152px, 100vw" />
      </div>
    </footer>
  );
}
