// Copies the browser-only PDF engines from node_modules to public/vendor, so they are served from this site
// and loaded only when a tool needs them. Runs before `next dev` and `next build`; public/vendor is git-ignored.
import { cpSync, mkdirSync } from "node:fs";

const copy = (from, to) => cpSync(`node_modules/${from}`, `public/vendor/${to}`, { recursive: true });

mkdirSync("public/vendor/pdfjs", { recursive: true });
mkdirSync("public/vendor/qpdf", { recursive: true });
copy("pdfjs-dist/build/pdf.min.mjs", "pdfjs/pdf.min.mjs");
copy("pdfjs-dist/build/pdf.worker.min.mjs", "pdfjs/pdf.worker.min.mjs");
copy("pdfjs-dist/cmaps", "pdfjs/cmaps");
copy("pdfjs-dist/standard_fonts", "pdfjs/standard_fonts");
copy("@neslinesli93/qpdf-wasm/dist/qpdf.js", "qpdf/qpdf.js");
copy("@neslinesli93/qpdf-wasm/dist/qpdf.wasm", "qpdf/qpdf.wasm");
