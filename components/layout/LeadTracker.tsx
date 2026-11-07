"use client";

import { useEffect } from "react";
import { contactMethod, rememberSource, trackLead } from "@/lib/analytics";

/** Notes where the visit came from, and counts WhatsApp, phone and email taps anywhere on the site as leads. */
export function LeadTracker() {
  useEffect(() => {
    rememberSource();
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.("a");
      const method = link && contactMethod(link.href);
      if (method) trackLead(method);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
