import { Download } from "lucide-react";
import { AdminPage, Card, EmptyState, StatGrid, Th, timeAgo } from "@/components/admin/ui";
import { rows, sql } from "@/lib/db";

export const metadata = { title: "Newsletter" };

type Sub = { id: number; email: string; source: string; consent_at: string; unsubscribed_at: string | null };

export default async function NewsletterAdminPage() {
  const [[c], list] = await Promise.all([
    rows<{ active: number; left: number; month: number }>(sql`
      SELECT COUNT(*) FILTER (WHERE unsubscribed_at IS NULL)::int AS active, COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL)::int AS left,
        COUNT(*) FILTER (WHERE unsubscribed_at IS NULL AND created_at > LOCALTIMESTAMP - INTERVAL '30 days')::int AS month
      FROM newsletter_subscribers
    `),
    rows<Sub>(sql`SELECT id, email, source, consent_at, unsubscribed_at FROM newsletter_subscribers ORDER BY id DESC LIMIT 200`),
  ]);

  return (
    <AdminPage title="Newsletter">
      <p className="mb-6 max-w-3xl text-sm text-zinc-400">
        People who asked for the monthly tips email, with the time they agreed. Email only those still subscribed, and always include their unsubscribe link: it is in the export.
      </p>
      <StatGrid
        stats={[
          [c.active, "Subscribed", "text-emerald-400"],
          [c.month, "New in 30 days", "text-white"],
          [c.left, "Unsubscribed", "text-zinc-400"],
        ]}
      />
      <div className="mb-4 flex justify-end">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a CSV download, not a page */}
        <a href="/api/admin/newsletter" download className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-brand/50 hover:text-brand">
          <Download className="size-3.5" aria-hidden="true" /> Export subscribed (CSV)
        </a>
      </div>
      <Card className="p-0">
        {list.length === 0 ? (
          <EmptyState>No subscribers yet. The sign-up card appears to visitors 5 seconds after they make their cookie choice.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="border-b border-zinc-800">
                <tr>
                  <Th>Email</Th>
                  <Th>Signed up on</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Agreed</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {list.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 text-zinc-200">{s.email}</td>
                    <td className="max-w-[14rem] truncate px-4 py-2.5 font-mono text-xs text-zinc-400">{s.source}</td>
                    <td className="px-4 py-2.5 text-xs">{s.unsubscribed_at ? <span className="text-zinc-500">Unsubscribed</span> : <span className="text-emerald-400">Subscribed</span>}</td>
                    <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap text-zinc-500">{timeAgo(s.consent_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminPage>
  );
}
