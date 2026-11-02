"use client";

import { BadgeCheck, Gift, ShieldCheck, WifiOff } from "lucide-react";
import Script from "next/script";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { WORKSPACE_HTML } from "./workspaceHtml";

// Client shell for the PDF Toolkit. The tool engine (public/js/pdf-tools.js) is plain JavaScript ported
// from the PHP page; it drives #toolsGrid / #privacyBanner / #toolWorkspace directly, so this component
// renders that markup once and never re-renders it.

type Engine = { pdfToolsInit?: () => void; openTool?: (id: string) => void };
const engine = () => window as unknown as Engine;

type Category = "organize" | "edit" | "convert" | "security";

const TOOLS: [string, string, string, Category, string][] = [
  ["merge", "Merge PDF", "Combine multiple PDFs into one", "organize", "M12 6v6m0 0v6m0-6h6m-6 0H6"],
  ["split", "Split PDF", "Extract specific pages visually", "organize", "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"],
  ["reorder", "Reorder Pages", "Drag & drop to rearrange pages", "organize", "M4 6h16M4 10h16M4 14h16M4 18h16"],
  [
    "delete",
    "Delete Pages",
    "Remove unwanted pages",
    "organize",
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  ],
  [
    "rotate",
    "Rotate Pages",
    "Rotate PDF pages any direction",
    "edit",
    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  ],
  [
    "watermark",
    "Add Watermark",
    "Text watermark with full control",
    "edit",
    "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  ],
  ["pagenum", "Page Numbers", "Insert page numbers", "edit", "M7 20l4-16m2 16l4-16M6 9h14M4 15h14"],
  ["sign", "Sign PDF", "Draw & place your signature", "edit", "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"],
  ["metadata", "Edit Metadata", "Change title, author & more", "edit", "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"],
  ["compress", "Compress PDF", "Reduce file size with image optimization", "edit", "M19 14l-7 7m0 0l-7-7m7 7V3"],
  [
    "img2pdf",
    "Images → PDF",
    "Convert JPG/PNG to PDF",
    "convert",
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  ],
  [
    "pdf2img",
    "PDF → Images",
    "Export pages as PNG/JPG + ZIP",
    "convert",
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  ],
  [
    "extract",
    "Extract Text",
    "OCR for Hindi, scanned & all PDFs",
    "convert",
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  ],
  [
    "protect",
    "Protect PDF",
    "Add password encryption",
    "security",
    "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  ],
  ["unlock", "Unlock PDF", "Remove password protection", "security", "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"],
  [
    "viewer",
    "PDF Viewer",
    "Preview with zoom & keyboard nav",
    "security",
    "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  ],
];

const FILTERS: [Category | "all", string][] = [
  ["all", "All Tools"],
  ["organize", "Organize"],
  ["edit", "Edit & Modify"],
  ["convert", "Convert"],
  ["security", "Security"],
];

function ToolGrid() {
  const [cat, setCat] = useState<Category | "all">("all");

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="flex flex-wrap gap-2 mb-8" style={{ animation: "slide-up .5s ease-out .15s forwards", opacity: 0 }}>
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setCat(k)} className={`cat-btn${cat === k ? " active" : ""} px-4 py-2 text-xs font-mono border border-zinc-800 rounded-full`}>
            {label}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" id="toolsList">
        {TOOLS.filter((t) => cat === "all" || t[3] === cat).map(([id, name, desc, category, icon], i) => (
          <button
            key={`${cat}-${id}`}
            onClick={() => engine().openTool?.(id)}
            data-cat={category}
            className="tool-card group text-left bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5"
            style={{ animation: cat === "all" ? `slide-up .5s ease-out ${0.15 + i * 0.03}s forwards` : "slide-up .3s ease-out forwards", opacity: 0 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors">
                <Icon d={icon} className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">{category}</span>
            </div>
            <h3 className="font-display font-semibold text-white group-hover:text-accent transition-colors text-sm">{name}</h3>
            <p className="text-xs text-zinc-500 font-mono mt-1.5 leading-relaxed">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

const PRIVACY = [
  [ShieldCheck, "100% Private", "All processing happens in your browser. Files never touch our servers."],
  [BadgeCheck, "No Watermarks", "Downloads are clean — no branding, no stamps, no ads embedded."],
  [WifiOff, "Works Offline", "Once loaded, no internet needed for most tools."],
  [Gift, "Always Free", "No premium plans, no credits, no paywalls. Every tool, every time."],
] as const;

export default function PdfToolkit() {
  return (
    <>
      {/* Same CDN libraries and versions as the PHP page */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js" strategy="afterInteractive" />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        strategy="afterInteractive"
        onReady={() => {
          const pdfjs = (window as unknown as { pdfjsLib?: { GlobalWorkerOptions: { workerSrc: string } } }).pdfjsLib;
          if (pdfjs) pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }}
      />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js" strategy="lazyOnload" />
      <Script src="/js/pdf-tools.js" strategy="afterInteractive" onReady={() => engine().pdfToolsInit?.()} />

      <section className="pb-10 relative" id="toolsGrid">
        <ToolGrid />
      </section>

      <section className="pb-20 relative" id="privacyBanner">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRIVACY.map(([PIcon, title, desc]) => (
              <div key={title} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center hover:border-accent/20 transition-colors">
                <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10">
                  <PIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                </span>
                <div className="font-display font-semibold text-white text-sm mb-1">{title}</div>
                <p className="text-xs text-zinc-500 font-mono leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 lg:pb-32 relative hidden" id="toolWorkspace" dangerouslySetInnerHTML={{ __html: WORKSPACE_HTML }} />

      <div id="toastContainer" />
    </>
  );
}
