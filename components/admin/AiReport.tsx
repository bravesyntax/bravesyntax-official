"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

/** Dashboard card that asks AI for a short weekly report on demand. */
export function AiReport({ report }: { report: () => Promise<{ text: string } | { error: string }> }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setError("");
    const r = await report().catch(() => ({ error: "The AI report failed. Try again." }));
    setBusy(false);
    if ("error" in r) setError(r.error);
    else setText(r.text);
  };

  return (
    <div className="mb-6 rounded-2xl border border-brand/20 bg-brand/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display font-semibold text-white">
            <Sparkles className="size-4 text-brand" aria-hidden="true" /> Weekly AI report
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">Leads, enquiries and sign-ups this week, with what to do next. Uses counts only.</p>
        </div>
        <button type="button" onClick={run} disabled={busy} className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-black hover:bg-brand-light disabled:opacity-60">
          {busy ? "Writing…" : text ? "Write again" : "Write this week's report"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {text && <div className="mt-4 text-sm leading-relaxed whitespace-pre-line text-zinc-200">{text.replace(/\*\*/g, "")}</div>}
    </div>
  );
}
