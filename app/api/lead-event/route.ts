import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL } from "@/lib/config";
import { sql } from "@/lib/db";
import { LEAD_METHODS } from "@/lib/analytics";

// Records one lead (a contact form sent, or a WhatsApp, phone or email tap) for Admin → Leads. Stores no personal
// data. Accepts only same-site requests, and caps how many it records per hour, so a script can't flood the table.

const HOURLY_CAP = 300;
const SITE_HOST = new URL(SITE_URL).host;

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || (new URL(origin).host !== SITE_HOST && new URL(origin).host !== req.nextUrl.host)) {
    return new NextResponse(null, { status: 403 });
  }
  let body: { method?: unknown; page?: unknown; source?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const method = typeof body.method === "string" && (LEAD_METHODS as readonly string[]).includes(body.method) ? body.method : null;
  const page = typeof body.page === "string" && /^\/[\w\-./]{0,299}$/.test(body.page) ? body.page : null;
  const source = typeof body.source === "string" && /^[a-z0-9.\-_]{1,60}$/.test(body.source) ? body.source : "direct";
  if (!method || !page) return new NextResponse(null, { status: 400 });

  try {
    const [{ n }] = (await sql`SELECT COUNT(*)::int AS n FROM lead_events WHERE created_at > LOCALTIMESTAMP - INTERVAL '1 hour'`) as { n: number }[];
    if (n < HOURLY_CAP) await sql`INSERT INTO lead_events (method, page, source) VALUES (${method}, ${page}, ${source})`;
  } catch (err) {
    console.error("[lead-event]", err);
  }
  return new NextResponse(null, { status: 204 });
}
