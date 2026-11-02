"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { finish, idsField, intField } from "@/lib/admin/common";
import { rows, sql } from "@/lib/db";
import { decodeEntities } from "@/lib/html";
import { getContactInfo } from "@/lib/contact";
import { enquiryReplyEmail } from "@/lib/email/templates";
import { sendMail } from "@/lib/mailer";

const PAGE = "/admin/messages";

const STAGES = ["new", "contacted", "proposal", "won", "lost"];

export async function setMessageStatus(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const status = String(fd.get("status") ?? "");
  if (!STAGES.includes(status)) await finish("error", "Unknown status.", `${PAGE}?view=${id}`);
  await sql`UPDATE contact_messages SET status = ${status} WHERE id = ${id}`;
  await finish("success", "Status updated.", `${PAGE}?view=${id}`);
}

export async function deleteMessage(fd: FormData) {
  await requireAdmin();
  await sql`DELETE FROM contact_messages WHERE id = ${intField(fd, "id")}`;
  await finish("success", "Message deleted successfully.", PAGE);
}

export async function bulkDeleteMessages(fd: FormData) {
  await requireAdmin();
  const ids = idsField(fd);
  if (ids.length) await sql`DELETE FROM contact_messages WHERE id = ANY(${ids})`;
  await finish("success", `${ids.length} messages deleted.`, PAGE);
}

export async function replyToMessage(fd: FormData) {
  await requireAdmin();
  const id = intField(fd, "id");
  const back = `${PAGE}?view=${id}`;
  const text = String(fd.get("reply_message") ?? "").trim();
  const subject = String(fd.get("reply_subject") ?? "").trim() || "Re: Your enquiry — Brave Syntax";
  if (!text) await finish("error", "Reply message cannot be empty.", back);

  const [msg] = await rows<{ name: string; email: string }>(sql`SELECT name, email FROM contact_messages WHERE id = ${id}`);
  if (!msg) await finish("error", "Message not found.", PAGE);

  const contact = await getContactInfo();
  const { html } = enquiryReplyEmail(contact, { name: decodeEntities(msg.name), text });
  const sent = await sendMail({ to: msg.email, subject, html, replyTo: contact.email });
  if (!sent) await finish("error", "Failed to send email. Check your SMTP/mail configuration.", back);

  await sql`UPDATE contact_messages SET is_replied = 1, is_read = 1, status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END WHERE id = ${id}`;
  await finish("success", `Reply sent successfully to ${msg.email}.`, back);
}

