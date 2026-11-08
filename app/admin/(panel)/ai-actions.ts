"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { writeBlogDraft, writePortfolioDraft, writeWeeklyReport } from "@/lib/admin/ai";
import { rows, sql } from "@/lib/db";
import { geminiEnabled } from "@/lib/gemini";

// Admin AI actions: each checks the session, then hands off to lib/admin/ai.ts. Nothing here saves content.

const notSetUp = { error: "Add GEMINI_API_KEY to turn on AI features." };
const aiError = (err: unknown) => ({ error: err instanceof Error && err.message.startsWith("Gemini") ? err.message : "The AI request failed. Try again." });

/** A short weekly report from counts only (no personal data): this week against last week. */
export async function weeklyReport(): Promise<{ text: string } | { error: string }> {
  await requireAdmin();
  if (!geminiEnabled()) return notSetUp;
  const week = (col: string) => sql.unsafe(`CASE WHEN ${col} > LOCALTIMESTAMP - INTERVAL '7 days' THEN 'this week' ELSE 'last week' END`);
  const [leads, sources, pages, enquiries, stages, news] = await Promise.all([
    rows<{ w: string; method: string; n: number }>(sql`SELECT ${week("created_at")} AS w, method, COUNT(*)::int AS n FROM lead_events WHERE created_at > LOCALTIMESTAMP - INTERVAL '14 days' GROUP BY 1, 2`),
    rows<{ source: string; n: number }>(sql`SELECT source, COUNT(*)::int AS n FROM lead_events WHERE created_at > LOCALTIMESTAMP - INTERVAL '7 days' GROUP BY 1 ORDER BY 2 DESC LIMIT 6`),
    rows<{ page: string; n: number }>(sql`SELECT page, COUNT(*)::int AS n FROM lead_events WHERE created_at > LOCALTIMESTAMP - INTERVAL '7 days' GROUP BY 1 ORDER BY 2 DESC LIMIT 6`),
    rows<{ w: string; service: string; n: number }>(sql`SELECT ${week("created_at")} AS w, COALESCE(NULLIF(service, ''), 'not given') AS service, COUNT(*)::int AS n FROM contact_messages WHERE created_at > LOCALTIMESTAMP - INTERVAL '14 days' GROUP BY 1, 2`),
    rows<{ status: string; priority: string; replied: number; n: number }>(sql`SELECT status, COALESCE(ai_priority, 'unknown') AS priority, is_replied AS replied, COUNT(*)::int AS n FROM contact_messages WHERE created_at > LOCALTIMESTAMP - INTERVAL '30 days' GROUP BY 1, 2, 3`),
    rows<{ w: string; n: number }>(sql`SELECT ${week("created_at")} AS w, COUNT(*)::int AS n FROM newsletter_subscribers WHERE created_at > LOCALTIMESTAMP - INTERVAL '14 days' AND unsubscribed_at IS NULL GROUP BY 1`),
  ]);
  try {
    return { text: await writeWeeklyReport({ leads, top_sources_this_week: sources, top_pages_this_week: pages, enquiries_by_service: enquiries, enquiries_last_30_days: stages, newsletter_signups: news }) };
  } catch (err) {
    return aiError(err);
  }
}

/** Drafts a blog post (excerpt, HTML body, tags) from its title and any notes in the excerpt and tags fields. */
export async function aiBlogDraft(ctx: Record<string, string>): Promise<Record<string, string> | { error: string }> {
  await requireAdmin();
  if (!geminiEnabled()) return notSetUp;
  if ((ctx.title ?? "").trim().length < 5) return { error: "Write a title first, then let AI draft the post." };
  try {
    return await writeBlogDraft(ctx.title, `${ctx.excerpt ?? ""} ${ctx.tags ?? ""}`);
  } catch (err) {
    return aiError(err);
  }
}

/** Drafts a project's description and case-study sections from the facts already in the form. */
export async function aiPortfolioDraft(ctx: Record<string, string>): Promise<Record<string, string> | { error: string }> {
  await requireAdmin();
  if (!geminiEnabled()) return notSetUp;
  if ((ctx.title ?? "").trim().length < 2) return { error: "Add the project title first." };
  try {
    return await writePortfolioDraft(ctx);
  } catch (err) {
    return aiError(err);
  }
}
