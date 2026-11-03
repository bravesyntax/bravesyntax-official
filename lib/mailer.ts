import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

// SMTP mailer (send_mail() in includes/functions.php). Defaults match the Gmail account; SMTP_PASS must be a Google App Password, and
// is the only secret. Without it, mail is skipped and logged so forms still work.
const SMTP_HOST = process.env.SMTP_HOST ?? "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 465);
const SMTP_USER = process.env.SMTP_USER ?? "bravesyntax@gmail.com";
const SMTP_FROM = process.env.SMTP_FROM ?? SMTP_USER;
const SMTP_FROM_NAME = "Brave Syntax";

let transporter: Transporter | null = null;

export const mailConfigured = () => !!process.env.SMTP_PASS;

function getTransporter() {
  if (!process.env.SMTP_PASS) return null;
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // 465 = implicit TLS, 587 = STARTTLS
    auth: { user: SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15_000,
  });
  return transporter;
}

const htmlToText = (html: string) =>
  html
    .replace(/<(br|\/p|\/div|\/h[1-6]|\/tr)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** Sends an HTML email. Returns false (and logs) instead of throwing. */
export async function sendMail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }) {
  const t = getTransporter();
  if (!t) {
    console.warn(`[sendMail] SMTP_PASS not set; skipped "${subject}" to ${to}`);
    return false;
  }
  try {
    await t.sendMail({
      from: { name: SMTP_FROM_NAME, address: SMTP_FROM },
      to,
      replyTo,
      subject,
      html,
      text: htmlToText(html),
    });
    return true;
  } catch (err) {
    console.error("[sendMail]", err);
    return false;
  }
}

