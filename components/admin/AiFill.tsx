"use client";

import { Sparkles } from "lucide-react";
import { useRef, useState } from "react";

type Result = Record<string, string> | { error: string };

/** Sets a form field the way typing would, so controlled and uncontrolled inputs both pick it up. */
function setField(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * "Write with AI" for an admin form: sends the named fields as context and fills in the fields the AI returns.
 * Nothing is saved until the admin saves the form.
 */
export function AiFill({ label, read, run, hint }: { label: string; read: string[]; run: (ctx: Record<string, string>) => Promise<Result>; hint?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const go = async () => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const get = (n: string) => form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${n}"]`);
    const ctx = Object.fromEntries(read.map((n) => [n, get(n)?.value ?? ""]));
    setBusy(true);
    setNote("");
    const r = await run(ctx).catch((): Result => ({ error: "AI writing failed. Try again." }));
    setBusy(false);
    if ("error" in r && typeof r.error === "string" && Object.keys(r).length === 1) return setNote(r.error);
    const filled = Object.entries(r).filter(([n]) => get(n));
    const overwrite = filled.filter(([n]) => (get(n)?.value ?? "").trim()).map(([n]) => n);
    if (overwrite.length && !confirm(`Replace what's already in: ${overwrite.join(", ")}?`)) return;
    for (const [n, v] of filled) setField(get(n)!, v);
    setNote("Draft filled in. Read and edit it, then save.");
  };

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
      <button type="button" onClick={go} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand-light disabled:opacity-60">
        <Sparkles className="size-3.5" aria-hidden="true" /> {busy ? "Writing…" : label}
      </button>
      <span role="status" className="text-xs text-zinc-400">
        {note || hint}
      </span>
    </div>
  );
}
