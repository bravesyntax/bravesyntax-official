"use client";

import { Check, Copy, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatBytes, uploadMedia } from "@/lib/admin/upload-client";

/** Drag-and-drop or pick several files: each is optimised (images → WebP), uploaded and added to the library. */
export function MediaUploader() {
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  async function run(files: FileList | null) {
    if (!files?.length || busy) return;
    setBusy(true);
    const list = Array.from(files);
    const lines = list.map((f) => `${f.name}: waiting`);
    setLog([...lines]);
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      try {
        const item = await uploadMedia(f, (p, stage) => {
          lines[i] = `${f.name}: ${stage.toLowerCase()}${p ? ` ${p}%` : "…"}`;
          setLog([...lines]);
        });
        const saved = f.size && item.size_bytes ? Math.round((1 - item.size_bytes / f.size) * 100) : 0;
        lines[i] = `✓ ${item.name} (${formatBytes(item.size_bytes)}${saved > 5 ? `, ${saved}% smaller` : ""})`;
      } catch (err) {
        lines[i] = `✗ ${f.name}: ${err instanceof Error ? err.message : "upload failed"}`;
      }
      setLog([...lines]);
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="mb-6">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          run(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${over ? "border-brand bg-brand/5" : "border-zinc-700 hover:border-zinc-500"} ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        <Upload className="size-6 text-zinc-400" aria-hidden="true" />
        <span className="text-sm font-medium text-white">{busy ? "Uploading…" : "Drop images or videos here, or click to choose"}</span>
        <span className="text-xs text-zinc-500">JPG, PNG, WebP, GIF (resized to 1920 px and converted to WebP) · MP4, WebM up to 50 MB</span>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" className="sr-only" onChange={(e) => run(e.target.files)} />
      </label>
      {log.length > 0 && (
        <ul role="status" className="mt-3 space-y-1 font-mono text-xs text-zinc-400">
          {log.map((l, i) => (
            <li key={i} className={l.startsWith("✓") ? "text-brand" : l.startsWith("✗") ? "text-red-400" : ""}>
              {l}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Copies a file's full address, for pasting into a page, email or post. */
export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const full = url.startsWith("/") ? `${location.origin}${url}` : url;
        await navigator.clipboard.writeText(full).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-brand"
    >
      {done ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />} {done ? "Copied" : "Copy link"}
    </button>
  );
}
