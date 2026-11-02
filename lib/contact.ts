import "server-only";
import { cache } from "react";
import { ADMIN_EMAIL, SITE_NAME } from "./config";
import { getSiteSettings } from "./settings";

// Business contact details, all editable in Admin → Settings. Pages, schema and emails read them from here
// instead of hard-coding addresses, so one change in the admin updates the whole site.

export type ContactInfo = {
  siteName: string;
  tagline: string;
  email: string;
  /** Inbox that receives enquiry and application notifications. */
  notifyEmail: string;
  phone: string;
  /** tel: href, or "" when no phone is set. */
  phoneHref: string;
  whatsapp: string;
  /** https://wa.me/… link, or "" when no WhatsApp number is set. */
  whatsappHref: string;
  address: string;
  hours: string;
  responseTime: string;
  /** Calendly/Cal.com link for discovery calls, or "". */
  bookingUrl: string;
  /** Upwork/freelance profile, or "". */
  upworkUrl: string;
  socials: { name: "LinkedIn" | "Instagram" | "GitHub" | "Facebook" | "X"; url: string }[];
};

const digits = (s: string) => s.replace(/[^\d+]/g, "");

export const getContactInfo = cache(async (): Promise<ContactInfo> => {
  const s = await getSiteSettings();
  const email = s.contact_email || ADMIN_EMAIL;
  const phone = s.contact_phone || "";
  const whatsapp = s.contact_whatsapp || phone;
  const wa = digits(whatsapp).replace(/^\+/, "");
  const socials = (
    [
      ["LinkedIn", s.social_linkedin],
      ["Instagram", s.social_instagram],
      ["GitHub", s.social_github],
      ["Facebook", s.social_facebook],
      ["X", s.social_twitter],
    ] as const
  )
    .filter(([, url]) => url && /^https?:\/\//i.test(url))
    .map(([name, url]) => ({ name, url: url! }));

  return {
    siteName: s.site_name || SITE_NAME,
    tagline: s.site_tagline || "Design & Development Services",
    email,
    notifyEmail: s.notification_email || email,
    phone,
    phoneHref: phone ? `tel:${digits(phone)}` : "",
    whatsapp,
    whatsappHref: wa.length >= 8 ? `https://wa.me/${wa}` : "",
    address: s.contact_address || "",
    hours: s.business_hours || "Mon–Sat, 9am–8pm IST",
    responseTime: s.response_time || "within 2 hours",
    bookingUrl: /^https?:\/\//i.test(s.booking_url ?? "") ? s.booking_url : "",
    upworkUrl: /^https?:\/\//i.test(s.upwork_url ?? "") ? s.upwork_url : "",
    socials,
  };
});
