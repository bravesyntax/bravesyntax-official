import { BadgeCheck, Building2, Type } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SubmitButton } from "@/components/admin/client";
import SeoShell from "@/components/admin/SeoShell";
import { inputCls, labelCls, primaryBtn } from "@/components/admin/ui";
import { getSiteSettings } from "@/lib/settings";
import { SEO_SETTING_DEFAULTS } from "@/lib/seo";
import { saveSeoSettings } from "../actions";

export const metadata = { title: "SEO · Settings" };

function Field({ name, title, value, placeholder, hint, span, type = "text" }: { name: string; title: string; value: string; placeholder?: string; hint?: ReactNode; span?: boolean; type?: string }) {
  return (
    <div className={span ? "md:col-span-2" : undefined}>
      <label htmlFor={name} className={labelCls}>
        {title}
      </label>
      <input id={name} name={name} type={type} defaultValue={value} placeholder={placeholder} className={inputCls} />
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{hint}</p>}
    </div>
  );
}

function Section({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-zinc-800 py-8 first:pt-0 last:border-0 lg:grid-cols-[260px_1fr]">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
          {title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{description}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

export default async function SeoSettingsPage() {
  const s = await getSiteSettings();
  const v = (k: string, fallback = "") => s[k] || fallback;

  return (
    <SeoShell active="settings">
      <form action={saveSeoSettings} className="mx-auto max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 lg:p-8">
        <Section icon={Type} title="Titles & descriptions" description="Defaults for every URL that doesn't have its own. Blog posts, case studies and other generated titles get the suffix appended.">
          <Field
            name="seo_title_suffix"
            title="Title suffix"
            value={s.seo_title_suffix ?? SEO_SETTING_DEFAULTS.seo_title_suffix}
            placeholder=" | Brave Syntax"
            hint='Added after generated titles, e.g. "My Post | Brave Syntax". Clear it to add nothing.'
          />
          <Field name="default_og_image" title="Default social share image" type="url" value={v("default_og_image")} placeholder="https://… (1200×630)" hint="Used when a URL has no image of its own. Leave empty to use the built-in Brave Syntax image." />
          <div className="md:col-span-2">
            <label htmlFor="seo_default_description" className={labelCls}>
              Fallback meta description
            </label>
            <textarea id="seo_default_description" name="seo_default_description" rows={3} defaultValue={v("seo_default_description", SEO_SETTING_DEFAULTS.seo_default_description)} className={`${inputCls} resize-y`} />
            <p className="mt-1.5 text-[11px] text-zinc-500">Only used when a page has no description at all.</p>
          </div>
        </Section>

        <Section icon={BadgeCheck} title="Search engine verification" description="Proves to Google and Bing that you own the site, so you can use Search Console and Webmaster Tools.">
          <Field
            name="google_search_console"
            title="Google Search Console"
            value={v("google_search_console")}
            placeholder='Paste the meta tag or its content value'
            hint={
              <>
                Search Console → Add property → URL prefix → HTML tag. You can paste the whole <code className="font-mono">&lt;meta&gt;</code> tag.
              </>
            }
          />
          <Field name="bing_site_verification" title="Bing Webmaster Tools" value={v("bing_site_verification")} placeholder="Paste the msvalidate.01 tag or value" hint="Bing → Add site → HTML meta tag." />
        </Section>

        <Section icon={Building2} title="Organisation schema" description="Structured data on the home page telling Google who runs the site (knowledge panel, logo in results). Contact details and social profiles come from Settings.">
          <Field name="global_schema_org_name" title="Organisation name" value={v("global_schema_org_name", "Brave Syntax")} />
          <div>
            <label htmlFor="global_schema_org_type" className={labelCls}>
              Type
            </label>
            <select id="global_schema_org_type" name="global_schema_org_type" defaultValue={v("global_schema_org_type", "ProfessionalService")} className={inputCls}>
              {["ProfessionalService", "LocalBusiness", "Organization"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <Field name="global_schema_logo" title="Logo URL" type="url" value={v("global_schema_logo")} span hint="Square or wide PNG, at least 112×112." />
        </Section>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-6">
          <p className="text-[11px] text-zinc-500">
            Location page templates are on the{" "}
            <Link href="/admin/seo/locations" className="text-brand hover:underline">
              Location pages
            </Link>{" "}
            tab. Google Analytics lives in Settings.
          </p>
          <SubmitButton className={primaryBtn}>Save SEO settings</SubmitButton>
        </div>
      </form>
    </SeoShell>
  );
}
