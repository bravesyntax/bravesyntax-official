"use client";

import { ArrowRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { baseName, formatBytes, zipFiles, type OutFile } from "@/lib/tools/pdf";
import { CopyButton, DownloadLink, ErrorNote, Field, FilePicker, fieldClass, Panel, ProgressBar, ResultCard, RunButton, Segmented, Select } from "./kit";

// Image compressor, resizer, converter and favicon generator. All of it runs on a canvas in the browser.

type Format = "image/jpeg" | "image/png" | "image/webp";
const EXT: Record<Format, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const asFormat = (type: string): Format => (type === "image/png" || type === "image/webp" ? type : "image/jpeg");

const PRESETS: [string, string, number, number][] = [
  ["custom", "Custom size", 0, 0],
  ["ig-square", "Instagram post (1080 × 1080)", 1080, 1080],
  ["ig-story", "Instagram story (1080 × 1920)", 1080, 1920],
  ["fb-post", "Facebook post (1200 × 630)", 1200, 630],
  ["yt-thumb", "YouTube thumbnail (1280 × 720)", 1280, 720],
  ["linkedin", "LinkedIn post (1200 × 627)", 1200, 627],
  ["og", "Website share image (1200 × 630)", 1200, 630],
  ["passport", "Passport photo (413 × 531)", 413, 531],
];

async function encode(canvas: HTMLCanvasElement, type: Format, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), type, quality));
}

function draw(bitmap: ImageBitmap, w: number, h: number, format: Format, cover = false) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  if (format === "image/jpeg") {
    ctx.fillStyle = "#fff"; // JPG has no transparency, and a black background is what you'd get otherwise
    ctx.fillRect(0, 0, w, h);
  }
  if (cover) {
    const scale = Math.max(w / bitmap.width, h / bitmap.height);
    const sw = w / scale;
    const sh = h / scale;
    ctx.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, w, h);
  } else {
    ctx.drawImage(bitmap, 0, 0, w, h);
  }
  return canvas;
}

type Row = { file: File; out?: OutFile };

function Batch({ rows, setRows }: { rows: Row[]; setRows: (r: Row[]) => void }) {
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {rows.map((r, i) => {
        const saved = r.out ? Math.round((1 - r.out.blob.size / r.file.size) * 100) : 0;
        return (
          <li key={`${r.file.name}-${i}`} className="flex flex-wrap items-center gap-2 p-3 sm:flex-nowrap">
            <span className="min-w-0 flex-1 basis-full sm:basis-0">
              <span className="block truncate text-sm font-medium">{r.file.name}</span>
              <span className="block text-xs text-muted-foreground">
                {formatBytes(r.file.size)}
                {r.out && (
                  <>
                    {" → "}
                    {formatBytes(r.out.blob.size)}
                    {saved > 0 && <span className="font-medium text-primary"> ({saved}% smaller)</span>}
                  </>
                )}
              </span>
            </span>
            {r.out ? (
              <DownloadLink file={r.out} className="shrink-0 border-primary/40">
                <span>Download</span>
              </DownloadLink>
            ) : (
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${r.file.name}`} onClick={() => setRows(rows.filter((_, n) => n !== i))}>
                <Trash2 aria-hidden="true" />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function ImageTool({ mode }: { mode: "compress" | "resize" | "convert" }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [quality, setQuality] = useState(78);
  const [format, setFormat] = useState<"same" | Format>(mode === "convert" ? "image/webp" : "same");
  const [preset, setPreset] = useState("custom");
  const [width, setWidth] = useState("1200");
  const [height, setHeight] = useState("");
  const [fit, setFit] = useState<"keep" | "cover">("keep");
  const [progress, setProgress] = useState<{ percent: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [zip, setZip] = useState<OutFile | null>(null);
  const done = rows.length > 0 && rows.every((r) => r.out);

  const add = (files: File[]) => {
    setError("");
    setZip(null);
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length < files.length) setError("Only image files can be added here.");
    setRows((current) => [...current.filter((r) => !r.out), ...images.map((file) => ({ file }))]);
  };

  const run = async () => {
    setError("");
    setZip(null);
    const out: Row[] = [];
    try {
      for (let i = 0; i < rows.length; i++) {
        const { file } = rows[i];
        setProgress({ percent: (i / rows.length) * 100, label: `Processing ${file.name}` });
        let bitmap: ImageBitmap;
        try {
          bitmap = await createImageBitmap(file);
        } catch {
          throw new Error(`${file.name} can't be read. iPhone HEIC photos need to be saved as JPG first.`);
        }
        // PNG ignores the quality setting, so the compressor's automatic choice turns it into WebP, which also keeps transparency.
        const type = format !== "same" ? format : mode === "compress" && asFormat(file.type) !== "image/jpeg" ? "image/webp" : asFormat(file.type);
        let w = bitmap.width;
        let h = bitmap.height;
        let cover = false;
        if (mode === "resize") {
          const tw = Number(width) || 0;
          const th = Number(height) || 0;
          if (!tw && !th) throw new Error("Enter a width or a height.");
          if (tw && th && fit === "cover") {
            w = tw;
            h = th;
            cover = true;
          } else {
            const scale = tw && th ? Math.min(tw / w, th / h) : tw ? tw / w : th / h;
            w = Math.max(1, Math.round(w * scale));
            h = Math.max(1, Math.round(h * scale));
          }
        }
        // Sizes this large crash mobile browsers, so they're refused with an explanation rather than a blank tab.
        if (w * h > 60_000_000) throw new Error("That size is too large for a browser to handle. Try smaller dimensions.");
        const q = mode === "compress" ? quality / 100 : 0.92;
        let blob = await encode(draw(bitmap, w, h, type, cover), type, q);
        // PNG ignores quality, so for the compressor it can come out bigger. Keep whichever is smaller.
        if (mode === "compress" && blob.size >= file.size && type === file.type) blob = file;
        out.push({ file, out: { name: `${baseName(file.name)}${mode === "resize" ? `-${w}x${h}` : mode === "compress" ? "-compressed" : ""}.${EXT[type]}`, blob } });
      }
      setRows(out);
      if (out.length > 1) setZip(await zipFiles(out.map((r) => r.out!), "images.zip"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "These images could not be processed.");
    } finally {
      setProgress(null);
    }
  };

  const before = rows.reduce((n, r) => n + r.file.size, 0);
  const after = rows.reduce((n, r) => n + (r.out?.blob.size ?? 0), 0);

  return (
    <div className="space-y-4">
      {done ? (
        <ResultCard
          title={mode === "compress" ? (after < before ? `${Math.round((1 - after / before) * 100)}% smaller` : "Already well compressed") : `${rows.length} image${rows.length === 1 ? "" : "s"} ready`}
          detail={`${formatBytes(before)} → ${formatBytes(after)}`}
          file={zip ?? rows[0].out}
          onReset={() => {
            setRows([]);
            setZip(null);
          }}
          resetLabel="Use other images"
        />
      ) : (
        <FilePicker accept="image/*" multiple compact={rows.length > 0} title={rows.length ? "Add more images" : "Choose images or drop them here"} hint="JPG, PNG, WebP. Stays on your device." onFiles={add} />
      )}
      {rows.length > 0 && <Batch rows={rows} setRows={setRows} />}
      {error && <ErrorNote>{error}</ErrorNote>}
      {rows.length > 0 && !done && (
        <>
          <Panel className="grid gap-4 sm:grid-cols-2">
            {mode === "compress" && (
              <Field label={`Quality: ${quality}`} hint="Around 75 to 80 looks the same for most photos.">
                <input type="range" min={30} max={95} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-primary" />
              </Field>
            )}
            {mode === "resize" && (
              <>
                <Field label="Size" className="sm:col-span-2">
                  <select
                    value={preset}
                    className={fieldClass}
                    onChange={(e) => {
                      setPreset(e.target.value);
                      const p = PRESETS.find(([id]) => id === e.target.value);
                      if (p && p[2]) {
                        setWidth(String(p[2]));
                        setHeight(String(p[3]));
                        setFit("cover");
                      }
                    }}
                  >
                    {PRESETS.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Width (px)" hint="Leave one empty to keep the proportions.">
                  <Input type="number" min={1} value={width} onChange={(e) => { setWidth(e.target.value); setPreset("custom"); }} className="h-11" />
                </Field>
                <Field label="Height (px)">
                  <Input type="number" min={1} value={height} onChange={(e) => { setHeight(e.target.value); setPreset("custom"); }} className="h-11" />
                </Field>
                {width && height && (
                  <div className="sm:col-span-2">
                    <Segmented label="How to fit" value={fit} onChange={setFit} options={[["keep", "Fit inside, keep everything"], ["cover", "Fill exactly, crop edges"]]} />
                  </div>
                )}
              </>
            )}
            <Field label={mode === "convert" ? "Convert to" : "Format"}>
              <Select<"same" | Format> value={format} onChange={setFormat} options={[...(mode === "convert" ? [] : ([["same", mode === "compress" ? "Automatic (JPG stays JPG, PNG becomes WebP)" : "Keep original format"]] as ["same", string][])), ["image/webp", "WebP (smallest, for websites)"], ["image/jpeg", "JPG (photos)"], ["image/png", "PNG (transparency)"]]} />
            </Field>
          </Panel>
          {progress ? (
            <ProgressBar percent={progress.percent} label={progress.label} />
          ) : (
            <div className="flex justify-center">
              <RunButton onClick={run}>
                {mode === "compress" ? "Compress images" : mode === "resize" ? "Resize images" : "Convert images"} <ArrowRight className="size-4" aria-hidden="true" />
              </RunButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const ICON_SIZES: [string, number][] = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["favicon-48x48.png", 48],
  ["apple-touch-icon.png", 180],
  ["android-chrome-192x192.png", 192],
  ["android-chrome-512x512.png", 512],
];
const SNIPPET = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

export function FaviconTool() {
  const [source, setSource] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ name: string; url: string; size: number }[]>([]);
  const [zip, setZip] = useState<OutFile | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => () => preview.forEach((p) => URL.revokeObjectURL(p.url)), [preview]);

  const build = async (file: File) => {
    setError("");
    setZip(null);
    setPreview([]);
    try {
      const bitmap = await createImageBitmap(file);
      setSource(file);
      setNote(bitmap.width !== bitmap.height ? "Your image isn't square, so its edges were cropped. A square image gives the best result." : bitmap.width < 512 ? "Your image is smaller than 512 pixels, so the largest icons may look soft." : "");
      const out: OutFile[] = [];
      for (const [name, size] of ICON_SIZES) {
        const blob = await encode(draw(bitmap, size, size, "image/png", true), "image/png", 1);
        out.push({ name, blob });
      }
      const manifest = { icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }, { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }] };
      out.push({ name: "site.webmanifest", blob: new Blob([JSON.stringify(manifest, null, 2)], { type: "application/manifest+json" }) });
      setPreview(out.filter((o) => o.name.endsWith(".png")).map((o, i) => ({ name: o.name, url: URL.createObjectURL(o.blob), size: ICON_SIZES[i][1] })));
      setZip(await zipFiles(out, "favicons.zip"));
    } catch {
      setError("This image can't be read. Try a PNG or JPG.");
      setSource(null);
    }
  };

  return (
    <div className="space-y-4">
      {!zip && <FilePicker accept="image/png,image/jpeg,image/webp,image/svg+xml" onFiles={(f) => build(f[0])} title="Choose your logo or drop it here" hint="A square PNG of at least 512 pixels works best." />}
      {error && <ErrorNote>{error}</ErrorNote>}
      {zip && source && (
        <ResultCard title="Favicon set ready" detail={note || `Made from ${source.name}`} file={zip} onReset={() => { setZip(null); setSource(null); setPreview([]); }} resetLabel="Use another image">
          <div className="flex flex-wrap items-end gap-4">
            {preview.map((p) => (
              <figure key={p.name} className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a generated icon */}
                <img src={p.url} alt="" width={Math.min(p.size, 64)} height={Math.min(p.size, 64)} className="mx-auto rounded border bg-white" />
                <figcaption className="mt-1 text-xs text-muted-foreground">{p.size}px</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Upload the files to your site&apos;s root folder, then add this inside &lt;head&gt;:</p>
            <pre className="overflow-x-auto rounded-xl border bg-background p-3 text-xs">{SNIPPET}</pre>
            <CopyButton text={SNIPPET} label="Copy code" />
          </div>
        </ResultCard>
      )}
    </div>
  );
}
