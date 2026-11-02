"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Mobile-only bottom bar that slides in after scrolling past most of the hero.
export default function StickyCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const heroH = document.querySelector("main section")?.clientHeight ?? 600;
    const onScroll = () => setVisible(window.scrollY > heroH * 0.7);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
    setTimeout(() => setHidden(true), 420);
  };

  return (
    <div
      id="bsh-sticky-cta"
      className={[visible && "bsh-scta-visible", hidden && "bsh-scta-hidden"].filter(Boolean).join(" ")}
      role="complementary"
      aria-label="Start your project"
    >
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-mono font-bold" style={{ color: "var(--bsh-t1)" }}>
          Ready to start? Let&apos;s build.
        </span>
        <span className="text-[10px] font-mono" style={{ color: "var(--bsh-t3)" }}>
          Free quote · Reply in 2 hrs
        </span>
      </div>
      <Link
        href="/contact"
        className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs rounded-lg transition-all"
      >
        Get Quote
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
      <button className="bsh-scta-close" onClick={dismiss} aria-label="Dismiss">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
