"use client";

import { useEffect } from "react";
import { contactMethod, track } from "@/lib/analytics";

/** Counts WhatsApp, phone and email clicks anywhere on the site as `contact_click` events. */
export function LeadTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.("a");
      const method = link && contactMethod(link.href);
      if (method) track("contact_click", { method });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
