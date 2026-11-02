"use client";

import { useState } from "react";
import Icon, { ICONS } from "@/components/ui/Icon";

// Single-open FAQ accordion for the services page.
export default function ServicesFaq({ faqs }: { faqs: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map(([q, a], i) => (
        <div
          key={q}
          className="sv-faq-item group bg-zinc-900/50 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-emerald-500/20 transition-colors"
        >
          <button
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="sv-faq-q text-sm font-mono font-medium text-zinc-200">{q}</span>
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500 transition-transform"
              style={open === i ? { transform: "rotate(180deg)" } : undefined}
            >
              <Icon d={ICONS.chevronDown} className="w-3 h-3" strokeWidth={2.5} />
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-4">
              <p className="sv-faq-a text-xs text-zinc-500 font-mono leading-relaxed border-t border-zinc-800/60 pt-4">{a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
