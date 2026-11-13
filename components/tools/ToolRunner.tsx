"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Each tool's code loads only on its own page. They use browser-only APIs, so none of them render on the server.

const loading = () => (
  <div className="grid h-64 place-items-center rounded-2xl border border-dashed" role="status" aria-label="Loading the tool">
    <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
  </div>
);
const client = (load: () => Promise<{ default: ComponentType<object> }>) => dynamic(load, { ssr: false, loading });

const PdfTool = dynamic(() => import("./PdfTool"), { ssr: false, loading });
const ImageTool = dynamic(() => import("./ImageTools"), { ssr: false, loading });

const TOOLS: Record<string, ComponentType<object>> = {
  "website-audit": client(() => import("./WebsiteAuditTool")),
  "invoice-generator": client(() => import("./InvoiceTool")),
  "favicon-generator": client(() => import("./ImageTools").then((m) => ({ default: m.FaviconTool }))),
  "qr-code-generator": client(() => import("./WebTools").then((m) => ({ default: m.QrTool }))),
  "whatsapp-link-generator": client(() => import("./WebTools").then((m) => ({ default: m.WhatsAppTool }))),
  "meta-tag-generator": client(() => import("./WebTools").then((m) => ({ default: m.MetaTool }))),
  "utm-builder": client(() => import("./WebTools").then((m) => ({ default: m.UtmTool }))),
  "word-counter": client(() => import("./WebTools").then((m) => ({ default: m.WordCounterTool }))),
  "password-generator": client(() => import("./WebTools").then((m) => ({ default: m.PasswordTool }))),
  "json-formatter": client(() => import("./WebTools").then((m) => ({ default: m.JsonTool }))),
};

export default function ToolRunner({ slug, kind }: { slug: string; kind: "pdf" | "web" }) {
  if (kind === "pdf") return <PdfTool slug={slug} />;
  if (slug === "image-compressor") return <ImageTool mode="compress" />;
  if (slug === "image-resizer") return <ImageTool mode="resize" />;
  if (slug === "image-converter") return <ImageTool mode="convert" />;
  const Tool = TOOLS[slug];
  return Tool ? <Tool /> : null;
}
