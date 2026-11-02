import "server-only";
import { headers } from "next/headers";

// Form helpers ported from includes/functions.php.

/** Same rule as PHP's FILTER_VALIDATE_EMAIL for everyday addresses. */
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;

/** PHP FILTER_SANITIZE_EMAIL: drop characters that can't appear in an address. */
export const sanitizeEmail = (email: string) => email.trim().replace(/[^a-zA-Z0-9!#$%&'*+\-=?^_`{|}~@.[\]]/g, "");

export const sanitizePhone = (phone: string) => phone.replace(/[^0-9+\-\s()]/g, "");

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Client IP. On Vercel, x-real-ip / x-forwarded-for are set by Vercel's edge and overwrite anything the
 * visitor sends, so they're trustworthy there (the PHP site avoided X-Forwarded-For because Apache
 * passed it through untouched).
 */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0].trim() || null;
}

export const field = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();
