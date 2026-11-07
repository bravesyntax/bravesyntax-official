import "server-only";
import { getContactInfo } from "./contact";
import { getPortfolios } from "./content";
import { INDUSTRIES } from "./industries";
import { INDUSTRY_GUIDES } from "./industry-guides";
import { estimate, PROJECT_TYPES } from "./planner";
import { SERVICE_GUIDES } from "./service-guides";
import { getActiveServices } from "./services";

// The site assistant answers only from the site's own content. Each question picks the few most relevant pieces of
// that content, which keeps every request small enough for a free model plan.

/** Gemini when its key is set, otherwise Groq; null when neither is set up. */
export const assistantProvider = (): "gemini" | "groq" | null => (process.env.GEMINI_API_KEY ? "gemini" : process.env.GROQ_API_KEY ? "groq" : null);
export const assistantEnabled = () => assistantProvider() !== null;

type Chunk = { title: string; text: string; words: Set<string> };

const STOP = new Set("a an and are as at be by can do does for from how i if in is it me my of on or our so the to we what when where which who why will with you your hai kya ka ki ke ko se me mein aap hum".split(" "));
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9₹ऀ-ॿ\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.slice(0, 6)); // a rough stem, so "manufacturing" matches "manufacturer"

let cache: { at: number; chunks: Chunk[]; core: string } | null = null;

async function knowledge() {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache;
  const [contact, services, projects] = await Promise.all([getContactInfo(), getActiveServices(), getPortfolios()]);
  const pricing = PROJECT_TYPES.map(([t, label]) => {
    const e = estimate(t, []);
    return `${label}: ${e.price}, typically ${e.time}.`;
  }).join(" ");
  const core = [
    `Brave Syntax is a design and development studio in Ghaziabad, India, working with businesses across India. Building since 2025.`,
    `Contact: email ${contact.email}, phone and WhatsApp ${contact.phone}, ${contact.address}. Hours Mon–Sat, 9am–8pm IST. Contact page: /contact.`,
    `Pricing guide (final price is a fixed written quote after a short chat): ${pricing} Maintenance plans start at ₹5,000 per month.`,
    `How projects work: brief and fixed quote, plan, design approval before coding, build with a private staging link, launch with training and 30–90 days of support. Clients own their code, domain and hosting.`,
    `Services: ${services.map((s) => s.title).join(", ")}.`,
    `Projects (details at /portfolio): ${projects.filter((p) => p.slug).map((p) => `${p.title}: ${(p.description ?? "").split(/(?<=\.)\s/)[0].slice(0, 140)}`).join(" | ")}`,
  ].join("\n");

  const chunks: Omit<Chunk, "words">[] = [];
  for (const s of services) {
    const g = SERVICE_GUIDES[s.slug];
    chunks.push({
      title: `${s.title} (/services/${s.slug})`,
      text: [s.tagline, g?.definition, g ? `Pricing: ${g.pricing}` : "", g ? `When to choose it: ${g.whenToChoose.join("; ")}` : "", ...(g?.faqs ?? []).map(([q, a]) => `Q: ${q} A: ${a}`)].filter(Boolean).join(" "),
    });
  }
  for (const i of INDUSTRIES) {
    const g = INDUSTRY_GUIDES[i.slug];
    if (g) chunks.push({ title: `${i.title} websites (/industries/${i.slug})`, text: `${g.answer} Must-haves: ${g.mustHaves.map(([t]) => t).join(", ")}.` });
  }
  chunks.push({
    title: "Portfolio (/portfolio)",
    text: projects.filter((p) => p.slug).map((p) => `${p.title}${p.year ? ` (${p.year})` : ""}: ${p.description ?? ""} ${p.live_url ? `Live: ${p.live_url}` : ""}`).join(" | "),
  });
  chunks.push({ title: "Free tools (/tools)", text: "Free tools that run in the browser with no sign-up: GST invoice maker, PDF tools (merge, split, compress, convert, sign, protect), image tools, QR code generator and an AI background remover." });

  cache = { at: Date.now(), core, chunks: chunks.map((c) => ({ ...c, words: new Set(tokens(`${c.title} ${c.text}`)) })) };
  return cache;
}

/** The core facts plus the pieces of content that best match the question, trimmed to a fixed size. */
export async function contextFor(question: string) {
  const { core, chunks } = await knowledge();
  const q = tokens(question);
  const ranked = chunks
    .map((c) => ({ c, score: q.reduce((s, w) => s + (c.words.has(w) ? 1 : 0), 0) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ c }) => `## ${c.title}\n${c.text.slice(0, 1400)}`);
  return `${core}\n\n${ranked.join("\n\n")}`;
}

export const SYSTEM_PROMPT = `You are the website assistant for Brave Syntax, a web design and development studio in Ghaziabad, India.
Answer only using the CONTEXT. If the answer is not in it, say you are not sure and suggest WhatsApp or the contact page.
Rules:
- Never invent prices, timelines, clients, results or guarantees. Quote prices only as written in the CONTEXT, and say the final price is a fixed quote after a short chat.
- If asked about discounts or special offers, do not say yes or no; say pricing is discussed in the quote and suggest WhatsApp.
- Mention only projects listed in the CONTEXT, and call a project a demo when the CONTEXT does.
- Never promise Google rankings or results.
- Reply in the visitor's language (English, Hindi or Hinglish), in under 90 words, plain text, friendly and direct.
- When it helps, point to one relevant page path from the CONTEXT, such as /services/ecommerce-shopify.
- Do not ask for passwords, payment details or other sensitive information.
- Politely decline topics unrelated to Brave Syntax and its services.`;
