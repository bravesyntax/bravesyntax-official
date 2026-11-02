"use client";

import { useState } from "react";
import { mediaUrl, type MediaKind } from "@/lib/media";

// Featured image field for blog posts and portfolio items. The file uploads as soon as it's picked — to Vercel
// Blob, or (local mode) to public/uploads/ on this server — and the form then submits only the resulting
// Blob URL or filename (in the hidden "image_url" input).

const MAX_BYTES = 5 * 1024 * 1024;

export default function ImageUpload({ kind, current, mode, hint }: { kind: MediaKind; current: string | null; mode: "blob" | "local" | null; hint: string }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return setStatus("Invalid file type.");
    if (file.size > MAX_BYTES) return setStatus("Image too large. Max 5 MB.");
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    setStatus("Uploading…");
    try {
      if (mode === "local") {
        const body = new FormData();
        body.append("kind", kind);
        body.append("file", file);
        const res = await fetch("/api/admin/upload-local", { method: "POST", body });
        const data = (await res.json().catch(() => ({}))) as { name?: string; error?: string };
        if (!res.ok || !data.name) throw new Error(data.error || "Upload failed.");
        setUrl(data.name);
        setStatus("Uploaded ✓");
        return;
      }
      const { upload } = await import("@vercel/blob/client");
      const ext = file.name.split(".").pop()?.toLowerCase().replace("jpeg", "jpg") ?? "jpg";
      const blob = await upload(`${kind}/${kind === "blog" ? "blog" : "pf"}_${Date.now()}.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      setUrl(blob.url);
      setStatus("Uploaded ✓");
    } catch (err) {
      setPreview("");
      setStatus(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="block text-xs font-mono text-zinc-400 mb-3">
        Featured Image <span className="text-zinc-600">({hint})</span>
      </span>
      <input type="hidden" name="image_url" value={url} />
      <div className="flex items-start gap-5">
        <div className="flex-1">
          {mode ? (
            <label className="group relative flex flex-col items-center justify-center w-full h-40 bg-zinc-800/30 border-2 border-dashed border-zinc-700 hover:border-accent/50 rounded-xl cursor-pointer transition-all overflow-hidden">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object-URL preview
                <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-zinc-600 group-hover:text-accent/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs font-mono text-zinc-500">Click to upload</span>
                </span>
              )}
              <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="sr-only" disabled={busy} onChange={(e) => onPick(e.target.files?.[0])} />
            </label>
          ) : (
            <p className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              Image uploads on Vercel need a Blob store (BLOB_READ_WRITE_TOKEN). Existing images stay as they are.
            </p>
          )}
          {status && <p className={`mt-2 text-xs font-mono ${status.includes("✓") || status.endsWith("…") ? "text-zinc-400" : "text-red-400"}`}>{status}</p>}
        </div>
        {current && (
          <div className="flex-shrink-0">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Current</div>
            <div className="w-48 h-28 rounded-xl overflow-hidden border border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
              <img src={mediaUrl(kind, current)} alt="" className="w-full h-full object-cover" />
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" name="remove_image" value="1" className="rounded border-zinc-600" />
              <span className="text-xs font-mono text-red-400">Remove image</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
