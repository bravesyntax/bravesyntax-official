// Admin session tokens: base64url(JSON payload) + "." + base64url(HMAC-SHA256). Web Crypto only, so this
// module works in the proxy as well as in server components and actions.

export const SESSION_COOKIE = "bs_admin";
/** Holds the pending second step (emailed code) between password check and full sign-in. */
export const OTP_COOKIE = "bs_admin_otp";
export const OTP_TTL_SECONDS = 10 * 60;
/** Sliding inactivity timeout, as SESSION_LIFETIME on the PHP site. */
export const SESSION_TTL_SECONDS = 60 * 60;

export type SessionPayload = {
  typ: "session";
  uid: number;
  u: string; // username
  pv: string; // password-hash fingerprint: changes when the password changes, which ends other sessions
  exp: number; // unix seconds
};

/** Proof that the password step passed; only good for entering the emailed code. */
export type OtpTicket = {
  typ: "otp";
  uid: number;
  oid: number; // admin_login_otps.id
  exp: number;
};

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function secret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}
export const sessionsConfigured = () => secret() !== null;

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret()!), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function sign(payload: object): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function signSession(p: Omit<SessionPayload, "exp" | "typ">): Promise<string> {
  return sign({ ...p, typ: "session", exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS } satisfies SessionPayload);
}

export async function signOtpTicket(p: Omit<OtpTicket, "exp" | "typ">): Promise<string> {
  return sign({ ...p, typ: "otp", exp: Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS } satisfies OtpTicket);
}

/** A valid, unexpired session token (never an OTP ticket). */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  const p = await verify<SessionPayload>(token);
  return p?.typ === "session" ? p : null;
}

export async function verifyOtpTicket(token: string | undefined): Promise<OtpTicket | null> {
  const p = await verify<OtpTicket>(token);
  return p?.typ === "otp" ? p : null;
}

/** Returns the payload if the signature is valid and the token hasn't expired. */
async function verify<T extends { exp: number }>(token: string | undefined): Promise<T | null> {
  if (!token || !secret()) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as T;
    return typeof p.exp === "number" && p.exp > Date.now() / 1000 ? p : null;
  } catch {
    return null;
  }
}

/** Short fingerprint of a password hash (not reversible, and the hash itself never leaves the server). */
export async function passwordFingerprint(hash: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(`pv:${hash}`)));
  return b64url(digest).slice(0, 16);
}

/** HMAC-SHA256 hex of a value under the session secret (used for one-time codes). */
export async function keyedHash(value: string): Promise<string> {
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(`otp:${value}`)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
