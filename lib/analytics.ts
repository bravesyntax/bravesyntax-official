// Lead tracking: events go to Google Analytics 4 when it is set up in Admin → Settings, and to Admin → Leads.
// Lead events carry only the method, page and visit source, never what a visitor typed.

type Gtag = (command: "event", name: string, params?: Record<string, string>) => void;

export const LEAD_METHODS = ["contact_form", "whatsapp", "phone", "email", "audit_review"] as const;
export type LeadMethod = (typeof LEAD_METHODS)[number];

const SOURCE_KEY = "bs_source";
const SEEN_KEY = "bs_leads_seen";
const REPEAT_WINDOW_MS = 30 * 60 * 1000;

/** Sites whose referrals are worth naming; anything else is grouped as "other". */
const REFERRERS: [RegExp, string][] = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)(instagram\.com|l\.instagram\.com)$/, "instagram"],
  [/(^|\.)(facebook\.com|fb\.com|m\.facebook\.com|l\.facebook\.com)$/, "facebook"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|gemini\.google\.com)$/, "ai-search"],
];

const store = {
  get: (k: string) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* private mode: the source and repeat check just aren't remembered */
    }
  },
};

/**
 * Where this visit came from: ?utm_source=, else the referring site, else "direct". A new campaign link or outside
 * referral replaces it; moving around the site keeps it for the rest of the visit.
 */
export function rememberSource() {
  const utm = new URLSearchParams(location.search).get("utm_source")?.toLowerCase().replace(/[^a-z0-9.\-_]/g, "").slice(0, 60);
  let source = utm || "";
  if (!source && document.referrer) {
    try {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host !== location.hostname.replace(/^www\./, "")) source = REFERRERS.find(([re]) => re.test(host))?.[1] ?? "other";
    } catch {
      /* unreadable referrer: treated as direct */
    }
  }
  if (source) store.set(SOURCE_KEY, source);
  else if (!store.get(SOURCE_KEY)) store.set(SOURCE_KEY, "direct");
}

export function track(name: string, params: Record<string, string> = {}) {
  const gtag = (window as Window & { gtag?: Gtag }).gtag;
  gtag?.("event", name, { page_path: location.pathname, ...params });
}

/** Records a lead in Google Analytics and Admin → Leads. The same lead on the same page counts once per 30 minutes. */
export function trackLead(method: LeadMethod) {
  track(method === "contact_form" || method === "audit_review" ? "generate_lead" : "contact_click", { method });
  const key = `${method}:${location.pathname}`;
  let seen: Record<string, number> = {};
  try {
    seen = JSON.parse(store.get(SEEN_KEY) ?? "{}");
  } catch {
    /* start fresh */
  }
  if (Date.now() - (seen[key] ?? 0) < REPEAT_WINDOW_MS) return;
  seen[key] = Date.now();
  store.set(SEEN_KEY, JSON.stringify(seen));
  const body = JSON.stringify({ method, page: location.pathname.slice(0, 300), source: store.get(SOURCE_KEY) ?? "direct" });
  if (!navigator.sendBeacon?.("/api/lead-event", new Blob([body], { type: "application/json" }))) {
    fetch("/api/lead-event", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }
}

/** How a link reaches us, or null when it isn't a way of contacting us. */
export function contactMethod(href: string): LeadMethod | null {
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) return "whatsapp";
  if (href.startsWith("tel:")) return "phone";
  if (href.startsWith("mailto:")) return "email";
  return null;
}
