import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ContactForm, { PrefilledContactForm } from "@/components/contact/ContactForm";
import JsonLd from "@/components/JsonLd";
import Icon, { ICONS, PingDot } from "@/components/ui/Icon";
import { pageMetadata, pageSchema } from "@/lib/seo";
import { getContactInfo } from "@/lib/contact";
import { getActiveServices } from "@/lib/services";
import { TURNSTILE_SITE_KEY, turnstileEnabled } from "@/lib/spam";
import "./contact.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("contact");
}

const CLOCK = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
const PHONE =
  "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z";

const NEXT_STEPS = ["We read your message carefully", "We reply with a clear proposal", "You approve scope & price", "We start within 24 hours"];

const ICON_WHATSAPP = "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z";
const ICON_SHIELD =
  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z";
const ICON_CALENDAR = "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";

export default async function ContactPage() {
  const [dbServices, contact, schema] = await Promise.all([getActiveServices(), getContactInfo(), pageSchema("contact")]);
  const services = dbServices.map((s) => s.title);
  const turnstileKey = turnstileEnabled() ? TURNSTILE_SITE_KEY : "";

  const infoCards = (
    [
      ["Email", contact.email, ICONS.mail, `mailto:${contact.email}`],
      ["Phone", contact.phone, PHONE, contact.phoneHref],
      ["Location", contact.address, ICONS.pin, null],
    ] as [string, string, string | string[], string | null][]
  ).filter(([, value]) => value);

  // Only channels that are configured in Admin → Settings are shown.
  const channels = (
    [
      ["WhatsApp", "Chat directly. Fastest response for urgent requests.", contact.whatsappHref, "Chat on WhatsApp", ICON_WHATSAPP],
      ["Book a Call", "30-minute discovery call. No hard sell, just straight talk.", contact.bookingUrl, "Pick a time", ICON_CALENDAR],
      ["Upwork", "Milestone-based projects with escrow protection.", contact.upworkUrl, "View Upwork profile", ICON_SHIELD],
      ["Direct Email", "Write to us directly anytime, any format.", `mailto:${contact.email}`, "Send email", ICONS.mail],
    ] as [string, string, string, string, string | string[]][]
  ).filter(([, , href]) => href);

  return (
    <div className="pg-contact">
      <JsonLd data={schema} />

      {/* ═══ HERO ═══ */}
      <section className="ct-hero-section relative pt-32 pb-16 lg:pt-44 lg:pb-20 overflow-hidden" aria-label="Contact Brave Syntax">
        <div className="ct-dots absolute inset-0" style={{ backgroundSize: "28px 28px" }} />
        <div className="ct-fade-b absolute inset-0" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center mb-10">
            <div className="ct-badge-pill inline-flex items-center gap-2.5 px-4 py-2 bg-zinc-900/80 border border-zinc-700/60 rounded-full backdrop-blur-sm">
              <PingDot />
              <span className="ct-badge-text text-xs font-mono text-zinc-300">We reply {contact.responseTime} &middot; {contact.hours}</span>
            </div>
          </div>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="ct-t-p text-5xl lg:text-7xl font-display font-bold text-white leading-none mb-6">
              Let&apos;s Build
              <br />
              <span className="text-gradient">Something Great</span>
            </h1>
            <p className="ct-t-s text-lg text-zinc-400 font-mono leading-relaxed">
              Tell us about your project. We&apos;ll send a detailed proposal, fixed quote, and realistic timeline &mdash; usually {contact.responseTime}.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ FORM + SIDEBAR ═══ */}
      <section className="pb-24 lg:pb-32 relative" aria-label="Contact form">
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-10 items-start">
            <div className="space-y-5 lg:sticky lg:top-28 order-2 lg:order-1">
              <div className="ct-info-card bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon d={CLOCK} className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="ct-t-p text-sm font-mono font-semibold text-white">Response Time</div>
                    <div className="text-emerald-400 text-xs font-mono font-bold first-letter:uppercase">{contact.responseTime}</div>
                  </div>
                </div>
                <p className="ct-t-m text-xs text-zinc-600 font-mono leading-relaxed">
                  {contact.hours}. We also check messages on Sundays for urgent requests.
                </p>
              </div>

              {infoCards.map(([label, value, icon, href]) => (
                <div key={label} className="ct-info-card bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon d={icon} className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="ct-info-label text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-0.5">{label}</div>
                    {href ? (
                      <a href={href} className="ct-info-value text-sm font-mono text-white hover:text-emerald-400 transition-colors truncate block">
                        {value}
                      </a>
                    ) : (
                      <div className="ct-info-value text-sm font-mono text-white">{value}</div>
                    )}
                  </div>
                </div>
              ))}

              <div className="ct-info-card bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-5">
                <p className="ct-t-m text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">What Happens Next</p>
                <ul className="space-y-2.5">
                  {NEXT_STEPS.map((step, i) => (
                    <li key={step} className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-mono font-bold text-emerald-400 flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="ct-t-s text-xs font-mono text-zinc-400">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-2xl p-5">
                <div className="text-emerald-400 text-xs font-mono font-bold mb-1">&#10003; Our Guarantee</div>
                <p className="ct-t-m text-xs text-zinc-500 font-mono leading-relaxed">
                  Fixed pricing, no hidden costs, revisions until you&apos;re satisfied. If we can&apos;t deliver what we quoted, you don&apos;t pay.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 order-1 lg:order-2">
              <Suspense fallback={<ContactForm services={services} turnstileSiteKey={turnstileKey} />}>
                <PrefilledContactForm services={services} turnstileSiteKey={turnstileKey} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ OTHER CHANNELS ═══ */}
      <section className="py-20 ct-alt relative" aria-label="Other ways to get in touch">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="ct-t-p text-center text-2xl font-display font-bold text-white mb-10">Other Ways to Reach Us</h2>
          <div className={`grid sm:grid-cols-2 gap-5 ${channels.length >= 4 ? "lg:grid-cols-4" : channels.length === 3 ? "lg:grid-cols-3" : ""}`}>
            {channels.map(([title, desc, href, cta, icon]) => (
              <div key={title} className="ct-info-card group bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 hover:border-emerald-500/25 transition-all hover:-translate-y-1">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon d={icon} className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="ct-t-p text-sm font-display font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">{title}</h3>
                <p className="ct-t-m text-xs text-zinc-600 font-mono leading-relaxed mb-4">{desc}</p>
                <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors">
                  {cta} &rarr;
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="ct-cta py-20 lg:py-24 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle,rgba(16,185,129,.08) 1px,transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="ct-fade absolute inset-0" />
        <div className="relative max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="ct-t-p text-3xl lg:text-4xl font-display font-bold text-white mb-4">
            Not Ready to Commit?
            <br />
            <span className="text-gradient">That&apos;s Fine Too.</span>
          </h2>
          <p className="ct-t-s text-zinc-400 font-mono text-sm mb-8 leading-relaxed">Browse our portfolio or try our free PDF tools &mdash; no signup needed.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900/80 border border-zinc-700 hover:border-emerald-500/40 text-zinc-300 hover:text-white font-mono text-sm rounded-xl transition-all"
            >
              Browse Portfolio
            </Link>
            <Link
              href="/pdf-tools"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-500/50 text-emerald-400 font-mono text-sm rounded-xl transition-all"
            >
              Try Free PDF Tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
