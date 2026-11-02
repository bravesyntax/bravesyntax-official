import { MapPin, Wand2 } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "@/components/admin/client";
import SeoShell from "@/components/admin/SeoShell";
import SeoTargetList from "@/components/admin/SeoTargetList";
import { Card, inputCls, labelCls, smallPrimaryBtn } from "@/components/admin/ui";
import { ISSUES, loadSeoTargets } from "@/lib/admin/seo-audit";
import { getSiteSettings } from "@/lib/settings";
import { SEO_SETTING_DEFAULTS } from "@/lib/seo";
import { saveSeoSettings } from "../actions";

export const metadata = { title: "SEO · Location pages" };

type Props = { searchParams: Promise<{ filter?: string; city?: string }> };

const TEMPLATES: [keyof typeof SEO_SETTING_DEFAULTS, string, boolean][] = [
  ["seo_loc_city_title", "City page title", false],
  ["seo_loc_city_description", "City page description", true],
  ["seo_loc_service_title", "Service page title", false],
  ["seo_loc_service_description", "Service page description", true],
];

export default async function LocationSeoPage({ searchParams }: Props) {
  const [{ filter = "all", city }, { targets }, s] = await Promise.all([searchParams, loadSeoTargets("location"), getSiteSettings()]);
  const cities = targets.filter((t) => !t.key.includes("/"));
  const selected = cities.find((c) => c.key === city)?.key ?? cities[0]?.key ?? "";
  const shown = targets.filter((t) => t.key === selected || t.key.startsWith(`${selected}/`));
  const issuesIn = (slug: string) => targets.filter((t) => (t.key === slug || t.key.startsWith(`${slug}/`)) && t.issues.some((c) => ISSUES[c].severity !== "notice")).length;

  return (
    <SeoShell active="locations">
      <Card className="mb-6 p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-display font-semibold text-white">
              <Wand2 className="h-4 w-4 text-accent" aria-hidden="true" /> Title &amp; description templates
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
              Every city and city + service page gets its title and description from these, so {targets.length} pages stay unique and on-brand. Placeholders:{" "}
              {["{city}", "{state}", "{service}", "{keyword}", "{site}", "{suffix}"].map((p) => (
                <code key={p} className="mx-0.5 rounded bg-zinc-800 px-1 py-0.5 font-mono text-[11px] text-accent">
                  {p}
                </code>
              ))}
              . Override a single page from the list below.
            </p>
          </div>
        </div>
        <form action={saveSeoSettings} className="grid gap-5 md:grid-cols-2">
          <input type="hidden" name="return_to" value="locations" />
          {TEMPLATES.map(([key, label, long]) => (
            <div key={key}>
              <label htmlFor={key} className={labelCls}>
                {label}
              </label>
              {long ? (
                <textarea id={key} name={key} rows={3} defaultValue={s[key] || SEO_SETTING_DEFAULTS[key]} className={`${inputCls} resize-y`} />
              ) : (
                <input id={key} name={key} defaultValue={s[key] || SEO_SETTING_DEFAULTS[key]} className={inputCls} />
              )}
            </div>
          ))}
          <div className="flex items-center gap-3 md:col-span-2">
            <SubmitButton className={smallPrimaryBtn}>Save templates</SubmitButton>
            <span className="text-[11px] text-zinc-500">Clear a field to restore its default. H1 and intro text are set in <Link href="/admin/location?tab=overrides" className="text-accent hover:underline">Location Pages → Content overrides</Link>.</span>
          </div>
        </form>
      </Card>

      <SeoTargetList
        targets={shown}
        title="Location pages"
        description={`${cities.length} cities × ${targets.length / Math.max(1, cities.length)} pages each. Pick a city to review its pages.`}
        filter={filter}
        baseHref={`/admin/seo/locations?city=${encodeURIComponent(selected)}`}
        extra={
          <form className="flex items-center gap-2" action="/admin/seo/locations">
            <MapPin className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <select name="city" defaultValue={selected} aria-label="City" className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 font-mono text-xs text-white focus:border-accent focus:outline-none">
              {cities.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                  {issuesIn(c.key) ? ` (${issuesIn(c.key)} issues)` : ""}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-accent hover:text-accent">
              Show
            </button>
          </form>
        }
      />
    </SeoShell>
  );
}
