// PDF operations for the tools. Browser only: every library is loaded on first use, so a tool page stays light
// until someone actually adds a file. Nothing here touches the network with the user's document.

import type { PDFDocument, PDFImage, PDFPage } from "pdf-lib";

export type Progress = (percent: number, label?: string) => void;
export type OutFile = { name: string; blob: Blob };

/* eslint-disable @typescript-eslint/no-explicit-any -- pdf.js and qpdf ship from /vendor without types */

export class ToolError extends Error {}

const pdfBlob = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: "application/pdf" });
export const baseName = (name: string) => name.replace(/\.[^.]+$/, "");
export const readBytes = async (file: File | Blob) => new Uint8Array(await file.arrayBuffer());

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

const canvasBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new ToolError("Your browser could not create the image."))), type, quality));

// ── Loaders ──────────────────────────────────────────────────────────────────────

const lib = () => import("pdf-lib");

let pdfjsPromise: Promise<any> | null = null;
export function loadPdfjs() {
  pdfjsPromise ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "/vendor/pdfjs/pdf.min.mjs" as string).then((m: any) => {
    m.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
    return m;
  });
  return pdfjsPromise;
}

/** Opens a PDF for reading. pdf.js takes ownership of the buffer it's given, so it always gets a copy. */
export async function openForReading(bytes: Uint8Array, password?: string) {
  const pdfjs = await loadPdfjs();
  try {
    return await pdfjs.getDocument({ data: bytes.slice(), password, cMapUrl: "/vendor/pdfjs/cmaps/", cMapPacked: true, standardFontDataUrl: "/vendor/pdfjs/standard_fonts/" }).promise;
  } catch (err: any) {
    if (err?.name === "PasswordException") throw new ToolError(password ? "That password is not correct." : "This PDF is password protected. Remove the password first with Unlock PDF.");
    throw new ToolError("This file could not be read. It may be damaged, so try Repair PDF.");
  }
}

/** Opens a PDF for editing, with a clear message for locked or damaged files. */
async function openForEditing(bytes: Uint8Array): Promise<PDFDocument> {
  const { PDFDocument } = await lib();
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch {
    const text = new TextDecoder("latin1").decode(bytes.subarray(Math.max(0, bytes.length - 4096)));
    if (text.includes("/Encrypt")) throw new ToolError("This PDF is password protected or restricted. Remove the password first with Unlock PDF.");
    throw new ToolError("This file could not be read. It may be damaged, so try Repair PDF.");
  }
}

let qpdfScript: Promise<void> | null = null;
function loadQpdfScript() {
  qpdfScript ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/vendor/qpdf/qpdf.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new ToolError("The PDF engine could not load. Check your connection and try again."));
    document.head.appendChild(s);
  });
  return qpdfScript;
}

/** Runs qpdf on one file. A fresh instance each time, because the program can't be restarted once it has exited. */
async function runQpdf(input: Uint8Array, args: (inPath: string, outPath: string) => string[]) {
  await loadQpdfScript();
  const create = (window as any).Module as (o: object) => Promise<any>;
  const q = await create({ locateFile: () => "/vendor/qpdf/qpdf.wasm", noInitialRun: true, print: () => {}, printErr: () => {} });
  q.FS.writeFile("/in.pdf", input);
  let code = 0;
  try {
    code = q.callMain(args("/in.pdf", "/out.pdf"));
  } catch (err: any) {
    code = typeof err?.status === "number" ? err.status : 2;
  }
  // 3 means "succeeded with warnings", which is what a repaired file normally reports.
  let output: Uint8Array | null = null;
  if (code === 0 || code === 3) {
    try {
      output = q.FS.readFile("/out.pdf") as Uint8Array;
    } catch {
      /* no output file: treated as a failure by the caller */
    }
  }
  return { output };
}

// ── Placing things on a page ─────────────────────────────────────────────────────

/** A page as the reader sees it: size and origin after rotation and cropping. */
function view(page: PDFPage) {
  const box = page.getCropBox();
  const rotation = ((page.getRotation().angle % 360) + 360) % 360;
  const swapped = rotation === 90 || rotation === 270;
  return { box, rotation, width: swapped ? box.height : box.width, height: swapped ? box.width : box.height };
}

/** Converts a position measured from the bottom-left of the visible page into page coordinates and rotation. */
function place(page: PDFPage, x: number, y: number) {
  const { box, rotation } = view(page);
  if (rotation === 90) return { x: box.x + box.width - y, y: box.y + x, angle: 90 };
  if (rotation === 180) return { x: box.x + box.width - x, y: box.y + box.height - y, angle: 180 };
  if (rotation === 270) return { x: box.x + y, y: box.y + box.height - x, angle: 270 };
  return { x: box.x + x, y: box.y + y, angle: 0 };
}

async function drawImageAt(page: PDFPage, image: PDFImage, x: number, y: number, width: number, height: number, opacity = 1) {
  const { degrees } = await lib();
  const p = place(page, x, y);
  page.drawImage(image, { x: p.x, y: p.y, width, height, opacity, rotate: degrees(p.angle) });
}

/** Draws text to a transparent PNG. The browser's fonts handle Hindi and other scripts that PDF base fonts can't. */
async function textImage(text: string, fontPx: number, color: string, bold = true) {
  const measure = document.createElement("canvas").getContext("2d")!;
  const font = `${bold ? "700" : "400"} ${fontPx}px Arial, "Noto Sans Devanagari", "Nirmala UI", sans-serif`;
  measure.font = font;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(measure.measureText(text).width) + 8;
  canvas.height = Math.ceil(fontPx * 1.5);
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 4, canvas.height / 2);
  return { bytes: await readBytes(await canvasBlob(canvas, "image/png")), width: canvas.width, height: canvas.height };
}

// ── Organize ─────────────────────────────────────────────────────────────────────

export async function mergePdfs(files: File[], onProgress: Progress): Promise<OutFile> {
  if (files.length < 2) throw new ToolError("Add at least two PDFs to merge.");
  const { PDFDocument } = await lib();
  const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    onProgress(((i + 0.5) / files.length) * 90, `Adding ${files[i].name}`);
    let src: PDFDocument;
    try {
      src = await openForEditing(await readBytes(files[i]));
    } catch (err) {
      throw new ToolError(`${files[i].name}: ${(err as Error).message}`);
    }
    for (const page of await out.copyPages(src, src.getPageIndices())) out.addPage(page);
  }
  onProgress(95, "Saving");
  return { name: "merged.pdf", blob: pdfBlob(await out.save()) };
}

/** Parses "1-3, 5" into groups of 0-based page indexes. */
export function parseRanges(input: string, total: number): number[][] {
  const groups: number[][] = [];
  for (const part of input.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new ToolError(`"${part}" isn't a page or range. Use a format like 1-3, 5.`);
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    if (from < 1 || to < from || to > total) throw new ToolError(`"${part}" is outside this PDF, which has ${total} page${total === 1 ? "" : "s"}.`);
    groups.push(Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i));
  }
  if (!groups.length) throw new ToolError("Enter the pages to keep, such as 1-3, 5.");
  return groups;
}

export async function pickPages(bytes: Uint8Array, indexes: number[]) {
  const { PDFDocument } = await lib();
  const src = await openForEditing(bytes);
  const out = await PDFDocument.create();
  for (const page of await out.copyPages(src, indexes)) out.addPage(page);
  return pdfBlob(await out.save());
}

export async function splitPdf(file: File, groups: number[][], onProgress: Progress): Promise<OutFile[]> {
  const bytes = await readBytes(file);
  const stem = baseName(file.name);
  const out: OutFile[] = [];
  for (let i = 0; i < groups.length; i++) {
    onProgress(((i + 1) / groups.length) * 95, `Creating file ${i + 1} of ${groups.length}`);
    const g = groups[i];
    const label = g.length === 1 ? `page-${g[0] + 1}` : `pages-${g[0] + 1}-${g[g.length - 1] + 1}`;
    out.push({ name: `${stem}-${label}.pdf`, blob: await pickPages(bytes, g) });
  }
  return out;
}

export async function rotatePdf(file: File, angle: number, pages: Set<number> | null, onProgress: Progress): Promise<OutFile> {
  const { degrees } = await lib();
  const doc = await openForEditing(await readBytes(file));
  doc.getPages().forEach((page, i) => {
    if (!pages || pages.has(i)) page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  });
  onProgress(90, "Saving");
  return { name: `${baseName(file.name)}-rotated.pdf`, blob: pdfBlob(await doc.save()) };
}

// ── Compress ─────────────────────────────────────────────────────────────────────

export type CompressLevel = "balanced" | "strong" | "smallest";
const COMPRESS: Record<Exclude<CompressLevel, "smallest">, { quality: number; maxPx: number }> = {
  balanced: { quality: 0.72, maxPx: 1800 },
  strong: { quality: 0.5, maxPx: 1200 },
};

async function inflate(bytes: Uint8Array) {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Rebuilds JPEG and simple Flate images at a lower size. Text and vector content aren't touched. */
async function shrinkImages(doc: PDFDocument, level: { quality: number; maxPx: number }, onProgress: Progress) {
  const { PDFName, PDFNumber, PDFRawStream } = await lib();
  const objects = doc.context.enumerateIndirectObjects();
  let done = 0;
  for (const [ref, obj] of objects) {
    done++;
    if (!(obj instanceof PDFRawStream) || obj.dict.lookup(PDFName.of("Subtype")) !== PDFName.of("Image")) continue;
    onProgress(10 + (done / objects.length) * 70, "Compressing images");
    const dict = obj.dict;
    const raw = dict.lookup(PDFName.of("Filter"));
    const filter = String(raw).replace(/^\[\s*|\s*\]$/g, "");
    const width = Number(String(dict.lookup(PDFName.of("Width"))));
    const height = Number(String(dict.lookup(PDFName.of("Height"))));
    if (!width || !height || width * height < 40000 || dict.has(PDFName.of("ImageMask"))) continue;

    let source: CanvasImageSource | null = null;
    try {
      if (filter === "/DCTDecode") {
        source = await createImageBitmap(new Blob([obj.contents as BlobPart], { type: "image/jpeg" }));
      } else if (filter === "/FlateDecode" && !dict.has(PDFName.of("DecodeParms")) && String(dict.lookup(PDFName.of("BitsPerComponent"))) === "8") {
        const space = String(dict.lookup(PDFName.of("ColorSpace")));
        const channels = space === "/DeviceRGB" ? 3 : space === "/DeviceGray" ? 1 : 0;
        if (!channels) continue;
        const data = await inflate(obj.contents);
        if (data.length < width * height * channels) continue;
        const pixels = new ImageData(width, height);
        for (let i = 0, p = 0; i < width * height; i++, p += channels) {
          pixels.data[i * 4] = data[p];
          pixels.data[i * 4 + 1] = data[channels === 3 ? p + 1 : p];
          pixels.data[i * 4 + 2] = data[channels === 3 ? p + 2 : p];
          pixels.data[i * 4 + 3] = 255;
        }
        source = await createImageBitmap(pixels);
      }
    } catch {
      continue; // an image the browser can't decode (CMYK JPEG, for one) is simply left as it is
    }
    if (!source) continue;

    const scale = Math.min(1, level.maxPx / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
    const jpeg = await readBytes(await canvasBlob(canvas, "image/jpeg", level.quality));
    if (jpeg.length >= obj.contents.length) continue;

    dict.set(PDFName.of("Width"), PDFNumber.of(canvas.width));
    dict.set(PDFName.of("Height"), PDFNumber.of(canvas.height));
    dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
    dict.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
    dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
    dict.delete(PDFName.of("DecodeParms"));
    dict.delete(PDFName.of("Decode"));
    doc.context.assign(ref, PDFRawStream.of(dict, jpeg));
  }
}

async function pagesToImages(bytes: Uint8Array, onProgress: Progress) {
  const { PDFDocument } = await lib();
  const pdf = await openForReading(bytes);
  const out = await PDFDocument.create();
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress(10 + (i / pdf.numPages) * 75, `Rendering page ${i} of ${pdf.numPages}`);
    const page = await pdf.getPage(i);
    const size = page.getViewport({ scale: 1 });
    const canvas = await renderPage(page, 1.4);
    const image = await out.embedJpg(await readBytes(await canvasBlob(canvas, "image/jpeg", 0.5)));
    out.addPage([size.width, size.height]).drawImage(image, { x: 0, y: 0, width: size.width, height: size.height });
  }
  await pdf.destroy();
  return out.save();
}

export async function compressPdf(file: File, level: CompressLevel, onProgress: Progress) {
  const original = await readBytes(file);
  onProgress(5, "Reading the PDF");
  let bytes: Uint8Array;
  if (level === "smallest") {
    bytes = await pagesToImages(original, onProgress);
  } else {
    const doc = await openForEditing(original);
    await shrinkImages(doc, COMPRESS[level], onProgress);
    onProgress(85, "Saving");
    bytes = await doc.save({ useObjectStreams: true });
  }
  onProgress(90, "Optimizing the file structure");
  const optimized = await runQpdf(bytes, (i, o) => ["--object-streams=generate", "--compress-streams=y", "--recompress-flate", "--compression-level=9", i, o]).catch(() => null);
  if (optimized?.output && optimized.output.length < bytes.length) bytes = optimized.output;
  const smaller = bytes.length < original.length;
  return {
    file: { name: `${baseName(file.name)}-compressed.pdf`, blob: pdfBlob(smaller ? bytes : original) } as OutFile,
    before: original.length,
    after: smaller ? bytes.length : original.length,
    smaller,
  };
}

// ── Edit ─────────────────────────────────────────────────────────────────────────

export type WatermarkOptions = { text: string; position: "center" | "top" | "bottom" | "tile"; size: number; opacity: number; color: string };

export async function watermarkPdf(file: File, o: WatermarkOptions, onProgress: Progress): Promise<OutFile> {
  const text = o.text.trim();
  if (!text) throw new ToolError("Enter the watermark text.");
  const doc = await openForEditing(await readBytes(file));
  const stamp = await textImage(text, 160, o.color);
  const image = await doc.embedPng(stamp.bytes);
  const { degrees } = await lib();
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    onProgress(((i + 1) / pages.length) * 90, `Page ${i + 1} of ${pages.length}`);
    const { width, height } = view(page);
    const w = width * (o.size / 100);
    const h = w * (stamp.height / stamp.width);
    const draw = (cx: number, cy: number, tilt: number) => {
      // Rotates around the stamp's centre, measured on the page as the reader sees it.
      const rad = (tilt * Math.PI) / 180;
      const vx = cx - (Math.cos(rad) * w - Math.sin(rad) * h) / 2;
      const vy = cy - (Math.sin(rad) * w + Math.cos(rad) * h) / 2;
      const p = place(page, vx, vy);
      page.drawImage(image, { x: p.x, y: p.y, width: w, height: h, opacity: o.opacity, rotate: degrees(tilt + p.angle) });
    };
    if (o.position === "tile") {
      const stepX = w * 1.25;
      const stepY = Math.max(h * 4, w * 0.8);
      for (let y = stepY / 2; y < height + stepY; y += stepY) for (let x = stepX / 2; x < width + stepX; x += stepX) draw(x, y, 30);
    } else if (o.position === "center") draw(width / 2, height / 2, 45);
    else draw(width / 2, o.position === "top" ? height - h - 16 : h + 16, 0);
  });
  onProgress(95, "Saving");
  return { name: `${baseName(file.name)}-watermarked.pdf`, blob: pdfBlob(await doc.save()) };
}

export type PageNumberOptions = { position: "bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-right"; format: "n" | "page" | "of" | "dash"; startAt: number; fontSize: number };

export async function addPageNumbers(file: File, o: PageNumberOptions, onProgress: Progress): Promise<OutFile> {
  const { StandardFonts, rgb, degrees } = await lib();
  const doc = await openForEditing(await readBytes(file));
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const first = Math.max(1, o.startAt) - 1;
  const total = pages.length - first;
  pages.forEach((page, i) => {
    if (i < first) return;
    onProgress(((i + 1) / pages.length) * 90, `Page ${i + 1} of ${pages.length}`);
    const n = i - first + 1;
    const label = o.format === "page" ? `Page ${n}` : o.format === "of" ? `${n} / ${total}` : o.format === "dash" ? `- ${n} -` : String(n);
    const { width, height } = view(page);
    const textWidth = font.widthOfTextAtSize(label, o.fontSize);
    const margin = 28;
    const x = o.position.endsWith("left") ? margin : o.position.endsWith("right") ? width - textWidth - margin : (width - textWidth) / 2;
    const y = o.position.startsWith("top") ? height - margin - o.fontSize : margin;
    const p = place(page, x, y);
    page.drawText(label, { x: p.x, y: p.y, size: o.fontSize, font, color: rgb(0.25, 0.25, 0.25), rotate: degrees(p.angle) });
  });
  onProgress(95, "Saving");
  return { name: `${baseName(file.name)}-numbered.pdf`, blob: pdfBlob(await doc.save()) };
}

/** x and y are fractions of the visible page, measured to the signature's centre from the top-left. */
export type SignaturePlacement = { page: number | "all"; x: number; y: number; widthFraction: number };

export async function signPdf(file: File, signaturePng: Blob, at: SignaturePlacement, onProgress: Progress): Promise<OutFile> {
  const doc = await openForEditing(await readBytes(file));
  const image = await doc.embedPng(await readBytes(signaturePng));
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    if (at.page !== "all" && at.page !== i) continue;
    const { width, height } = view(pages[i]);
    const w = width * at.widthFraction;
    const h = w * (image.height / image.width);
    await drawImageAt(pages[i], image, width * at.x - w / 2, height * (1 - at.y) - h / 2, w, h);
  }
  onProgress(90, "Saving");
  return { name: `${baseName(file.name)}-signed.pdf`, blob: pdfBlob(await doc.save()) };
}

/** Margins in points, measured on the page as the reader sees it. */
export async function cropPdf(file: File, m: { top: number; right: number; bottom: number; left: number }, onProgress: Progress): Promise<OutFile> {
  const doc = await openForEditing(await readBytes(file));
  for (const page of doc.getPages()) {
    const { box, rotation, width, height } = view(page);
    if (m.left + m.right >= width || m.top + m.bottom >= height) throw new ToolError("Those margins would remove the whole page. Use smaller values.");
    // Maps the reader's top/right/bottom/left to the unrotated page's sides.
    const side = rotation === 90 ? { l: m.top, b: m.left, r: m.bottom, t: m.right } : rotation === 180 ? { l: m.right, b: m.top, r: m.left, t: m.bottom } : rotation === 270 ? { l: m.bottom, b: m.right, r: m.top, t: m.left } : { l: m.left, b: m.bottom, r: m.right, t: m.top };
    const x = box.x + side.l;
    const y = box.y + side.b;
    const w = box.width - side.l - side.r;
    const h = box.height - side.b - side.t;
    page.setCropBox(x, y, w, h);
    page.setMediaBox(x, y, w, h);
  }
  onProgress(90, "Saving");
  return { name: `${baseName(file.name)}-cropped.pdf`, blob: pdfBlob(await doc.save()) };
}

export type Metadata = { title: string; author: string; subject: string; keywords: string };

export async function readMetadata(file: File): Promise<Metadata> {
  const doc = await openForEditing(await readBytes(file));
  return { title: doc.getTitle() ?? "", author: doc.getAuthor() ?? "", subject: doc.getSubject() ?? "", keywords: doc.getKeywords() ?? "" };
}

export async function writeMetadata(file: File, m: Metadata): Promise<OutFile> {
  const doc = await openForEditing(await readBytes(file));
  doc.setTitle(m.title);
  doc.setAuthor(m.author);
  doc.setSubject(m.subject);
  doc.setKeywords(m.keywords.split(",").map((k) => k.trim()).filter(Boolean));
  return { name: `${baseName(file.name)}-edited.pdf`, blob: pdfBlob(await doc.save()) };
}

export async function flattenPdf(file: File, onProgress: Progress) {
  const doc = await openForEditing(await readBytes(file));
  const form = doc.getForm();
  const fields = form.getFields().length;
  if (fields) form.flatten();
  onProgress(90, "Saving");
  return { file: { name: `${baseName(file.name)}-flattened.pdf`, blob: pdfBlob(await doc.save()) } as OutFile, fields };
}

/** Whether opening the file fails only because of its password. */
async function needsPassword(bytes: Uint8Array, password?: string) {
  try {
    await (await openForReading(bytes, password)).destroy();
    return false;
  } catch (err) {
    return (err as Error).message.toLowerCase().includes("password");
  }
}

/** Tries the gentlest fix first. The last resort keeps the pages' appearance, but as images. */
export async function repairPdf(file: File, onProgress: Progress) {
  const bytes = await readBytes(file);
  if (await needsPassword(bytes)) throw new ToolError("This PDF is password protected. Remove the password first with Unlock PDF.");
  const name = `${baseName(file.name)}-repaired.pdf`;
  onProgress(25, "Rebuilding the file");
  const rebuilt = await runQpdf(bytes, (i, o) => [i, o]);
  if (rebuilt.output) return { file: { name, blob: pdfBlob(rebuilt.output) } as OutFile, asImages: false };
  onProgress(50, "Trying a deeper recovery");
  try {
    const { PDFDocument } = await lib();
    const doc = await PDFDocument.load(bytes, { throwOnInvalidObject: false, updateMetadata: false });
    if (doc.getPageCount() > 0) return { file: { name, blob: pdfBlob(await doc.save()) } as OutFile, asImages: false };
  } catch {
    /* on to the last resort */
  }
  onProgress(60, "Recovering pages as images");
  try {
    return { file: { name, blob: pdfBlob(await pagesToImages(bytes, onProgress)) } as OutFile, asImages: true };
  } catch {
    throw new ToolError("This file is too damaged to repair, or it isn't a PDF.");
  }
}

// ── Security ─────────────────────────────────────────────────────────────────────

export async function protectPdf(file: File, password: string, allow: { print: boolean; copy: boolean }, onProgress: Progress): Promise<OutFile> {
  if (password.length < 4) throw new ToolError("Use a password of at least 4 characters.");
  onProgress(40, "Encrypting");
  const owner = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
  const bytes = await readBytes(file);
  const r = await runQpdf(bytes, (i, o) => ["--encrypt", password, owner, "256", `--print=${allow.print ? "full" : "none"}`, `--extract=${allow.copy ? "y" : "n"}`, "--", i, o]);
  if (!r.output) {
    if (await needsPassword(bytes)) throw new ToolError("This PDF already has a password. Remove it first with Unlock PDF.");
    throw new ToolError("This file could not be encrypted. It may be damaged, so try Repair PDF first.");
  }
  return { name: `${baseName(file.name)}-protected.pdf`, blob: pdfBlob(r.output) };
}

export async function unlockPdf(file: File, password: string, onProgress: Progress): Promise<OutFile> {
  onProgress(40, "Unlocking");
  const bytes = await readBytes(file);
  const r = await runQpdf(bytes, (i, o) => [`--password=${password}`, "--decrypt", i, o]);
  if (!r.output) {
    if (await needsPassword(bytes, password || undefined)) throw new ToolError(password ? "That password is not correct." : "This PDF needs a password. Enter it above.");
    throw new ToolError("This file could not be opened. It may be damaged, so try Repair PDF.");
  }
  return { name: `${baseName(file.name)}-unlocked.pdf`, blob: pdfBlob(r.output) };
}

// ── Convert ──────────────────────────────────────────────────────────────────────

export async function renderPage(page: any, scale: number) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] } as const;
export type ImagePdfOptions = { size: "fit" | "a4" | "letter"; margin: number };

export async function imagesToPdf(files: File[], o: ImagePdfOptions, onProgress: Progress): Promise<OutFile> {
  if (!files.length) throw new ToolError("Add at least one image.");
  const { PDFDocument } = await lib();
  const doc = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    onProgress(((i + 0.5) / files.length) * 90, `Adding ${files[i].name}`);
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(files[i]);
    } catch {
      throw new ToolError(`${files[i].name} can't be read. iPhone HEIC photos need to be saved as JPG first.`);
    }
    const isJpeg = files[i].type === "image/jpeg";
    const isPng = files[i].type === "image/png";
    const image = isJpeg
      ? await doc.embedJpg(await readBytes(files[i]))
      : isPng
        ? await doc.embedPng(await readBytes(files[i]))
        : await (async () => {
            // Other formats go through a canvas; pdf-lib only embeds JPEG and PNG.
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
            return doc.embedPng(await readBytes(await canvasBlob(canvas, "image/png")));
          })();
    let pageW: number = image.width;
    let pageH: number = image.height;
    if (o.size !== "fit") {
      const [a, b] = PAGE_SIZES[o.size];
      [pageW, pageH] = image.width > image.height ? [b, a] : [a, b];
    } else {
      pageW += o.margin * 2;
      pageH += o.margin * 2;
    }
    const scale = Math.min((pageW - o.margin * 2) / image.width, (pageH - o.margin * 2) / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    doc.addPage([pageW, pageH]).drawImage(image, { x: (pageW - w) / 2, y: (pageH - h) / 2, width: w, height: h });
  }
  onProgress(95, "Saving");
  return { name: files.length === 1 ? `${baseName(files[0].name)}.pdf` : "images.pdf", blob: pdfBlob(await doc.save()) };
}

export async function pdfToImages(file: File, format: "png" | "jpeg", scale: number, onProgress: Progress): Promise<OutFile[]> {
  const pdf = await openForReading(await readBytes(file));
  const stem = baseName(file.name);
  const out: OutFile[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress((i / pdf.numPages) * 95, `Page ${i} of ${pdf.numPages}`);
    const canvas = await renderPage(await pdf.getPage(i), scale);
    out.push({ name: `${stem}-page-${i}.${format === "png" ? "png" : "jpg"}`, blob: await canvasBlob(canvas, `image/${format}`, 0.92) });
    canvas.width = canvas.height = 0; // frees the canvas memory right away on long documents
  }
  await pdf.destroy();
  return out;
}

/** Rebuilds readable lines from a page's text items, which arrive in no guaranteed order. */
function linesFromContent(content: any): string[] {
  const rows: { y: number; parts: { x: number; s: string }[] }[] = [];
  for (const item of content.items) {
    if (!item.str) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const tolerance = Math.max(2, (item.height || 10) * 0.5);
    let row = rows.find((r) => Math.abs(r.y - y) < tolerance);
    if (!row) rows.push((row = { y, parts: [] }));
    row.parts.push({ x, s: item.str });
  }
  return rows.sort((a, b) => b.y - a.y).map((r) => r.parts.sort((a, b) => a.x - b.x).map((p) => p.s).join("").replace(/\s+/g, " ").trim()).filter(Boolean);
}

export async function extractText(file: File, onProgress: Progress) {
  const pdf = await openForReading(await readBytes(file));
  const pages: string[][] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress((i / pdf.numPages) * 95, `Page ${i} of ${pdf.numPages}`);
    pages.push(linesFromContent(await (await pdf.getPage(i)).getTextContent()));
  }
  const total = pdf.numPages;
  await pdf.destroy();
  return { pages, total };
}

export async function extractTextOcr(file: File, lang: string, onProgress: Progress) {
  const pdf = await openForReading(await readBytes(file));
  onProgress(3, "Loading the OCR language (only slow the first time)");
  const { createWorker } = await import("tesseract.js");
  let worker;
  try {
    worker = await createWorker(lang);
  } catch {
    throw new ToolError("The OCR language data could not be downloaded. Check your connection and try again.");
  }
  const pages: string[][] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress(5 + ((i - 1) / pdf.numPages) * 90, `Reading page ${i} of ${pdf.numPages}`);
    const canvas = await renderPage(await pdf.getPage(i), 2);
    const { data } = await worker.recognize(canvas);
    pages.push(data.text.split("\n").map((l: string) => l.trim()).filter(Boolean));
    canvas.width = canvas.height = 0;
  }
  const total = pdf.numPages;
  await worker.terminate();
  await pdf.destroy();
  return { pages, total };
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[^\u0009\u000A\u000D -퟿-�]/g, "");

/** A minimal Word file: paragraphs of text, with a page break between PDF pages. */
export async function textToDocx(pages: string[][], name: string): Promise<OutFile> {
  const { default: JSZip } = await import("jszip");
  const paragraph = (t: string) => `<w:p><w:r><w:t xml:space="preserve">${xml(t)}</w:t></w:r></w:p>`;
  const body = pages.map((lines, i) => lines.map(paragraph).join("") + (i < pages.length - 1 ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : "")).join("");
  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`);
  return { name, blob: await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }) };
}

export async function zipFiles(files: OutFile[], name: string): Promise<OutFile> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.blob);
  return { name, blob: await zip.generateAsync({ type: "blob" }) };
}
