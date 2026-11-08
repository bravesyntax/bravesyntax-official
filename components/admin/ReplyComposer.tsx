"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

const textareaCls = "w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-brand transition-colors resize-y";

/** The reply box, with an optional AI draft. The draft only fills the box; nothing is sent until the admin presses Send. */
export function ReplyComposer({ initial, draft }: { initial: string; draft?: () => Promise<{ text: string } | { error: string }> }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const write = async () => {
    if (!draft) return;
    if (text.trim() !== initial.trim() && !confirm("Replace what you've written with an AI draft?")) return;
    setBusy(true);
    setNote("");
    const r = await draft().catch(() => ({ error: "AI drafting failed. Try again." }));
    setBusy(false);
    if ("error" in r) return setNote(r.error);
    setText(r.text);
    setNote("AI draft added. Read it and edit anything before sending.");
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor="reply_message" className="block text-xs font-mono text-zinc-400">
          Message <span className="text-emerald-400">*</span>
        </label>
        {draft && (
          <button type="button" onClick={write} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-brand/50 hover:text-brand disabled:opacity-50">
            <Sparkles className="size-3.5" aria-hidden="true" /> {busy ? "Drafting…" : "Draft reply with AI"}
          </button>
        )}
      </div>
      <textarea id="reply_message" name="reply_message" rows={10} required value={text} onChange={(e) => setText(e.target.value)} className={textareaCls} />
      {note && (
        <p role="status" className="mt-2 text-xs text-zinc-400">
          {note}
        </p>
      )}
    </div>
  );
}
