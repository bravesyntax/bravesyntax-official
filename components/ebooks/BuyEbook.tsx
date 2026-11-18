"use client";

import { CheckCircle2, Download, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = CHECKOUT_JS;
    s.async = true;
    s.onload = () => resolve(!!window.Razorpay);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type State = { kind: "form" } | { kind: "busy" } | { kind: "done"; token: string | null; message?: string };

export function BuyEbook({ slug, priceLabel }: { slug: string; priceLabel: string }) {
  const [state, setState] = useState<State>({ kind: "form" });
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    setState({ kind: "busy" });

    const [ok, res] = await Promise.all([
      loadCheckout(),
      fetch("/api/ebooks/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          consent: fd.get("consent") === "yes",
        }),
      }).catch(() => null),
    ]);
    const data = res ? await res.json().catch(() => null) : null;
    if (!res?.ok || !data?.orderId) {
      setError(data?.error ?? "Something went wrong. Please try again.");
      return setState({ kind: "form" });
    }
    if (!ok || !window.Razorpay) {
      setError("The payment window didn't load. Check your internet connection and try again.");
      return setState({ kind: "form" });
    }

    const rzp = new window.Razorpay({
      key: data.key,
      order_id: data.orderId,
      amount: data.amount,
      currency: data.currency,
      name: "Brave Syntax",
      description: `Ebook: ${data.title}`,
      prefill: data.prefill,
      theme: { color: "#10b981" },
      handler: async (r: RazorpayResponse) => {
        setState({ kind: "busy" });
        const v = await fetch("/api/ebooks/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        }).catch(() => null);
        const vd = v ? await v.json().catch(() => null) : null;
        if (v?.ok && vd?.token) return setState({ kind: "done", token: vd.token });
        setState({
          kind: "done",
          token: null,
          message: vd?.error ?? "Payment received. Your download link will reach your email in a few minutes.",
        });
      },
      modal: { ondismiss: () => setState({ kind: "form" }) },
    });
    rzp.on("payment.failed", (r) => {
      setError(r.error?.description ?? "The payment failed. Please try again.");
      setState({ kind: "form" });
    });
    rzp.open();
  }

  if (state.kind === "done") {
    return (
      <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden="true" />
        <h3 className="mt-3 text-xl font-semibold">Thank you! Payment successful.</h3>
        {state.token ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Download your PDF now. We’ve also emailed you the link.</p>
            <Button asChild size="lg" className="mt-5 h-11 px-5 text-base">
              <a href={`/api/ebooks/download/${state.token}`}>
                <Download className="size-4" aria-hidden="true" /> Download the PDF
              </a>
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
        )}
      </div>
    );
  }

  const busy = state.kind === "busy";
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="space-y-1.5">
        <Label htmlFor="eb-name">Name</Label>
        <Input id="eb-name" name="name" required minLength={2} maxLength={150} autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="eb-email">Email (we’ll send the PDF here)</Label>
        <Input id="eb-email" name="email" type="email" required maxLength={254} autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="eb-phone">Phone (optional)</Label>
        <Input id="eb-phone" name="phone" type="tel" maxLength={20} autoComplete="tel" />
      </div>
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input type="checkbox" name="consent" value="yes" required className="mt-0.5 size-4 shrink-0 accent-primary" />
        <span>
          I agree to the{" "}
          <Link href="https://bravesyntax.com/terms" target="_blank" className="font-medium text-primary underline underline-offset-2">
            terms
          </Link>{" "}
          and{" "}
          <Link href="https://bravesyntax.com/privacy-policy" target="_blank" className="font-medium text-primary underline underline-offset-2">
            privacy policy
          </Link>
          . As this is a digital product, it can’t be refunded once downloaded.
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
        {busy ? "Please wait…" : `Buy now for ${priceLabel}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">UPI, cards, net banking and wallets · Secure payment by Razorpay</p>
    </form>
  );
}
