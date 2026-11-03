"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StickyBanner } from "@/components/velora/sticky-banner";

const KEY = "bs-banner-dismissed";

/** Top announcement. Remembered per visitor once dismissed; the page works the same if storage is blocked. */
export default function SiteBanner({ count }: { count: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(!localStorage.getItem(KEY));
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  return (
    <StickyBanner
      className="static"
      onDismiss={() => {
        try {
          localStorage.setItem(KEY, "1");
        } catch {
          /* storage blocked: it just returns next visit */
        }
      }}
    >
      <Link href="/tools" className="inline-flex items-center gap-2 py-1 font-medium hover:underline">
        <Sparkles className="size-4" aria-hidden="true" /> {count} free tools, including a GST invoice maker and PDF tools. No sign-up.
      </Link>
    </StickyBanner>
  );
}
