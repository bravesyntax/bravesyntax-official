import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getContactInfo } from "@/lib/contact";
import { rows, sql } from "@/lib/db";
import { ebookPurchaseEmail } from "@/lib/email/templates";
import { EBOOKS_URL, getEbook } from "@/lib/ebooks";
import { mailConfigured, sendMail } from "@/lib/mailer";

// Razorpay Standard Checkout for the ebook store, called over its REST API (no SDK needed):
//   1. createEbookOrder  → POST /v1/orders, row saved as 'created'
//   2. the browser pays in Razorpay Checkout and posts back order id, payment id and signature
//   3. verifyCheckoutSignature + markEbookPaid → row becomes 'paid', gets a download token, buyer is emailed
// The webhook (payment.captured / order.paid) calls markEbookPaid too, so a buyer who closes the tab right after
// paying still gets the email. markEbookPaid only acts on a 'created' row, so the two paths never double-send.

const API = "https://api.razorpay.com/v1";
const keyId = () => process.env.RAZORPAY_KEY_ID ?? "";
const keySecret = () => process.env.RAZORPAY_KEY_SECRET ?? "";
export const razorpayConfigured = () => !!(keyId() && keySecret());
export const razorpayKeyId = keyId;

const auth = () => `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString("base64")}`;
const ORDERS_PER_IP_HOUR = 10;

export const ebookIpHash = (ip: string) =>
  createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "bs").update(`ebook:${ip}`).digest("hex").slice(0, 40);

function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checkout's signature: HMAC-SHA256 of "order_id|payment_id" under the API key secret. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  if (!keySecret()) return false;
  const expected = createHmac("sha256", keySecret()).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook's X-Razorpay-Signature: HMAC-SHA256 of the raw body under the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

type Buyer = { name: string; email: string; phone: string | null };

export async function createEbookOrder(slug: string, buyer: Buyer, ipHash: string | null) {
  const ebook = getEbook(slug);
  if (!ebook) return { error: "This ebook was not found." } as const;
  if (!razorpayConfigured()) return { error: "Payments are paused right now. Please try again in a little while." } as const;

  if (ipHash) {
    const [{ n }] = await rows<{ n: number }>(sql`
      SELECT COUNT(*)::int AS n FROM ebook_orders WHERE ip_hash = ${ipHash} AND created_at > LOCALTIMESTAMP - INTERVAL '1 hour'
    `);
    if (n >= ORDERS_PER_IP_HOUR) return { error: "Too many attempts. Please try again in a little while." } as const;
  }

  const amount = ebook.price * 100;
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", receipt: `ebook_${Date.now()}`.slice(0, 40), notes: { ebook: ebook.slug } }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[ebook order] Razorpay", res.status, await res.text().catch(() => ""));
    return { error: "Couldn't start the payment. Please try again." } as const;
  }
  const order = (await res.json()) as { id: string; amount: number; currency: string };
  await sql`
    INSERT INTO ebook_orders (ebook_slug, razorpay_order_id, amount, currency, name, email, phone, ip_hash)
    VALUES (${ebook.slug}, ${order.id}, ${order.amount}, ${order.currency}, ${buyer.name}, ${buyer.email}, ${buyer.phone}, ${ipHash})
  `;
  return { orderId: order.id, amount: order.amount, currency: order.currency, ebook } as const;
}

/** Asks Razorpay whether a payment really belongs to the order and went through. */
async function paymentIsGood(orderId: string, paymentId: string) {
  const res = await fetch(`${API}/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: auth() }, cache: "no-store" });
  if (!res.ok) return false;
  const p = (await res.json()) as { order_id: string; status: string };
  return p.order_id === orderId && (p.status === "captured" || p.status === "authorized");
}

type PaidRow = { id: number; ebook_slug: string; name: string; email: string; amount: number; razorpay_order_id: string; download_token: string };

/**
 * Marks an order paid (once) and emails the download link. Returns the download token, or null when the order is
 * unknown, the amount doesn't match, or Razorpay doesn't confirm the payment.
 */
export async function markEbookPaid(orderId: string, paymentId: string, opts: { amount?: number; confirmed?: boolean } = {}) {
  const [existing] = await rows<{ status: string; amount: number; download_token: string | null }>(
    sql`SELECT status, amount, download_token FROM ebook_orders WHERE razorpay_order_id = ${orderId}`,
  );
  if (!existing) return null;
  if (opts.amount !== undefined && opts.amount !== existing.amount) return null;
  if (existing.status === "paid") return existing.download_token;
  if (!opts.confirmed && !(await paymentIsGood(orderId, paymentId))) return null;

  const token = randomBytes(24).toString("base64url");
  const [row] = await rows<PaidRow>(sql`
    UPDATE ebook_orders
    SET status = 'paid', razorpay_payment_id = ${paymentId}, paid_at = LOCALTIMESTAMP, download_token = ${token}
    WHERE razorpay_order_id = ${orderId} AND status = 'created'
    RETURNING id, ebook_slug, name, email, amount, razorpay_order_id, download_token
  `);
  if (!row) {
    // The other path (checkout or webhook) got there first.
    const [again] = await rows<{ download_token: string | null }>(sql`SELECT download_token FROM ebook_orders WHERE razorpay_order_id = ${orderId}`);
    return again?.download_token ?? null;
  }
  await sendPurchaseEmail(row);
  return row.download_token;
}

async function sendPurchaseEmail(row: PaidRow) {
  const ebook = getEbook(row.ebook_slug);
  if (!ebook || !mailConfigured()) return;
  try {
    const contact = await getContactInfo();
    const mail = ebookPurchaseEmail(contact, {
      name: row.name,
      title: ebook.title,
      amount: row.amount / 100,
      orderId: row.razorpay_order_id,
      downloadUrl: `${EBOOKS_URL}/api/ebooks/download/${row.download_token}`,
    });
    await sendMail({ to: row.email, ...mail });
    await sql`UPDATE ebook_orders SET email_sent_at = LOCALTIMESTAMP WHERE id = ${row.id}`;
  } catch (err) {
    console.error("[ebook email]", err);
  }
}
