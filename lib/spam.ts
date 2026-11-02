import "server-only";

// Anti-spam helpers from includes/functions.php.

/** Drops the "withdraw your BTC" scam, common spam phrases, and messages with 2+ links. */
export function looksLikeSpam(name: string, message: string): boolean {
  const text = `${name} ${message}`.toLowerCase();
  if (text.includes("withdraw") && ["btc", "bitcoin", "crypto", "usdt"].some((w) => text.includes(w))) return true;
  if (["viagra", "cialis", "casino", "guaranteed #1", "buy backlinks", "seo backlinks"].some((p) => text.includes(p))) return true;
  return (message.match(/https?:\/\//gi) ?? []).length >= 2;
}

/** Cloudflare Turnstile is enforced only when both keys are configured. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const turnstileEnabled = () => !!(TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET);

export async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET!, response: token, ...(ip && { remoteip: ip }) }),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as { success?: boolean };
    return !!json.success;
  } catch (err) {
    console.error("[verifyTurnstile]", err);
    return false;
  }
}
