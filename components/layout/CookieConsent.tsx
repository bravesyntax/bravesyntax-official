"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

// Google Analytics loads only after the visitor accepts. The choice is remembered in this browser and can be changed
// any time from "Cookie settings" in the footer.

const KEY = "bs_cookie_consent";
export const OPEN_COOKIE_SETTINGS = "bs:cookie-settings";
type Choice = "granted" | "denied" | null;

function read(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function CookieConsent({ gaId }: { gaId: string }) {
  const [choice, setChoice] = useState<Choice>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = read();
    setChoice(saved);
    setOpen(saved === null);
    setReady(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
  }, []);

  const decide = (c: Exclude<Choice, null>) => {
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* private mode: the choice lasts for this page only */
    }
    if (c === "denied" && choice === "granted") location.reload(); // stop analytics that already loaded
    setChoice(c);
    setOpen(false);
    window.dispatchEvent(new Event("bs:cookie-choice"));
  };

  return (
    <>
      {gaId && choice === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`}
          </Script>
        </>
      )}
      {ready && open && (
        <div role="region" aria-label="Cookie choice" className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border bg-background p-5 shadow-2xl sm:inset-x-auto sm:left-6 sm:bottom-6 sm:max-w-sm">
          <p className="font-medium">Cookies, with your permission</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We&apos;d like to use Google Analytics cookies to see which pages help visitors. Nothing is shared for ads. Essential site features work either way.{" "}
            <Link href="/privacy-policy" className="text-primary underline underline-offset-2">
              Privacy policy
            </Link>
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => decide("granted")} className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
              Accept
            </button>
            <button type="button" onClick={() => decide("denied")} className="flex-1 rounded-full border px-4 py-2.5 text-sm font-medium hover:bg-muted">
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Footer link that reopens the cookie choice. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}>
      Cookie settings
    </button>
  );
}
