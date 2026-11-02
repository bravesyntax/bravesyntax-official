import type { Metadata } from "next";
import Link from "next/link";
import BgFaq from "@/components/bg-remover/BgFaq";
import BgRemoverTool from "@/components/bg-remover/BgRemoverTool";
import JsonLd from "@/components/JsonLd";
import Icon, { PingDot } from "@/components/ui/Icon";
import { pageMetadata, pageSchema } from "@/lib/seo";
import "./bg-remover.css";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("bg-remover");
}

const FEATURES = [
  ["Privacy-first", "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"],
  ["No watermark", "M8 12l2 2 4-4"],
  [
    "PNG with transparency",
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  ],
  ["AI powered (WASM)", "M13 10V3L4 14h7v7l9-11h-7z"],
  [
    "Custom background",
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  ],
];

const STEPS = [
  ["01", "Upload your image", "Drag & drop or click to select a JPG, PNG, or WEBP file up to 15MB."],
  ["02", "AI removes the background", "Our WASM-powered neural network detects and removes the background automatically — runs in your browser, no data sent."],
  ["03", "Download or change BG", "Download your transparent PNG or apply a solid/custom background color with one click."],
  ["04", "Use it anywhere", "Perfect for product listings, ID photos, social posts, presentations, and more."],
];

const USE_CASES = [
  ["E-commerce", "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z", "Clean product photos"],
  [
    "LinkedIn / ID",
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
    "Professional headshots",
  ],
  [
    "Presentations",
    "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
    "Insert into slide decks",
  ],
  [
    "Social Media",
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    "Stickers, thumbnails",
  ],
  [
    "Web Design",
    "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    "Transparent assets",
  ],
  ["Graphic Design", "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", "Compose custom artwork"],
];

const FAQS: [string, string][] = [
  [
    "Is this tool really free?",
    "Yes, completely free with no hidden limits. No account, no watermarks, no daily cap. Brave Syntax offers this as a free utility for designers and small businesses.",
  ],
  [
    "Do my images get uploaded to a server?",
    "No. The AI model runs entirely inside your browser using WebAssembly (WASM). Your image never leaves your device — there's no server processing, no storage, and no tracking.",
  ],
  [
    "What image formats are supported?",
    "JPG, PNG, WEBP, and GIF up to 15MB. The result is always exported as a transparent PNG — the format that best preserves cutouts without quality loss.",
  ],
  [
    "Why does the first removal take longer?",
    "The AI model (~50MB) is downloaded from a CDN on first use and cached in your browser. Subsequent removals in the same session use the cached model and are much faster.",
  ],
  [
    "Does it work on mobile?",
    "Yes, on modern Android and iOS browsers. Processing may be slower on low-end devices due to the AI computation, but the result quality is the same.",
  ],
  [
    "Can I use the result for commercial projects?",
    "Absolutely. There are no licensing restrictions on outputs from this tool. The cutout PNG is yours to use freely for personal or commercial work.",
  ],
];

const SectionPill = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
    <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">{children}</span>
  </div>
);

export default async function BgRemoverPage() {
  const schema = await pageSchema("bg-remover");

  return (
    <div className="pg-bgremover">
      <JsonLd data={schema} />

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24 overflow-hidden" aria-label="Background Remover Tool">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.03)_0%,transparent_70%)] top-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-zinc-900/80 border border-zinc-700/60 rounded-full backdrop-blur-sm dark:bg-zinc-900/80 dark:border-zinc-700/60 bg-white/90 border-zinc-200/80">
              <PingDot />
              <span className="text-xs font-mono text-zinc-300 dark:text-zinc-300 text-zinc-700">AI-Powered · 100% Free · No Sign-up</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-zinc-900 dark:text-white leading-tight mb-4">
            Remove Image Background
            <br />
            <span className="text-emerald-500">Instantly &amp; Free</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 font-mono max-w-2xl mx-auto leading-relaxed mb-8">
            Upload any photo and our AI removes the background in seconds — entirely in your browser. Your images never leave your device.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-0">
            {FEATURES.map(([label, path]) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-full text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                <Icon d={path} className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <BgRemoverTool />

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.03)_0%,transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <SectionPill>How it works</SectionPill>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-900 dark:text-white">Three steps to a perfect cutout</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(([num, title, desc]) => (
              <div key={num} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-6 hover:border-emerald-500/40 transition-all">
                <div className="text-3xl font-display font-bold text-emerald-500/40 mb-2">{num}</div>
                <h4 className="font-display font-semibold text-zinc-900 dark:text-white mb-1">{title}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section className="py-16 lg:py-20 border-y border-zinc-200 dark:border-zinc-700/60 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <SectionPill>Use cases</SectionPill>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-900 dark:text-white">Who uses BG Remover?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {USE_CASES.map(([label, path, sub]) => (
              <div key={label} className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-4 text-center hover:border-emerald-500/30 transition-all">
                <div className="w-10 h-10 mx-auto mb-2 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Icon d={path} className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
                </div>
                <h5 className="text-sm font-semibold text-zinc-900 dark:text-white">{label}</h5>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 lg:py-24 max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <SectionPill>FAQ</SectionPill>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-900 dark:text-white">Common questions</h2>
        </div>
        <BgFaq faqs={FAQS} />
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-16 lg:py-24 text-center bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-zinc-900/30 border-t border-zinc-200 dark:border-zinc-700/60">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-900 dark:text-white mb-3">Need a full website for your business?</h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed mb-6">
            Brave Syntax builds fast, SEO-optimized websites and web apps for Indian SMBs. Custom design, no templates.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-mono font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25"
          >
            Talk to us →
          </Link>
        </div>
      </section>
    </div>
  );
}
