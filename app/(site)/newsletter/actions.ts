"use server";

import { randomBytes } from "node:crypto";
import { getContactInfo } from "@/lib/contact";
import { SITE_URL } from "@/lib/config";
import { sql } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { NEWSLETTER_CONSENT } from "@/lib/newsletter";
import { getClientIp, isValidEmail, sanitizeEmail } from "@/lib/validation";

export type NewsletterState = { status: "idle" | "ok" | "error"; message: string };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Adds a subscriber after explicit consent, and sends a welcome email with a one-click unsubscribe link. */
export async function subscribeNewsletter(_prev: NewsletterState, fd: FormData): Promise<NewsletterState> {
  if (String(fd.get("website_url") ?? "")) return { status: "ok", message: "Thanks! You're subscribed." }; // bot trap
  const email = sanitizeEmail(String(fd.get("email") ?? "").trim());
  const source = String(fd.get("source") ?? "/").slice(0, 300);
  if (!isValidEmail(email) || email.length > 150) return { status: "error", message: "Please enter a valid email address." };
  if (fd.get("consent") !== "yes") return { status: "error", message: "Please tick the box to agree to receive our emails." };

  const ip = await getClientIp();
  if (ip) {
    const [{ n }] = (await sql`SELECT COUNT(*)::int AS n FROM newsletter_subscribers WHERE ip_address = ${ip} AND created_at > LOCALTIMESTAMP - INTERVAL '10 minutes'`) as { n: number }[];
    if (n >= 3) return { status: "error", message: "Too many sign-ups from your network. Please try again later." };
  }

  const token = randomBytes(24).toString("hex");
  let fresh = true;
  try {
    const rows = (await sql`
      INSERT INTO newsletter_subscribers (email, source, consent_text, unsubscribe_token, ip_address)
      VALUES (${email}, ${source}, ${NEWSLETTER_CONSENT}, ${token}, ${ip})
      ON CONFLICT (email) DO UPDATE SET unsubscribed_at = NULL, consent_at = LOCALTIMESTAMP, consent_text = EXCLUDED.consent_text,
        source = EXCLUDED.source
      RETURNING unsubscribe_token, (xmax = 0) AS inserted
    `) as { unsubscribe_token: string; inserted: boolean }[];
    fresh = rows[0].inserted;
    const link = `${SITE_URL}/newsletter/unsubscribe?token=${rows[0].unsubscribe_token}`;
    if (fresh) {
      const contact = await getContactInfo();
      await sendMail({
        to: email,
        subject: "You're subscribed to Brave Syntax tips",
        replyTo: contact.email,
        html: `<p>Thanks for subscribing!</p><p>About once a month we'll send one practical tip to help your website bring in more enquiries, plus news about our free tools.</p><p>Didn't mean to sign up? <a href="${esc(link)}">Unsubscribe with one click</a>.</p><p>— ${esc(contact.siteName)}</p>`,
      });
    }
  } catch (err) {
    console.error("[subscribeNewsletter]", err);
    return { status: "error", message: "Something went wrong. Please try again in a moment." };
  }
  return { status: "ok", message: fresh ? "You're in! Check your inbox for a welcome email." : "You're already on the list. Thanks!" };
}
