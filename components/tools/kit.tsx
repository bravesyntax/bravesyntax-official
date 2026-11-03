"use client";

import { AlertCircle, Check, Copy, Download, FileUp, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { formatBytes, type OutFile } from "@/lib/tools/pdf";
import { cn } from "@/lib/utils";

// Shared pieces of the tool workspaces: file picker, option fields, progress, errors and downloads.

export const fieldClass = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border bg-card p-4 sm:p-6", className)}>{children}</div>;
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("grid content-start gap-1.5 text-sm", className)}>
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={fieldClass}>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: [T, string][]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-xl border bg-muted/50 p-1">
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={cn("min-h-9 flex-1 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors", value === v ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function FilePicker({ accept, multiple, onFiles, title, hint, compact }: { accept: string; multiple?: boolean; onFiles: (files: File[]) => void; title?: string; hint: string; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={cn("flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors hover:border-primary/60 hover:bg-primary/5 focus-within:border-primary", over && "border-primary bg-primary/10", compact ? "gap-1 p-4" : "gap-3 px-4 py-14")}
    >
      <input
        ref={input}
        data-testid="tool-file-input"
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = ""; // so picking the same file again still fires a change
        }}
      />
      {!compact && (
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <FileUp className="size-7" aria-hidden="true" />
        </span>
      )}
      <span className={cn("font-semibold", compact ? "text-sm" : "text-lg")}>{title ?? (multiple ? "Choose files or drop them here" : "Choose a file or drop it here")}</span>
      <span className="text-sm text-muted-foreground">{hint}</span>
    </label>
  );
}

export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div role="status" aria-live="polite" className="rounded-xl border bg-muted/30 p-4">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span className="font-medium tabular-nums">{Math.round(percent)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" data-testid="tool-error" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> <span>{children}</span>
    </p>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">{children}</p>;
}

export function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** A download link whose object URL is released when it's no longer shown. */
export function DownloadLink({ file, primary, className, children }: { file: OutFile; primary?: boolean; className?: string; children?: ReactNode }) {
  const url = useMemo(() => URL.createObjectURL(file.blob), [file.blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <a href={url} download={file.name} data-testid="tool-download" data-filename={file.name} className={cn(primary ? "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90" : "flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-sm hover:border-primary/50", className)}>
      {children ?? (
        <>
          <span className="min-w-0 truncate">{file.name}</span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            {formatBytes(file.blob.size)} <Download className="size-3.5" aria-hidden="true" />
          </span>
        </>
      )}
    </a>
  );
}

export function ResultCard({ title, detail, file, onReset, resetLabel = "Start over", children }: { title: string; detail?: ReactNode; file?: OutFile; onReset: () => void; resetLabel?: string; children?: ReactNode }) {
  return (
    <div data-testid="tool-result" className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          {detail && <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>}
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        {file && (
          <DownloadLink file={file} primary>
            <Download className="size-4" aria-hidden="true" /> Download {file.name.split(".").pop()?.toUpperCase()} ({formatBytes(file.blob.size)})
          </DownloadLink>
        )}
        <Button type="button" variant="ghost" className="h-11 rounded-full" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden="true" /> {resetLabel}
        </Button>
      </div>
    </div>
  );
}

export function RunButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Button type="button" data-testid="tool-run" size="lg" className="h-12 w-full rounded-full text-base sm:w-auto sm:min-w-56" disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("rounded-full", className)}
      disabled={!text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard blocked: the text is still on screen to select by hand */
        }
      }}
    >
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />} {copied ? "Copied" : label}
    </Button>
  );
}
