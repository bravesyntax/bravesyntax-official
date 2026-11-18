"use client";

import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

/** Mobile/tablet bar with the price and a buy button, shown while the buy box (#buy) is off screen. */
export function StickyBuyBar({ title, price, mrp }: { title: string; price: string; mrp?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const target = document.getElementById("buy");
    if (!target) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(target);
    return () => io.disconnect();
  }, []);
  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur transition-transform duration-300 motion-reduce:transition-none lg:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-sm">
            <span className="font-semibold">{price}</span>
            {mrp && <span className="ml-2 text-muted-foreground line-through">{mrp}</span>}
          </p>
        </div>
        <a
          href="#buy"
          tabIndex={show ? 0 : -1}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90"
        >
          <ShoppingBag className="size-4" aria-hidden /> Abhi khareedo
        </a>
      </div>
    </div>
  );
}
