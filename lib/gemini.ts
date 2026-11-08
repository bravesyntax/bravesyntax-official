import "server-only";

// Small Gemini client for server-side automation (admin writing helpers and the like). The key stays on the server.

export const geminiEnabled = () => !!process.env.GEMINI_API_KEY;

export async function generate({ system, prompt, json = false, maxTokens = 600 }: { system: string; prompt: string; json?: boolean; maxTokens?: number }) {
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY ?? "", "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens, ...(json && { responseMimeType: "application/json" }) },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(res.status === 429 || res.status === 503 ? "Gemini is busy right now. Try again in a minute." : `Gemini returned an error (${res.status}).`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini gave no answer. Try again.");
  return text;
}
