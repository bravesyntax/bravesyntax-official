import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import { CityNameSlug, FeaturesJson } from "@/components/admin/LocationFields";
import { AdminPage, Card, inputCls, labelCls, primaryBtn } from "@/components/admin/ui";
import { formatDate } from "@/lib/content";
import { rows, sql } from "@/lib/db";
import { decodeRow } from "@/lib/html";
import {
  deleteCity,
  deleteLocationService,
  deleteOverride,
  saveCity,
  saveLocationService,
  saveOverride,
  toggleCity,
  toggleLocationService,
} from "./actions";

export const metadata = { title: "Location Pages" };

type City = { id: number; name: string; slug: string; state: string; latitude: string | null; longitude: string | null; is_active: number; sort_order: number };
type Service = { id: number; slug: string; label: string; keyword: string; contact_param: string | null; features_json: string | null; is_active: number; sort_order: number };
type Override = {
  id: number;
  city_slug: string;
  service_slug: string;
  custom_h1: string | null;
  custom_intro: string | null;
  updated_at: Date;
};
type Props = { searchParams: Promise<{ tab?: string; edit_city?: string; edit_service?: string; edit_override?: string }> };

const actBtn = "inline-flex items-center px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold border transition-colors";
const actEdit = `${actBtn} bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20`;
const actTog = `${actBtn} bg-amber-400/10 text-amber-400 border-amber-400/15 hover:bg-amber-400/20`;
const actDel = `${actBtn} bg-red-500/10 text-red-400 border-red-500/15 hover:bg-red-500/20`;
const muted = <span className="text-zinc-600">—</span>;

const ActiveBadge = ({ on }: { on: number }) =>
  on ? (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">● Active</span>
  ) : (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">● Hidden</span>
  );

function Input({ name, label, hint, defaultValue, placeholder, type = "text", required }: { name: string; label: string; hint?: string; defaultValue?: string | number | null; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label} {required && <span className="text-emerald-400">*</span>} {hint && <span className="text-zinc-600">({hint})</span>}
      </label>
      <input id={name} type={type} name={name} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-6 lg:p-7 mb-6">
      <h3 className="text-base font-display font-bold text-white mb-5">{title}</h3>
      {children}
    </Card>
  );
}

function FormButtons({ label, cancel }: { label: string; cancel?: string }) {
  return (
    <div className="flex items-center gap-3 pt-5 mt-5 border-t border-zinc-800">
      <SubmitButton className={primaryBtn}>{label}</SubmitButton>
      {cancel && (
        <Link href={cancel} className="px-4 py-3 text-sm font-mono text-zinc-400 hover:text-white transition-colors">
          Cancel
        </Link>
      )}
    </div>
  );
}

function Table({ head, children, empty, colSpan }: { head: string[]; children: ReactNode[]; empty: string; colSpan: number }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="l-table">
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children.length ? (
              children
            ) : (
              <tr>
                <td colSpan={colSpan} className="text-center !py-10 text-zinc-500">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CitiesTab({ cities, edit }: { cities: City[]; edit: City | null }) {
  return (
    <>
      <FormCard title={edit ? `Edit City — ${edit.name}` : "Add City"}>
        <form key={edit?.id ?? "new"} action={saveCity}>
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <CityNameSlug name={edit?.name ?? ""} slug={edit?.slug ?? ""} />
            <Input name="state" label="State" defaultValue={edit?.state} placeholder="Uttar Pradesh" />
            <Input name="latitude" label="Latitude" defaultValue={edit?.latitude} placeholder="28.6139" />
            <Input name="longitude" label="Longitude" defaultValue={edit?.longitude} placeholder="77.2090" />
            <Input name="sort_order" label="Sort Order" type="number" defaultValue={edit?.sort_order ?? 0} />
          </div>
          {edit && (
            <label className="mt-5 flex items-center gap-2 cursor-pointer text-sm font-mono text-zinc-300">
              <input type="checkbox" name="is_active" value="1" defaultChecked={!!edit.is_active} className="w-4 h-4 accent-emerald-500" />
              Active
            </label>
          )}
          <FormButtons label={edit ? "Update City" : "Add City"} cancel={edit ? "/admin/location?tab=cities" : undefined} />
        </form>
      </FormCard>
      <Table head={["City", "Slug / URL", "State", "Coords", "Sort", "Status", "Actions"]} empty="No cities yet — add one above." colSpan={7}>
        {cities.map((c) => (
          <tr key={c.id} className={!c.is_active ? "opacity-60" : ""}>
            <td className="!text-white font-semibold">{c.name}</td>
            <td>
              <span className="text-emerald-400">/{c.slug}</span>{" "}
              <a href={`/${c.slug}`} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </td>
            <td>{c.state || muted}</td>
            <td>{c.latitude ? `${c.latitude}, ${c.longitude ?? ""}` : muted}</td>
            <td>{c.sort_order}</td>
            <td>
              <ActiveBadge on={c.is_active} />
            </td>
            <td>
              <div className="flex gap-1.5">
                <Link href={`/admin/location?tab=cities&edit_city=${c.id}`} className={actEdit}>
                  Edit
                </Link>
                <form action={toggleCity}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className={actTog}>
                    {c.is_active ? "Hide" : "Show"}
                  </button>
                </form>
                <form action={deleteCity}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmButton message={`Delete city ${c.name}?`} className={actDel}>
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function ServicesTab({ services, edit, quoteOptions }: { services: Service[]; edit: Service | null; quoteOptions: string[] }) {
  return (
    <>
      <FormCard title={edit ? `Edit Service — ${edit.label}` : "Add Location Service"}>
        <form key={edit?.id ?? "new"} action={saveLocationService}>
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="space-y-5">
              <Input name="label" label="Label" hint="shown in pills" required defaultValue={edit?.label} placeholder="Web Development" />
              <div>
                <Input name="slug" label="URL Slug" hint="empty = city root" defaultValue={edit?.slug} placeholder="web-development" />
                <div className="mt-1 text-[11px] font-mono text-zinc-500">
                  bravesyntax.com/delhi/<span className="text-emerald-400">{edit?.slug || "..."}</span>
                </div>
              </div>
              <Input name="keyword" label="Keyword" hint="for SEO text" required defaultValue={edit?.keyword} placeholder="web development" />
              <div>
                <label htmlFor="contact_param" className={labelCls}>
                  Quote form service <span className="text-zinc-600">(pre-selected when visitors click “Get Free Quote”)</span>
                </label>
                <select id="contact_param" name="contact_param" defaultValue={edit?.contact_param ?? ""} className={inputCls}>
                  <option value="">— none —</option>
                  {/* Keep an old value visible even if that service was renamed, so saving doesn't silently drop it. */}
                  {edit?.contact_param && !quoteOptions.includes(edit.contact_param) && <option value={edit.contact_param}>{edit.contact_param} (not a current service)</option>}
                  {quoteOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <Input name="sort_order" label="Sort Order" type="number" defaultValue={edit?.sort_order ?? 0} />
              {edit && (
                <label className="flex items-center gap-2 cursor-pointer text-sm font-mono text-zinc-300">
                  <input type="checkbox" name="is_active" value="1" defaultChecked={!!edit.is_active} className="w-4 h-4 accent-emerald-500" />
                  Active (show in URL pills)
                </label>
              )}
            </div>
            <FeaturesJson value={edit?.features_json ?? ""} />
          </div>
          <FormButtons label={edit ? "Update Service" : "Add Service"} cancel={edit ? "/admin/location?tab=services" : undefined} />
        </form>
      </FormCard>
      <Table head={["Label", "Slug", "Keyword", "Contact Param", "Features", "Sort", "Status", "Actions"]} empty="No services yet — add one above." colSpan={8}>
        {services.map((s) => (
          <tr key={s.id} className={!s.is_active ? "opacity-60" : ""}>
            <td className="!text-white font-semibold">{s.label}</td>
            <td>
              <span className="text-emerald-400">{s.slug ? `/${s.slug}` : <em className="text-zinc-500">(city root)</em>}</span>
            </td>
            <td>{s.keyword}</td>
            <td>{s.contact_param || muted}</td>
            <td>{s.features_json ? <span className="text-emerald-400">Custom</span> : <span className="text-zinc-500">Default</span>}</td>
            <td>{s.sort_order}</td>
            <td>
              <ActiveBadge on={s.is_active} />
            </td>
            <td>
              <div className="flex gap-1.5">
                <Link href={`/admin/location?tab=services&edit_service=${s.id}`} className={actEdit}>
                  Edit
                </Link>
                <form action={toggleLocationService}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className={actTog}>
                    {s.is_active ? "Hide" : "Show"}
                  </button>
                </form>
                <form action={deleteLocationService}>
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmButton message="Delete this service?" className={actDel}>
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}

function OverridesTab({ overrides, cities, services, edit }: { overrides: Override[]; cities: City[]; services: Service[]; edit: Override | null }) {
  const cut = (s: string | null, n: number) => (s ? (s.length > n ? `${s.slice(0, n)}…` : s) : null);
  return (
    <>
      <FormCard title={edit ? "Edit Override" : "Add Content Override"}>
        <p className="-mt-3 mb-5 text-xs font-mono text-zinc-500">Override the auto-generated H1 and intro paragraph for any city/service page. Titles and meta descriptions are managed in{" "}
          <Link href="/admin/seo/locations" className="text-accent hover:underline">
            SEO → Location pages
          </Link>
          .
        </p>
        <form key={edit?.id ?? "new"} action={saveOverride}>
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="city_slug" className={labelCls}>
                City <span className="text-emerald-400">*</span>
              </label>
              <select id="city_slug" name="city_slug" required defaultValue={edit?.city_slug} className={inputCls}>
                {cities.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name} ({c.slug})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="service_slug" className={labelCls}>
                Service <span className="text-zinc-600">(empty = city root page)</span>
              </label>
              <select id="service_slug" name="service_slug" defaultValue={edit?.service_slug ?? ""} className={inputCls}>
                <option value="">— City Root Page —</option>
                {services
                  .filter((s) => s.slug)
                  .map((s) => (
                    <option key={s.id} value={s.slug}>
                      {s.label}
                    </option>
                  ))}
              </select>
            </div>
            <Input name="custom_h1" label="Custom H1" hint="leave empty = auto-generated" defaultValue={edit?.custom_h1} placeholder="Best Web Development Agency in Delhi" />
            <div>
              <label htmlFor="custom_intro" className={labelCls}>
                Custom Intro Paragraph
              </label>
              <textarea
                id="custom_intro"
                name="custom_intro"
                rows={3}
                defaultValue={edit?.custom_intro ?? ""}
                placeholder="Custom intro text for this specific city+service combination..."
                className={`${inputCls} resize-y`}
              />
            </div>
          </div>
          <FormButtons label="Save Override" cancel={edit ? "/admin/location?tab=overrides" : undefined} />
        </form>
      </FormCard>
      <Table head={["City", "Service", "Custom H1", "SEO", "Updated", "Preview", "Actions"]} empty="No overrides yet. All pages use auto-generated content." colSpan={7}>
        {overrides.map((o) => {
          const path = `/${o.city_slug}${o.service_slug ? `/${o.service_slug}` : ""}`;
          return (
            <tr key={o.id}>
              <td className="!text-white font-semibold">{o.city_slug}</td>
              <td>{o.service_slug || <em className="text-zinc-500">root</em>}</td>
              <td>{cut(o.custom_h1, 40) ?? <span className="text-zinc-500">auto</span>}</td>
              <td>
                <Link href={`/admin/seo/edit?type=location&key=${encodeURIComponent(path.slice(1))}`} className="text-emerald-400 hover:underline">
                  Edit SEO
                </Link>
              </td>
              <td>{formatDate(o.updated_at)}</td>
              <td>
                <a href={path} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                  Preview <ExternalLink className="inline h-3 w-3" aria-hidden="true" />
                </a>
              </td>
              <td>
                <div className="flex gap-1.5">
                  <Link href={`/admin/location?tab=overrides&edit_override=${o.id}`} className={actEdit}>
                    Edit
                  </Link>
                  <form action={deleteOverride}>
                    <input type="hidden" name="id" value={o.id} />
                    <ConfirmButton message="Delete this override?" className={actDel}>
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

export default async function LocationAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tab = sp.tab === "services" || sp.tab === "overrides" ? sp.tab : "cities";
  const [cities, services, overrides, quoteOptions] = await Promise.all([
    rows<City>(sql`SELECT * FROM location_cities ORDER BY sort_order ASC, name ASC`),
    rows<Service>(sql`SELECT * FROM location_services ORDER BY sort_order ASC, label ASC`),
    rows<Override>(sql`SELECT * FROM location_page_overrides ORDER BY city_slug ASC, service_slug ASC`).then((r) => r.map(decodeRow)),
    rows<{ title: string }>(sql`SELECT title FROM services WHERE is_active = 1 ORDER BY sort_order ASC, title ASC`).then((r) => r.map((x) => x.title)),
  ]);
  const realServices = services.filter((s) => s.slug !== "").length;
  const tabLink = (key: string, label: string) => (
    <Link href={`/admin/location?tab=${key}`} className={`tab-btn ${tab === key ? "active" : ""}`}>
      {label}
    </Link>
  );

  return (
    <AdminPage title="Location Pages">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Location Pages</h2>
          <p className="text-xs font-mono text-zinc-500 mt-1">
            {cities.length} cities · {realServices} services · {cities.length * Math.max(1, realServices)} potential pages
          </p>
        </div>
        <a href="/delhi" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono text-zinc-300 border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-white">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Preview /delhi
        </a>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabLink("cities", `Cities (${cities.length})`)}
        {tabLink("services", `Services (${services.length})`)}
        {tabLink("overrides", `Content Overrides (${overrides.length})`)}
      </div>
      {tab === "cities" && <CitiesTab cities={cities} edit={cities.find((c) => c.id === Number(sp.edit_city)) ?? null} />}
      {tab === "services" && <ServicesTab services={services} edit={services.find((s) => s.id === Number(sp.edit_service)) ?? null} quoteOptions={quoteOptions} />}
      {tab === "overrides" && <OverridesTab overrides={overrides} cities={cities} services={services} edit={overrides.find((o) => o.id === Number(sp.edit_override)) ?? null} />}
    </AdminPage>
  );
}
