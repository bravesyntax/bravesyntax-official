"use client";

import { useState } from "react";

// Single-open FAQ accordion.
export default function FaqList({ faqs }: { faqs: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3" role="list">
      {faqs.map(([q, a], i) => (
        <div
          key={q}
          className={`bsh-faq-item bsh-reveal bsh-reveal-stagger-${(i % 3) + 1} border rounded-xl overflow-hidden hover:border-emerald-500/20 transition-colors`}
          role="listitem"
          data-open={open === i ? "" : undefined}
        >
          <button
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="bsh-faq-q text-sm font-mono font-medium">{q}</span>
            <span className="bsh-faq-icon flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center" aria-hidden="true">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          <div className="bsh-faq-answer px-5 pb-4">
            <p className="bsh-faq-a text-xs font-mono leading-relaxed border-t pt-4">{a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
