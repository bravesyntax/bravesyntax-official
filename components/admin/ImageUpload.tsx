"use client";

import { useEffect, useRef, useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { FileDrop } from "@/components/velora/file-drop";
import { formatBytes, uploadMedia } from "@/lib/admin/upload-client";
import { mediaUrl, type MediaKind } from "@/lib/media";

// Featured image field for blog posts and portfolio items. A new file is resized and converted to WebP in the
// browser, uploaded to Vercel Blob and added to Admin → Media as soon as it's picked; or an existing file can be
// chosen from the media library. The form then submits only the file's address (hidden "image_url" input).
// While a file is still uploading the form can't be saved: otherwise the post is saved without the image.

const MAX_LOCAL_BYTES = 5 * 1024 * 1024;

export default function ImageUpload({ kind, current, mode, hint }: { kind: MediaKind; current: string | null; mode: "blob" | "local" | null; hint: string }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const guard = useRef<HTMLInputElement>(null);

  // A hidden field that is invalid while uploading: the browser blocks the form and shows the message.
  useEffect(() => {
    guard.current?.setCustomValidity(busy ? "Please wait: the image is still uploading. Save once it says Uploaded." : "");
  }, [busy]);

  async function onPick(file: File | undefined) {
    if (!file || busy) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return setStatus("Only JPG, PNG, WebP or GIF images.");
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    setProgress(0);
    setUrl("");
    setStatus("Uploading… please wait before saving.");
    try {
      if (mode === "local") {
        if (file.size > MAX_LOCAL_BYTES) throw new Error("Image too large. Max 5 MB.");
        const body = new FormData();
        body.append("kind", kind);
        body.append("file", file);
        const res = await fetch("/api/admin/upload-local", { method: "POST", body });
        const data = (await res.json().catch(() => ({}))) as { name?: string; error?: string };
        if (!res.ok || !data.name) throw new Error(data.error || "Upload failed.");
        setUrl(data.name);
        setStatus("Uploaded ✓ Now save the post to keep it.");
        return;
      }
      const item = await uploadMedia(file, (p, stage) => {
        setProgress(p);
        setStatus(stage === "Optimising" ? "Optimising (WebP)… please wait before saving." : "Uploading… please wait before saving.");
      });
      setUrl(item.url);
      setStatus(`Uploaded ✓ ${item.width && item.height ? `${item.width}×${item.height} WebP, ` : ""}${formatBytes(item.size_bytes)}. Now save the post to keep it.`);
    } catch (err) {
      setPreview("");
      setStatus(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="block text-xs font-mono text-zinc-400">
          Featured Image <span className="text-zinc-600">({hint})</span>
        </span>
        {mode === "blob" && (
          <MediaPicker
            onSelect={(m) => {
              setUrl(m.url);
              setPreview(m.url);
              setStatus(`Chosen from Media: ${m.name}. Now save the post to keep it.`);
            }}
          />
        )}
      </div>
      <input type="hidden" name="image_url" value={url} />
      <input ref={guard} aria-hidden="true" tabIndex={-1} className="sr-only" defaultValue="" />
      <div className="flex items-start gap-5">
        <div className="flex-1">
          {mode ? (
            <>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element -- local object-URL or library preview
                <img src={preview} alt="" className="mb-3 h-40 w-full rounded-xl border object-contain" />
              )}
              <FileDrop accept=".jpg,.jpeg,.png,.webp,.gif" multiple={false} onFiles={(files) => onPick(files[0])} />
              {mode === "blob" && <p className="mt-1.5 text-[11px] text-zinc-600">Large photos are resized to 1920 px and converted to WebP automatically.</p>}
            </>
          ) : (
            <p className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              Image uploads on Vercel need a Blob store (BLOB_READ_WRITE_TOKEN). Existing images stay as they are.
            </p>
          )}
          {busy && progress > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {status && (
            <p role="status" className={`mt-2 text-xs font-mono ${status.includes("✓") || status.startsWith("Chosen") ? "text-brand" : busy ? "text-amber-400" : "text-red-400"}`}>
              {busy && progress > 0 ? `${status} ${progress}%` : status}
            </p>
          )}
        </div>
        {current && (
          <div className="flex-shrink-0">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Current</div>
            <div className="w-48 h-28 rounded-xl overflow-hidden border border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
              <img src={mediaUrl(kind, current)} alt="" className="w-full h-full object-contain" />
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" name="remove_image" value="1" className="rounded border-zinc-600" />
              <span className="text-xs font-mono text-red-400">Remove image</span>
            </label>
            <p className="mt-1 max-w-48 text-[10px] text-zinc-600">Removing only unlinks it; the file stays in Media.</p>
          </div>
        )}
      </div>
    </div>
  );
}
