"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Item = { src: string; caption: string };

/** Real pages from the product: a grid of thumbnails that open in a full-size viewer (←/→, Esc). */
export function PreviewGallery({ items, title }: { items: Item[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const show = (i: number) => {
    setOpen(i);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const onClose = () => setOpen(null);
    el.addEventListener("keydown", onKey);
    el.addEventListener("close", onClose);
    return () => {
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("close", onClose);
    };
  }, [step]);

  const current = open === null ? null : items[open];
  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, i) => (
          <li key={it.src}>
            <button
              type="button"
              onClick={() => show(i)}
              className="group block w-full cursor-pointer text-left focus-visible:outline-none"
              aria-label={`View page: ${it.caption}`}
            >
              <span className="relative block aspect-[148/210] overflow-hidden rounded-xl border bg-muted shadow-sm ring-primary/40 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:ring-4 motion-reduce:transition-none">
                <Image src={it.src} alt={`${title}: ${it.caption}`} fill sizes="(min-width: 1024px) 260px, (min-width: 640px) 30vw, 45vw" className="object-cover object-top" />
                <span className="absolute right-2 bottom-2 inline-flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Expand className="size-4" aria-hidden />
                </span>
              </span>
              <span className="mt-2 block text-sm leading-snug text-muted-foreground group-hover:text-foreground">{it.caption}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={current ? current.caption : "Page preview"}
        onClick={(e) => e.target === dialog.current && close()}
        className="m-auto max-h-[96vh] w-[min(92vw,640px)] overflow-visible bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        {current && (
          <figure className="relative">
            <div className="relative aspect-[148/210] max-h-[86vh] w-full overflow-hidden rounded-lg bg-white shadow-2xl">
              <Image src={current.src} alt={`${title}: ${current.caption}`} fill sizes="640px" className="object-contain" />
            </div>
            <figcaption className="mt-3 flex items-center justify-between gap-3 text-sm text-white">
              <span>
                {current.caption} <span className="text-white/60">· {open! + 1}/{items.length}</span>
              </span>
              <span className="flex gap-2">
                <button type="button" onClick={() => step(-1)} aria-label="Previous page" className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/15 hover:bg-white/25">
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next page" className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/15 hover:bg-white/25">
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </span>
            </figcaption>
            <button type="button" onClick={close} aria-label="Close" className="absolute -top-3 -right-3 inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-white/90">
              <X className="size-5" aria-hidden />
            </button>
          </figure>
        )}
      </dialog>
    </>
  );
}
