import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { SITE_URL } from "@/lib/config";
import { sql } from "@/lib/db";

// CSV of current subscribers for an email tool, each with their own unsubscribe link. Admin only (the proxy also
// guards /api/admin).
const cell = (v: string) => (/[",\n\r]|^[=+\-@]/.test(v) ? `"${v.replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"` : v);

export async function GET() {
  await requireAdmin();
  const subs = (await sql`
    SELECT email, consent_at, consent_text, unsubscribe_token FROM newsletter_subscribers WHERE unsubscribed_at IS NULL ORDER BY id
  `) as { email: string; consent_at: string; consent_text: string; unsubscribe_token: string }[];
  const lines = ["email,consent_at,consent_text,unsubscribe_link", ...subs.map((s) => [s.email, new Date(s.consent_at).toISOString(), s.consent_text, `${SITE_URL}/newsletter/unsubscribe?token=${s.unsubscribe_token}`].map(cell).join(","))];
  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="newsletter-subscribers.csv"`, "Cache-Control": "no-store" },
  });
}
