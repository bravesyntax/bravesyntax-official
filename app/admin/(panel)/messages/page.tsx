import Link from "next/link";
import { redirect } from "next/navigation";
import { BulkDeleteButton, ConfirmButton, RowCheckbox, SelectAll, SubmitButton } from "@/components/admin/client";
import { AdminPage, BackLink, Card, EmptyState, FilterTabs, Pagination, StatGrid, Th, timeAgo } from "@/components/admin/ui";
import Icon, { ICONS } from "@/components/ui/Icon";
import { rows, sql } from "@/lib/db";
import { decodeRow } from "@/lib/html";
import { bulkDeleteMessages, deleteMessage, replyToMessage } from "./actions";

export const metadata = { title: "Messages" };

type Message = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  ip_address: string | null;
  is_read: number;
  is_replied: number;
  created_at: Date;
};
type Props = { searchParams: Promise<{ view?: string; status?: string; page?: string }> };

const PER_PAGE = 20;

function StatusBadge({ m, size = "list" }: { m: Message; size?: "list" | "view" }) {
  const pad = size === "view" ? "px-2.5 py-1 text-xs rounded-lg" : "px-2 py-0.5 text-[10px] rounded";
  if (m.is_replied) return <span className={`inline-block ${pad} font-mono bg-accent/10 text-accent border border-accent/20`}>Replied</span>;
  if (!m.is_read) return <span className={`inline-block ${pad} font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20`}>New</span>;
  return <span className={`inline-block ${pad} font-mono bg-zinc-700/50 text-zinc-500`}>Read</span>;
}

async function MessageView({ id }: { id: number }) {
  const [raw] = await rows<Message>(sql`SELECT * FROM contact_messages WHERE id = ${id}`);
  if (!raw) redirect("/admin/messages");
  if (!raw.is_read) await sql`UPDATE contact_messages SET is_read = 1 WHERE id = ${id}`;
  const m = decodeRow({ ...raw, is_read: 1 });
  const at = new Date(m.created_at);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <BackLink href="/admin/messages">Back to Messages</BackLink>
        <StatusBadge m={m} size="view" />
      </div>

      <Card className="mb-6">
        <div className="px-6 py-5 border-b border-zinc-800 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold text-white mb-1">{m.name}</h2>
            <a href={`mailto:${m.email}`} className="text-sm font-mono text-emerald-400 hover:text-emerald-300 transition-colors">
              {m.email}
            </a>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-mono text-zinc-500">{at.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</div>
            <div className="text-xs font-mono text-zinc-600">{at.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-px bg-zinc-800/40">
          {[
            ["Phone", m.phone || "Not provided"],
            ["Service", m.service || "Not specified"],
            ["IP", m.ip_address ?? "Unknown"],
            ["Received", timeAgo(m.created_at)],
          ].map(([k, v]) => (
            <div key={k} className="bg-zinc-900/60 px-4 py-3">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-0.5">{k}</div>
              <div className="text-xs font-mono text-zinc-300">{v}</div>
            </div>
          ))}
        </div>

        <div className="px-6 py-5">
          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">Message</div>
          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5">
            <p className="text-white font-mono text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
          </div>
        </div>

        <div className="px-6 pb-5 flex items-center gap-3 flex-wrap">
          <a
            href={`mailto:${m.email}?subject=${encodeURIComponent("Re: Your enquiry — Brave Syntax")}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-black font-mono font-semibold text-sm rounded-lg transition-all"
          >
            <Icon d={ICONS.mail} className="w-4 h-4" strokeWidth={2} />
            Quick Reply (Gmail)
          </a>
          <form action={deleteMessage} className="inline">
            <input type="hidden" name="id" value={m.id} />
            <ConfirmButton
              message="Delete this message permanently?"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-mono text-sm rounded-lg transition-all"
            >
              Delete
            </ConfirmButton>
          </form>
          {!m.is_replied && <span className="text-xs font-mono text-zinc-600">&#x2193; Use the reply form below</span>}
        </div>
      </Card>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 lg:p-8">
        <h3 className="text-lg font-display font-semibold text-white mb-5">
          Reply to {m.name}
          <span className="text-sm font-mono text-zinc-500 font-normal ml-2">{m.email}</span>
        </h3>
        <form action={replyToMessage} className="space-y-4">
          <input type="hidden" name="id" value={m.id} />
          <div>
            <label htmlFor="reply_subject" className="block text-xs font-mono text-zinc-400 mb-2">
              Subject
            </label>
            <input
              id="reply_subject"
              type="text"
              name="reply_subject"
              defaultValue="Re: Your enquiry — Brave Syntax"
              className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label htmlFor="reply_message" className="block text-xs font-mono text-zinc-400 mb-2">
              Message <span className="text-emerald-400">*</span>
            </label>
            <textarea
              id="reply_message"
              name="reply_message"
              rows={10}
              required
              defaultValue={`Hi ${m.name},\n\nThank you for reaching out to Brave Syntax!\n\n`}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-accent transition-colors resize-y"
            />
          </div>
          <div className="flex items-center gap-3">
            <SubmitButton
              pending="Sending…"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-light text-black font-mono font-semibold text-sm rounded-xl transition-all"
            >
              Send Reply via Email
            </SubmitButton>
            <p className="text-xs font-mono text-zinc-600">Sends via your configured mail system</p>
          </div>
        </form>
      </div>
    </>
  );
}

async function MessageList({ status, page }: { status: string; page: number }) {
  const [counts] = await rows<{ total: number; unread: number; replied: number }>(sql`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE is_read = 0)::int AS unread,
           COUNT(*) FILTER (WHERE is_replied = 1)::int AS replied
    FROM contact_messages
  `);
  const filtered = status === "unread" ? counts.unread : status === "replied" ? counts.replied : counts.total;
  const totalPages = Math.max(1, Math.ceil(filtered / PER_PAGE));
  const current = Math.min(Math.max(1, page), totalPages);
  const offset = (current - 1) * PER_PAGE;

  const list = (
    await rows<Message>(sql`
      SELECT * FROM contact_messages
      WHERE (${status} <> 'unread' OR is_read = 0) AND (${status} <> 'replied' OR is_replied = 1)
      ORDER BY created_at DESC LIMIT ${PER_PAGE} OFFSET ${offset}
    `)
  ).map((m) => decodeRow(m));

  const href = (s: string, p = 1) => `/admin/messages?status=${s}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <>
      <StatGrid
        stats={[
          [counts.total, "Total Messages", "text-white"],
          [counts.unread, "Unread", "text-amber-400"],
          [counts.replied, "Replied", "text-accent"],
        ]}
      />

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <FilterTabs
          tabs={[
            ["all", "All"],
            ["unread", "Unread"],
            ["replied", "Replied"],
          ]}
          active={status}
          hrefFor={(k) => href(k)}
        />
        <form id="bulk-messages" action={bulkDeleteMessages}>
          <BulkDeleteButton formId="bulk-messages" noun="message(s)" />
        </form>
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState>
            No messages{status !== "all" ? " in this filter" : ""}.{" "}
            {status !== "all" && (
              <Link href={href("all")} className="text-accent text-xs font-mono hover:underline">
                View all messages
              </Link>
            )}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  <th className="w-8 px-4 py-3">
                    <SelectAll formId="bulk-messages" />
                  </th>
                  <Th>From</Th>
                  <Th hide="hidden md:table-cell">Service / Budget</Th>
                  <Th hide="hidden lg:table-cell">Preview</Th>
                  <Th>When</Th>
                  <Th className="text-center">Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {list.map((m) => (
                  <tr key={m.id} className={`group transition-colors hover:bg-zinc-800/30 ${!m.is_read ? "bg-accent/3" : ""}`}>
                    <td className="px-4 py-3 w-8">
                      <RowCheckbox formId="bulk-messages" value={m.id} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {!m.is_read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" title="Unread" />}
                        <div className="min-w-0">
                          <div className={`font-mono text-sm text-white truncate max-w-[140px] ${!m.is_read ? "font-semibold" : "font-normal"}`}>{m.name}</div>
                          <div className="font-mono text-xs text-zinc-500 truncate max-w-[140px]">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="font-mono text-xs text-zinc-400 max-w-[160px] truncate">{m.service || "—"}</div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-zinc-600 line-clamp-1 max-w-[200px]">{m.message.slice(0, 60)}…</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-zinc-500 whitespace-nowrap">{timeAgo(m.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge m={m} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/messages?view=${m.id}`} className="inline-flex items-center gap-1 text-xs font-mono text-accent hover:text-accent-light transition-colors">
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={current} totalPages={totalPages} total={filtered} perPage={PER_PAGE} hrefFor={(p) => href(status, p)} />
      </Card>
    </>
  );
}

export default async function MessagesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const viewId = Number(sp.view) || 0;
  const status = sp.status === "unread" || sp.status === "new" ? "unread" : sp.status === "replied" ? "replied" : "all";

  return <AdminPage title="Messages">{viewId > 0 ? <MessageView id={viewId} /> : <MessageList status={status} page={Number(sp.page) || 1} />}</AdminPage>;
}
