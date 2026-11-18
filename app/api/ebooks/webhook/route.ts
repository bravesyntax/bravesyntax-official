import { NextResponse } from "next/server";
import { markEbookPaid, verifyWebhookSignature } from "@/lib/ebook-orders";

// Razorpay webhook (Dashboard → Settings → Webhooks): URL https://store.bravesyntax.com/api/ebooks/webhook,
// events payment.captured and order.paid, secret = RAZORPAY_WEBHOOK_SECRET. Covers buyers who close the tab
// before Checkout's success handler runs. The signature is checked against the raw body, so read it as text.
type PaymentEntity = { id: string; order_id: string | null; amount: number; status: string };

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? "")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event: { event?: string; payload?: { payment?: { entity?: PaymentEntity } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const p = event.payload?.payment?.entity;
  if ((event.event === "payment.captured" || event.event === "order.paid") && p?.order_id && p.status === "captured") {
    await markEbookPaid(p.order_id, p.id, { amount: p.amount, confirmed: true });
  }
  // Always 200 for a verified event (including other event types and orders that aren't ebooks),
  // otherwise Razorpay keeps retrying it.
  return NextResponse.json({ ok: true });
}
