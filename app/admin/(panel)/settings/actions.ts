"use server";

import bcrypt from "bcryptjs";
import { updateTag } from "next/cache";
import { after } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/admin/auth";
import { finish, refreshPublicSite } from "@/lib/admin/common";
import { passwordFingerprint, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/admin/session";
import { getContactInfo } from "@/lib/contact";
import { rows, sql } from "@/lib/db";
import { connectInstagram, disconnectInstagram, INSTAGRAM_TAG } from "@/lib/instagram";
import { passwordChangedEmail } from "@/lib/email/templates";
import { sendMail } from "@/lib/mailer";
import { getClientIp, isValidEmail, isValidHttpUrl } from "@/lib/validation";

const SETTING_FIELDS = [
  "site_name", "site_tagline", "contact_email", "notification_email", "contact_phone", "contact_whatsapp", "contact_address",
  "business_hours", "response_time", "booking_url", "upwork_url",
  "social_facebook", "social_twitter", "social_github", "social_instagram", "social_linkedin",
  "google_analytics_id",
] as const; // SEO settings (verification, share image, organisation schema) are saved in Admin → SEO → Settings
const EMAIL_FIELDS = new Set(["contact_email", "notification_email"]);
const URL_FIELDS = new Set(["social_facebook", "social_twitter", "social_github", "social_instagram", "social_linkedin", "booking_url", "upwork_url"]);

const PAGE = "/admin/settings";

export async function saveSettings(fd: FormData) {
  await requireAdmin();
  const values: [string, string][] = [];
  for (const key of SETTING_FIELDS) {
    const value = String(fd.get(key) ?? "").trim().slice(0, 500);
    if (value && EMAIL_FIELDS.has(key) && !isValidEmail(value)) await finish("error", `"${value}" is not a valid email address.`, PAGE);
    if (value && URL_FIELDS.has(key) && !isValidHttpUrl(value)) await finish("error", `${key.replace(/_/g, " ")} must be a full https:// link.`, PAGE);
    if (key === "google_analytics_id" && value && !/^G-[A-Z0-9]{4,15}$/i.test(value)) await finish("error", "Google Analytics ID looks like G-XXXXXXXXXX.", PAGE);
    values.push([key, value]);
  }
  const keys = values.map(([k]) => k);
  const vals = values.map(([, v]) => v);
  await sql`
    INSERT INTO site_settings (setting_key, setting_value) SELECT * FROM unnest(${keys}::text[], ${vals}::text[])
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value
  `;
  refreshPublicSite();
  await finish("success", "Settings saved. The website is updated.", PAGE);
}

export async function changePassword(fd: FormData) {
  const admin = await requireAdmin();
  const current = String(fd.get("current_password") ?? "");
  const next = String(fd.get("new_password") ?? "");
  const confirm = String(fd.get("confirm_password") ?? "");

  if (!current || !next || !confirm) await finish("error", "All password fields are required.", PAGE);
  if (next.length < 10 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) await finish("error", "Use at least 10 characters with letters and numbers.", PAGE);
  if (next !== confirm) await finish("error", "New passwords don't match.", PAGE);
  if (next === current) await finish("error", "The new password must be different.", PAGE);

  const [user] = await rows<{ password_hash: string; email: string; full_name: string | null }>(sql`SELECT password_hash, email, full_name FROM admin_users WHERE id = ${admin.id}`);
  if (!user || !(await bcrypt.compare(current, user.password_hash))) await finish("error", "Current password is incorrect.", PAGE);

  const hash = await bcrypt.hash(next, 12);
  await sql`UPDATE admin_users SET password_hash = ${hash} WHERE id = ${admin.id}`;
  // Other sessions carry the old password fingerprint and stop working; this one gets a fresh cookie.
  const token = await signSession({ uid: admin.id, u: admin.username, pv: await passwordFingerprint(hash) });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);

  const ip = await getClientIp();
  after(async () => {
    const mail = passwordChangedEmail(await getContactInfo(), { name: user.full_name || admin.username, ip });
    await sendMail({ to: user.email, ...mail });
  });
  await finish("success", "Password updated. Other devices have been signed out.", PAGE);
}

/** The address that receives sign-in codes. Needs the current password, since it controls the second factor. */
export async function updateAdminEmail(fd: FormData) {
  const admin = await requireAdmin();
  const email = String(fd.get("admin_email") ?? "").trim().toLowerCase();
  const name = String(fd.get("full_name") ?? "").trim().slice(0, 100);
  const password = String(fd.get("confirm_password_email") ?? "");
  if (!isValidEmail(email)) await finish("error", "Enter a valid email address.", PAGE);

  const [user] = await rows<{ password_hash: string }>(sql`SELECT password_hash FROM admin_users WHERE id = ${admin.id}`);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) await finish("error", "Current password is incorrect.", PAGE);

  await sql`UPDATE admin_users SET email = ${email}, full_name = ${name || null} WHERE id = ${admin.id}`;
  await finish("success", "Account details updated. Sign-in codes will go to the new address.", PAGE);
}

/** Instagram feed: checks the pasted long-lived token with Instagram, then stores it (see lib/instagram.ts). */
export async function saveInstagram(fd: FormData) {
  await requireAdmin();
  const token = String(fd.get("instagram_token") ?? "").trim();
  const userId = String(fd.get("instagram_user_id") ?? "").replace(/\D/g, "");
  if (!/^[A-Za-z0-9_-]{20,1000}$/.test(token)) await finish("error", "Paste the full access token (it starts with EAA… or IG…).", PAGE);
  let username = "";
  try {
    username = await connectInstagram(token, userId);
  } catch (err) {
    await finish("error", `Meta didn't accept this token: ${err instanceof Error ? err.message : "unknown error"}`, PAGE);
  }
  updateTag(INSTAGRAM_TAG);
  refreshPublicSite();
  await finish("success", `Instagram connected${username ? ` as @${username}` : ""}. Your latest posts now show on the home page.`, PAGE);
}

export async function removeInstagram() {
  await requireAdmin();
  await disconnectInstagram();
  updateTag(INSTAGRAM_TAG);
  refreshPublicSite();
  await finish("success", "Instagram disconnected. The feed is hidden from the website.", PAGE);
}
