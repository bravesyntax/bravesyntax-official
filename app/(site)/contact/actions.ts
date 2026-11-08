"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { getContactInfo } from "@/lib/contact";
import { sql } from "@/lib/db";
import { enquiryAdminEmail, enquiryAutoReply } from "@/lib/email/templates";
import { sendMail } from "@/lib/mailer";
import { looksLikeSpam, verifyTurnstile } from "@/lib/spam";
import { field, getClientIp, isValidEmail, sanitizeEmail, sanitizePhone } from "@/lib/validation";

export type ContactState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors: string[];
  values: Record<string, string>;
};

const RATE_MAX = 3;
const MESSAGE_MAX = 2000;
// Bots get the same success message, so they don't learn they were filtered.
const BOT_SUCCESS: ContactState = { status: "ok", message: "Thanks! We'll reply within 2 hours.", errors: [], values: {} };

export async function submitContact(_prev: ContactState, fd: FormData): Promise<ContactState> {
  const values = {
    name: field(fd, "name"),
    email: field(fd, "email"),
    phone: field(fd, "phone"),
    service: field(fd, "service"),
    budget: field(fd, "budget"),
    message: field(fd, "message"),
  };
  const fail = (errors: string[]): ContactState => ({ status: "error", errors, values });

  // Honeypot: a hidden field humans never fill in.
  if (field(fd, "website_url")) return BOT_SUCCESS;

  // Time trap: under 3 seconds is a bot; over an hour is a stale or replayed form.
  const age = Date.now() - Number(field(fd, "form_ts"));
  if (!Number.isFinite(age) || age < 3_000 || age > 3_600_000) return BOT_SUCCESS;

  const ip = await getClientIp();
  const errors: string[] = [];

  // Rate limit: 3 messages per IP per 10 minutes, counted from saved messages.
  if (ip) {
    const [{ n }] = (await sql`
      SELECT COUNT(*)::int AS n FROM contact_messages
      WHERE ip_address = ${ip} AND created_at > LOCALTIMESTAMP - INTERVAL '10 minutes'
    `) as { n: number }[];
    if (n >= RATE_MAX) errors.push("You have sent too many messages recently. Please wait 10 minutes before trying again.");
  }

  if (!(await verifyTurnstile(field(fd, "cf-turnstile-response"), ip))) {
    errors.push('Please complete the "I am human" check, then send again.');
  }

  if (field(fd, "consent") !== "yes") errors.push("Please tick the box to agree to our privacy policy, so we can reply to you.");
  if (values.name.length < 2) errors.push("Full name is required (at least 2 characters).");
  else if (values.name.length > 100) errors.push("Full name is too long.");
  if (!isValidEmail(values.email) || values.email.length > 150) errors.push("A valid email address is required.");
  if (values.message.length < 10) errors.push("Project details are required (at least 10 characters).");
  else if (values.message.length > MESSAGE_MAX) errors.push(`Project details are too long (max ${MESSAGE_MAX} characters).`);

  if (looksLikeSpam(values.name, values.message)) return BOT_SUCCESS;
  if (errors.length) return fail(errors);

  const email = sanitizeEmail(values.email);
  const phone = sanitizePhone(values.phone).slice(0, 30);
  const serviceField = values.service.slice(0, 100);
  const budget = values.budget.slice(0, 40) || null;
  const userAgent = ((await headers()).get("user-agent") ?? "").slice(0, 500);

  try {
    await sql`
      INSERT INTO contact_messages (name, email, phone, service, budget, message, ip_address, user_agent, consent_at)
      VALUES (${values.name}, ${email}, ${phone}, ${serviceField}, ${budget}, ${values.message}, ${ip}, ${userAgent}, LOCALTIMESTAMP)
    `;
  } catch (err) {
    console.error("[submitContact]", err);
    return fail([`Something went wrong saving your message. Please email us directly at ${(await getContactInfo()).email}`]);
  }

  // Notification + auto-reply are sent after the response, so the visitor isn't kept waiting on SMTP.
  after(async () => {
    const info = { ...values, email, phone, ip };
    const contact = await getContactInfo();
    await sendMail({ to: contact.notifyEmail, ...enquiryAdminEmail(contact, info), replyTo: email });
    await sendMail({ to: email, ...enquiryAutoReply(contact, info), replyTo: contact.email });
  });

  return {
    status: "ok",
    message: `Thanks, ${values.name}! Message sent. Check your inbox — we've sent a confirmation. We'll reply within 2 hours.`,
    errors: [],
    values: {},
  };
}

