"use client";

import { MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = ["How much does a business website cost?", "Do you build online stores?", "How long does a website take?", "Can I update the website myself?"];

/** Shows text with any site paths (like /services/ecommerce-shopify) as links. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/(\s\/[a-z0-9][a-z0-9\-/]*)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\s\/[a-z0-9]/.test(p) ? (
          <span key={i}>
            {" "}
            <Link href={p.trim().replace(/[.,)]+$/, "")} className="font-medium text-primary underline underline-offset-2">
              {p.trim().replace(/[.,)]+$/, "")}
            </Link>
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

/** Questions answered by a free AI model from the site's own content, with WhatsApp always one tap away. */
export function AssistantChat({ whatsappHref }: { whatsappHref: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);

  // Braces matter: newer browsers return a Promise from scrollIntoView, which React would treat as a cleanup function.
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  async function ask(question: string) {
    const q = question.trim().slice(0, 500);
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    track("assistant_question");
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
      if (res.ok && data.answer) setMessages([...next, { role: "assistant", content: data.answer }]);
      else setError(data.error ?? "The assistant couldn't answer right now. Please message us on WhatsApp.");
    } catch {
      setError("You seem to be offline. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-3" aria-live="polite">
        {messages.length === 0 && (
          <>
            <p className="text-sm text-muted-foreground">Ask anything about our services, prices or how we work. Answers come from our website.</p>
            <div className="grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => ask(s)} className="rounded-2xl border px-4 py-2.5 text-left text-sm hover:border-primary/50 hover:bg-muted">
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line", m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
            {m.role === "assistant" ? <Linked text={m.content} /> : m.content}
          </div>
        ))}
        {busy && <div className="w-16 animate-pulse rounded-2xl bg-muted px-4 py-2.5 text-sm">…</div>}
        {error && <p className="rounded-2xl border border-destructive/40 px-4 py-2.5 text-sm text-destructive">{error}</p>}
        <div ref={end} />
      </div>

      {messages.length > 0 && whatsappHref && (
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#1FAF5A] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
          <MessageCircle className="size-4" aria-hidden="true" /> Talk to a person on WhatsApp
        </a>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label className="sr-only" htmlFor="assistant-input">
          Your question
        </label>
        <input
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Type your question"
          className="h-11 min-w-0 flex-1 rounded-full border bg-background px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send question" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">AI answers can be wrong; your final quote comes from us. Questions go to Google Gemini and may be used to improve its services, so please don&apos;t share personal details.</p>
    </div>
  );
}
