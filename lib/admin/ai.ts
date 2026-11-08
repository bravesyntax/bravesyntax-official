import "server-only";
import { sql } from "@/lib/db";
import { generate, geminiEnabled } from "@/lib/gemini";

// AI helpers for the admin. Enquiries are sent without the person's name, email or phone, and any email addresses or
// phone numbers inside the message are masked first, because Google's free Gemini tier may use what it receives.

const PRICING = "Landing page or 3-page site ₹8,000–₹20,000 (3–5 days); 5–10 page custom website ₹20,000–₹60,000 (1–3 weeks); online store ₹20,000–₹60,000, larger catalogues from ₹60,000 (2–6 weeks); web apps from ₹60,000 (3–8 weeks); maintenance from ₹5,000 a month. Final price is a fixed written quote.";

export const mask = (s: string) =>
  s
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/(?:\+?\d[\s-]?){8,14}\d/g, "[phone]")
    .slice(0, 3000);

type Enquiry = { id: number; service: string | null; budget: string | null; message: string };
export type EnquiryInsight = { summary: string; priority: "hot" | "warm" | "cold"; next_step: string };

/** Summary, priority and next step for an enquiry, stored on the row so each enquiry is analysed once. */
export async function analyseEnquiry(m: Enquiry): Promise<EnquiryInsight | null> {
  if (!geminiEnabled()) return null;
  try {
    const out = await generate({
      json: true,
      maxTokens: 300,
      system: `You help Brave Syntax, a web design and development studio in India, triage enquiries.
Return JSON: {"summary": string, "priority": "hot" | "warm" | "cold", "next_step": string}.
- summary: one sentence, under 25 words, what they want.
- priority: hot = clear project with budget or timeline; warm = real need but vague; cold = spam, job seekers, students, or no real project.
- next_step: one short practical action for the studio, such as a question to ask.
Use only what the enquiry says. Do not invent details.`,
      prompt: `Service: ${m.service || "not given"}\nBudget: ${m.budget || "not given"}\nMessage:\n${mask(m.message)}`,
    });
    const j = JSON.parse(out) as Record<string, unknown>;
    const priority = ["hot", "warm", "cold"].includes(String(j.priority)) ? (j.priority as EnquiryInsight["priority"]) : "warm";
    const insight = { summary: String(j.summary ?? "").slice(0, 300), priority, next_step: String(j.next_step ?? "").slice(0, 300) };
    if (!insight.summary) return null;
    await sql`UPDATE contact_messages SET ai_summary = ${insight.summary}, ai_priority = ${insight.priority}, ai_next_step = ${insight.next_step} WHERE id = ${m.id}`;
    return insight;
  } catch (err) {
    console.error("[analyseEnquiry]", err instanceof Error ? err.message : err);
    return null;
  }
}

/** A friendly reply draft. The greeting uses only the first name, which stays on our server. */
export async function draftEnquiryReply(m: Enquiry & { name: string }) {
  const body = await generate({
    maxTokens: 500,
    system: `You draft email replies for Brave Syntax, a web design and development studio in Ghaziabad, India.
Write the body only (no subject line), in the language the enquiry is written in, warm and professional, under 150 words.
Thank them, show you understood their need, ask 2-3 specific questions needed for a fixed quote, and suggest a short call or WhatsApp chat.
Pricing guide you may mention only if relevant: ${PRICING}
Never promise rankings, results, discounts or dates. Do not sign off with a name; end with "Best regards," and nothing after it.
Start with "Hi NAME," exactly, using the placeholder NAME.`,
    prompt: `Service: ${m.service || "not given"}\nBudget: ${m.budget || "not given"}\nMessage:\n${mask(m.message)}`,
  });
  const first = m.name.trim().split(/\s+/)[0] || "there";
  return `${body.replace(/\bNAME\b/, first).trim()}\nBrave Syntax`;
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** A short weekly report from aggregated counts. */
export async function writeWeeklyReport(data: unknown) {
  const text = await generate({
    maxTokens: 500,
    system: `You write a short weekly report for the owner of Brave Syntax, a small web design studio in India.
Use only the numbers given. Plain text with no markdown symbols, simple English, under 160 words, in three parts:
"This week" (2-3 lines comparing with last week), "What stands out" (2 lines starting with "- "), "Do next" (3 lines starting with "- ", practical and specific, such as replying to unreplied hot leads or improving a page).
If there is little or no data, say so plainly and suggest how to get more traffic. Never invent numbers.`,
    prompt: JSON.stringify(data),
  });
  return text.replace(/\*\*/g, "");
}

/** A blog post draft: excerpt, body HTML limited to simple tags, and tags. */
export async function writeBlogDraft(title: string, notes: string) {
  const out = await generate({
    json: true,
    maxTokens: 3000,
    system: `You write blog posts for Brave Syntax, a web design and development studio in Ghaziabad, India, for small business owners.
Return JSON: {"excerpt": string, "content": string, "tags": string}.
- excerpt: 140-160 characters, what the reader will learn.
- content: 700-900 words of HTML using only <h2>, <h3>, <p>, <ul>, <li>, <strong>. Answer the title directly in the first paragraph, use question-style headings, practical steps and examples, and end with a short paragraph inviting readers to contact Brave Syntax.
- tags: 3-5 comma-separated tags.
Plain, accurate English. Never invent statistics, studies, quotes, client names or results. Do not promise rankings.
If you mention prices, use only Brave Syntax's published prices: ${PRICING} Do not quote any other price ranges.`,
    prompt: `Title: ${clip(title, 200)}\nNotes from the editor (may be empty): ${clip(notes, 700)}`,
  });
  const j = JSON.parse(out) as Record<string, unknown>;
  const content = clip(j.content, 20000).replace(/<(?!\/?(h2|h3|p|ul|li|strong)\b)[^>]*>/gi, "");
  if (!content) throw new Error("Gemini gave no answer. Try again.");
  return { excerpt: clip(j.excerpt, 300), content, tags: clip(j.tags, 200) };
}

/** Portfolio description and case-study sections from the facts given, without inventing results. */
export async function writePortfolioDraft(ctx: Record<string, string>) {
  const out = await generate({
    json: true,
    maxTokens: 900,
    system: `You write portfolio case studies for Brave Syntax, a web design and development studio in India.
Return JSON: {"description": string, "challenge": string, "approach": string, "results_detail": string}.
- description: 1-2 sentences, under 220 characters, what was built and for whom.
- challenge: 2-3 sentences on what the business needed.
- approach: 2-3 sentences on how it was built, using the technologies given.
- results_detail: 1-2 sentences on what was delivered, such as the site being live.
Use only the facts given. Never invent numbers, results, quotes or client opinions. Do not claim the client had an old website, problems or a redesign unless the facts say so. If a fact is missing, write in general terms rather than guessing.`,
    prompt: Object.entries(ctx)
      .map(([k, v]) => `${k}: ${clip(v, 600)}`)
      .join("\n"),
  });
  const j = JSON.parse(out) as Record<string, unknown>;
  const r = { description: clip(j.description, 400), challenge: clip(j.challenge, 900), approach: clip(j.approach, 900), results_detail: clip(j.results_detail, 500) };
  if (!r.description) throw new Error("Gemini gave no answer. Try again.");
  return r;
}
