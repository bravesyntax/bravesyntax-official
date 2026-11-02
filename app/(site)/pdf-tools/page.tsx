import { BadgeCheck, Infinity, Languages, Lock, WifiOff } from "lucide-react";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PdfToolkit from "@/components/pdf-tools/PdfToolkit";
import Icon from "@/components/ui/Icon";
import { pageMetadata, pageSchema } from "@/lib/seo";
import "./pdf-tools.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("pdf-tools");
}

const TRUST_BADGES = [
  [Lock, "Files stay on your device"],
  [WifiOff, "Works offline once loaded"],
  [BadgeCheck, "No watermarks ever"],
  [Infinity, "No file size limits"],
  [Languages, "16 OCR languages"],
] as const;

const HOW_IT_WORKS = [
  ["01", "Choose a tool", "Click any tool card below to open the dedicated workspace."],
  ["02", "Upload your file", "Drag-drop or browse. Processed instantly in your browser — zero server contact."],
  ["03", "Download result", "Your processed file is ready immediately. No email, no waiting."],
];

export default async function PdfToolsPage() {
  const schema = await pageSchema("pdf-tools");

  return (
    <div className="pg-pdftools">
      <JsonLd data={schema} />

      {/* ═══ HERO ═══ */}
      <section className="pt-hero-section pt-32 pb-10 lg:pt-40 lg:pb-14 relative overflow-hidden" aria-label="PDF Toolkit">
        <div className="pt-hero-dots absolute inset-0" style={{ backgroundSize: "28px 28px" }} />
        <div className="pt-hero-fade absolute inset-0" />
        <div className="pdf-hero-glow" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center mb-8" style={{ animation: "slide-up .5s ease-out forwards", opacity: 0 }}>
            <div className="pt-badge-pill inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm">
              <Icon
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                className="w-3.5 h-3.5 text-accent flex-shrink-0"
                strokeWidth={2}
              />
              <span className="text-xs font-mono text-accent-light">Free &bull; Browser-only &bull; No Upload &bull; No Registration</span>
            </div>
          </div>

          <div className="text-center max-w-4xl mx-auto" style={{ animation: "slide-up .5s ease-out .05s forwards", opacity: 0 }}>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold mb-5 leading-none">
              PDF <span className="text-gradient">Toolkit</span>
            </h1>
            <p className="text-lg text-zinc-400 font-mono leading-relaxed max-w-2xl mx-auto mb-8">
              16 powerful PDF tools — merge, split, compress, convert, sign, and more. 100% browser-based. Your files never leave your device. Forever free.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 mb-6" style={{ animation: "slide-up .5s ease-out .1s forwards", opacity: 0 }}>
              {TRUST_BADGES.map(([BadgeIcon, label]) => (
                <div key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800/60 rounded-lg">
                  <BadgeIcon className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-[11px] font-mono text-zinc-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <div className="pt-how-strip relative border-y border-zinc-800/40 bg-zinc-950/50 py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(([n, t, d]) => (
              <div key={n} className="pt-how-card flex items-start gap-4 bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-4">
                <div className="pt-how-num flex-shrink-0 w-8 h-8 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-accent">
                  {n}
                </div>
                <div>
                  <div className="text-sm font-mono font-semibold text-white mb-0.5">{t}</div>
                  <div className="text-[11px] font-mono text-zinc-500 leading-relaxed">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PdfToolkit />
    </div>
  );
}
