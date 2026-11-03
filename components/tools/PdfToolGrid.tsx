"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PDF_TOOL_LIST, TOOL_GROUPS, type ToolGroup } from "@/lib/tools/registry";

const FILTERS: (ToolGroup | "all")[] = ["all", "organize", "edit", "convert", "security"];

export default function PdfToolGrid() {
  const [group, setGroup] = useState<ToolGroup | "all">("all");
  const tools = PDF_TOOL_LIST.filter((t) => group === "all" || t.group === group);
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={group === f} onClick={() => setGroup(f)} className={cn("min-h-9 rounded-full border px-4 py-1.5 text-sm transition-colors", group === f ? "border-transparent bg-primary font-medium text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}>
            {f === "all" ? "All tools" : TOOL_GROUPS[f]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {tools.map((t) => (
          <Link key={t.slug} href={`/pdf-tools/${t.slug}`} className="group rounded-2xl border bg-card p-4 transition-colors hover:border-primary/50 sm:p-5">
            <h2 className="font-medium group-hover:text-primary">{t.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.short}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
