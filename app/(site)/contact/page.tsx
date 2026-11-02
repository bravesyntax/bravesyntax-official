import { CalendarDays, Clock, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import ContactForm, { PrefilledContactForm } from "@/components/contact/ContactForm";
import JsonLd from "@/components/JsonLd";
import { CtaLink, IconChip, PageHero, Section, SectionHeading } from "@/components/site/ui";
import { Pin3D } from "@/components/velora/3d-pin";
import { BlurFade } from "@/components/velora/blur-fade";
import { GlowingEffect } from "@/components/velora/glowing-effect";
import { Dock, DockIcon } from "@/components/velora/dock";
import { Ripple } from "@/components/velora/ripple";
import { Timeline } from "@/components/velora/timeline";
import { getContactInfo } from "@/lib/contact";
import { pageMetadata, pageSchema } from "@/lib/seo";
import { getActiveServices } from "@/lib/services";
import { TURNSTILE_SITE_KEY, turnstileEnabled } from "@/lib/spam";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("contact");
}

const NEXT_STEPS: [string, string][] = [
  ["We read your message", "A real person reads it, not an autoresponder. You get a confirmation email straight away."],
  ["We reply with a clear plan", "Questions if we have them, then a scope, a fixed price and a timeline."],
  ["You approve", "Nothing starts, and nothing is charged, until you've agreed the scope and price."],
  ["We get started", "You get a start date and a direct contact for the whole project."],
];

export default async function ContactPage() {
  const [dbServices, contact, schema] = await Promise.all([getActiveServices(), getContactInfo(), pageSchema("contact")]);
  const services = dbServices.map((s) => s.title);
  const turnstileKey = turnstileEnabled() ? TURNSTILE_SITE_KEY : "";

  const infoCards = (
    [
      ["Email", contact.email, Mail, `mailto:${contact.email}`],
      ["Phone", contact.phone, Phone, contact.phoneHref],
      ["Location", contact.address, MapPin, null],
    ] as [string, string, typeof Mail, string | null][]
  ).filter(([, value]) => value);

  // Only channels that are configured in Admin → Settings are shown.
  const channels = (
    [
      ["WhatsApp", "Chat directly. The quickest way to reach us.", contact.whatsappHref, "Chat on WhatsApp", MessageCircle],
      ["Book a call", "A short discovery call, with no hard sell.", contact.bookingUrl, "Pick a time", CalendarDays],
      ["Upwork", "Milestone-based projects with escrow protection.", contact.upworkUrl, "View Upwork profile", ShieldCheck],
      ["Email", "Write to us directly, in any format.", `mailto:${contact.email}`, "Send an email", Mail],
    ] as [string, string, string, string, typeof Mail][]
  ).filter(([, , href]) => href);

  return (
    <>
      <JsonLd data={schema} />
      <PageHero
        eyebrow={
          <>
            <Clock className="size-3.5 text-primary" aria-hidden="true" /> We reply {contact.responseTime} · {contact.hours}
          </>
        }
        title="Let's build something great"
        background={<Ripple className="-z-10" />}
      >
        Tell us about your project. We&apos;ll send a clear plan, a fixed quote and a realistic timeline.
      </PageHero>

      <Section label="Contact form" className="!pt-4">
        <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
          <BlurFade>
            <Suspense fallback={<ContactForm services={services} turnstileSiteKey={turnstileKey} />}>
              <PrefilledContactForm services={services} turnstileSiteKey={turnstileKey} />
            </Suspense>
          </BlurFade>
          <BlurFade delay={0.1} className="space-y-4">
            {infoCards.map(([label, value, Icon, href]) => (
              <div key={label} className="relative flex items-start gap-4 rounded-2xl border bg-card p-5">
                <GlowingEffect />
                <IconChip>
                  <Icon className="size-5" aria-hidden="true" />
                </IconChip>
                <div className="min-w-0">
                  <h2 className="text-sm font-medium">{label}</h2>
                  {href ? (
                    <a href={href} className="mt-0.5 block text-sm break-words text-muted-foreground hover:text-foreground">
                      {value}
                    </a>
                  ) : (
                    <p className="mt-0.5 text-sm text-muted-foreground">{value}</p>
                  )}
                </div>
              </div>
            ))}
            <div className="hidden h-72 items-center justify-center lg:flex">
              <Pin3D title={contact.address || "Ghaziabad, India"} className="size-full">
                <div className="flex size-44 flex-col items-center justify-center rounded-2xl text-center">
                  <MapPin className="size-8 text-primary" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium">Working remotely with businesses across India</p>
                </div>
              </Pin3D>
            </div>
          </BlurFade>
        </div>
      </Section>

      <Section muted label="What happens next">
        <SectionHeading eyebrow="What happens next" title="From your message to a start date" />
        <Timeline className="mt-8" items={NEXT_STEPS.map(([title, desc]) => ({ title, content: <p className="max-w-xl text-muted-foreground">{desc}</p> }))} />
      </Section>

      <Section label="Other ways to reach us">
        <SectionHeading center eyebrow="Other ways to reach us" title="Prefer something else?" />
        <div className="mt-8 hidden justify-center sm:flex">
          <Dock>
            {channels.map(([label, , href, , Icon]) => (
              <DockIcon key={label} label={label} href={href}>
                <Icon className="size-5" aria-hidden="true" />
              </DockIcon>
            ))}
          </Dock>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map(([label, desc, href, cta, Icon]) => (
            <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-medium">{label}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{desc}</p>
              <span className="mt-3 text-sm font-medium text-primary group-hover:underline">{cta}</span>
            </a>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <p className="text-muted-foreground">Not ready to commit?</p>
          <CtaLink href="/portfolio" variant="outline">
            Browse our work
          </CtaLink>
          <CtaLink href="/pdf-tools" variant="outline">
            Try our free tools
          </CtaLink>
        </div>
      </Section>
    </>
  );
}
