import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { passwordFingerprint, SESSION_COOKIE, verifySession } from "./session";

export type AdminUser = { id: number; username: string };

/** Signed-in admin, or null. Checks the cookie signature and that the account is still active with the same password. */
export async function getAdmin(): Promise<AdminUser | null> {
  const p = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!p) return null;
  const rows = (await sql`
    SELECT id, username, password_hash FROM admin_users WHERE id = ${p.uid} AND is_active = 1 LIMIT 1
  `) as { id: number; username: string; password_hash: string }[];
  const user = rows[0];
  if (!user || (await passwordFingerprint(user.password_hash)) !== p.pv) return null;
  return { id: user.id, username: user.username };
}

/** For admin pages and server actions: the signed-in admin, or a redirect to the login page. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
