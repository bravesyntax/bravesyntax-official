"use client";

import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitContact, type ContactState } from "@/app/(site)/contact/actions";
import Icon, { ICONS } from "@/components/ui/Icon";

const BUDGETS = ["Under ₹10,000", "₹10,000–₹30,000", "₹30,000–₹75,000", "₹75,000+"];
const CUSTOM = "Custom / Not Listed";
const MESSAGE_MAX = 2000;

const inputCls =
  "ct-input w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder-zinc-600";
const labelCls = "ct-label block text-xs font-mono text-zinc-400 mb-2";
const Required = () => <span className="ct-required text-emerald-400">*</span>;

const initial: ContactState = { status: "idle", errors: [], values: {} };

type Prefill = { service: string; message: string };

/** Reads ?service= / ?plan= / ?industry= / ?project= links from other pages. Rendered inside <Suspense>. */
export function PrefilledContactForm({ services, turnstileSiteKey }: { services: string[]; turnstileSiteKey: string }) {
  const sp = useSearchParams();
  const service = (sp.get("industry") || sp.get("plan") || sp.get("service") || "").trim();
  const project = (sp.get("project") || "").trim();
  const message = project ? `Hi! I came across your "${project}" project and I'd love something similar. Here is what I have in mind:\n\n` : "";
  return <ContactForm services={services} turnstileSiteKey={turnstileSiteKey} prefill={{ service, message }} />;
}

export default function ContactForm({
  services,
  turnstileSiteKey,
  prefill = { service: "", message: "" },
}: {
  services: string[];
  turnstileSiteKey: string;
  prefill?: Prefill;
}) {
  const [state, action, pending] = useActionState(submitContact, initial);
  const v = state.status === "error" ? state.values : { service: prefill.service, message: prefill.message };

  return (
    <>
      {state.status === "ok" && (
        <div className="mb-6 px-5 py-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-start gap-3" role="status">
          <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-emerald-300 font-mono text-sm">{state.message}</p>
        </div>
      )}

      {state.errors.length > 0 && (
        <div className="ct-error mb-6 px-5 py-4 bg-red-500/15 border border-red-500/30 rounded-xl" role="alert">
          {state.errors.map((e) => (
            <p key={e} className="text-red-400 font-mono text-sm flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">&#9888;</span>
              {e}
            </p>
          ))}
        </div>
      )}

      <div className="ct-form-card bg-zinc-900/50 border border-zinc-800/60 rounded-3xl p-7 lg:p-10">
        <h2 className="ct-t-p text-xl font-display font-bold text-white mb-1">Send Us a Message</h2>
        <p className="ct-t-m text-xs text-zinc-600 font-mono mb-7">
          Fields marked <Required /> are required.
        </p>

        {/* Re-mounting on each result restores values after an error and clears the form after success. */}
        <FormBody key={JSON.stringify(state)} action={action} pending={pending} values={v} services={services} turnstileSiteKey={turnstileSiteKey} />
      </div>
    </>
  );
}

function FormBody({
  action,
  pending,
  values,
  services,
  turnstileSiteKey,
}: {
  action: (fd: FormData) => void;
  pending: boolean;
  values: Record<string, string>;
  services: string[];
  turnstileSiteKey: string;
}) {
  const [formTs, setFormTs] = useState("");
  const [budget, setBudget] = useState(values.budget ?? "");
  const [count, setCount] = useState((values.message ?? "").length);

  // Set in the browser: a server-rendered value would be the build time of this static page.
  useEffect(() => setFormTs(String(Date.now())), []);

  const selected = (values.service ?? "").trim().toLowerCase();
  const known = services.some((s) => s.trim().toLowerCase() === selected) || selected === CUSTOM.toLowerCase();
  const serviceDefault =
    services.find((s) => s.trim().toLowerCase() === selected) ?? (selected === CUSTOM.toLowerCase() ? CUSTOM : values.service ?? "");

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="form_ts" value={formTs} />
      {/* Honeypot — invisible to humans */}
      <div style={{ position: "absolute", left: -9999, height: 0, overflow: "hidden" }} aria-hidden="true">
        <label>
          Leave this empty <input type="text" name="website_url" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="ct_name" className={labelCls}>
            Full Name <Required />
          </label>
          <input type="text" id="ct_name" name="name" required minLength={2} defaultValue={values.name} placeholder="Arjun Mehta" className={inputCls} />
        </div>
        <div>
          <label htmlFor="ct_email" className={labelCls}>
            Email Address <Required />
          </label>
          <input type="email" id="ct_email" name="email" required defaultValue={values.email} placeholder="arjun@company.com" className={inputCls} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="ct_phone" className={labelCls}>
            Phone Number
          </label>
          <input type="tel" id="ct_phone" name="phone" defaultValue={values.phone} placeholder="+91 98765 43210" className={inputCls} />
        </div>
        <div>
          <label htmlFor="ct_service" className={labelCls}>
            Service Needed
          </label>
          <select id="ct_service" name="service" defaultValue={serviceDefault} className={inputCls}>
            <option value="">Select a service…</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {/* A service from a link that isn't in the list (e.g. an industry) is still pre-selected. */}
            {values.service && !known && <option value={values.service}>{values.service}</option>}
            <option value={CUSTOM}>{CUSTOM}</option>
          </select>
        </div>
      </div>

      <div>
        <span className={labelCls}>Approximate Budget</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Approximate budget">
          {BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={budget === b}
              onClick={() => setBudget(b)}
              className={`budget-tile ct-input text-center px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl font-mono text-xs transition-all hover:border-zinc-500 cursor-pointer ${
                budget === b ? "!bg-emerald-500/15 !border-emerald-500/50 !text-emerald-300 text-emerald-300" : "text-zinc-400"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <input type="hidden" name="budget" value={budget} />
      </div>

      <div>
        <label htmlFor="ct_message" className={labelCls}>
          Project Details <Required />
        </label>
        <textarea
          id="ct_message"
          name="message"
          rows={6}
          required
          minLength={10}
          maxLength={MESSAGE_MAX}
          defaultValue={values.message}
          onChange={(e) => setCount(e.target.value.length)}
          placeholder="Tell us about your project — what you need, your timeline, any inspiration links, and specific requirements..."
          className={`${inputCls} resize-none`}
        />
        <div className="flex justify-between mt-1.5">
          <span className="ct-t-m text-[10px] font-mono text-zinc-700">More detail = faster, more accurate quote</span>
          <span className="ct-t-m text-[10px] font-mono text-zinc-700" style={count > 1800 ? { color: "#f59e0b" } : undefined}>
            {count} / {MESSAGE_MAX}
          </span>
        </div>
      </div>

      {turnstileSiteKey && <Turnstile siteKey={turnstileSiteKey} />}

      <button
        type="submit"
        disabled={pending || !formTs}
        className={`group w-full flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,.25)] hover:shadow-[0_0_50px_rgba(16,185,129,.4)] active:scale-[.99] ${pending ? "opacity-80" : ""}`}
      >
        <span>{pending ? "Sending…" : "Send Message"}</span>
        {pending ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <Icon d={ICONS.arrowRight} className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
        )}
      </button>
      <p className="ct-t-m text-center text-[10px] font-mono text-zinc-700 mt-2">Your data is never shared or sold. We hate spam as much as you do.</p>
    </form>
  );
}

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; theme?: string; "response-field-name"?: string }) => string;
  remove: (id: string) => void;
};

/** Cloudflare Turnstile widget, rendered explicitly so it survives React re-mounts. */
function Turnstile({ siteKey }: { siteKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && "turnstile" in window);

  useEffect(() => {
    const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
    if (!ready || !api || !ref.current) return;
    const id = api.render(ref.current, { sitekey: siteKey, theme: "auto" });
    return () => api.remove(id);
  }, [ready, siteKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} />
      <div ref={ref} />
    </>
  );
}
