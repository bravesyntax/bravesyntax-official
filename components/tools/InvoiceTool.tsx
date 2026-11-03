"use client";

import { Download, ImagePlus, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorNote, Field, Panel, triggerDownload } from "./kit";

// GST invoice builder. Draft is kept in this browser only; the PDF is made here, nothing is sent anywhere.

type Item = { description: string; hsn: string; qty: string; rate: string; gst: string };
type Party = { name: string; address: string; gstin: string; phone: string };
type Draft = {
  seller: Party;
  buyer: Party;
  number: string;
  date: string;
  due: string;
  interState: boolean;
  items: Item[];
  notes: string;
  bank: string;
};

const KEY = "bs-invoice-draft";
const emptyParty: Party = { name: "", address: "", gstin: "", phone: "" };
const emptyItem: Item = { description: "", hsn: "", qty: "1", rate: "", gst: "18" };
const today = () => new Date().toISOString().slice(0, 10);
const newDraft = (): Draft => ({ seller: emptyParty, buyer: emptyParty, number: "INV-001", date: today(), due: "", interState: false, items: [emptyItem], notes: "Thank you for your business.", bank: "" });

const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function belowThousand(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]} ${ONES[n % 10]}`.trim();
  return `${ONES[Math.floor(n / 100)]} Hundred ${belowThousand(n % 100)}`.trim();
}
/** Indian numbering: lakh and crore. */
export function amountInWords(amount: number) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  const parts: string[] = [];
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${belowThousand(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return `Rupees ${parts.join(" ") || "Zero"}${paise ? ` and ${belowThousand(paise)} Paise` : ""} Only`;
}

function totals(d: Draft) {
  const rows = d.items.map((it) => {
    const qty = Number(it.qty) || 0;
    const rate = Number(it.rate) || 0;
    const taxable = qty * rate;
    const tax = (taxable * (Number(it.gst) || 0)) / 100;
    return { ...it, qtyN: qty, rateN: rate, taxable, tax, total: taxable + tax };
  });
  const taxable = rows.reduce((n, r) => n + r.taxable, 0);
  const tax = rows.reduce((n, r) => n + r.tax, 0);
  return { rows, taxable, tax, total: taxable + tax };
}

async function buildPdf(d: Draft, logo: Blob | null) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(`Invoice ${d.number}`);
  doc.setCreator("Brave Syntax Invoice Generator");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const A4: [number, number] = [595.28, 841.89];
  let page = doc.addPage(A4);
  const margin = 40;
  const right = A4[0] - margin;
  const ink = rgb(0.1, 0.12, 0.16);
  const muted = rgb(0.42, 0.45, 0.5);
  const line = rgb(0.85, 0.87, 0.89);
  const brand = rgb(0.03, 0.42, 0.33);

  // Hindi and other scripts aren't in the PDF base fonts, so that text is drawn by the browser as a sharp image.
  const unicodeText = async (text: string, x: number, baseline: number, size: number, isBold: boolean, color: string) => {
    const scale = 4;
    const m = document.createElement("canvas").getContext("2d")!;
    const font = `${isBold ? "700" : "400"} ${size * scale}px Arial, "Noto Sans Devanagari", "Nirmala UI", sans-serif`;
    m.font = font;
    const c = document.createElement("canvas");
    c.width = Math.ceil(m.measureText(text).width) + 4;
    c.height = Math.ceil(size * scale * 1.6);
    const ctx = c.getContext("2d")!;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, 2, size * scale * 1.15);
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/png"));
    const img = await doc.embedPng(new Uint8Array(await blob.arrayBuffer()));
    page.drawImage(img, { x, y: baseline - size * 0.45, width: c.width / scale, height: c.height / scale });
    return c.width / scale;
  };

  const isLatin = (t: string) => {
    try {
      regular.encodeText(t);
      return true;
    } catch {
      return false;
    }
  };

  const widthOf = (t: string, size: number, f = regular) => (isLatin(t) ? f.widthOfTextAtSize(t, size) : t.length * size * 0.6);

  const text = async (t: string, x: number, y: number, size = 9.5, f = regular, color = ink, align: "left" | "right" = "left") => {
    const clean = t.replace(/[\r\t]/g, " ");
    if (!clean) return;
    const px = align === "right" ? x - widthOf(clean, size, f) : x;
    if (isLatin(clean)) page.drawText(clean, { x: px, y, size, font: f, color });
    else await unicodeText(clean, px, y, size, f === bold, "#1a1f29");
  };

  const wrap = (t: string, width: number, size: number) => {
    const out: string[] = [];
    for (const para of t.split("\n")) {
      let cur = "";
      for (const word of para.split(/\s+/)) {
        const next = cur ? `${cur} ${word}` : word;
        if (widthOf(next, size) > width && cur) {
          out.push(cur);
          cur = word;
        } else cur = next;
      }
      if (cur) out.push(cur);
    }
    return out;
  };

  // Header
  let top = A4[1] - margin;
  if (logo) {
    try {
      const bytes = new Uint8Array(await logo.arrayBuffer());
      const img = logo.type === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      const h = Math.min(44, img.height);
      const w = Math.min(150, (img.width / img.height) * h);
      page.drawImage(img, { x: margin, y: top - h, width: w, height: (img.height / img.width) * w });
      top -= h + 10;
    } catch {
      /* a logo that can't be embedded shouldn't stop the invoice */
    }
  }
  await text(d.seller.name || "Your business", margin, top - 12, 15, bold);
  await text(d.seller.gstin ? "TAX INVOICE" : "INVOICE", right, A4[1] - margin - 14, 18, bold, brand, "right");
  await text(`Invoice no: ${d.number}`, right, A4[1] - margin - 34, 9.5, regular, ink, "right");
  await text(`Date: ${d.date}`, right, A4[1] - margin - 47, 9.5, regular, ink, "right");
  if (d.due) await text(`Due: ${d.due}`, right, A4[1] - margin - 60, 9.5, regular, ink, "right");

  let y = top - 28;
  for (const l of wrap(d.seller.address, 260, 9.5)) {
    await text(l, margin, y, 9.5, regular, muted);
    y -= 12.5;
  }
  if (d.seller.phone) {
    await text(`Phone: ${d.seller.phone}`, margin, y, 9.5, regular, muted);
    y -= 12.5;
  }
  if (d.seller.gstin) {
    await text(`GSTIN: ${d.seller.gstin}`, margin, y, 9.5, bold);
    y -= 12.5;
  }

  y = Math.min(y, A4[1] - margin - 80) - 12;
  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 0.75, color: line });
  y -= 18;
  await text("BILL TO", margin, y, 8, bold, muted);
  y -= 14;
  await text(d.buyer.name || "-", margin, y, 10.5, bold);
  y -= 13;
  for (const l of wrap(d.buyer.address, 300, 9.5)) {
    await text(l, margin, y, 9.5, regular, muted);
    y -= 12.5;
  }
  if (d.buyer.phone) {
    await text(`Phone: ${d.buyer.phone}`, margin, y, 9.5, regular, muted);
    y -= 12.5;
  }
  if (d.buyer.gstin) {
    await text(`GSTIN: ${d.buyer.gstin}`, margin, y, 9.5, bold);
    y -= 12.5;
  }
  y -= 12;

  // Items
  const col = { n: margin + 6, desc: margin + 24, hsn: 300, qty: 372, rate: 432, gst: 470, amount: right - 6 };
  const tableHead = async () => {
    page.drawRectangle({ x: margin, y: y - 6, width: right - margin, height: 20, color: rgb(0.95, 0.97, 0.96) });
    await text("#", col.n, y, 8.5, bold);
    await text("Description", col.desc, y, 8.5, bold);
    await text("HSN/SAC", col.hsn, y, 8.5, bold);
    await text("Qty", col.qty, y, 8.5, bold, ink, "right");
    await text("Rate", col.rate, y, 8.5, bold, ink, "right");
    await text("GST", col.gst, y, 8.5, bold, ink, "right");
    await text("Amount", col.amount, y, 8.5, bold, ink, "right");
    y -= 22;
  };
  await tableHead();
  const t = totals(d);
  const rows = t.rows.filter((r) => r.description || r.taxable);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const lines = wrap(r.description || "-", col.hsn - col.desc - 10, 9.5);
    if (y - lines.length * 12.5 < 170) {
      page = doc.addPage(A4);
      y = A4[1] - margin - 10;
      await tableHead();
    }
    await text(String(i + 1), col.n, y, 9.5, regular, muted);
    let ly = y;
    for (const l of lines) {
      await text(l, col.desc, ly, 9.5);
      ly -= 12.5;
    }
    await text(r.hsn, col.hsn, y);
    await text(String(r.qtyN), col.qty, y, 9.5, regular, ink, "right");
    await text(money(r.rateN), col.rate, y, 9.5, regular, ink, "right");
    await text(`${Number(r.gst) || 0}%`, col.gst, y, 9.5, regular, ink, "right");
    await text(money(r.taxable), col.amount, y, 9.5, regular, ink, "right");
    y = ly - 5;
    page.drawLine({ start: { x: margin, y: y + 7 }, end: { x: right, y: y + 7 }, thickness: 0.5, color: line });
    y -= 5;
  }

  // Totals. "Rs." rather than the rupee sign, which the PDF base fonts don't contain.
  y -= 6;
  const label = right - 170;
  const row = async (name: string, value: string, f = regular, size = 9.5) => {
    await text(name, label, y, size, f);
    await text(value, right - 6, y, size, f, ink, "right");
    y -= 15;
  };
  await row("Taxable amount", `Rs. ${money(t.taxable)}`);
  const byRate = new Map<number, number>();
  t.rows.forEach((r) => {
    const rate = Number(r.gst) || 0;
    if (rate) byRate.set(rate, (byRate.get(rate) ?? 0) + r.tax);
  });
  for (const [rate, tax] of [...byRate].sort((a, b) => a[0] - b[0])) {
    if (d.interState) await row(`IGST @ ${rate}%`, `Rs. ${money(tax)}`);
    else {
      await row(`CGST @ ${rate / 2}%`, `Rs. ${money(tax / 2)}`);
      await row(`SGST @ ${rate / 2}%`, `Rs. ${money(tax / 2)}`);
    }
  }
  y -= 8;
  page.drawRectangle({ x: label - 8, y: y - 8, width: right - label + 8, height: 24, color: brand });
  page.drawText("Total", { x: label, y, size: 11, font: bold, color: rgb(1, 1, 1) });
  const totalText = `Rs. ${money(t.total)}`;
  page.drawText(totalText, { x: right - 6 - bold.widthOfTextAtSize(totalText, 11), y, size: 11, font: bold, color: rgb(1, 1, 1) });
  y -= 26;
  for (const l of wrap(amountInWords(t.total), right - margin, 9)) {
    await text(l, margin, y, 9, bold);
    y -= 12;
  }
  y -= 8;
  if (d.bank) {
    await text("Payment details", margin, y, 9, bold, muted);
    y -= 12.5;
    for (const l of wrap(d.bank, 320, 9)) {
      await text(l, margin, y, 9);
      y -= 12;
    }
    y -= 6;
  }
  if (d.notes) {
    for (const l of wrap(d.notes, right - margin, 9)) {
      await text(l, margin, y, 9, regular, muted);
      y -= 12;
    }
  }
  return new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" });
}

export default function InvoiceTool() {
  const [d, setD] = useState<Draft>(newDraft);
  const [loaded, setLoaded] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const t = useMemo(() => totals(d), [d]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setD({ ...newDraft(), ...JSON.parse(saved), date: today() });
    } catch {
      /* no saved draft available: start blank */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch {
      /* storage blocked: the invoice still works, it just isn't remembered */
    }
  }, [d, loaded]);

  const party = (who: "seller" | "buyer", label: string) => (
    <Panel className="grid content-start gap-3">
      <h2 className="font-semibold">{label}</h2>
      <Field label="Business name">
        <Input data-testid={`${who}-name`} value={d[who].name} onChange={(e) => setD({ ...d, [who]: { ...d[who], name: e.target.value } })} className="h-11" />
      </Field>
      <Field label="Address">
        <Textarea rows={2} value={d[who].address} onChange={(e) => setD({ ...d, [who]: { ...d[who], address: e.target.value } })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="GSTIN" hint={d[who].gstin && !GSTIN.test(d[who].gstin) ? "This doesn't look like a valid 15-character GSTIN." : undefined}>
          <Input value={d[who].gstin} maxLength={15} onChange={(e) => setD({ ...d, [who]: { ...d[who], gstin: e.target.value.toUpperCase() } })} className="h-11" />
        </Field>
        <Field label="Phone">
          <Input type="tel" value={d[who].phone} onChange={(e) => setD({ ...d, [who]: { ...d[who], phone: e.target.value } })} className="h-11" />
        </Field>
      </div>
    </Panel>
  );

  const setItem = (i: number, patch: Partial<Item>) => setD({ ...d, items: d.items.map((it, n) => (n === i ? { ...it, ...patch } : it)) });

  const download = async () => {
    setError("");
    if (!d.seller.name.trim()) return setError("Add your business name.");
    if (!d.buyer.name.trim()) return setError("Add who the invoice is for.");
    if (!t.rows.some((r) => r.description.trim() && r.taxable > 0)) return setError("Add at least one item with a description, quantity and rate.");
    setBusy(true);
    try {
      triggerDownload(await buildPdf(d, logo), `${d.number.replace(/[^\w-]+/g, "_") || "invoice"}.pdf`);
    } catch (err) {
      console.error(err);
      setError("The PDF could not be created. Check the logo image and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {party("seller", "From (your business)")}
        {party("buyer", "Bill to (customer)")}
      </div>
      <Panel className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Invoice number">
          <Input value={d.number} onChange={(e) => setD({ ...d, number: e.target.value })} className="h-11" />
        </Field>
        <Field label="Invoice date">
          <Input type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} className="h-11" />
        </Field>
        <Field label="Due date (optional)">
          <Input type="date" value={d.due} onChange={(e) => setD({ ...d, due: e.target.value })} className="h-11" />
        </Field>
        <Field label="Logo (optional)">
          <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-input px-3 text-sm hover:bg-muted">
            <ImagePlus className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{logo ? logo.name : "PNG or JPG"}</span>
            <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
          </label>
        </Field>
        <label className="flex items-start gap-2 text-sm sm:col-span-2 lg:col-span-4">
          <input type="checkbox" data-testid="inter-state" checked={d.interState} onChange={(e) => setD({ ...d, interState: e.target.checked })} className="mt-0.5 size-4 accent-primary" />
          <span>
            <span className="font-medium">Inter-state sale</span> <span className="text-muted-foreground">(customer is in another state: charge IGST instead of CGST + SGST)</span>
          </span>
        </label>
      </Panel>
      <Panel className="space-y-3">
        <h2 className="font-semibold">Items</h2>
        {d.items.map((it, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 rounded-xl border p-3 md:grid-cols-[1fr_6rem_4.5rem_6.5rem_5rem_6.5rem_2.5rem] md:items-end md:border-0 md:p-0">
            <Field label="Description" className="col-span-6 md:col-span-1">
              <Input data-testid="item-desc" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} className="h-11" />
            </Field>
            <Field label="HSN/SAC" className="col-span-3 md:col-span-1">
              <Input value={it.hsn} onChange={(e) => setItem(i, { hsn: e.target.value })} className="h-11" />
            </Field>
            <Field label="Qty" className="col-span-3 md:col-span-1">
              <Input data-testid="item-qty" type="number" min={0} value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} className="h-11" />
            </Field>
            <Field label="Rate (₹)" className="col-span-3 md:col-span-1">
              <Input data-testid="item-rate" type="number" min={0} value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} className="h-11" />
            </Field>
            <Field label="GST" className="col-span-3 md:col-span-1">
              <select value={it.gst} onChange={(e) => setItem(i, { gst: e.target.value })} className="h-11 w-full rounded-lg border border-input bg-background px-2 text-sm">
                {["0", "5", "12", "18", "28"].map((g) => (
                  <option key={g} value={g}>
                    {g}%
                  </option>
                ))}
              </select>
            </Field>
            <div className="col-span-5 flex h-11 items-center text-sm font-medium tabular-nums md:col-span-1 md:justify-end">₹{money(t.rows[i].taxable)}</div>
            <Button type="button" variant="ghost" size="icon" className="col-span-1 size-11" aria-label={`Remove item ${i + 1}`} disabled={d.items.length === 1} onClick={() => setD({ ...d, items: d.items.filter((_, n) => n !== i) })}>
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" className="rounded-full" onClick={() => setD({ ...d, items: [...d.items, emptyItem] })}>
          <Plus className="size-4" aria-hidden="true" /> Add item
        </Button>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="grid content-start gap-3">
          <Field label="Payment details (optional)">
            <Textarea rows={3} placeholder="Bank name, account number, IFSC, UPI ID" value={d.bank} onChange={(e) => setD({ ...d, bank: e.target.value })} />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
          </Field>
        </Panel>
        <Panel className="space-y-2 text-sm">
          <p className="flex justify-between">
            <span className="text-muted-foreground">Taxable amount</span> <span className="tabular-nums">₹{money(t.taxable)}</span>
          </p>
          {d.interState ? (
            <p className="flex justify-between">
              <span className="text-muted-foreground">IGST</span> <span data-testid="igst" className="tabular-nums">₹{money(t.tax)}</span>
            </p>
          ) : (
            <>
              <p className="flex justify-between">
                <span className="text-muted-foreground">CGST</span> <span data-testid="cgst" className="tabular-nums">₹{money(t.tax / 2)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">SGST</span> <span className="tabular-nums">₹{money(t.tax / 2)}</span>
              </p>
            </>
          )}
          <p className="flex justify-between border-t pt-2 text-lg font-semibold">
            <span>Total</span> <span data-testid="total" className="tabular-nums">₹{money(t.total)}</span>
          </p>
          <p className="text-xs text-muted-foreground">{amountInWords(t.total)}</p>
        </Panel>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button type="button" data-testid="tool-run" size="lg" className="h-12 w-full rounded-full text-base sm:w-auto sm:min-w-56" disabled={busy} onClick={download}>
          <Download className="size-4" aria-hidden="true" /> {busy ? "Creating PDF…" : "Download invoice PDF"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setD({ ...newDraft(), seller: d.seller, bank: d.bank, notes: d.notes });
            setLogo(null);
          }}
        >
          New invoice (keep my details)
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">Your details are saved only in this browser. Check rates and compliance with your accountant.</p>
    </div>
  );
}
