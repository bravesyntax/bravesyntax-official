import "server-only";
import { SITE_URL } from "@/lib/config";
import type { ContactInfo } from "@/lib/contact";
import { buttons, codeBlock, detailsTable, esc, link, paragraph, quote, renderEmail, small } from "./layout";

// Every email the site sends. Each returns { subject, html } so callers only pick a recipient.

type Email = { subject: string; html: string };
const istNow = () => new Date().toLocaleString("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST";
const mailto = (e: string) => link(e, `mailto:${e}`);

// ── Admin sign-in ─────────────────────────────────────────────

export function loginOtpEmail(c: ContactInfo, d: { name: string; code: string; minutes: number; ip: string | null }): Email {
  return {
    subject: `${d.code} is your ${c.siteName} admin sign-in code`,
    html: renderEmail({
      contact: c,
      preheader: `Your sign-in code is ${d.code}. It expires in ${d.minutes} minutes.`,
      eyebrow: "Admin sign-in",
      title: "Your verification code",
      body:
        paragraph(`Hi ${esc(d.name)}, use this code to finish signing in to the admin panel. It expires in <strong>${d.minutes} minutes</strong> and can be used once.`) +
        codeBlock(d.code) +
        detailsTable([
          ["Requested", esc(istNow())],
          ["IP address", esc(d.ip ?? "Unknown")],
        ]) +
        paragraph(`<strong>Didn't try to sign in?</strong> Someone has your password. Change it in Admin → Settings right away; this code is useless without access to this inbox.`),
      note: "Never share this code. Brave Syntax will never ask you for it.",
    }),
  };
}

export function passwordChangedEmail(c: ContactInfo, d: { name: string; ip: string | null }): Email {
  return {
    subject: `Your ${c.siteName} admin password was changed`,
    html: renderEmail({
      contact: c,
      preheader: "The admin password was just changed.",
      eyebrow: "Security alert",
      title: "Admin password changed",
      body:
        paragraph(`Hi ${esc(d.name)}, the password for the admin account was changed. All other signed-in sessions have been signed out.`) +
        detailsTable([
          ["When", esc(istNow())],
          ["IP address", esc(d.ip ?? "Unknown")],
        ]) +
        paragraph("If this wasn't you, reset the password immediately and review recent admin activity."),
      note: "You receive this email because you are an administrator of this website.",
    }),
  };
}

// ── Contact form ──────────────────────────────────────────────

type Enquiry = { name: string; email: string; phone: string; service: string; budget: string; message: string; ip: string | null };

export function enquiryAdminEmail(c: ContactInfo, d: Enquiry): Email {
  return {
    subject: `New enquiry: ${d.name}${d.service ? ` — ${d.service}` : ""}`,
    html: renderEmail({
      contact: c,
      preheader: `${d.name} sent a new enquiry${d.service ? ` about ${d.service}` : ""}.`,
      eyebrow: "New enquiry",
      title: `${d.name} wants to talk`,
      body:
        detailsTable([
          ["Name", esc(d.name)],
          ["Email", mailto(d.email)],
          ["Phone", d.phone ? link(d.phone, `tel:${d.phone.replace(/[^\d+]/g, "")}`) : "Not provided"],
          ["Service", esc(d.service || "Not specified")],
          ["Budget", esc(d.budget || "Not specified")],
        ]) +
        quote("Message", d.message) +
        buttons([
          ["Reply by email", `mailto:${d.email}`],
          ["Open in admin", `${SITE_URL}/admin/messages`],
        ]) +
        small(`Received ${esc(istNow())} · IP ${esc(d.ip ?? "unknown")}`),
    }),
  };
}

export function enquiryAutoReply(c: ContactInfo, d: Enquiry): Email {
  const preview = d.message.length > 500 ? `${d.message.slice(0, 500)}…` : d.message;
  return {
    subject: `We've received your message — ${c.siteName}`,
    html: renderEmail({
      contact: c,
      preheader: `Thanks ${d.name}, we'll reply ${c.responseTime}.`,
      eyebrow: "Message received",
      title: `Thanks, ${d.name}. We're on it.`,
      body:
        paragraph(`Your message reached our team. We'll get back to you <strong>${esc(c.responseTime)}</strong> (${esc(c.hours)}).`) +
        quote("Your message", preview) +
        paragraph("While you wait, see what we've built for other businesses:") +
        buttons([
          ["View our work", `${SITE_URL}/portfolio`],
          ["Explore services", `${SITE_URL}/services`],
        ]) +
        (c.whatsappHref ? small(`Need something urgently? ${link("Message us on WhatsApp", c.whatsappHref)}.`) : ""),
      note: `You're receiving this because you contacted ${esc(c.siteName)} through our website.`,
    }),
  };
}

export function enquiryReplyEmail(c: ContactInfo, d: { name: string; text: string }): Email {
  return {
    subject: "",
    html: renderEmail({
      contact: c,
      preheader: d.text.slice(0, 120),
      eyebrow: "Reply to your enquiry",
      title: `Hi ${d.name},`,
      body: paragraph(esc(d.text).replace(/\r?\n/g, "<br>")) + small(`Simply reply to this email to continue the conversation.`),
      note: `This is a reply to your enquiry with ${esc(c.siteName)}.`,
    }),
  };
}

// ── Careers ───────────────────────────────────────────────────

type Application = { id: number; name: string; email: string; phone: string; role: string; portfolio: string; linkedin: string; coverLetter: string; hasResume: boolean };

export function applicationAdminEmail(c: ContactInfo, d: Application): Email {
  return {
    subject: `New application: ${d.name} — ${d.role}`,
    html: renderEmail({
      contact: c,
      preheader: `${d.name} applied for ${d.role}.`,
      eyebrow: "New job application",
      title: `${d.name} applied for ${d.role}`,
      body:
        detailsTable([
          ["Email", mailto(d.email)],
          ["Phone", esc(d.phone || "Not provided")],
          ["Portfolio", d.portfolio ? link(d.portfolio, d.portfolio) : "—"],
          ["LinkedIn", d.linkedin ? link(d.linkedin, d.linkedin) : "—"],
          ["Resume", d.hasResume ? "Attached in admin" : "Not uploaded"],
        ]) +
        (d.coverLetter ? quote("Cover letter", d.coverLetter.length > 800 ? `${d.coverLetter.slice(0, 800)}…` : d.coverLetter) : "") +
        buttons([["Review application", `${SITE_URL}/admin/careers?tab=applications&view=${d.id}`]]),
    }),
  };
}

export function applicationAutoReply(c: ContactInfo, d: { name: string; role: string }): Email {
  return {
    subject: `Application received — ${d.role} at ${c.siteName}`,
    html: renderEmail({
      contact: c,
      preheader: `Thanks for applying for ${d.role}.`,
      eyebrow: "Application received",
      title: `Thanks for applying, ${d.name}`,
      body:
        paragraph(`We've received your application for <strong>${esc(d.role)}</strong>. Our team reviews every application personally, usually within 5 working days.`) +
        paragraph("If your profile matches what we're looking for, we'll reach out to schedule a conversation.") +
        buttons([["See our work", `${SITE_URL}/portfolio`]]),
      note: `You're receiving this because you applied for a role at ${esc(c.siteName)}.`,
    }),
  };
}
