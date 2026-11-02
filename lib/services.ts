import "server-only";
import { sql } from "./db";

export type DbService = { id: number; title: string; description: string; category: string; icon: string };

/**
 * Active services from the admin-managed `services` table. Errors are rethrown on purpose: a failed query during
 * static generation is retried, and a failed background revalidation keeps the last good page, instead of
 * publishing a page with an empty menu.
 */
export async function getActiveServices(): Promise<DbService[]> {
  try {
    return (await sql`
      SELECT id, title, COALESCE(description, '') AS description, category, COALESCE(icon, '') AS icon
      FROM services WHERE is_active = 1 ORDER BY sort_order ASC, id ASC
    `) as DbService[];
  } catch (err) {
    console.error("[getActiveServices]", err);
    throw err;
  }
}
