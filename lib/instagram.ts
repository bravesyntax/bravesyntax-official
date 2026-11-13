import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "./db";

// Latest Instagram posts for the public site. The token is pasted in Admin → Settings and kept in site_settings.
// Two kinds of token work:
// - Unified login (new Meta apps, token starts "EAA"): Graph API at graph.facebook.com, needs the Instagram
//   account ID. It's renewed weekly when META_APP_ID and META_APP_SECRET are set; otherwise renew it by hand.
// - Instagram login (older apps, token starts "IG"): graph.instagram.com, renewed weekly with ig_refresh_token.
//   https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token

const FB_API = "https://graph.facebook.com/v23.0";
const IG_API = "https://graph.instagram.com";
export const INSTAGRAM_TAG = "instagram";
const KEYS = {
  token: "instagram_token",
  userId: "instagram_user_id",
  refreshedAt: "instagram_token_refreshed_at",
  username: "instagram_username",
  error: "instagram_last_error",
} as const;
const ALL_KEYS = Object.values(KEYS);
const REFRESH_EVERY_MS = 7 * 24 * 3600 * 1000;
const MIN_TOKEN_AGE_MS = 24 * 3600 * 1000; // Instagram refuses to refresh tokens younger than this
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

export type InstagramPost = {
  id: string;
  caption: string;
  type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  image: string;
  permalink: string;
  timestamp: string;
};

export type InstagramAccount = { token: string; userId: string; refreshedAt: Date | null; username: string; lastError: string };

const isIgToken = (token: string) => token.startsWith("IG");
/** Whether a Unified-login token can renew itself (needs the app's ID and secret in env vars). */
export const canAutoRenew = (token: string) => isIgToken(token) || Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);

export async function getInstagramAccount(): Promise<InstagramAccount | null> {
  const rows = (await sql`SELECT setting_key, setting_value FROM site_settings WHERE setting_key = ANY(${ALL_KEYS})`) as {
    setting_key: string;
    setting_value: string | null;
  }[];
  const s = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value ?? ""]));
  if (!s[KEYS.token]) return null;
  const at = s[KEYS.refreshedAt] ? new Date(s[KEYS.refreshedAt]) : null;
  return {
    token: s[KEYS.token],
    userId: s[KEYS.userId] ?? "",
    refreshedAt: at && !Number.isNaN(at.getTime()) ? at : null,
    username: s[KEYS.username] ?? "",
    lastError: s[KEYS.error] ?? "",
  };
}

async function saveSettings(pairs: [string, string][]) {
  const keys = pairs.map(([k]) => k);
  const vals = pairs.map(([, v]) => v);
  await sql`
    INSERT INTO site_settings (setting_key, setting_value) SELECT * FROM unnest(${keys}::text[], ${vals}::text[])
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value
  `;
}

async function get<T>(url: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`${url}?${new URLSearchParams(params)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.error) throw new Error(body?.error?.message || `Instagram API ${res.status}`);
  return body as T;
}

/**
 * Checks a pasted token with Meta and stores it with the account's username. `userId` is the Instagram
 * account ID, required for Unified-login tokens. Throws with Meta's message if anything is wrong.
 */
export async function connectInstagram(token: string, userId: string): Promise<string> {
  let username = "";
  if (isIgToken(token)) {
    const me = await get<{ user_id?: string; username?: string }>(`${IG_API}/me`, { fields: "user_id,username", access_token: token });
    username = me.username ?? "";
    userId = me.user_id ?? userId;
  } else {
    if (!/^\d{5,25}$/.test(userId)) throw new Error("Enter the Instagram account ID (the long number next to the account in Meta's dashboard).");
    const me = await get<{ username?: string }>(`${FB_API}/${userId}`, { fields: "username", access_token: token });
    username = me.username ?? "";
  }
  // Pasted tokens may be minutes old, so the first renewal happens a day later at the earliest.
  await saveSettings([
    [KEYS.token, token],
    [KEYS.userId, userId],
    [KEYS.refreshedAt, new Date().toISOString()],
    [KEYS.username, username],
    [KEYS.error, ""],
  ]);
  return username;
}

export async function disconnectInstagram() {
  await sql`DELETE FROM site_settings WHERE setting_key = ANY(${ALL_KEYS})`;
}

async function renewIfDue(account: InstagramAccount): Promise<string> {
  const age = account.refreshedAt ? Date.now() - account.refreshedAt.getTime() : Infinity;
  if (age < REFRESH_EVERY_MS || age < MIN_TOKEN_AGE_MS || !canAutoRenew(account.token)) return account.token;
  try {
    const r = isIgToken(account.token)
      ? await get<{ access_token: string }>(`${IG_API}/refresh_access_token`, { grant_type: "ig_refresh_token", access_token: account.token })
      : await get<{ access_token: string }>(`${FB_API}/oauth/access_token`, {
          grant_type: "fb_exchange_token",
          client_id: process.env.META_APP_ID!,
          client_secret: process.env.META_APP_SECRET!,
          fb_exchange_token: account.token,
        });
    await saveSettings([[KEYS.token, r.access_token], [KEYS.refreshedAt, new Date().toISOString()]]);
    return r.access_token;
  } catch (err) {
    console.error("[instagram] token renewal failed", err);
    return account.token; // the current token stays valid until it expires
  }
}

type ApiMedia = { id: string; caption?: string; media_type: InstagramPost["type"]; media_url?: string; thumbnail_url?: string; permalink: string; timestamp: string };

/**
 * Latest posts, cached for an hour (Instagram's image links are signed and expire after a while, so they
 * aren't cached longer). Returns [] when no account is connected or Meta is unreachable, so the section
 * simply hides; the error is kept for Admin → Settings.
 */
export const getInstagramPosts = unstable_cache(
  async (limit = 8): Promise<InstagramPost[]> => {
    let account: InstagramAccount | null = null;
    try {
      account = await getInstagramAccount();
      if (!account) return [];
      const token = await renewIfDue(account);
      const url = isIgToken(token) ? `${IG_API}/me/media` : `${FB_API}/${account.userId}/media`;
      const { data } = await get<{ data: ApiMedia[] }>(url, { fields: FIELDS, limit: String(limit), access_token: token });
      if (account.lastError) await saveSettings([[KEYS.error, ""]]);
      return data
        .map((m) => ({
          id: m.id,
          caption: m.caption ?? "",
          type: m.media_type,
          image: (m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url) ?? "",
          permalink: m.permalink,
          timestamp: m.timestamp,
        }))
        .filter((p) => p.image);
    } catch (err) {
      console.error("[instagram] feed failed", err);
      const message = `${new Date().toISOString()} ${err instanceof Error ? err.message : String(err)}`.slice(0, 500);
      if (account) await saveSettings([[KEYS.error, message]]).catch(() => {});
      return [];
    }
  },
  ["instagram-feed"],
  { revalidate: 3600, tags: [INSTAGRAM_TAG] },
);
