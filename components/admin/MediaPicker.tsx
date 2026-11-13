"use client";

import { Film, ImageIcon, Images, Search, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { pickerList, type MediaItem } from "@/app/admin/(panel)/media/actions";
import { formatBytes, uploadMedia } from "@/lib/admin/upload-client";

type Accept = "image" | "video" | "all";

/**
 * "Choose from Media" button and window: lists the media library (newest first) with search and an upload
 * button, and hands the chosen file to `onSelect`. Used by image fields, the article editor and SEO settings.
 */
export function MediaPicker({ accept = "image", onSelect, label = "Choose from Media", className }: { accept?: Accept; onSelect: (item: MediaItem) => void; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-brand/50 hover:text-brand"}
      >
        <Images className="size-3.5" aria-hidden="true" /> {label}
      </button>
      {open && (
        <PickerDialog
          accept={accept}
          onClose={() => setOpen(false)}
          onSelect={(item) => {
            onSelect(item);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function PickerDialog({ accept, onClose, onSelect }: { accept: Accept; onClose: () => void; onSelect: (item: MediaItem) => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Accept>(accept);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pickerList(accept)
      .then(setItems)
      .catch(() => setStatus("Couldn't load the media library."));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [accept, onClose]);

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const item = await uploadMedia(f, (p, stage) => setStatus(`${stage} ${f.name}… ${p ? `${p}%` : ""}`));
        setItems((cur) => [item, ...(cur ?? [])]);
      }
      setStatus("Uploaded ✓ Click a file to use it.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const term = q.trim().toLowerCase();
  const shown = (items ?? []).filter((m) => (tab === "all" || m.kind === tab) && (!term || m.name.toLowerCase().includes(term) || (m.alt ?? "").toLowerCase().includes(term)));
  const accepts = accept === "image" ? "image/jpeg,image/png,image/webp,image/gif" : accept === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Media library">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-white">Media library</h2>
          {accept === "all" && (
            <div className="flex gap-1">
              {(["all", "image", "video"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-full px-3 py-1 text-xs ${tab === k ? "bg-brand text-black" : "text-zinc-400 hover:text-white"}`}>
                  {k === "all" ? "All" : k === "image" ? "Images" : "Videos"}
                </button>
              ))}
            </div>
          )}
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files" aria-label="Search files" className="h-8 w-44 rounded-lg border border-zinc-700 bg-zinc-900 pr-3 pl-8 text-xs text-white outline-none focus:border-brand" />
          </div>
          <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-black ${busy ? "pointer-events-none opacity-60" : ""}`}>
            <Upload className="size-3.5" aria-hidden="true" /> Upload new
            <input ref={fileRef} type="file" multiple accept={accepts} className="sr-only" onChange={(e) => onUpload(e.target.files)} />
          </label>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <X className="size-5" />
          </button>
        </div>
        {status && (
          <p role="status" className="border-b border-zinc-800 px-5 py-2 text-xs text-zinc-400">
            {status}
          </p>
        )}
        <div className="overflow-y-auto p-5">
          {items === null ? (
            <p className="py-16 text-center text-sm text-zinc-500">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="py-16 text-center text-sm text-zinc-500">No files{term ? " match your search" : " yet. Upload one above"}.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {shown.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => onSelect(m)} className="group w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-left hover:border-brand focus-visible:border-brand focus-visible:outline-none">
                    <div className="relative aspect-[4/3] bg-zinc-800">
                      {m.kind === "video" ? (
                        <video src={m.url} muted preload="metadata" className="size-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail, straight from storage
                        <img src={m.url} alt={m.alt ?? ""} loading="lazy" className="size-full object-cover" />
                      )}
                      <span className="absolute top-1.5 left-1.5 rounded bg-black/70 p-1 text-white">{m.kind === "video" ? <Film className="size-3" aria-hidden="true" /> : <ImageIcon className="size-3" aria-hidden="true" />}</span>
                    </div>
                    <div className="px-2.5 py-2">
                      <div className="truncate text-xs text-zinc-200 group-hover:text-brand">{m.name}</div>
                      <div className="text-[10px] text-zinc-500">
                        {m.width && m.height ? `${m.width}×${m.height} · ` : ""}
                        {formatBytes(m.size_bytes)}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
