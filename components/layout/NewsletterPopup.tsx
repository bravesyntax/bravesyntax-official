"use client";

import { Mail, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { subscribeNewsletter, type NewsletterState } from "@/app/(site)/newsletter/actions";
import { track } from "@/lib/analytics";
import { NEWSLETTER_CONSENT } from "@/lib/newsletter";

// A small corner card, not a full-screen popup: it appears 5 seconds after the visitor has made their cookie choice,
// once per two weeks if closed, never again after subscribing, and never on the contact page or inside the tools.

const DELAY_MS = 5000;
const SNOOZE_DAYS = 14;
const KEY = "bs_newsletter";
const initial: NewsletterState = { status: "idle", message: "" };

function snoozed() {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "subscribed") return true;
    return !!v && Date.now() - Number(v) < SNOOZE_DAYS * 864e5;
  } catch {
    return true; // can't remember a dismissal, so don't nag
  }
}
const remember = (v: string) => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* ignore */
  }
};

export function NewsletterPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(subscribeNewsletter, initial);
  const hidden = pathname === "/contact" || pathname.startsWith("/tools/") || pathname.startsWith("/pdf-tools/") || pathname.startsWith("/newsletter");

  useEffect(() => {
    if (hidden || snoozed()) return;
    let timer = 0;
    const start = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setOpen(true), DELAY_MS);
    };
    let decided = false;
    try {
      decided = !!localStorage.getItem("bs_cookie_consent");
    } catch {
      decided = true;
    }
    if (decided) start();
    window.addEventListener("bs:cookie-choice", start);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("bs:cookie-choice", start);
    };
  }, [hidden]);

  useEffect(() => {
    if (state.status === "ok") {
      remember("subscribed");
      track("sign_up", { method: "newsletter" });
    }
  }, [state.status]);

  if (!open || hidden) return null;
  const close = () => {
    if (state.status !== "ok") remember(String(Date.now()));
    setOpen(false);
  };

  return (
    <div role="dialog" aria-label="Newsletter" className="fixed inset-x-3 bottom-20 z-50 rounded-3xl border bg-background p-6 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[24rem]">
      <button type="button" onClick={close} aria-label="Close" className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
        <X className="size-4" aria-hidden="true" />
      </button>
      {state.status === "ok" ? (
        <div role="status" className="pr-6">
          <p className="text-lg font-semibold tracking-tight">You&apos;re in! 🎉</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{state.message}</p>
        </div>
      ) : (
        <>
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 pr-6 text-lg font-semibold tracking-tight">Is your website losing enquiries?</p>
          <p className="mt-1.5 text-sm text-muted-foreground">Get one practical tip a month to turn more visitors into customers, plus first access to our new free tools.</p>
          <form action={action} className="mt-4 space-y-3">
            <input type="hidden" name="source" value={pathname} />
            <input type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <label className="sr-only" htmlFor="nl-email">
              Email address
            </label>
            <input id="nl-email" type="email" name="email" required maxLength={150} placeholder="you@business.com" className="h-11 w-full rounded-full border bg-background px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" />
            <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <input type="checkbox" name="consent" value="yes" required className="mt-0.5 size-4 shrink-0 accent-primary" />
              <span>
                {NEWSLETTER_CONSENT}{" "}
                <Link href="/privacy-policy" target="_blank" className="text-primary underline underline-offset-2">
                  Privacy policy
                </Link>
              </span>
            </label>
            {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
            <button type="submit" disabled={pending} className="h-11 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">
              {pending ? "Subscribing…" : "Send me the tips"}
            </button>
          </form>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">One email a month. No spam. Unsubscribe anytime.</p>
        </>
      )}
    </div>
  );
}
