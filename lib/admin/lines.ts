// Admin forms edit lists as plain text, one item per line, so nobody has to write JSON by hand.

/** "One per line" text → JSON array string, or null when empty. */
export function linesToJson(raw: string): string | null {
  const items = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return items.length ? JSON.stringify(items) : null;
}

/** "Left | Right" per line → JSON array of [left, right] pairs, or null when empty. Lines without a "|" are dropped. */
export function pairsToJson(raw: string): string | null {
  const items = raw
    .split(/\r?\n/)
    .map((l) => l.split("|"))
    .filter((p) => p.length >= 2 && p[0].trim() && p.slice(1).join("|").trim())
    .map((p) => [p[0].trim(), p.slice(1).join("|").trim()]);
  return items.length ? JSON.stringify(items) : null;
}

/** "Name | Need" per line → JSON array of { name, need } objects, or null when empty. */
export function sectorsToJson(raw: string): string | null {
  const pairs = pairsToJson(raw);
  return pairs ? JSON.stringify((JSON.parse(pairs) as [string, string][]).map(([name, need]) => ({ name, need }))) : null;
}

function parse<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

export const jsonToLines = (raw: string | null | undefined) => parse<string>(raw).join("\n");
export const jsonToPairs = (raw: string | null | undefined) => parse<[string, string]>(raw).map(([a, b]) => `${a} | ${b}`).join("\n");
export const jsonToSectors = (raw: string | null | undefined) => parse<{ name: string; need: string }>(raw).map((s) => `${s.name} | ${s.need}`).join("\n");
