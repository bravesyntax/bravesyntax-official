import { NextResponse } from "next/server";
import { markEbookPaid, verifyCheckoutSignature } from "@/lib/ebook-orders";

// Checkout's success handler posts here. A valid signature plus Razorpay's own record of the payment marks the
// order paid and returns the download token for the thank-you page.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const str = (k: string) => (typeof body?.[k] === "string" ? (body[k] as string) : "");
  const orderId = str("razorpay_order_id");
  const paymentId = str("razorpay_payment_id");
  const signature = str("razorpay_signature");

  if (!orderId || !paymentId || !verifyCheckoutSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment verify nahi ho paya." }, { status: 400 });
  }
  const token = await markEbookPaid(orderId, paymentId);
  if (!token) {
    return NextResponse.json(
      { error: "Payment confirm hone mein time lag raha hai. Kuch minute mein download link aapke email par aa jaayega." },
      { status: 202 },
    );
  }
  return NextResponse.json({ token });
}
