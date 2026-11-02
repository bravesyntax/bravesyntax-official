"use client";

import { useState } from "react";

// Single-open FAQ with the +/− toggle used on the background remover page.
export default function BgFaq({ faqs }: { faqs: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-1 divide-y divide-zinc-200 dark:divide-zinc-700/60">
      {faqs.map(([q, a], i) => (
        <div key={q} className={`faq-item py-4${open === i ? " open" : ""}`}>
          <button
            type="button"
            className="faq-q w-full flex justify-between items-center cursor-pointer text-left text-zinc-900 dark:text-white font-semibold text-sm"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{q}</span>
            <span className="text-emerald-500 text-xl leading-none ml-4 transition-transform duration-200">{open === i ? "−" : "+"}</span>
          </button>
          <div className="faq-a text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <p className="pt-2">{a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
