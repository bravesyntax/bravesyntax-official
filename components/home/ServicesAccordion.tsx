"use client";

import Link from "next/link";
import { useState } from "react";
import { contactServiceHref } from "@/lib/navigation";

type Item = { title: string; description: string; category: string; icon: string };

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Mobile-only (CSS-controlled) single-open accordion of the top services.
export default function ServicesAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="bsh-acc-wrap" role="list">
      {items.map((s, i) => (
        <div
          key={s.title}
          className={`bsh-acc-item bsh-reveal bsh-reveal-stagger-${(i % 6) + 1}`}
          role="listitem"
          data-open={open === i ? "" : undefined}
        >
          <button className="bsh-acc-btn" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bsh-acc-label">{s.title}</div>
              <div className="bsh-acc-cat">{capitalize(s.category)}</div>
            </div>
            <div className="bsh-acc-chevron" aria-hidden="true">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          <div className="bsh-acc-body">
            <p className="bsh-acc-desc">{s.description}</p>
            <Link
              href={contactServiceHref(s.title)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Get a quote &rarr;
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
