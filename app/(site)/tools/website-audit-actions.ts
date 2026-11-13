"use server";

import { createHmac, randomBytes } from "node:crypto";
import { getContactInfo } from "@/lib/contact";
import { rows, sql } from "@/lib/db";
import { generate, geminiEnabled } from "@/lib/gemini";
import { sendMail } from "@/lib/mailer";
import { normaliseUrl, runSiteAudit, type AuditReport } from "@/lib/site-audit";
import { field, getClientIp, isValidEmail, sanitizeEmail, sanitizePhone } from "@/lib/validation";

// The free Website Audit tool. Every audit is saved (website address and report only); the visitor's name and
// contact details are saved only if they ask for a free review and tick the consent box.

const PER_IP_HOUR = 5;
const PER_DAY = 300; // keeps the tool inside the free hosting limits
const CACHE_HOURS = 6;

const ipHash = (ip: string) => createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "bs").update(`audit:${ip}`).digest("hex").slice(0, 40);

/** Plain-English summary of the three most useful fixes (AI, optional). Only the site's checks are sent. */
async function summarise(report: AuditReport): Promise<string | undefined> {
  if (!geminiEnabled()) return undefined;
  const problems = report.checks.filter((c) => c.status !== "pass").map((c) => `${c.label}: ${c.detail}`);
  if (!problems.length) return "This website passes every check in our audit. Keep the content fresh and check your Google Search Console regularly.";
  try {
    return (
      await generate({
        maxTokens: 260,
        timeoutMs: 15_000,
        system: `You are a friendly web consultant at Brave Syntax, a web design studio in India. In 3 short sentences of plain English for a small business owner (no jargon, no markdown, no lists), explain the 2-3 problems below that most affect getting customers, and why. Don't invent facts or numbers. Don't mention prices.`,
        prompt: `Website: ${new URL(report.finalUrl).host}\nOverall score: ${report.score}/100\nProblems found:\n${problems.slice(0, 15).join("\n")}`,
      })
    ).slice(0, 700);
  } catch {
    return undefined;
  }
}

export async function runWebsiteAudit(input: string): Promise<{ token: string; report: AuditReport } | { error: string }> {
  const url = normaliseUrl(input);
  if (!url) return { error: "Enter a website address, like example.com." };
  const ip = await getClientIp();
  const hash = ip ? ipHash(ip) : null;
  const [{ mine, today }] = await rows<{ mine: number; today: number }>(sql`
    SELECT COUNT(*) FILTER (WHERE ip_hash = ${hash} AND created_at > LOCALTIMESTAMP - INTERVAL '1 hour')::int AS mine,
           COUNT(*) FILTER (WHERE created_at > LOCALTIMESTAMP - INTERVAL '1 day')::int AS today
    FROM site_audits WHERE created_at > LOCALTIMESTAMP - INTERVAL '1 day'
  `);
  if (hash && mine >= PER_IP_HOUR) return { error: "You've run several audits in the last hour. Please try again a little later." };
  if (today >= PER_DAY) return { error: "Our audit tool is very busy today. Please try again tomorrow, or contact us for a free manual review." };

  const domain = new URL(url).host.replace(/^www\./, "");
  // The same site checked in the last few hours: reuse that report (saves time and server resources).
  const [recent] = await rows<{ report_json: string }>(sql`
    SELECT report_json FROM site_audits WHERE domain = ${domain} AND created_at > LOCALTIMESTAMP - make_interval(hours => ${CACHE_HOURS}) ORDER BY created_at DESC LIMIT 1
  `);
  let report: AuditReport;
  if (recent) {
    report = JSON.parse(recent.report_json) as AuditReport;
  } else {
    try {
      report = await runSiteAudit(url);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "We couldn't check this website. Please try again." };
    }
    report.summary = await summarise(report);
  }
  const token = randomBytes(18).toString("base64url");
  await sql`
    INSERT INTO site_audits (token, url, domain, score, report_json, ip_hash)
    VALUES (${token}, ${report.finalUrl.slice(0, 600)}, ${domain.slice(0, 255)}, ${report.score}, ${JSON.stringify(report)}, ${hash})
  `;
  return { token, report };
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** "Get a free review": saves the visitor's details on their audit (with consent) and tells the team. */
export async function requestAuditReview(fd: FormData): Promise<{ ok: true } | { error: string }> {
  const token = field(fd, "token");
  const name = field(fd, "name").slice(0, 150);
  const email = sanitizeEmail(field(fd, "email")).slice(0, 150);
  const phone = sanitizePhone(field(fd, "phone")).slice(0, 40);
  const message = field(fd, "message").slice(0, 2000);
  if (fd.get("consent") !== "yes") return { error: "Please tick the box to let us contact you." };
  if (!name) return { error: "Please enter your name." };
  if (!email && !phone) return { error: "Please give an email address or a phone number." };
  if (email && !isValidEmail(email)) return { error: "That email address doesn't look right." };
  if (phone && phone.replace(/\D/g, "").length < 8) return { error: "That phone number looks too short." };

  const [audit] = await rows<{ id: number; domain: string; score: number; consent_contact: boolean }>(sql`
    UPDATE site_audits SET name = ${name}, email = ${email || null}, phone = ${phone || null}, message = ${message || null},
      consent_contact = true, consent_at = LOCALTIMESTAMP
    WHERE token = ${token} AND created_at > LOCALTIMESTAMP - INTERVAL '2 days'
    RETURNING id, domain, score, consent_contact
  `);
  if (!audit) return { error: "This audit has expired. Please run it again." };

  try {
    const contact = await getContactInfo();
    await sendMail({
      to: contact.notifyEmail,
      subject: `Website audit review request: ${audit.domain} (score ${audit.score}/100)`,
      replyTo: email || undefined,
      html: `<p><strong>${escapeHtml(name)}</strong> ran the free website audit on <strong>${escapeHtml(audit.domain)}</strong> (score ${audit.score}/100) and asked for a free review.</p>
<ul><li>Email: ${email ? escapeHtml(email) : "-"}</li><li>Phone: ${phone ? escapeHtml(phone) : "-"}</li></ul>
${message ? `<p>Message:<br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` : ""}
<p>They agreed to be contacted. Full report: Admin → Site Audits.</p>`,
    });
  } catch (err) {
    console.error("[requestAuditReview] mail", err);
  }
  return { ok: true };
}
