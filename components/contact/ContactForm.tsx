"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitContact, type ContactState } from "@/app/(site)/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { confettiBurst } from "@/components/velora/confetti";
import { DotsLoader } from "@/components/velora/loaders";
import { RippleButton } from "@/components/velora/ripple-button";
import { Stepper } from "@/components/velora/stepper";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const BUDGETS = ["Under ₹10,000", "₹10,000–₹30,000", "₹30,000–₹75,000", "₹75,000+", "Not sure yet"];
const CUSTOM = "Custom / Not Listed";
const MESSAGE_MAX = 2000;
const STEPS = ["About you", "Your project", "Details"];

const initial: ContactState = { status: "idle", errors: [], values: {} };

type Prefill = { service: string; message: string };

/** Reads ?service= / ?plan= / ?industry= / ?project= links from other pages. Rendered inside <Suspense>. */
export function PrefilledContactForm({ services, turnstileSiteKey }: { services: string[]; turnstileSiteKey: string }) {
  const sp = useSearchParams();
  const service = (sp.get("industry") || sp.get("plan") || sp.get("service") || "").trim();
  const project = (sp.get("project") || "").trim();
  const business = (sp.get("business") || "").trim().slice(0, 60);
  const message = business ? `Hi! I'd like a website for ${business}. Here is what I have in mind:\n\n` : project ? `Hi! I came across your "${project}" project and I'd love something similar. Here is what I have in mind:\n\n` : "";
  return <ContactForm services={services} turnstileSiteKey={turnstileSiteKey} prefill={{ service, message }} />;
}

export default function ContactForm({ services, turnstileSiteKey, prefill = { service: "", message: "" } }: { services: string[]; turnstileSiteKey: string; prefill?: Prefill }) {
  const [state, action, pending] = useActionState(submitContact, initial);
  const v = state.status === "error" ? state.values : { service: prefill.service, message: prefill.message };
  const announcer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "ok") {
      track("generate_lead", { method: "contact_form" });
      const r = announcer.current?.getBoundingClientRect();
      confettiBurst(r ? { x: r.left + r.width / 2, y: r.top + 20 } : {});
    }
  }, [state.status]);

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
      <div ref={announcer}>
        {state.status === "ok" ? (
          <div className="py-10 text-center" role="status">
            <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Message sent</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">{state.message}</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold tracking-tight">Tell us about your project</h2>
            <p className="mt-1 text-sm text-muted-foreground">It takes about a minute.</p>
            {state.errors.length > 0 && (
              <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4" role="alert">
                {state.errors.map((e) => (
                  <p key={e} className="flex items-start gap-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {e}
                  </p>
                ))}
              </div>
            )}
            {/* Re-mounting on each result restores the submitted values after an error. */}
            <FormBody key={JSON.stringify(state)} action={action} pending={pending} values={v} services={services} turnstileSiteKey={turnstileSiteKey} hasErrors={state.errors.length > 0} />
          </>
        )}
      </div>
    </div>
  );
}

function FormBody({
  action,
  pending,
  values,
  services,
  turnstileSiteKey,
  hasErrors,
}: {
  action: (fd: FormData) => void;
  pending: boolean;
  values: Record<string, string>;
  services: string[];
  turnstileSiteKey: string;
  hasErrors: boolean;
}) {
  const [step, setStep] = useState(0);
  const [formTs, setFormTs] = useState("");
  const [budget, setBudget] = useState(values.budget ?? "");
  const [count, setCount] = useState((values.message ?? "").length);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  // Set in the browser: a server-rendered value would be the build time of this static page.
  useEffect(() => setFormTs(String(Date.now())), []);

  const selected = (values.service ?? "").trim().toLowerCase();
  const known = services.some((s) => s.trim().toLowerCase() === selected) || selected === CUSTOM.toLowerCase();
  const serviceDefault = services.find((s) => s.trim().toLowerCase() === selected) ?? (selected === CUSTOM.toLowerCase() ? CUSTOM : values.service) ?? "";

  /** Only move on once the visible fields are valid, with the browser's own messages. */
  const next = () => {
    const fields = panels.current[step]?.querySelectorAll<HTMLInputElement>("input, select, textarea") ?? [];
    for (const f of fields) if (!f.reportValidity()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goTo = (i: number) => {
    if (i < step) setStep(i);
    else if (i === step + 1) next();
  };

  const selectCls = "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

  return (
    <form action={action} className="mt-6">
      <Stepper steps={STEPS} current={step} onStepClick={goTo} className="mb-7" />
      <input type="hidden" name="form_ts" value={formTs} />
      {/* Honeypot: invisible to humans */}
      <div style={{ position: "absolute", left: -9999, height: 0, overflow: "hidden" }} aria-hidden="true">
        <label>
          Leave this empty <input type="text" name="website_url" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {/* All steps stay in the DOM, so every field submits with the form. */}
      <div ref={(el) => void (panels.current[0] = el)} className={cn("grid gap-5 sm:grid-cols-2", step !== 0 && "hidden")}>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="ct_name">Full name</Label>
          <Input id="ct_name" name="name" required minLength={2} maxLength={100} autoComplete="name" defaultValue={values.name} placeholder="Your name" className="h-11" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ct_email">Email address</Label>
          <Input id="ct_email" type="email" name="email" required maxLength={150} autoComplete="email" defaultValue={values.email} placeholder="you@company.com" className="h-11" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ct_phone">
            Phone <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="ct_phone" type="tel" name="phone" maxLength={30} autoComplete="tel" defaultValue={values.phone} placeholder="+91 98765 43210" className="h-11" />
        </div>
      </div>

      <div ref={(el) => void (panels.current[1] = el)} className={cn("grid gap-5", step !== 1 && "hidden")}>
        <div className="grid gap-2">
          <Label htmlFor="ct_service">What do you need?</Label>
          <select id="ct_service" name="service" defaultValue={serviceDefault} className={selectCls}>
            <option value="">Select a service…</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {/* A value from a link that isn't in the list (e.g. an industry or a plan) is still pre-selected. */}
            {values.service && !known && <option value={values.service}>{values.service}</option>}
            <option value={CUSTOM}>{CUSTOM}</option>
          </select>
        </div>
        <div className="grid gap-2">
          <span className="text-sm leading-none font-medium">Approximate budget</span>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Approximate budget">
            {BUDGETS.map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={budget === b}
                onClick={() => setBudget(b)}
                className={cn("rounded-lg border px-3 py-2.5 text-left text-sm transition-colors", budget === b ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted")}
              >
                {b}
              </button>
            ))}
          </div>
          <input type="hidden" name="budget" value={budget === "Not sure yet" ? "" : budget} />
        </div>
      </div>

      <div ref={(el) => void (panels.current[2] = el)} className={cn("grid gap-5", step !== 2 && "hidden")}>
        <div className="grid gap-2">
          <Label htmlFor="ct_message">Project details</Label>
          <Textarea
            id="ct_message"
            name="message"
            rows={6}
            required
            minLength={10}
            maxLength={MESSAGE_MAX}
            defaultValue={values.message}
            onChange={(e) => setCount(e.target.value.length)}
            placeholder="What you need, your timeline, and any examples you like."
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>More detail means a faster, more accurate quote.</span>
            <span className={count > 1800 ? "text-warning" : undefined}>
              {count} / {MESSAGE_MAX}
            </span>
          </div>
        </div>
        {turnstileSiteKey && <Turnstile siteKey={turnstileSiteKey} />}
      </div>

      <div className="mt-7 flex items-center gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" className="h-11 rounded-full px-5" onClick={() => setStep(step - 1)}>
            <ArrowLeft aria-hidden="true" /> Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" className="ml-auto h-11 rounded-full px-6" onClick={next}>
            Continue <ArrowRight aria-hidden="true" />
          </Button>
        ) : (
          <RippleButton type="submit" disabled={pending || !formTs} className="ml-auto h-11 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {pending ? <DotsLoader size="sm" label="Sending" /> : "Send message"}
          </RippleButton>
        )}
      </div>
      {hasErrors && step !== 0 && (
        <button type="button" className="mt-3 text-xs text-muted-foreground underline" onClick={() => setStep(0)}>
          Check your details
        </button>
      )}
      <p className="mt-5 text-center text-xs text-muted-foreground">Your details are only used to reply to you. See our privacy policy.</p>
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
