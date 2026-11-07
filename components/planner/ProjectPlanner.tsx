"use client";

import { ArrowLeft, Check, Clock, IndianRupee, MessageCircle, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AssistantChat } from "@/components/planner/AssistantChat";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { track } from "@/lib/analytics";
import { briefText, estimate, FEATURES, INDUSTRIES, PROJECT_TYPES, TIMELINES, type ProjectType } from "@/lib/planner";
import { cn } from "@/lib/utils";

const STEPS = ["What do you need?", "What kind of business?", "What must it have?", "When do you need it?"];
const HIDDEN_ON = ["/contact"];

const chip = (on: boolean) =>
  cn(
    "rounded-2xl border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    on ? "border-primary bg-primary/10 font-medium text-foreground" : "hover:border-primary/50 hover:bg-muted",
  );

/**
 * A short guided questionnaire that gives an instant price range and timeline, then hands the brief to WhatsApp or the
 * contact form. With an AI key set, a second tab answers questions from the site's own content.
 */
export function ProjectPlanner({ whatsappHref, assistant }: { whatsappHref: string; assistant: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"estimate" | "ask">("estimate");
  const [step, setStep] = useState(0);
  const [type, setType] = useState<ProjectType | null>(null);
  const [industry, setIndustry] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [timeline, setTimeline] = useState("");

  if (HIDDEN_ON.includes(pathname) || pathname.startsWith("/pdf-tools/") || pathname.startsWith("/tools/")) return null;

  const restart = () => {
    setStep(0);
    setType(null);
    setIndustry("");
    setFeatures([]);
    setTimeline("");
  };
  const done = step === STEPS.length && type;
  const result = done ? estimate(type, features) : null;
  const brief = done ? briefText({ type, industry, features, timeline }) : "";
  const service = result?.service ?? "";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          track("planner_open");
        }}
        className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:right-6 sm:bottom-6"
      >
        <Sparkles className="size-4" aria-hidden="true" /> {assistant ? "Ask or get an estimate" : "Instant estimate"}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
          <SheetHeader className="border-b p-6">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-primary" aria-hidden="true" /> {tab === "ask" ? "Ask Brave Syntax" : "Instant project estimate"}
            </SheetTitle>
            <SheetDescription>{tab === "ask" ? "Quick answers about our services and prices, from an AI model that reads our website." : "Four quick questions. You get a price range and timeline straight away, based on our published prices."}</SheetDescription>
            {assistant && (
              <div role="tablist" aria-label="Choose" className="mt-3 grid grid-cols-2 gap-1 rounded-full border bg-muted/50 p-1">
                {(
                  [
                    ["estimate", "Get an estimate"],
                    ["ask", "Ask a question"],
                  ] as const
                ).map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-full px-3 py-1.5 text-sm", tab === k ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 p-6">
            {tab === "ask" && assistant ? (
              <AssistantChat whatsappHref={whatsappHref} />
            ) : !done ? (
              <>
                <div className="flex items-center gap-2" aria-hidden="true">
                  {STEPS.map((s, i) => (
                    <span key={s} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
                  ))}
                </div>
                <p className="mt-5 text-xs text-muted-foreground">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">{STEPS[step]}</h3>

                {step === 0 && (
                  <div className="mt-5 grid gap-2.5">
                    {PROJECT_TYPES.map(([key, label, hint]) => (
                      <button
                        key={key}
                        type="button"
                        className={chip(type === key)}
                        onClick={() => {
                          setType(key);
                          setStep(1);
                        }}
                      >
                        <span className="block font-medium">{label}</span>
                        <span className="block text-xs text-muted-foreground">{hint}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    {INDUSTRIES.map((i) => (
                      <button
                        key={i}
                        type="button"
                        className={chip(industry === i)}
                        onClick={() => {
                          setIndustry(i);
                          setStep(2);
                        }}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <>
                    <p className="mt-1 text-sm text-muted-foreground">Pick any that apply, or skip.</p>
                    <div className="mt-4 grid gap-2.5">
                      {FEATURES.map((f) => {
                        const on = features.includes(f);
                        return (
                          <button key={f} type="button" aria-pressed={on} className={cn(chip(on), "flex items-center justify-between gap-3")} onClick={() => setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))}>
                            {f}
                            {on && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                    <button type="button" onClick={() => setStep(3)} className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
                      {features.length ? "Continue" : "Skip"}
                    </button>
                  </>
                )}

                {step === 3 && (
                  <div className="mt-5 grid gap-2.5">
                    {TIMELINES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={chip(timeline === t)}
                        onClick={() => {
                          setTimeline(t);
                          setStep(4);
                          track("planner_complete", { project: type ?? "" });
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}

                {step > 0 && (
                  <button type="button" onClick={() => setStep(step - 1)} className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden="true" /> Back
                  </button>
                )}
              </>
            ) : (
              result && (
                <div role="status">
                  <p className="text-sm font-medium text-primary">Your estimate</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">{PROJECT_TYPES.find(([t]) => t === type)?.[1]}</h3>
                  <dl className="mt-5 space-y-3">
                    <div className="flex gap-3 rounded-2xl border bg-card p-4">
                      <IndianRupee className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                      <div>
                        <dt className="text-xs text-muted-foreground">Typical price</dt>
                        <dd className="font-semibold">{result.price}</dd>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-2xl border bg-card p-4">
                      <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                      <div>
                        <dt className="text-xs text-muted-foreground">Typical timeline</dt>
                        <dd className="font-semibold">{result.time}</dd>
                      </div>
                    </div>
                  </dl>
                  {result.upgraded && <p className="mt-4 text-sm font-medium">With these features, this is really a small website rather than a single page, so the estimate reflects that.</p>}
                  <p className="mt-4 text-sm text-muted-foreground">{result.note}</p>
                  {result.upper && <p className="mt-2 text-sm text-muted-foreground">With {result.heavy.join(", ").toLowerCase()}, expect the upper part of this range.</p>}
                  <p className="mt-2 text-xs text-muted-foreground">This is a guide, not a quote. You get a fixed written quote after a short chat about your project.</p>

                  <div className="mt-6 grid gap-2.5">
                    {whatsappHref && (
                      <a
                        href={`${whatsappHref}${whatsappHref.includes("?") ? "&" : "?"}text=${encodeURIComponent(brief)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1FAF5A] px-5 py-3 text-sm font-medium text-white hover:opacity-90"
                      >
                        <MessageCircle className="size-4" aria-hidden="true" /> Send this on WhatsApp
                      </a>
                    )}
                    <Link
                      href={`/contact?service=${encodeURIComponent(service)}&brief=${encodeURIComponent(brief)}`}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-medium hover:bg-muted"
                    >
                      Get a fixed quote
                    </Link>
                    <Link href={`/services/${result.serviceSlug}`} onClick={() => setOpen(false)} className="text-center text-sm text-primary hover:underline">
                      What&apos;s included in {result.service}
                    </Link>
                  </div>
                  <button type="button" onClick={restart} className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <RotateCcw className="size-4" aria-hidden="true" /> Start again
                  </button>
                </div>
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
