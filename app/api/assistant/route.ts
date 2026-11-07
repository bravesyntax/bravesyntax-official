import { NextResponse, type NextRequest } from "next/server";
import { assistantEnabled, assistantProvider, contextFor, SYSTEM_PROMPT } from "@/lib/assistant";
import { SITE_URL } from "@/lib/config";

// Answers visitor questions with a free AI model (Gemini, or Groq as an alternative), grounded in the site's own
// content. Conversations are not stored. Same-site requests only, short messages only, and a per-visitor limit so
// the free plan isn't used up. Google's free Gemini tier may not be offered to people in the EU, EEA, Switzerland
// or UK, so it stays off there.

const MAX_CHARS = 500;
const MAX_TURNS = 8;
const PER_MINUTE = 6;
const SITE_HOST = new URL(SITE_URL).host;
const RESTRICTED = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO CH GB".split(" "));
const hits = new Map<string, number[]>();
const busy = () => NextResponse.json({ error: "The assistant is busy right now. Please message us on WhatsApp." }, { status: 429 });
const failed = () => NextResponse.json({ error: "The assistant couldn't answer right now. Please message us on WhatsApp." }, { status: 502 });

function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > PER_MINUTE;
}

type Msg = { role: "user" | "assistant"; content: string };

async function askGemini(system: string, messages: Msg[]) {
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (res.status === 429) return { status: 429 as const };
  if (!res.ok) {
    console.error("[assistant] gemini", res.status, (await res.text()).slice(0, 200));
    return { status: 502 as const };
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return { status: 200 as const, answer: data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() };
}

async function askGroq(system: string, messages: Msg[]) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.GROQ_MODEL || "llama-3.1-8b-instant", temperature: 0.2, max_tokens: 300, messages: [{ role: "system", content: system }, ...messages] }),
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 429) return { status: 429 as const };
  if (!res.ok) {
    console.error("[assistant] groq", res.status, (await res.text()).slice(0, 200));
    return { status: 502 as const };
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return { status: 200 as const, answer: data.choices?.[0]?.message?.content?.trim() };
}

export async function POST(req: NextRequest) {
  if (!assistantEnabled()) return NextResponse.json({ error: "The assistant is not set up." }, { status: 503 });
  const origin = req.headers.get("origin");
  if (!origin || ![SITE_HOST, req.nextUrl.host].includes(new URL(origin).host)) return new NextResponse(null, { status: 403 });
  const provider = assistantProvider();
  if (provider === "gemini" && RESTRICTED.has(req.headers.get("x-vercel-ip-country") ?? "")) {
    return NextResponse.json({ error: "The assistant isn't available in your region. Please message us on WhatsApp or by email." }, { status: 451 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many questions at once. Please wait a minute." }, { status: 429 });

  let messages: Msg[];
  try {
    const body = (await req.json()) as { messages?: unknown };
    messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m): m is Msg => !!m && typeof m === "object" && ["user", "assistant"].includes((m as Msg).role) && typeof (m as Msg).content === "string")
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  while (messages[0]?.role === "assistant") messages.shift(); // a conversation starts with the visitor
  const question = [...messages].reverse().find((m) => m.role === "user")?.content.trim();
  if (!question) return new NextResponse(null, { status: 400 });

  try {
    const system = `${SYSTEM_PROMPT}\n\nCONTEXT:\n${await contextFor(question)}`;
    const r = provider === "gemini" ? await askGemini(system, messages) : await askGroq(system, messages);
    if (r.status === 429) return busy();
    if (r.status !== 200 || !r.answer) return failed();
    return NextResponse.json({ answer: r.answer });
  } catch (err) {
    console.error("[assistant]", err);
    return failed();
  }
}
