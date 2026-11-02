import "server-only";
import { SITE_URL } from "@/lib/config";
import type { ContactInfo } from "@/lib/contact";

// Shared HTML email layout. Email clients (Gmail, Outlook, Apple Mail) ignore flexbox, <style> blocks and
// web fonts unevenly, so everything is nested tables with inline styles and a system font stack.

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
export const nl2br = (s: string) => esc(s).replace(/\r?\n/g, "<br>");

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace";
export const BRAND = { accent: "#10b981", accentDark: "#047857", ink: "#0f172a", text: "#334155", muted: "#64748b", line: "#e2e8f0", soft: "#f8fafc" };

/** Primary (filled) or secondary (outlined) button. */
export function button(label: string, href: string, kind: "primary" | "secondary" = "primary") {
  const style =
    kind === "primary"
      ? `background:${BRAND.accent};color:#ffffff;border:1px solid ${BRAND.accent};`
      : `background:#ffffff;color:${BRAND.ink};border:1px solid ${BRAND.line};`;
  return `<a href="${esc(href)}" style="${style}display:inline-block;font-family:${FONT};font-size:14px;font-weight:600;line-height:20px;padding:11px 22px;border-radius:8px;text-decoration:none;mso-padding-alt:0;">${esc(label)}</a>`;
}

export function buttons(list: [label: string, href: string, kind?: "primary" | "secondary"][]) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;"><tr>${list
    .map(([l, h, k], i) => `<td style="padding:${i ? "0 0 0 10px" : "0"};">${button(l, h, k ?? (i ? "secondary" : "primary"))}</td>`)
    .join("")}</tr></table>`;
}

/** Label / value rows (values are already-escaped HTML). */
export function detailsTable(rows: [label: string, valueHtml: string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.line};border-radius:10px;border-collapse:separate;margin:4px 0 20px;">${rows
    .map(
      ([label, value], i) =>
        `<tr><td style="padding:11px 16px;${i ? `border-top:1px solid ${BRAND.line};` : ""}width:120px;font-family:${FONT};font-size:13px;color:${BRAND.muted};vertical-align:top;">${esc(label)}</td><td style="padding:11px 16px;${i ? `border-top:1px solid ${BRAND.line};` : ""}font-family:${FONT};font-size:14px;color:${BRAND.ink};vertical-align:top;">${value}</td></tr>`,
    )
    .join("")}</table>`;
}

/** Quoted block for a visitor's message. */
export function quote(label: string, text: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;"><tr><td style="background:${BRAND.soft};border-left:3px solid ${BRAND.accent};border-radius:6px;padding:16px 18px;">
<p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${BRAND.muted};">${esc(label)}</p>
<p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.7;color:${BRAND.text};">${nl2br(text)}</p></td></tr></table>`;
}

export const paragraph = (html: string) => `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BRAND.text};">${html}</p>`;
export const small = (html: string) => `<p style="margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${BRAND.muted};">${html}</p>`;
export const link = (label: string, href: string) => `<a href="${esc(href)}" style="color:${BRAND.accentDark};text-decoration:underline;">${esc(label)}</a>`;

/** Large one-time code, letter-spaced and easy to copy. */
export function codeBlock(code: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 20px;"><tr><td style="background:${BRAND.soft};border:1px dashed #cbd5e1;border-radius:12px;padding:18px 28px;font-family:${MONO};font-size:32px;font-weight:700;letter-spacing:10px;color:${BRAND.ink};text-align:center;">${esc(code)}</td></tr></table>`;
}

type LayoutOptions = {
  contact: ContactInfo;
  /** Hidden inbox preview text. */
  preheader: string;
  eyebrow?: string;
  title: string;
  body: string;
  /** Small print under the card (why the email was sent). */
  note?: string;
};

export function renderEmail({ contact, preheader, eyebrow, title, body, note }: LayoutOptions) {
  const socials = contact.socials
    .map((s) => `<a href="${esc(s.url)}" style="color:${BRAND.muted};text-decoration:none;font-family:${FONT};font-size:12px;margin:0 8px;">${esc(s.name)}</a>`)
    .join("");
  const contactLine = [
    `<a href="mailto:${esc(contact.email)}" style="color:${BRAND.muted};text-decoration:none;">${esc(contact.email)}</a>`,
    contact.phone ? `<a href="${esc(contact.phoneHref)}" style="color:${BRAND.muted};text-decoration:none;">${esc(contact.phone)}</a>` : "",
    contact.address ? esc(contact.address) : "",
  ]
    .filter(Boolean)
    .join(" &nbsp;·&nbsp; ");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <tr><td style="background:${BRAND.ink};border-radius:14px 14px 0 0;padding:22px 32px;">
    <a href="${SITE_URL}" style="text-decoration:none;"><img src="${SITE_URL}/brand/logo-on-dark.png" width="170" height="25" alt="Brave Syntax" style="display:block;border:0;outline:none;width:170px;height:auto;"></a>
  </td></tr>
  <tr><td style="background:#ffffff;padding:36px 32px 28px;border-left:1px solid ${BRAND.line};border-right:1px solid ${BRAND.line};">
    ${eyebrow ? `<p style="margin:0 0 10px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${BRAND.accentDark};">${esc(eyebrow)}</p>` : ""}
    <h1 style="margin:0 0 20px;font-family:${FONT};font-size:24px;line-height:1.3;font-weight:700;color:${BRAND.ink};">${esc(title)}</h1>
    ${body}
  </td></tr>
  <tr><td style="background:${BRAND.soft};border:1px solid ${BRAND.line};border-radius:0 0 14px 14px;padding:22px 32px;text-align:center;">
    <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;font-weight:600;color:${BRAND.ink};">${esc(contact.siteName)} <span style="font-weight:400;color:${BRAND.muted};">· ${esc(contact.tagline)}</span></p>
    <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.7;color:${BRAND.muted};">${contactLine}</p>
    ${socials ? `<p style="margin:10px 0 0;">${socials}</p>` : ""}
  </td></tr>
  ${note ? `<tr><td style="padding:18px 24px 0;text-align:center;font-family:${FONT};font-size:11px;line-height:1.6;color:#94a3b8;">${note}</td></tr>` : ""}
</table>
</td></tr></table>
</body></html>`;
}
