"use client";

import { useState } from "react";

// Location page FAQ: each question toggles independently.
export default function LocationFaq({ faqs }: { faqs: [string, string][] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="loc-faq">
      {faqs.map(([q, a], i) => (
        <div key={q} className={`faq-item${open.has(i) ? " open" : ""}`}>
          <button type="button" className="faq-q w-full text-left" aria-expanded={open.has(i)} onClick={() => toggle(i)}>
            <span>{q}</span>
            <svg className="faq-chevron" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="faq-a">
            <span>{a}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
