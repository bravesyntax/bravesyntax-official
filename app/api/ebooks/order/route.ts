import { NextResponse } from "next/server";
import { createEbookOrder, ebookIpHash, razorpayKeyId } from "@/lib/ebook-orders";
import { getClientIp, isValidEmail, sanitizeEmail, sanitizePhone } from "@/lib/validation";

// Starts a purchase: creates a Razorpay order for the ebook and returns what Checkout needs to open.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const str = (k: string) => (typeof body?.[k] === "string" ? (body[k] as string).trim() : "");
  const name = str("name").slice(0, 150);
  const email = sanitizeEmail(str("email")).toLowerCase();
  const phone = sanitizePhone(str("phone")).slice(0, 40) || null;

  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "Please enter a valid email address. The PDF will be sent there." }, { status: 400 });
  if (body?.consent !== true) return NextResponse.json({ error: "Please accept the terms to continue." }, { status: 400 });

  const ip = await getClientIp();
  const result = await createEbookOrder(str("slug"), { name, email, phone }, ip ? ebookIpHash(ip) : null);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({
    key: razorpayKeyId(),
    orderId: result.orderId,
    amount: result.amount,
    currency: result.currency,
    title: result.ebook.title,
    prefill: { name, email, contact: phone ?? "" },
  });
}
