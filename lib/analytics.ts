// Sends events to Google Analytics 4 when it is set up in Admin → Settings; does nothing otherwise.
// Lead events carry only the method and page, never what a visitor typed.

type Gtag = (command: "event", name: string, params?: Record<string, string>) => void;

export function track(name: string, params: Record<string, string> = {}) {
  const gtag = (window as Window & { gtag?: Gtag }).gtag;
  gtag?.("event", name, { page_path: location.pathname, ...params });
}

/** How a link reaches us, or null when it isn't a way of contacting us. */
export function contactMethod(href: string): string | null {
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) return "whatsapp";
  if (href.startsWith("tel:")) return "phone";
  if (href.startsWith("mailto:")) return "email";
  return null;
}
