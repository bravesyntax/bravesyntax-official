"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Eraser, FileText, Loader2, Minus, Plus, Trash2, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addPageNumbers,
  baseName,
  compressPdf,
  cropPdf,
  extractText,
  extractTextOcr,
  flattenPdf,
  formatBytes,
  imagesToPdf,
  mergePdfs,
  openForReading,
  parseRanges,
  pdfToImages,
  pickPages,
  protectPdf,
  readBytes,
  readMetadata,
  renderPage,
  repairPdf,
  rotatePdf,
  signPdf,
  splitPdf,
  textToDocx,
  ToolError,
  unlockPdf,
  watermarkPdf,
  writeMetadata,
  zipFiles,
  type CompressLevel,
  type ImagePdfOptions,
  type Metadata,
  type OutFile,
  type PageNumberOptions,
  type WatermarkOptions,
} from "@/lib/tools/pdf";
import { cn } from "@/lib/utils";
import { CopyButton, DownloadLink, ErrorNote, Field, FilePicker, Note, Panel, ProgressBar, ResultCard, RunButton, Segmented, Select } from "./kit";

/* eslint-disable @typescript-eslint/no-explicit-any -- pdf.js has no types here */

// One workspace for all PDF tools. The steps are the same everywhere (add file, set options, run, download);
// what differs per tool is its options and how pages are picked.

type Result = { title: string; detail?: string; file?: OutFile; files?: OutFile[]; text?: string };
const THUMB_TOOLS = new Set(["split-pdf", "reorder-pdf-pages", "delete-pdf-pages", "rotate-pdf"]);
const RUN_LABEL: Record<string, string> = {
  "merge-pdf": "Merge PDFs",
  "split-pdf": "Split PDF",
  "reorder-pdf-pages": "Save new order",
  "delete-pdf-pages": "Delete selected pages",
  "rotate-pdf": "Rotate PDF",
  "compress-pdf": "Compress PDF",
  "watermark-pdf": "Add watermark",
  "add-page-numbers": "Add page numbers",
  "sign-pdf": "Sign PDF",
  "crop-pdf": "Crop PDF",
  "edit-pdf-metadata": "Save details",
  "flatten-pdf": "Flatten PDF",
  "repair-pdf": "Repair PDF",
  "image-to-pdf": "Create PDF",
  "pdf-to-image": "Convert to images",
  "pdf-to-text": "Extract text",
  "pdf-to-word": "Convert to Word",
  "protect-pdf": "Protect PDF",
  "unlock-pdf": "Unlock PDF",
};
const OCR_LANGS: [string, string][] = [
  ["eng", "English"],
  ["hin", "Hindi"],
  ["hin+eng", "Hindi + English"],
  ["mar", "Marathi"],
  ["ben", "Bengali"],
  ["guj", "Gujarati"],
  ["pan", "Punjabi"],
  ["tam", "Tamil"],
  ["tel", "Telugu"],
  ["kan", "Kannada"],
  ["mal", "Malayalam"],
  ["urd", "Urdu"],
];

export default function PdfTool({ slug }: { slug: string }) {
  const isImages = slug === "image-to-pdf";
  const multi = slug === "merge-pdf" || isImages;
  const [files, setFiles] = useState<File[]>([]);
  const [thumbs, setThumbs] = useState<{ index: number; url: string }[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<{ percent: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);

  // Options
  const [splitMode, setSplitMode] = useState<"select" | "ranges" | "every">("select");
  const [ranges, setRanges] = useState("");
  const [angle, setAngle] = useState("90");
  const [rotateTarget, setRotateTarget] = useState<"all" | "selected">("all");
  const [level, setLevel] = useState<CompressLevel>("balanced");
  const [wm, setWm] = useState<WatermarkOptions>({ text: "CONFIDENTIAL", position: "center", size: 60, opacity: 0.2, color: "#6b7280" });
  const [num, setNum] = useState<PageNumberOptions>({ position: "bottom-center", format: "n", startAt: 1, fontSize: 11 });
  const [imgOpt, setImgOpt] = useState<ImagePdfOptions>({ size: "a4", margin: 24 });
  const [imgFormat, setImgFormat] = useState<"png" | "jpeg">("jpeg");
  const [imgScale, setImgScale] = useState("2");
  const [useOcr, setUseOcr] = useState(false);
  const [lang, setLang] = useState("hin+eng");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [meta, setMeta] = useState<Metadata>({ title: "", author: "", subject: "", keywords: "" });
  const [crop, setCrop] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [signature, setSignature] = useState<Blob | null>(null);
  const [signAt, setSignAt] = useState({ page: 0, x: 0.75, y: 0.88, width: 0.25, allPages: false });

  const file = files[0];
  const onProgress = useCallback((percent: number, label?: string) => setBusy((b) => ({ percent, label: label ?? b?.label ?? "Working" })), []);

  const reset = () => {
    setFiles([]);
    setThumbs([]);
    setPageCount(0);
    setOrder([]);
    setSelected(new Set());
    setResult(null);
    setError("");
    setPassword("");
    setConfirm("");
    setRanges("");
    setSignature(null);
  };

  const addFiles = (incoming: File[]) => {
    setError("");
    setResult(null);
    const valid = isImages ? incoming.filter((f) => f.type.startsWith("image/")) : incoming.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (valid.length < incoming.length) setError(isImages ? "Only image files can be added here." : "Only PDF files can be added here.");
    if (valid.length) setFiles((current) => (multi ? [...current, ...valid] : valid.slice(0, 1)));
  };

  // Page previews, drawn one at a time so a long document fills in progressively.
  useEffect(() => {
    if (!file || isImages || !(THUMB_TOOLS.has(slug) || slug === "crop-pdf" || slug === "sign-pdf")) return;
    let cancelled = false;
    let pdf: any;
    setLoadingPages(true);
    setThumbs([]);
    (async () => {
      try {
        pdf = await openForReading(await readBytes(file));
        if (cancelled) return;
        setPageCount(pdf.numPages);
        setOrder(Array.from({ length: pdf.numPages }, (_, i) => i));
        if (!THUMB_TOOLS.has(slug)) return;
        for (let i = 1; i <= pdf.numPages && !cancelled; i++) {
          const canvas = await renderPage(await pdf.getPage(i), 0.35);
          const url = canvas.toDataURL("image/jpeg", 0.7);
          if (!cancelled) setThumbs((t) => [...t, { index: i - 1, url }]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ToolError ? err.message : "This file could not be read.");
          setFiles([]);
        }
      } finally {
        if (!cancelled) setLoadingPages(false);
        pdf?.destroy();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, slug, isImages]);

  // Metadata tool: show the current values as soon as a file is added.
  useEffect(() => {
    if (slug !== "edit-pdf-metadata" || !file) return;
    readMetadata(file)
      .then(setMeta)
      .catch((err) => {
        setError(err instanceof ToolError ? err.message : "This file could not be read.");
        setFiles([]);
      });
  }, [file, slug]);

  const toggle = (i: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const run = async () => {
    setError("");
    setResult(null);
    setBusy({ percent: 2, label: "Starting" });
    try {
      setResult(await execute());
    } catch (err) {
      setError(err instanceof ToolError ? err.message : "Something went wrong with this file. It may be damaged; try Repair PDF, or try again.");
      if (!(err instanceof ToolError)) console.error(err);
    } finally {
      setBusy(null);
    }
  };

  async function execute(): Promise<Result> {
    switch (slug) {
      case "merge-pdf": {
        const out = await mergePdfs(files, onProgress);
        return { title: `${files.length} PDFs merged`, file: out };
      }
      case "split-pdf": {
        if (splitMode === "every") {
          const parts = await splitPdf(file, order.map((i) => [i]), onProgress);
          return { title: `Split into ${parts.length} files`, files: parts };
        }
        if (splitMode === "ranges") {
          const parts = await splitPdf(file, parseRanges(ranges, pageCount), onProgress);
          return parts.length === 1 ? { title: "Pages extracted", file: parts[0] } : { title: `Split into ${parts.length} files`, files: parts };
        }
        if (!selected.size) throw new ToolError("Click the pages you want to keep.");
        const picked = await pickPages(await readBytes(file), [...selected].sort((a, b) => a - b));
        return { title: `${selected.size} page${selected.size === 1 ? "" : "s"} extracted`, file: { name: `${baseName(file.name)}-extracted.pdf`, blob: picked } };
      }
      case "reorder-pdf-pages": {
        const blob = await pickPages(await readBytes(file), order);
        return { title: "Pages reordered", file: { name: `${baseName(file.name)}-reordered.pdf`, blob } };
      }
      case "delete-pdf-pages": {
        if (!selected.size) throw new ToolError("Click the pages you want to delete.");
        const keep = order.filter((i) => !selected.has(i));
        if (!keep.length) throw new ToolError("You can't delete every page. Leave at least one.");
        const blob = await pickPages(await readBytes(file), keep);
        return { title: `${selected.size} page${selected.size === 1 ? "" : "s"} deleted`, detail: `${keep.length} page${keep.length === 1 ? "" : "s"} left.`, file: { name: `${baseName(file.name)}-trimmed.pdf`, blob } };
      }
      case "rotate-pdf": {
        if (rotateTarget === "selected" && !selected.size) throw new ToolError("Click the pages to rotate, or choose All pages.");
        const out = await rotatePdf(file, Number(angle), rotateTarget === "all" ? null : selected, onProgress);
        return { title: "PDF rotated", file: out };
      }
      case "compress-pdf": {
        const r = await compressPdf(file, level, onProgress);
        if (!r.smaller) return { title: "This PDF is already well optimized", detail: `We couldn't make it smaller than ${formatBytes(r.before)}${level === "smallest" ? "" : ". Try the Smallest setting if it's a scan"}.`, file: r.file };
        const saved = Math.round((1 - r.after / r.before) * 100);
        return { title: `${saved}% smaller`, detail: `${formatBytes(r.before)} → ${formatBytes(r.after)}`, file: r.file };
      }
      case "watermark-pdf":
        return { title: "Watermark added", file: await watermarkPdf(file, wm, onProgress) };
      case "add-page-numbers":
        return { title: "Page numbers added", file: await addPageNumbers(file, num, onProgress) };
      case "sign-pdf": {
        if (!signature) throw new ToolError("Create your signature first.");
        const out = await signPdf(file, signature, { page: signAt.allPages ? "all" : signAt.page, x: signAt.x, y: signAt.y, widthFraction: signAt.width }, onProgress);
        return { title: "PDF signed", file: out };
      }
      case "crop-pdf": {
        const mm = 2.8346; // points per millimetre
        return { title: "PDF cropped", file: await cropPdf(file, { top: crop.top * mm, right: crop.right * mm, bottom: crop.bottom * mm, left: crop.left * mm }, onProgress) };
      }
      case "edit-pdf-metadata":
        return { title: "Details saved", file: await writeMetadata(file, meta) };
      case "flatten-pdf": {
        const r = await flattenPdf(file, onProgress);
        return { title: r.fields ? `${r.fields} form field${r.fields === 1 ? "" : "s"} flattened` : "No form fields found", detail: r.fields ? undefined : "This PDF has no fillable fields, so nothing needed to change.", file: r.file };
      }
      case "repair-pdf": {
        const r = await repairPdf(file, onProgress);
        return { title: "PDF recovered", detail: r.asImages ? "The structure couldn't be saved, so pages were recovered as images. Text can't be selected. Check that everything is there." : "Open the file to check that everything you need is there.", file: r.file };
      }
      case "image-to-pdf": {
        const out = await imagesToPdf(files, imgOpt, onProgress);
        return { title: `${files.length} image${files.length === 1 ? "" : "s"} converted`, file: out };
      }
      case "pdf-to-image": {
        const images = await pdfToImages(file, imgFormat, Number(imgScale), onProgress);
        return { title: `${images.length} page${images.length === 1 ? "" : "s"} converted`, files: images };
      }
      case "pdf-to-text": {
        const r = useOcr ? await extractTextOcr(file, lang, onProgress) : await extractText(file, onProgress);
        const text = r.pages.map((lines) => lines.join("\n")).join("\n\n").trim();
        const words = text ? text.split(/\s+/).length : 0;
        if (!useOcr && words < r.total * 5) throw new ToolError("Almost no text was found, so this is probably a scan. Turn on OCR below and run it again.");
        return { title: `${words.toLocaleString("en-IN")} words extracted`, detail: `From ${r.total} page${r.total === 1 ? "" : "s"}${useOcr ? " using OCR" : ""}. If Hindi looks garbled, turn on OCR.`, text, file: { name: `${baseName(file.name)}.txt`, blob: new Blob([text], { type: "text/plain;charset=utf-8" }) } };
      }
      case "pdf-to-word": {
        const r = useOcr ? await extractTextOcr(file, lang, onProgress) : await extractText(file, onProgress);
        const count = r.pages.reduce((n, lines) => n + lines.length, 0);
        if (!useOcr && count < r.total) throw new ToolError("Almost no text was found, so this is probably a scan. Turn on OCR below and run it again.");
        return { title: "Word document created", detail: "Text and paragraphs only. Layout, tables and images aren't copied across.", file: await textToDocx(r.pages, `${baseName(file.name)}.docx`) };
      }
      case "protect-pdf": {
        if (password !== confirm) throw new ToolError("The two passwords don't match.");
        const out = await protectPdf(file, password, { print: allowPrint, copy: allowCopy }, onProgress);
        return { title: "PDF protected with AES-256", detail: "Keep the password safe. Nobody, including us, can recover the file without it.", file: out };
      }
      case "unlock-pdf":
        return { title: "Password removed", file: await unlockPdf(file, password, onProgress) };
      default:
        throw new ToolError("This tool isn't available.");
    }
  }

  if (slug === "pdf-viewer") return <Viewer />;

  const hasFile = files.length > 0;

  return (
    <div className="space-y-4">
      {result ? (
        <>
          <ResultCard title={result.title} detail={result.detail} file={result.file && !result.files ? result.file : undefined} onReset={reset} resetLabel="Use another file">
            {result.files && <FileListResult files={result.files} zipName={`${baseName(file?.name ?? "files")}.zip`} />}
            {result.text !== undefined && (
              <div className="space-y-2">
                <textarea readOnly value={result.text} data-testid="tool-text" className="h-72 w-full resize-y rounded-xl border bg-background p-3 font-mono text-sm" />
                <CopyButton text={result.text} label="Copy text" />
              </div>
            )}
          </ResultCard>
          <Button type="button" variant="link" className="px-0" onClick={() => setResult(null)}>
            <ArrowLeft className="size-4" aria-hidden="true" /> Change settings and run again
          </Button>
        </>
      ) : (
        <>
          {(!hasFile || multi) && <FilePicker accept={isImages ? "image/*" : "application/pdf,.pdf"} multiple={multi} onFiles={addFiles} compact={hasFile} title={hasFile ? "Add more" : undefined} hint={isImages ? "JPG, PNG, WebP, GIF or BMP. Stays on your device." : "PDF files only. Stays on your device, nothing is uploaded."} />}

          {hasFile && multi && <FileOrder files={files} setFiles={setFiles} withPreview={isImages} />}

          {hasFile && !multi && (
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{file.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                  {pageCount ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : ""}
                </span>
              </span>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove file" onClick={reset} disabled={!!busy}>
                <X aria-hidden="true" />
              </Button>
            </div>
          )}

          {error && <ErrorNote>{error}</ErrorNote>}

          {hasFile && (
            <>
              {slug === "split-pdf" && (
                <Panel className="space-y-3">
                  <Segmented label="How to split" value={splitMode} onChange={setSplitMode} options={[["select", "Pick pages"], ["ranges", "Page ranges"], ["every", "Every page"]]} />
                  {splitMode === "ranges" && (
                    <Field label="Pages" hint={`Each part becomes its own PDF. This file has ${pageCount} pages.`}>
                      <Input value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3, 5, 8-10" className="h-11" />
                    </Field>
                  )}
                  {splitMode === "every" && <Note>Each of the {pageCount} pages becomes its own PDF, all in one ZIP.</Note>}
                </Panel>
              )}

              {slug === "rotate-pdf" && (
                <Panel className="grid gap-4 sm:grid-cols-2">
                  <Field label="Rotate by">
                    <Select value={angle} onChange={setAngle} options={[["90", "90° clockwise"], ["180", "180°"], ["270", "90° counter-clockwise"]]} />
                  </Field>
                  <Field label="Apply to">
                    <Select value={rotateTarget} onChange={setRotateTarget} options={[["all", "All pages"], ["selected", "Only pages I select"]]} />
                  </Field>
                </Panel>
              )}

              {THUMB_TOOLS.has(slug) && !(slug === "split-pdf" && splitMode !== "select") && !(slug === "rotate-pdf" && rotateTarget === "all") && (
                <PageGrid
                  slug={slug}
                  thumbs={thumbs}
                  order={order}
                  setOrder={setOrder}
                  selected={selected}
                  toggle={toggle}
                  setSelected={setSelected}
                  loading={loadingPages}
                  total={pageCount}
                />
              )}

              {slug === "compress-pdf" && (
                <Panel className="space-y-3">
                  <Segmented label="Compression" value={level} onChange={setLevel} options={[["balanced", "Balanced"], ["strong", "Strong"], ["smallest", "Smallest"]]} />
                  <p className="text-sm text-muted-foreground">
                    {level === "balanced" && "Good quality with a smaller file. Text stays sharp and selectable."}
                    {level === "strong" && "Lower image quality for a much smaller file. Text stays sharp and selectable."}
                    {level === "smallest" && "Turns every page into an image. Best for scans, but text can no longer be selected or searched."}
                  </p>
                </Panel>
              )}

              {slug === "watermark-pdf" && (
                <Panel className="grid gap-4 sm:grid-cols-2">
                  <Field label="Watermark text" className="sm:col-span-2">
                    <Input value={wm.text} onChange={(e) => setWm({ ...wm, text: e.target.value })} className="h-11" />
                  </Field>
                  <Field label="Position">
                    <Select value={wm.position} onChange={(position) => setWm({ ...wm, position })} options={[["center", "Centre, diagonal"], ["tile", "Repeated across the page"], ["top", "Top"], ["bottom", "Bottom"]]} />
                  </Field>
                  <Field label="Colour">
                    <input type="color" aria-label="Watermark colour" value={wm.color} onChange={(e) => setWm({ ...wm, color: e.target.value })} className="h-11 w-full cursor-pointer rounded-lg border border-input bg-background p-1" />
                  </Field>
                  <Field label={`Size: ${wm.size}% of page width`}>
                    <input type="range" min={15} max={100} value={wm.size} onChange={(e) => setWm({ ...wm, size: Number(e.target.value) })} className="w-full accent-primary" />
                  </Field>
                  <Field label={`Opacity: ${Math.round(wm.opacity * 100)}%`}>
                    <input type="range" min={5} max={90} value={wm.opacity * 100} onChange={(e) => setWm({ ...wm, opacity: Number(e.target.value) / 100 })} className="w-full accent-primary" />
                  </Field>
                </Panel>
              )}

              {slug === "add-page-numbers" && (
                <Panel className="grid gap-4 sm:grid-cols-2">
                  <Field label="Position">
                    <Select value={num.position} onChange={(position) => setNum({ ...num, position })} options={[["bottom-center", "Bottom centre"], ["bottom-left", "Bottom left"], ["bottom-right", "Bottom right"], ["top-center", "Top centre"], ["top-right", "Top right"]]} />
                  </Field>
                  <Field label="Format">
                    <Select value={num.format} onChange={(format) => setNum({ ...num, format })} options={[["n", "1, 2, 3"], ["page", "Page 1, Page 2"], ["of", "1 / 10, 2 / 10"], ["dash", "- 1 -, - 2 -"]]} />
                  </Field>
                  <Field label="Start numbering from page" hint="Earlier pages stay unnumbered, useful for a cover.">
                    <Input type="number" min={1} value={num.startAt} onChange={(e) => setNum({ ...num, startAt: Math.max(1, Number(e.target.value) || 1) })} className="h-11" />
                  </Field>
                  <Field label="Text size">
                    <Select value={String(num.fontSize)} onChange={(v) => setNum({ ...num, fontSize: Number(v) })} options={[["9", "Small"], ["11", "Medium"], ["14", "Large"]]} />
                  </Field>
                </Panel>
              )}

              {slug === "sign-pdf" && <SignPanel file={file} pageCount={pageCount} signature={signature} setSignature={setSignature} at={signAt} setAt={setSignAt} />}
              {slug === "crop-pdf" && <CropPanel file={file} crop={crop} setCrop={setCrop} />}

              {slug === "edit-pdf-metadata" && (
                <Panel className="grid gap-4 sm:grid-cols-2">
                  {(["title", "author", "subject", "keywords"] as const).map((k) => (
                    <Field key={k} label={k[0].toUpperCase() + k.slice(1)} hint={k === "keywords" ? "Separate with commas." : undefined}>
                      <Input value={meta[k]} onChange={(e) => setMeta({ ...meta, [k]: e.target.value })} className="h-11" />
                    </Field>
                  ))}
                  <Button type="button" variant="outline" className="w-fit rounded-full sm:col-span-2" onClick={() => setMeta({ title: "", author: "", subject: "", keywords: "" })}>
                    <Eraser className="size-4" aria-hidden="true" /> Clear all
                  </Button>
                </Panel>
              )}

              {isImages && (
                <Panel className="grid gap-4 sm:grid-cols-2">
                  <Field label="Page size">
                    <Select value={imgOpt.size} onChange={(size) => setImgOpt({ ...imgOpt, size })} options={[["a4", "A4"], ["letter", "US Letter"], ["fit", "Same as the image"]]} />
                  </Field>
                  <Field label="Margin">
                    <Select value={String(imgOpt.margin)} onChange={(v) => setImgOpt({ ...imgOpt, margin: Number(v) })} options={[["0", "None"], ["24", "Small"], ["48", "Large"]]} />
                  </Field>
                </Panel>
              )}

              {slug === "pdf-to-image" && (
                <Panel className="grid gap-4 sm:grid-cols-2">
                  <Field label="Format">
                    <Select value={imgFormat} onChange={setImgFormat} options={[["jpeg", "JPG (smaller files)"], ["png", "PNG (crisper text)"]]} />
                  </Field>
                  <Field label="Quality">
                    <Select value={imgScale} onChange={setImgScale} options={[["1", "Standard"], ["2", "High"], ["3", "Very high (for printing)"]]} />
                  </Field>
                </Panel>
              )}

              {(slug === "pdf-to-text" || slug === "pdf-to-word") && (
                <Panel className="space-y-3">
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" checked={useOcr} onChange={(e) => setUseOcr(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
                    <span>
                      <span className="font-medium">Use OCR</span>
                      <span className="block text-muted-foreground">Turn this on for scanned PDFs, or Hindi text that comes out garbled. It takes longer, and downloads language data the first time.</span>
                    </span>
                  </label>
                  {useOcr && (
                    <Field label="Language of the document">
                      <Select value={lang} onChange={setLang} options={OCR_LANGS} />
                    </Field>
                  )}
                </Panel>
              )}

              {slug === "protect-pdf" && (
                <Panel className="grid gap-4 sm:grid-cols-2">
                  <Field label="Password">
                    <Input type="password" autoComplete="new-password" data-testid="pw" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
                  </Field>
                  <Field label="Repeat password">
                    <Input type="password" autoComplete="new-password" data-testid="pw2" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />
                  </Field>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={allowPrint} onChange={(e) => setAllowPrint(e.target.checked)} className="size-4 accent-primary" /> Allow printing
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={allowCopy} onChange={(e) => setAllowCopy(e.target.checked)} className="size-4 accent-primary" /> Allow copying text
                  </label>
                </Panel>
              )}

              {slug === "unlock-pdf" && (
                <Panel>
                  <Field label="Current password" hint="Leave it empty if the PDF opens without one but is restricted from printing or copying. Only use this on files you're allowed to change.">
                    <Input type="password" autoComplete="off" data-testid="pw" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
                  </Field>
                </Panel>
              )}

              {busy ? (
                <ProgressBar percent={busy.percent} label={busy.label} />
              ) : (
                <div className="flex flex-col items-center gap-2 pt-1">
                  <RunButton onClick={run} disabled={loadingPages && THUMB_TOOLS.has(slug) && !pageCount}>
                    {RUN_LABEL[slug]} <ArrowRight className="size-4" aria-hidden="true" />
                  </RunButton>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function FileListResult({ files, zipName }: { files: OutFile[]; zipName: string }) {
  const [zip, setZip] = useState<OutFile | null>(null);
  const [zipping, setZipping] = useState(false);
  useEffect(() => {
    let live = true;
    setZipping(true);
    zipFiles(files, zipName)
      .then((z) => {
        if (live) setZip(z);
      })
      .finally(() => {
        if (live) setZipping(false);
      });
    return () => {
      live = false;
    };
  }, [files, zipName]);
  return (
    <div className="space-y-3">
      {zip ? (
        <DownloadLink file={zip} primary className="w-full sm:w-auto">
          Download all as ZIP ({formatBytes(zip.blob.size)})
        </DownloadLink>
      ) : (
        zipping && <p className="text-sm text-muted-foreground">Preparing the ZIP…</p>
      )}
      <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
        {files.map((f) => (
          <DownloadLink key={f.name} file={f} />
        ))}
      </div>
    </div>
  );
}

function FileOrder({ files, setFiles, withPreview }: { files: File[]; setFiles: (f: File[]) => void; withPreview: boolean }) {
  const [drag, setDrag] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setFiles(next);
  };
  return (
    <ol className="space-y-2">
      {files.map((f, i) => (
        <li
          key={`${f.name}-${f.size}-${i}`}
          draggable
          onDragStart={() => setDrag(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (drag !== null) move(drag, i);
            setDrag(null);
          }}
          className="flex cursor-grab items-center gap-2 rounded-xl border bg-card p-2 sm:gap-3 sm:p-3"
        >
          <span className="w-5 shrink-0 text-center text-xs text-muted-foreground tabular-nums">{i + 1}</span>
          {withPreview ? <ImageThumb file={f} /> : <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{f.name}</span>
            <span className="block text-xs text-muted-foreground">{formatBytes(f.size)}</span>
          </span>
          <Button type="button" variant="ghost" size="icon" aria-label={`Move ${f.name} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label={`Move ${f.name} down`} disabled={i === files.length - 1} onClick={() => move(i, i + 1)}>
            <ArrowDown aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, n) => n !== i))}>
            <Trash2 aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ol>
  );
}

function ImageThumb({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  // eslint-disable-next-line @next/next/no-img-element -- local preview of the user's own file
  return url ? <img src={url} alt="" className="size-10 shrink-0 rounded-md border object-cover" /> : <span className="size-10 shrink-0" />;
}

type GridProps = {
  slug: string;
  thumbs: { index: number; url: string }[];
  order: number[];
  setOrder: (o: number[]) => void;
  selected: Set<number>;
  toggle: (i: number) => void;
  setSelected: (s: Set<number>) => void;
  loading: boolean;
  total: number;
};

function PageGrid({ slug, thumbs, order, setOrder, selected, toggle, setSelected, loading, total }: GridProps) {
  const [drag, setDrag] = useState<number | null>(null);
  const reorder = slug === "reorder-pdf-pages";
  const danger = slug === "delete-pdf-pages";
  const byIndex = new Map(thumbs.map((t) => [t.index, t.url]));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
  };
  return (
    <Panel>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {reorder ? "Drag pages, or use the arrows" : `${selected.size} of ${total} selected`}
          {loading && <Loader2 className="ml-2 inline size-4 animate-spin text-muted-foreground" aria-label="Loading pages" />}
        </p>
        {reorder ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOrder([...order].sort((a, b) => a - b))}>
            <Undo2 className="size-4" aria-hidden="true" /> Reset order
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set(order))}>
              All
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              None
            </Button>
          </div>
        )}
      </div>
      <div className="grid max-h-[32rem] grid-cols-3 gap-2 overflow-y-auto p-0.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">
        {order.map((pageIndex, pos) => {
          const url = byIndex.get(pageIndex);
          const on = selected.has(pageIndex);
          return (
            <div
              key={pageIndex}
              draggable={reorder}
              onDragStart={() => setDrag(pos)}
              onDragOver={(e) => reorder && e.preventDefault()}
              onDrop={() => {
                if (reorder && drag !== null) move(drag, pos);
                setDrag(null);
              }}
              className={cn("relative overflow-hidden rounded-lg border bg-background", reorder && "cursor-grab", on && (danger ? "border-destructive ring-2 ring-destructive" : "border-primary ring-2 ring-primary"))}
            >
              <button type="button" disabled={reorder} data-testid="page-thumb" aria-pressed={on} aria-label={`Page ${pageIndex + 1}`} onClick={() => toggle(pageIndex)} className={cn("block w-full", !reorder && "cursor-pointer")}>
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- rendered from the user's own PDF
                  <img src={url} alt="" draggable={false} className={cn("aspect-[3/4] w-full bg-white object-contain", on && danger && "opacity-40")} />
                ) : (
                  <span className="block aspect-[3/4] w-full animate-pulse bg-muted" />
                )}
                <span className="absolute top-1 left-1 rounded bg-foreground/80 px-1.5 text-xs font-medium text-background tabular-nums">{pageIndex + 1}</span>
                {on && !reorder && <span className={cn("absolute top-1 right-1 grid size-5 place-items-center rounded-full text-white", danger ? "bg-destructive" : "bg-primary")}>{danger ? <X className="size-3.5" aria-hidden="true" /> : "✓"}</span>}
              </button>
              {reorder && (
                <div className="flex border-t">
                  <button type="button" aria-label={`Move page ${pageIndex + 1} earlier`} disabled={pos === 0} onClick={() => move(pos, pos - 1)} className="grid h-8 flex-1 place-items-center hover:bg-muted disabled:opacity-30">
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`Move page ${pageIndex + 1} later`} disabled={pos === order.length - 1} onClick={() => move(pos, pos + 1)} className="grid h-8 flex-1 place-items-center border-l hover:bg-muted disabled:opacity-30">
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/** Draws one PDF page to a canvas, re-rendering when the page or size changes. */
function PagePreview({ file, page, width, onSize, className }: { file: File; page: number; width: number; onSize?: (aspect: number, count: number) => void; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    let pdf: any;
    (async () => {
      pdf = await openForReading(await readBytes(file));
      const p = await pdf.getPage(page + 1);
      const base = p.getViewport({ scale: 1 });
      const out = await renderPage(p, (width * (window.devicePixelRatio || 1)) / base.width);
      if (cancelled || !ref.current) return;
      ref.current.width = out.width;
      ref.current.height = out.height;
      ref.current.getContext("2d")!.drawImage(out, 0, 0);
      onSize?.(base.width / base.height, pdf.numPages);
    })()
      .catch(() => {})
      .finally(() => pdf?.destroy());
    return () => {
      cancelled = true;
    };
  }, [file, page, width, onSize]);
  return <canvas ref={ref} className={cn("block h-auto w-full bg-white", className)} />;
}

type SignAt = { page: number; x: number; y: number; width: number; allPages: boolean };

function SignPanel({ file, pageCount, signature, setSignature, at, setAt }: { file: File; pageCount: number; signature: Blob | null; setSignature: (b: Blob | null) => void; at: SignAt; setAt: (a: SignAt) => void }) {
  const [mode, setMode] = useState<"draw" | "type" | "upload">("draw");
  const [typed, setTyped] = useState("");
  const [sigUrl, setSigUrl] = useState("");
  const [ratio, setRatio] = useState(3);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (!signature) {
      setSigUrl("");
      return;
    }
    const u = URL.createObjectURL(signature);
    setSigUrl(u);
    createImageBitmap(signature).then((b) => setRatio(b.width / b.height));
    return () => URL.revokeObjectURL(u);
  }, [signature]);

  const pos = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * e.currentTarget.width, ((e.clientY - r.top) / r.height) * e.currentTarget.height] as const;
  };
  const start = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = e.currentTarget.getContext("2d")!;
    const [x, y] = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const moveTo = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const [x, y] = pos(e);
    ctx.lineTo(x, y);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.stroke();
  };
  const end = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    e.currentTarget.toBlob((b) => setSignature(b), "image/png");
  };
  const clear = () => {
    canvas.current?.getContext("2d")!.clearRect(0, 0, canvas.current.width, canvas.current.height);
    setSignature(null);
    setTyped("");
  };
  const fromText = (text: string) => {
    setTyped(text);
    if (!text.trim()) return setSignature(null);
    const font = 'italic 110px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive';
    const m = document.createElement("canvas").getContext("2d")!;
    m.font = font;
    const c = document.createElement("canvas");
    c.width = Math.ceil(m.measureText(text).width) + 40;
    c.height = 170;
    const ctx = c.getContext("2d")!;
    ctx.font = font;
    ctx.fillStyle = "#111827";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 20, 85);
    c.toBlob((b) => setSignature(b), "image/png");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <Panel className="space-y-4">
        <Segmented
          label="Signature type"
          value={mode}
          onChange={(m) => {
            setMode(m);
            clear();
          }}
          options={[["draw", "Draw"], ["type", "Type"], ["upload", "Upload"]]}
        />
        {mode === "draw" && <canvas ref={canvas} data-testid="sig-canvas" width={900} height={320} onPointerDown={start} onPointerMove={moveTo} onPointerUp={end} className="h-40 w-full touch-none rounded-xl border bg-white" aria-label="Draw your signature here" />}
        {mode === "type" && <Input value={typed} data-testid="sig-text" onChange={(e) => fromText(e.target.value)} placeholder="Type your name" className="h-11" />}
        {mode === "upload" && <FilePicker compact accept="image/png,image/jpeg,image/webp" onFiles={async (f) => {
          // Everything becomes PNG here so it can be embedded the same way.
          const bmp = await createImageBitmap(f[0]);
          const c = document.createElement("canvas");
          c.width = bmp.width;
          c.height = bmp.height;
          c.getContext("2d")!.drawImage(bmp, 0, 0);
          c.toBlob((b) => setSignature(b), "image/png");
        }} title="Choose a signature image" hint="A PNG with a transparent background looks best." />}
        {signature && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            <Eraser className="size-4" aria-hidden="true" /> Clear signature
          </Button>
        )}
        <Field label={`Signature size: ${Math.round(at.width * 100)}% of page width`}>
          <input type="range" min={8} max={60} value={at.width * 100} onChange={(e) => setAt({ ...at, width: Number(e.target.value) / 100 })} className="w-full accent-primary" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={at.allPages} onChange={(e) => setAt({ ...at, allPages: e.target.checked })} className="size-4 accent-primary" /> Put it on every page
        </label>
      </Panel>
      <Panel>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Click where the signature goes</p>
          {pageCount > 1 && !at.allPages && (
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" aria-label="Previous page" disabled={at.page === 0} onClick={() => setAt({ ...at, page: at.page - 1 })}>
                <ChevronLeft aria-hidden="true" />
              </Button>
              <span className="text-sm tabular-nums">
                {at.page + 1} / {pageCount}
              </span>
              <Button type="button" variant="ghost" size="icon" aria-label="Next page" disabled={at.page >= pageCount - 1} onClick={() => setAt({ ...at, page: at.page + 1 })}>
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
        <div
          data-testid="sign-page"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setAt({ ...at, x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
          }}
          className="relative cursor-crosshair overflow-hidden rounded-lg border"
        >
          <PagePreview file={file} page={at.page} width={600} />
          {sigUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of the user's signature
            <img src={sigUrl} alt="Your signature" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 outline-1 outline-primary/60 outline-dashed" style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%`, width: `${at.width * 100}%`, aspectRatio: String(ratio) }} />
          )}
        </div>
      </Panel>
    </div>
  );
}

type Crop = { top: number; right: number; bottom: number; left: number };

function CropPanel({ file, crop, setCrop }: { file: File; crop: Crop; setCrop: (c: Crop) => void }) {
  const [aspect, setAspect] = useState(0.707);
  const onSize = useCallback((a: number) => setAspect(a), []);
  // Margins are in millimetres; the overlay needs them as a share of the page. A4 width is assumed only until the page is read.
  const [widthMm, setWidthMm] = useState(210);
  useEffect(() => {
    readBytes(file)
      .then(openForReading)
      .then(async (pdf: any) => {
        const vp = (await pdf.getPage(1)).getViewport({ scale: 1 });
        setWidthMm(vp.width / 2.8346);
        pdf.destroy();
      })
      .catch(() => {});
  }, [file]);
  const heightMm = widthMm / aspect;
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
      <Panel className="grid content-start gap-4">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <Field key={side} label={`${side[0].toUpperCase() + side.slice(1)}: ${crop[side]} mm`}>
            <input type="range" min={0} max={Math.floor((side === "top" || side === "bottom" ? heightMm : widthMm) / 2) - 5} value={crop[side]} onChange={(e) => setCrop({ ...crop, [side]: Number(e.target.value) })} className="w-full accent-primary" />
          </Field>
        ))}
        <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setCrop({ top: 0, right: 0, bottom: 0, left: 0 })}>
          <Undo2 className="size-4" aria-hidden="true" /> Reset
        </Button>
        <Note>These margins apply to every page. The preview shows page 1.</Note>
      </Panel>
      <Panel>
        <div className="relative mx-auto max-w-sm overflow-hidden rounded-lg border">
          <PagePreview file={file} page={0} width={420} onSize={onSize} />
          <div className="pointer-events-none absolute border-2 border-primary shadow-[0_0_0_999px_rgba(0,0,0,0.45)]" style={{ top: `${(crop.top / heightMm) * 100}%`, bottom: `${(crop.bottom / heightMm) * 100}%`, left: `${(crop.left / widthMm) * 100}%`, right: `${(crop.right / widthMm) * 100}%` }} />
        </div>
      </Panel>
    </div>
  );
}

function Viewer() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const doc = useRef<any>(null);

  const open = useCallback(async (f: File, pass?: string) => {
    setError("");
    try {
      doc.current?.destroy();
      doc.current = await openForReading(await readBytes(f), pass);
      setFile(f);
      setCount(doc.current.numPages);
      setPage(0);
      setNeedsPassword(false);
    } catch (err) {
      const message = err instanceof ToolError ? err.message : "This file could not be read.";
      if (message.toLowerCase().includes("password")) {
        setFile(f);
        setNeedsPassword(true);
      }
      setError(message);
    }
  }, []);

  useEffect(() => {
    if (!count || !doc.current) return;
    let live = true;
    (async () => {
      const p = await doc.current.getPage(page + 1);
      const out = await renderPage(p, (zoom / 100) * 1.5 * (window.devicePixelRatio || 1));
      if (!live || !canvas.current) return;
      canvas.current.width = out.width;
      canvas.current.height = out.height;
      canvas.current.style.width = `${out.width / (window.devicePixelRatio || 1)}px`;
      canvas.current.getContext("2d")!.drawImage(out, 0, 0);
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [page, zoom, count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!count || (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight") setPage((p) => Math.min(count - 1, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  useEffect(() => () => doc.current?.destroy(), []);

  if (!count) {
    return (
      <div className="space-y-4">
        <FilePicker accept="application/pdf,.pdf" onFiles={(f) => open(f[0])} hint="Opens in your browser. Nothing is uploaded." />
        {error && <ErrorNote>{error}</ErrorNote>}
        {needsPassword && file && (
          <Panel className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Password" className="flex-1">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
            </Field>
            <Button type="button" className="h-11 rounded-full px-6" onClick={() => open(file, password)}>
              Open PDF
            </Button>
          </Panel>
        )}
      </div>
    );
  }

  return (
    <Panel className="p-0 sm:p-0">
      <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl border-b bg-card/95 p-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span data-testid="viewer-page" className="text-sm tabular-nums">
            {page + 1} / {count}
          </span>
          <Button type="button" variant="ghost" size="icon" aria-label="Next page" disabled={page >= count - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="Zoom out" disabled={zoom <= 50} onClick={() => setZoom(zoom - 25)}>
            <Minus aria-hidden="true" />
          </Button>
          <span className="w-12 text-center text-sm tabular-nums">{zoom}%</span>
          <Button type="button" variant="ghost" size="icon" aria-label="Zoom in" disabled={zoom >= 300} onClick={() => setZoom(zoom + 25)}>
            <Plus aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Close PDF" onClick={() => { doc.current?.destroy(); doc.current = null; setCount(0); setFile(null); setPassword(""); }}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="max-h-[80vh] overflow-auto bg-muted/40 p-3">
        <canvas ref={canvas} data-testid="viewer-canvas" className="mx-auto max-w-none bg-white shadow-md" />
      </div>
    </Panel>
  );
}

