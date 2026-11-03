"use client";

import { Download, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CopyButton, ErrorNote, Field, Note, Panel, Segmented, triggerDownload } from "./kit";

// The smaller text-based tools. Each is self-contained and works entirely in the browser.

// ── QR code ──────────────────────────────────────────────────────────────────────

type QrKind = "url" | "whatsapp" | "upi" | "phone" | "wifi" | "text";
const digits = (s: string) => s.replace(/\D/g, "");
const wifiEscape = (s: string) => s.replace(/([\\;,":])/g, "\\$1");

export function QrTool() {
  const [kind, setKind] = useState<QrKind>("url");
  const [v, setV] = useState({ url: "https://", phone: "", message: "", upi: "", name: "", amount: "", ssid: "", password: "", security: "WPA", text: "" });
  const [color, setColor] = useState("#000000");
  const [png, setPng] = useState("");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  const content = useMemo(() => {
    if (kind === "url") return /^https?:\/\/.+\..+/.test(v.url) ? v.url : "";
    if (kind === "whatsapp") return digits(v.phone).length >= 10 ? `https://wa.me/${digits(v.phone).length === 10 ? `91${digits(v.phone)}` : digits(v.phone)}${v.message ? `?text=${encodeURIComponent(v.message)}` : ""}` : "";
    if (kind === "upi") {
      if (!/^[\w.-]+@[\w.-]+$/.test(v.upi)) return "";
      const q = new URLSearchParams({ pa: v.upi, cu: "INR" });
      if (v.name) q.set("pn", v.name);
      if (Number(v.amount) > 0) q.set("am", Number(v.amount).toFixed(2));
      return `upi://pay?${q}`;
    }
    if (kind === "phone") return digits(v.phone).length >= 7 ? `tel:+${digits(v.phone).length === 10 ? `91${digits(v.phone)}` : digits(v.phone)}` : "";
    if (kind === "wifi") return v.ssid ? `WIFI:T:${v.security};S:${wifiEscape(v.ssid)};${v.security === "nopass" ? "" : `P:${wifiEscape(v.password)};`};` : "";
    return v.text;
  }, [kind, v]);

  useEffect(() => {
    let live = true;
    setError("");
    if (!content) {
      setPng("");
      setSvg("");
      return;
    }
    (async () => {
      const QR = await import("qrcode");
      const options = { errorCorrectionLevel: "M" as const, margin: 2, width: 1024, color: { dark: color, light: "#ffffff" } };
      const [dataUrl, svgText] = await Promise.all([QR.toDataURL(content, options), QR.toString(content, { ...options, type: "svg" })]);
      if (live) {
        setPng(dataUrl);
        setSvg(svgText);
      }
    })().catch(() => live && setError("That's too much text for one QR code. Shorten it."));
    return () => {
      live = false;
    };
  }, [content, color]);

  const set = (patch: Partial<typeof v>) => setV({ ...v, ...patch });

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_20rem]">
      <Panel className="space-y-4">
        <Segmented label="QR code type" value={kind} onChange={setKind} options={[["url", "Link"], ["whatsapp", "WhatsApp"], ["upi", "UPI"], ["phone", "Phone"], ["wifi", "Wi-Fi"], ["text", "Text"]]} />
        {kind === "url" && (
          <Field label="Website address">
            <Input data-testid="qr-url" type="url" value={v.url} onChange={(e) => set({ url: e.target.value })} className="h-11" />
          </Field>
        )}
        {(kind === "whatsapp" || kind === "phone") && (
          <Field label="Phone number" hint="A 10-digit number is treated as Indian (+91).">
            <Input type="tel" value={v.phone} onChange={(e) => set({ phone: e.target.value })} className="h-11" />
          </Field>
        )}
        {kind === "whatsapp" && (
          <Field label="Message (optional)">
            <Textarea rows={2} value={v.message} onChange={(e) => set({ message: e.target.value })} />
          </Field>
        )}
        {kind === "upi" && (
          <>
            <Field label="UPI ID">
              <Input data-testid="qr-upi" value={v.upi} placeholder="yourname@bank" onChange={(e) => set({ upi: e.target.value.trim() })} className="h-11" />
            </Field>
            <Field label="Payee name (optional)">
              <Input value={v.name} onChange={(e) => set({ name: e.target.value })} className="h-11" />
            </Field>
            <Field label="Fixed amount in ₹ (optional)" hint="Leave empty so the customer enters the amount.">
              <Input type="number" min={0} value={v.amount} onChange={(e) => set({ amount: e.target.value })} className="h-11" />
            </Field>
          </>
        )}
        {kind === "wifi" && (
          <>
            <Field label="Network name (SSID)">
              <Input value={v.ssid} onChange={(e) => set({ ssid: e.target.value })} className="h-11" />
            </Field>
            <Field label="Security">
              <select value={v.security} onChange={(e) => set({ security: e.target.value })} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No password</option>
              </select>
            </Field>
            {v.security !== "nopass" && (
              <Field label="Password">
                <Input value={v.password} onChange={(e) => set({ password: e.target.value })} className="h-11" />
              </Field>
            )}
          </>
        )}
        {kind === "text" && (
          <Field label="Text">
            <Textarea rows={4} value={v.text} onChange={(e) => set({ text: e.target.value })} />
          </Field>
        )}
        <Field label="Colour" hint="Keep it dark on white. Light colours may not scan.">
          <input type="color" aria-label="QR code colour" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-24 cursor-pointer rounded-lg border border-input bg-background p-1" />
        </Field>
      </Panel>
      <Panel className="flex flex-col items-center gap-3 self-start">
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated data URL
          <img src={png} data-testid="qr-image" alt="Your QR code" className="w-full max-w-64 rounded-lg border bg-white" />
        ) : (
          <div className="grid aspect-square w-full max-w-64 place-items-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Fill in the details to see your QR code</div>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}
        <div className="grid w-full grid-cols-2 gap-2">
          <Button
            type="button"
            className="rounded-full"
            disabled={!png}
            onClick={async () => triggerDownload(await (await fetch(png)).blob(), "qr-code.png")}
          >
            <Download className="size-4" aria-hidden="true" /> PNG
          </Button>
          <Button type="button" variant="outline" className="rounded-full" disabled={!svg} onClick={() => triggerDownload(new Blob([svg], { type: "image/svg+xml" }), "qr-code.svg")}>
            <Download className="size-4" aria-hidden="true" /> SVG
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">Scan it with your phone before printing.</p>
      </Panel>
    </div>
  );
}

// ── WhatsApp link ────────────────────────────────────────────────────────────────

export function WhatsAppTool() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Hi, I found you on your website and would like to know more.");
  const number = digits(phone).length === 10 ? `91${digits(phone)}` : digits(phone);
  const valid = number.length >= 11 && number.length <= 15;
  const link = valid ? `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}` : "";
  const html = link ? `<a href="${link}" target="_blank" rel="noopener">Chat on WhatsApp</a>` : "";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel className="space-y-4">
        <Field label="WhatsApp number" hint="A 10-digit number is treated as Indian (+91). Otherwise include the country code.">
          <Input type="tel" data-testid="wa-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className="h-11" />
        </Field>
        <Field label="Message the customer starts with (optional)">
          <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
      </Panel>
      <Panel className="space-y-3 self-start">
        <h2 className="font-semibold">Your link</h2>
        <p data-testid="wa-link" className="min-h-12 rounded-xl border bg-muted/40 p-3 text-sm break-all">{link || "Enter a valid number to get your link."}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={link} label="Copy link" />
          <CopyButton text={html} label="Copy website code" />
          {link && (
            <Button asChild className="rounded-full">
              <a href={link} target="_blank" rel="noopener noreferrer">
                Test it
              </a>
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}

// ── Meta tags ────────────────────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function Meter({ label, count, ok, max }: { label: string; count: number; ok: number; max: number }) {
  const state = count === 0 ? "text-muted-foreground" : count > max ? "text-destructive" : count >= ok ? "text-primary" : "text-amber-600 dark:text-amber-400";
  const note = count === 0 ? "" : count > max ? "too long, may get cut off" : count >= ok ? "good length" : "could be longer";
  return (
    <span className={cn("text-xs", state)}>
      {label}: {count} / {max} {note && `· ${note}`}
    </span>
  );
}

export function MetaTool() {
  const [v, setV] = useState({ title: "", description: "", url: "https://", image: "", site: "" });
  const set = (patch: Partial<typeof v>) => setV({ ...v, ...patch });
  const host = (() => {
    try {
      const u = new URL(v.url);
      return { site: u.hostname, path: u.pathname === "/" ? "" : u.pathname.split("/").filter(Boolean).join(" › ") };
    } catch {
      return { site: "example.com", path: "" };
    }
  })();
  const tags = [
    v.title && `<title>${esc(v.title)}</title>`,
    v.description && `<meta name="description" content="${esc(v.description)}">`,
    v.url.length > 8 && `<link rel="canonical" href="${esc(v.url)}">`,
    "",
    "<!-- Social sharing -->",
    `<meta property="og:type" content="website">`,
    v.site && `<meta property="og:site_name" content="${esc(v.site)}">`,
    v.title && `<meta property="og:title" content="${esc(v.title)}">`,
    v.description && `<meta property="og:description" content="${esc(v.description)}">`,
    v.url.length > 8 && `<meta property="og:url" content="${esc(v.url)}">`,
    v.image && `<meta property="og:image" content="${esc(v.image)}">`,
    `<meta name="twitter:card" content="${v.image ? "summary_large_image" : "summary"}">`,
  ]
    .filter((l) => l !== false)
    .join("\n");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="space-y-4">
        <Field label="Page title">
          <Input data-testid="meta-title" value={v.title} onChange={(e) => set({ title: e.target.value })} className="h-11" />
          <Meter label="Characters" count={v.title.length} ok={30} max={60} />
        </Field>
        <Field label="Description">
          <Textarea rows={3} value={v.description} onChange={(e) => set({ description: e.target.value })} />
          <Meter label="Characters" count={v.description.length} ok={110} max={160} />
        </Field>
        <Field label="Page address">
          <Input type="url" value={v.url} onChange={(e) => set({ url: e.target.value })} className="h-11" />
        </Field>
        <Field label="Share image address (optional)" hint="1200 × 630 pixels works everywhere.">
          <Input type="url" value={v.image} onChange={(e) => set({ image: e.target.value })} className="h-11" />
        </Field>
        <Field label="Site name (optional)">
          <Input value={v.site} onChange={(e) => set({ site: e.target.value })} className="h-11" />
        </Field>
      </Panel>
      <div className="space-y-4">
        <Panel>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Google preview (approximate)</h2>
          <div className="rounded-xl border bg-white p-4 font-sans text-[#202124]">
            <p className="truncate text-xs">
              {host.site}
              {host.path && <span className="text-[#4d5156]"> › {host.path}</span>}
            </p>
            <p className="mt-1 line-clamp-1 text-xl text-[#1a0dab]">{v.title || "Your page title appears here"}</p>
            <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{v.description || "Your description appears here. Tell people what they'll get on this page, and why it's worth a click."}</p>
          </div>
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-semibold">Your tags</h2>
          <pre data-testid="meta-output" className="max-h-72 overflow-auto rounded-xl border bg-muted/40 p-3 text-xs whitespace-pre-wrap">{tags}</pre>
          <CopyButton text={tags} label="Copy tags" />
        </Panel>
      </div>
    </div>
  );
}

// ── UTM builder ──────────────────────────────────────────────────────────────────

export function UtmTool() {
  const [v, setV] = useState({ url: "", source: "", medium: "", campaign: "", term: "", content: "" });
  const set = (patch: Partial<typeof v>) => setV({ ...v, ...patch });
  const slugify = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "_");
  const link = (() => {
    if (!v.url || !v.source) return "";
    try {
      const u = new URL(v.url.startsWith("http") ? v.url : `https://${v.url}`);
      const pairs: [string, string][] = [["utm_source", v.source], ["utm_medium", v.medium], ["utm_campaign", v.campaign], ["utm_term", v.term], ["utm_content", v.content]];
      for (const [k, val] of pairs) if (val.trim()) u.searchParams.set(k, slugify(val));
      return u.toString();
    } catch {
      return "";
    }
  })();
  return (
    <div className="space-y-4">
      <Panel className="grid gap-4 sm:grid-cols-2">
        <Field label="Your page address" className="sm:col-span-2">
          <Input data-testid="utm-url" value={v.url} placeholder="https://yoursite.com/offer" onChange={(e) => set({ url: e.target.value })} className="h-11" />
        </Field>
        <Field label="Source" hint="Where it's posted: google, instagram, newsletter">
          <Input data-testid="utm-source" value={v.source} onChange={(e) => set({ source: e.target.value })} className="h-11" />
        </Field>
        <Field label="Medium" hint="The type of link: cpc, social, email">
          <Input value={v.medium} onChange={(e) => set({ medium: e.target.value })} className="h-11" />
        </Field>
        <Field label="Campaign" hint="A name you'll recognise: diwali_sale">
          <Input value={v.campaign} onChange={(e) => set({ campaign: e.target.value })} className="h-11" />
        </Field>
        <Field label="Content (optional)" hint="To compare two ads or links">
          <Input value={v.content} onChange={(e) => set({ content: e.target.value })} className="h-11" />
        </Field>
      </Panel>
      <Panel className="space-y-3">
        <h2 className="font-semibold">Your tracking link</h2>
        <p data-testid="utm-link" className="min-h-12 rounded-xl border bg-muted/40 p-3 text-sm break-all">{link || "Add your page address and a source to see the link."}</p>
        <CopyButton text={link} label="Copy link" />
      </Panel>
    </div>
  );
}

// ── Word counter ─────────────────────────────────────────────────────────────────

const LIMITS: [string, number][] = [
  ["Google title", 60],
  ["Google description", 160],
  ["X post", 280],
  ["Instagram caption", 2200],
];

export function WordCounterTool() {
  const [text, setText] = useState("");
  const s = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const counts = new Map<string, number>();
    for (const w of words) {
      const k = w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
      if (k.length > 3) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return {
      words: words.length,
      chars: text.length,
      noSpaces: text.replace(/\s/g, "").length,
      sentences: (text.match(/[^.!?।]+[.!?।]+|[^.!?।]+$/g) ?? []).filter((x) => x.trim()).length,
      paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
      minutes: Math.max(words.length ? 1 : 0, Math.round(words.length / 200)),
      top: [...counts].sort((a, b) => b[1] - a[1]).filter(([, n]) => n > 1).slice(0, 6),
    };
  }, [text]);
  const stats: [string, number | string][] = [
    ["Words", s.words],
    ["Characters", s.chars],
    ["No spaces", s.noSpaces],
    ["Sentences", s.sentences],
    ["Paragraphs", s.paragraphs],
    ["Reading time", s.minutes ? `${s.minutes} min` : "0 min"],
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-3 text-center">
            <p data-testid={`wc-${label.toLowerCase().replace(/\s/g, "-")}`} className="text-xl font-semibold tabular-nums">{typeof value === "number" ? value.toLocaleString("en-IN") : value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <Textarea data-testid="wc-input" rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste your text here" />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="space-y-2">
          <h2 className="font-semibold">Length limits</h2>
          {LIMITS.map(([label, max]) => (
            <div key={label} className="text-sm">
              <div className="flex justify-between">
                <span>{label}</span>
                <span className={cn("tabular-nums", s.chars > max && "font-medium text-destructive")}>
                  {s.chars} / {max}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", s.chars > max ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min(100, (s.chars / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </Panel>
        <Panel>
          <h2 className="mb-2 font-semibold">Most used words</h2>
          {s.top.length ? (
            <ul className="flex flex-wrap gap-2">
              {s.top.map(([w, n]) => (
                <li key={w} className="rounded-full border px-3 py-1 text-sm">
                  {w} <span className="text-muted-foreground">× {n}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Repeated words will show here.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ── Password generator ───────────────────────────────────────────────────────────

const SETS = { lower: "abcdefghijkmnopqrstuvwxyz", upper: "ABCDEFGHJKLMNPQRSTUVWXYZ", numbers: "23456789", symbols: "!@#$%^&*()-_=+[]{}?" };

/** An unbiased random index: values that would favour some characters are thrown away. */
function randomBelow(n: number) {
  const limit = Math.floor(0xffffffff / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % n;
}

export function PasswordTool() {
  const [length, setLength] = useState(18);
  const [on, setOn] = useState({ lower: true, upper: true, numbers: true, symbols: true });
  const [password, setPassword] = useState("");

  const make = useCallback(() => {
    const groups = (Object.keys(on) as (keyof typeof on)[]).filter((k) => on[k]).map((k) => SETS[k]);
    if (!groups.length) return setPassword("");
    const all = groups.join("");
    const chars = groups.map((g) => g[randomBelow(g.length)]); // at least one from each chosen set
    while (chars.length < length) chars.push(all[randomBelow(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomBelow(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setPassword(chars.slice(0, length).join(""));
  }, [length, on]);

  useEffect(make, [make]);

  const pool = (Object.keys(on) as (keyof typeof on)[]).reduce((n, k) => n + (on[k] ? SETS[k].length : 0), 0);
  const bits = pool ? Math.round(length * Math.log2(pool)) : 0;
  const strength = bits >= 100 ? ["Very strong", "bg-primary", 100] : bits >= 70 ? ["Strong", "bg-primary", 75] : bits >= 45 ? ["Fair", "bg-amber-500", 50] : ["Weak", "bg-destructive", 25];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Panel className="space-y-3">
        <p data-testid="pw-output" className="min-h-14 rounded-xl border bg-muted/40 p-4 font-mono text-lg break-all">{password || "Choose at least one character type."}</p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all", strength[1])} style={{ width: `${strength[2]}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          {strength[0]} · about {bits} bits of randomness
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" data-testid="tool-run" className="rounded-full" onClick={make}>
            <RefreshCw className="size-4" aria-hidden="true" /> New password
          </Button>
          <CopyButton text={password} />
        </div>
      </Panel>
      <Panel className="space-y-4">
        <Field label={`Length: ${length}`}>
          <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full accent-primary" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(on) as (keyof typeof on)[]).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm capitalize">
              <input type="checkbox" checked={on[k]} onChange={(e) => setOn({ ...on, [k]: e.target.checked })} className="size-4 accent-primary" /> {k}
            </label>
          ))}
        </div>
        <Note>Look-alike characters such as l, 1, O and 0 are left out, so passwords are easier to read.</Note>
      </Panel>
    </div>
  );
}

// ── JSON formatter ───────────────────────────────────────────────────────────────

export function JsonTool() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<"2" | "4" | "min">("2");
  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      return { output: JSON.stringify(JSON.parse(input), null, indent === "min" ? 0 : Number(indent)), error: "" };
    } catch (err) {
      const message = (err as Error).message;
      const at = message.match(/position (\d+)/);
      if (at) {
        const before = input.slice(0, Number(at[1]));
        const line = before.split("\n").length;
        const col = before.length - before.lastIndexOf("\n");
        return { output: "", error: `Invalid JSON at line ${line}, column ${col}. ${message}` };
      }
      return { output: "", error: `Invalid JSON. ${message}` };
    }
  }, [input, indent]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="w-full sm:w-72">
          <Segmented label="Formatting" value={indent} onChange={setIndent} options={[["2", "2 spaces"], ["4", "4 spaces"], ["min", "Minify"]]} />
        </div>
        <CopyButton text={output} label="Copy result" />
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="grid gap-4 md:grid-cols-2">
        <Textarea data-testid="json-input" rows={18} spellCheck={false} value={input} onChange={(e) => setInput(e.target.value)} placeholder='Paste JSON here, for example {"name":"Brave Syntax"}' className="font-mono text-sm" />
        <pre data-testid="json-output" className="max-h-[28rem] min-h-40 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap break-all">{output}</pre>
      </div>
    </div>
  );
}
