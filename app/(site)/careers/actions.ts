"use server";

import { head } from "@vercel/blob";
import { after } from "next/server";
import { getContactInfo } from "@/lib/contact";
import { applicationAdminEmail, applicationAutoReply } from "@/lib/email/templates";
import { sendMail } from "@/lib/mailer";
import { sql } from "@/lib/db";
import { RESUME_CONTENT_TYPES, RESUME_MAX_BYTES, RESUME_PREFIX, resumeBlobToken, resumeUploadsEnabled } from "@/lib/resumes";
import { field, getClientIp, isValidEmail, isValidHttpUrl, sanitizeEmail, sanitizePhone } from "@/lib/validation";

export type ApplyState = {
  ok: boolean;
  errors: string[];
  values: Record<string, string>;
};

const MAX_PER_HOUR = 3;

export async function submitApplication(_prev: ApplyState, fd: FormData): Promise<ApplyState> {
  const values = {
    name: field(fd, "name"),
    email: field(fd, "email"),
    phone: field(fd, "phone"),
    portfolio_url: field(fd, "portfolio_url"),
    linkedin_url: field(fd, "linkedin_url"),
    cover_letter: field(fd, "cover_letter"),
    job_id: field(fd, "job_id"),
  };
  const fail = (errors: string[]): ApplyState => ({ ok: false, errors, values });

  const ip = await getClientIp();

  // Rate limit: at most 3 applications per IP per hour, counted from the applications table itself.
  if (ip) {
    const [{ n }] = (await sql`
      SELECT COUNT(*)::int AS n FROM career_applications
      WHERE ip_address = ${ip} AND created_at > LOCALTIMESTAMP - INTERVAL '1 hour'
    `) as { n: number }[];
    if (n >= MAX_PER_HOUR) return fail(["Too many applications from this IP. Please try again later."]);
  }

  const errors: string[] = [];
  if (values.name.length < 2) errors.push("Full name is required.");
  else if (values.name.length > 150) errors.push("Full name is too long.");
  if (!isValidEmail(values.email)) errors.push("A valid email address is required.");
  if (values.portfolio_url && (!isValidHttpUrl(values.portfolio_url) || values.portfolio_url.length > 500)) errors.push("Portfolio URL is not valid.");
  if (values.linkedin_url && (!isValidHttpUrl(values.linkedin_url) || values.linkedin_url.length > 500)) errors.push("LinkedIn URL is not valid.");
  if (values.cover_letter.length > 10000) errors.push("Cover letter is too long.");
  if (errors.length) return fail(errors);

  // The browser uploaded the resume to Blob storage already; confirm it's really one of ours before linking it.
  let resumeUrl: string | null = null;
  const uploaded = field(fd, "resume_url");
  if (uploaded && resumeUploadsEnabled()) {
    try {
      const blob = await head(uploaded, { token: resumeBlobToken() });
      if (!blob.pathname.startsWith(RESUME_PREFIX) || blob.size > RESUME_MAX_BYTES || !RESUME_CONTENT_TYPES.includes(blob.contentType)) {
        return fail(["Invalid resume format. Only PDF, DOC, DOCX up to 5MB allowed."]);
      }
      resumeUrl = blob.url;
    } catch {
      return fail(["Resume upload error. Please try again."]);
    }
  }

  // Only link the application to a job that is actually open; anything else is a general application.
  let jobId: number | null = Number(values.job_id) || null;
  let role = "General application";
  if (jobId) {
    const rows = (await sql`SELECT id, title FROM career_jobs WHERE id = ${jobId} AND is_active = 1`) as { id: number; title: string }[];
    if (rows.length) role = rows[0].title;
    else jobId = null;
  }

  let appId = 0;
  try {
    [{ id: appId }] = (await sql`
      INSERT INTO career_applications
        (job_id, name, email, phone, portfolio_url, linkedin_url, cover_letter, resume_file, ip_address)
      VALUES (
        ${jobId}, ${values.name}, ${sanitizeEmail(values.email)},
        ${values.phone ? sanitizePhone(values.phone).slice(0, 30) : null},
        ${values.portfolio_url || null}, ${values.linkedin_url || null}, ${values.cover_letter || null},
        ${resumeUrl}, ${ip}
      )
      RETURNING id
    `) as { id: number }[];
  } catch (err) {
    console.error("[submitApplication]", err);
    return fail(["Something went wrong. Please try again."]);
  }

  const email = sanitizeEmail(values.email);
  after(async () => {
    const contact = await getContactInfo();
    const info = {
      id: appId, name: values.name, email, phone: values.phone, role, portfolio: values.portfolio_url,
      linkedin: values.linkedin_url, coverLetter: values.cover_letter, hasResume: !!resumeUrl,
    };
    await sendMail({ to: contact.notifyEmail, ...applicationAdminEmail(contact, info), replyTo: email });
    await sendMail({ to: email, ...applicationAutoReply(contact, { name: values.name, role }), replyTo: contact.email });
  });

  return { ok: true, errors: [], values: {} };
}
