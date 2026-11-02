"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import Icon from "@/components/ui/Icon";

// AI background removal, 100% in the browser (@imgly/background-removal, WASM). Ported from pages/bg-remover.php.
const LIBRARY_URL = "https://esm.sh/@imgly/background-removal@1.7.0";
const MAX_BYTES = 15 * 1024 * 1024;
const STEPS = ["Load model", "Analyse image", "Remove BG", "Done"];
const SWATCHES = [
  ["transparent", "Transparent"],
  ["#ffffff", "White"],
  ["#000000", "Black"],
  ["#10b981", "Emerald"],
  ["#3b82f6", "Blue"],
  ["#f59e0b", "Amber"],
  ["#ec4899", "Pink"],
];

type RemoveBackground = (
  file: Blob,
  config?: { progress?: (key: string, current: number, total: number) => void },
) => Promise<Blob>;

let libraryPromise: Promise<RemoveBackground> | null = null;
function loadLibrary() {
  libraryPromise ??= import(/* webpackIgnore: true */ LIBRARY_URL).then((m: { removeBackground: RemoveBackground }) => m.removeBackground);
  return libraryPromise;
}

type Stage = "upload" | "progress" | "result";

export default function BgRemoverTool() {
  const [stage, setStage] = useState<Stage>("upload");
  const [pct, setPct] = useState(0);
  const [status, setStatus] = useState("Loading AI model…");
  const [step, setStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("result.png");
  const [originalUrl, setOriginalUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [bg, setBg] = useState("transparent");
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultImg = useRef<HTMLImageElement | null>(null);
  const cutoutUrl = useRef(""); // the transparent PNG returned by the model
  const urls = useRef<string[]>([]);

  const track = (url: string) => (urls.current.push(url), url);
  const revokeAll = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
  };
  useEffect(() => revokeAll, []);

  const showToast = useCallback((msg: string, type = "") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const progress = (p: number, label?: string) => {
    setPct(p);
    if (label) setStatus(label);
  };

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) return showToast("Please upload a valid image file", "error");
    if (file.size > MAX_BYTES) return showToast("File too large (max 15 MB)", "error");

    setOriginalUrl(track(URL.createObjectURL(file)));
    const name = `${file.name.replace(/\.[^/.]+$/, "")}-nobg.png`;
    setFileName(name);
    setStage("progress");
    progress(5, "Preparing image…");
    setStep(1);

    try {
      const removeBackground = await loadLibrary().catch(() => {
        libraryPromise = null;
        throw new Error("AI model failed to load. Please refresh the page and try again.");
      });
      progress(15, "Loading AI model…");

      setStep(2);
      progress(62, "Analysing image…");
      await new Promise((r) => setTimeout(r, 80));
      setStep(3);
      progress(68, "Removing background…");

      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          if (total === 0 || !key.startsWith("fetch:")) return;
          progress(Math.min(15 + (current / total) * 45, 60), "Downloading AI model…");
          setStep(1);
        },
      });

      progress(90, "Rendering result…");
      const img = new Image();
      img.onload = () => {
        resultImg.current = img;
        cutoutUrl.current = track(URL.createObjectURL(blob));
        setDownloadUrl(cutoutUrl.current);
        setBg("transparent");
        progress(100, "Done!");
        setStep(4);
        setTimeout(() => {
          setStage("result");
          showToast("Background removed! Download your PNG.", "success");
        }, 500);
      };
      img.src = track(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      showToast(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`, "error");
      setStage("upload");
    }
  }

  // Redraw the cutout (with the chosen background) whenever the result or colour changes.
  useEffect(() => {
    const img = resultImg.current;
    const canvas = canvasRef.current;
    if (stage !== "result" || !img || !canvas) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    if (bg === "transparent") return setDownloadUrl(cutoutUrl.current);
    canvas.toBlob((b) => b && setDownloadUrl(track(URL.createObjectURL(b))), "image/png");
  }, [stage, bg]);

  function reset() {
    if (inputRef.current) inputRef.current.value = "";
    revokeAll();
    resultImg.current = null;
    cutoutUrl.current = "";
    setOriginalUrl("");
    setDownloadUrl("");
    setBg("transparent");
    progress(0, "");
    setStep(0);
    setStage("upload");
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 pb-12">
      <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-sm overflow-hidden">
        {stage === "upload" && (
          <div
            className={`upload-zone${dragOver ? " drag-over" : ""} relative p-10 sm:p-16 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl m-4 bg-zinc-100/50 dark:bg-zinc-800/30 cursor-pointer hover:border-emerald-500 transition-all`}
            role="button"
            tabIndex={0}
            aria-label="Upload image to remove background"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Choose image file"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
            <div className="w-14 h-14 mx-auto mb-4 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-7 h-7 text-emerald-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-display font-semibold text-zinc-900 dark:text-white mb-1">Drag &amp; drop your image here</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              or <span className="text-emerald-600 dark:text-emerald-400 font-semibold">browse to choose</span> a file
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["JPG", "PNG", "WEBP", "GIF", "Up to 15 MB"].map((t) => (
                <span key={t} className="px-2.5 py-0.5 bg-zinc-200 dark:bg-zinc-700/50 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono font-semibold rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {stage === "progress" && (
          <div className="p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-emerald-500 animate-spin" />
            <p className="font-display text-lg font-semibold text-zinc-900 dark:text-white mb-1">Processing your image…</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{status}</p>
            <div className="max-w-sm mx-auto mt-4 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div className="progress-bar-fill h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{Math.round(pct)}%</p>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {STEPS.map((label, i) => (
                <div key={label} className={`step-item${i + 1 < step ? " done" : i + 1 === step ? " active" : ""} flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400`}>
                  <div className="step-dot">{i + 1}</div>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {stage === "result" && (
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{fileName}</span>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Icon
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    className="w-4 h-4"
                    strokeWidth={2}
                  />
                  New Image
                </button>
                <a
                  href={downloadUrl}
                  download={fileName}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-4 h-4" strokeWidth={2} />
                  Download PNG
                </a>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase">Original</div>
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, nothing to optimise */}
                <img src={originalUrl} alt="Original uploaded image" className="w-full h-64 object-contain" />
              </div>
              <div
                className="relative result-canvas-wrap border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden"
                style={bg !== "transparent" ? { background: bg } : undefined}
              >
                <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase">Background Removed</div>
                <canvas ref={canvasRef} className="w-full h-64 object-contain" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-700">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Background:</span>
              {SWATCHES.map(([color, label]) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBg(color)}
                  className={`bg-swatch${color === "transparent" ? " transparent-swatch" : ""}${bg === color ? " active" : ""}`}
                  style={color !== "transparent" ? { background: color } : undefined}
                  title={label}
                  aria-label={`${label} background`}
                  aria-pressed={bg === color}
                />
              ))}
              <input
                type="color"
                id="bg-color-picker"
                title="Custom color"
                aria-label="Custom background color"
                onChange={(e) => setBg(e.target.value)}
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Custom →</span>
            </div>

            <div className="text-center pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-4 h-4" strokeWidth={2} />
                Remove background from another image
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`toast${toast ? ` show ${toast.type}` : ""}`} role="alert" aria-live="polite">
        {toast?.msg}
      </div>
    </div>
  );
}
