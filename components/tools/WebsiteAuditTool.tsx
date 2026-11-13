"use client";

import { CheckCircle2, Loader2, Printer, Search, Sparkles, XCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { requestAuditReview, runWebsiteAudit } from "@/app/(site)/tools/website-audit-actions";
import { ConsentCheckbox } from "@/components/site/ConsentCheckbox";
import { trackLead } from "@/lib/analytics";
import type { AuditCheck, AuditReport, CategoryKey } from "@/lib/site-audit";
import { cn } from "@/lib/utils";

const STEPS = ["Opening the website…", "Checking Google & SEO basics…", "Measuring speed on a phone…", "Checking security and contact options…", "Writing your report…"];
const input = "h-12 w-full rounded-xl border bg-background px-4 text-base outline-none transition-colors focus:border-primary";
const LABELS: Record<CategoryKey, string> = { seo: "Google & SEO", speed: "Speed", mobile: "Mobile", security: "Security & trust", leads: "Getting enquiries" };

const tone = (score: number) => (score >= 80 ? "text-emerald-600 dark:text-emerald-400" : score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400");
const bar = (score: number) => (score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500");

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-36 shrink-0" role="img" aria-label={`Overall score ${score} out of 100`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} className="fill-none stroke-muted" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} className={cn("fill-none transition-all duration-700", score >= 80 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-red-500")} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={cn("text-4xl font-semibold tracking-tight", tone(score))}>{score}</div>
          <div className="text-xs text-muted-foreground">out of 100</div>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ c }: { c: AuditCheck }) {
  const Icon = c.status === "pass" ? CheckCircle2 : c.status === "warn" ? AlertTriangle : XCircle;
  return (
    <li className="flex gap-3 py-3">
      <Icon className={cn("mt-0.5 size-5 shrink-0", c.status === "pass" ? "text-emerald-500" : c.status === "warn" ? "text-amber-500" : "text-red-500")} aria-label={c.status === "pass" ? "Passed" : c.status === "warn" ? "Could be better" : "Problem"} />
      <div className="min-w-0">
        <div className="font-medium">{c.label}</div>
        <div className="text-sm break-words text-muted-foreground">{c.detail}</div>
        {c.status !== "pass" && c.fix && <div className="mt-1 text-sm">→ {c.fix}</div>}
      </div>
    </li>
  );
}

export default function WebsiteAuditTool() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ token: string; report: AuditReport } | null>(null);

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 5000);
    return () => clearInterval(t);
  }, [busy]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    const r = await runWebsiteAudit(url).catch(() => ({ error: "Something went wrong. Please try again." }));
    setBusy(false);
    if ("error" in r) return setError(r.error);
    setResult(r);
    requestAnimationFrame(() => document.getElementById("audit-report")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="space-y-8">
      <form onSubmit={run} className="rounded-2xl border bg-card p-5 sm:p-6 print:hidden">
        <label htmlFor="audit-url" className="font-medium">
          Your website address
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input id="audit-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" inputMode="url" autoComplete="url" required className={input} />
          <button type="submit" disabled={busy || url.trim().length < 4} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-medium text-primary-foreground disabled:opacity-60">
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
            {busy ? "Checking…" : "Audit my website"}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Free, no sign-up. Takes 20–60 seconds. We save the report so we can improve the tool; we only contact you if you ask us to.</p>
        {busy && (
          <p role="status" className="mt-4 flex items-center gap-2 text-sm text-primary">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {STEPS[step]}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>

      {result && <Report token={result.token} report={result.report} />}
    </div>
  );
}

function Report({ token, report }: { token: string; report: AuditReport }) {
  const host = new URL(report.finalUrl).host;
  const order = { fail: 0, warn: 1, pass: 2 } as const;
  const problems = report.checks.filter((c) => c.status !== "pass").length;
  return (
    <section id="audit-report" aria-label="Audit report" className="scroll-mt-24 space-y-6">
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
        <ScoreRing score={report.score} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-semibold tracking-tight break-words">Report for {host}</h2>
          <p className="mt-1 text-muted-foreground">
            {problems ? `${problems} thing${problems > 1 ? "s" : ""} to improve` : "Everything we check passed"} · checked {new Date(report.checkedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            {report.metrics.platform ? ` · built with ${report.metrics.platform}` : ""}
          </p>
          <button type="button" onClick={() => window.print()} className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline print:hidden">
            <Printer className="size-4" aria-hidden="true" /> Print or save as PDF
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {report.categories.map((c) => (
          <div key={c.key} className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className={cn("mt-1 text-2xl font-semibold", tone(c.score))}>{c.score}</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full", bar(c.score))} style={{ width: `${c.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      {report.summary && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="size-4" aria-hidden="true" /> In short
          </div>
          <p className="mt-2 leading-relaxed">{report.summary}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {(Object.keys(LABELS) as CategoryKey[]).map((key) => {
          const list = report.checks.filter((c) => c.category === key).sort((a, b) => order[a.status] - order[b.status]);
          if (!list.length) return null;
          return (
            <div key={key} className="rounded-2xl border bg-card px-5 py-2">
              <h3 className="border-b py-3 font-semibold">{LABELS[key]}</h3>
              <ul className="divide-y">
                {list.map((c) => (
                  <CheckRow key={c.id} c={c} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {!report.pagespeed && <p className="text-xs text-muted-foreground">Google&apos;s PageSpeed test didn&apos;t answer in time, so phone speed scores are not included this time.</p>}

      <ReviewForm token={token} host={host} problems={problems} />
    </section>
  );
}

function ReviewForm({ token, host, problems }: { token: string; host: string; problems: number }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError("");
    const r = await requestAuditReview(new FormData(e.currentTarget)).catch(() => ({ error: "Something went wrong. Please try again." }));
    if ("error" in r) {
      setState("idle");
      return setError(r.error);
    }
    setState("done");
    trackLead("audit_review");
  }
  if (state === "done")
    return (
      <div role="status" className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center print:hidden">
        <CheckCircle2 className="mx-auto size-8 text-primary" aria-hidden="true" />
        <h3 className="mt-2 text-xl font-semibold">Thanks! We&apos;ll be in touch soon.</h3>
        <p className="mt-1 text-muted-foreground">A real person from our team will look at {host} and get back to you, usually within one working day.</p>
      </div>
    );
  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-6 print:hidden">
      <input type="hidden" name="token" value={token} />
      <h3 className="text-xl font-semibold tracking-tight">{problems ? "Want these fixed? Get a free expert review" : "Want to grow further? Get a free expert review"}</h3>
      <p className="mt-1 text-muted-foreground">We&apos;ll look at your site by hand and send a short plan with what to fix first. No obligation.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ar-name" className="text-sm font-medium">
            Name
          </label>
          <input id="ar-name" name="name" required maxLength={150} autoComplete="name" className={cn(input, "mt-1.5 h-11")} />
        </div>
        <div>
          <label htmlFor="ar-email" className="text-sm font-medium">
            Email
          </label>
          <input id="ar-email" name="email" type="email" maxLength={150} autoComplete="email" className={cn(input, "mt-1.5 h-11")} />
        </div>
        <div>
          <label htmlFor="ar-phone" className="text-sm font-medium">
            Phone / WhatsApp
          </label>
          <input id="ar-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className={cn(input, "mt-1.5 h-11")} />
        </div>
      </div>
      <label htmlFor="ar-msg" className="mt-4 block text-sm font-medium">
        Anything specific? <span className="font-normal text-muted-foreground">(optional)</span>
      </label>
      <textarea id="ar-msg" name="message" rows={3} maxLength={2000} className="mt-1.5 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:border-primary" />
      <div className="mt-4">
        <ConsentCheckbox>I agree that Brave Syntax may store this audit with my details and contact me about my website.</ConsentCheckbox>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button type="submit" disabled={state === "busy"} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-medium text-primary-foreground disabled:opacity-60">
        {state === "busy" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Get my free review
      </button>
      <p className="mt-2 text-xs text-muted-foreground">Give an email or a phone number, whichever you prefer.</p>
    </form>
  );
}
