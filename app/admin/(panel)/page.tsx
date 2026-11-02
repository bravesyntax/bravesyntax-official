import {
  AlertTriangle, ArrowRight, Briefcase, CheckCircle2, ExternalLink, FileText, FolderKanban, Inbox, Mail, Newspaper, Plus, Search, UserRound, Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { AdminPage, Card, timeAgo } from "@/components/admin/ui";
import { resumeUploadsEnabled } from "@/lib/resumes";
import { rows, sql } from "@/lib/db";
import { decodeEntities } from "@/lib/html";
import { mailConfigured } from "@/lib/mailer";
import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Dashboard" };

type Counts = {
  messages: number; unread: number; week: number; apps: number; apps_new: number; posts: number; drafts: number;
  projects: number; services: number; jobs: number; seo_custom: number;
};

function Stat({ icon: Icon, label, value, sub, href, tone }: { icon: LucideIcon; label: string; value: number; sub: string; href: string; tone: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <ArrowRight className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-zinc-400" aria-hidden="true" />
      </div>
      <div className="mt-4 font-display text-3xl font-bold text-white">{value}</div>
      <div className="mt-0.5 text-sm text-zinc-300">{label}</div>
      <div className="mt-1 text-xs text-zinc-500">{sub}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  const [[c], recent, apps, settings] = await Promise.all([
    rows<Counts>(sql`
      SELECT
        (SELECT COUNT(*)::int FROM contact_messages) AS messages,
        (SELECT COUNT(*)::int FROM contact_messages WHERE is_read = 0) AS unread,
        (SELECT COUNT(*)::int FROM contact_messages WHERE created_at > LOCALTIMESTAMP - INTERVAL '7 days') AS week,
        (SELECT COUNT(*)::int FROM career_applications) AS apps,
        (SELECT COUNT(*)::int FROM career_applications WHERE is_read = 0) AS apps_new,
        (SELECT COUNT(*)::int FROM blog_posts WHERE is_published = 1) AS posts,
        (SELECT COUNT(*)::int FROM blog_posts WHERE is_published = 0) AS drafts,
        (SELECT COUNT(*)::int FROM portfolios WHERE is_active = 1) AS projects,
        (SELECT COUNT(*)::int FROM services WHERE is_active = 1) AS services,
        (SELECT COUNT(*)::int FROM career_jobs WHERE is_active = 1) AS jobs,
        (SELECT COUNT(*)::int FROM seo_meta) AS seo_custom
    `),
    rows<{ id: number; name: string; service: string | null; message: string; is_read: number; created_at: Date }>(
      sql`SELECT id, name, service, message, is_read, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 6`,
    ),
    rows<{ id: number; name: string; job_title: string | null; status: string; is_read: number; created_at: Date }>(sql`
      SELECT a.id, a.name, j.title AS job_title, a.status, a.is_read, a.created_at
      FROM career_applications a LEFT JOIN career_jobs j ON j.id = a.job_id ORDER BY a.created_at DESC LIMIT 4
    `),
    getSiteSettings(),
  ]);

  // What still needs configuring for the site to work fully.
  const checklist: [ok: boolean, label: string, hint: string, href: string][] = [
    [mailConfigured(), "Email delivery (SMTP)", "Needed for enquiry alerts, auto-replies and sign-in codes.", "/admin/emails"],
    [!!process.env.BLOB_READ_WRITE_TOKEN, "Image uploads (Vercel Blob)", "Lets you upload blog and portfolio images.", "/admin/blog"],
    [resumeUploadsEnabled(), "Resume uploads (private Blob)", "Lets applicants attach a resume.", "/admin/careers"],
    [!!settings.google_analytics_id, "Google Analytics", "Track visitors and conversions.", "/admin/settings"],
    [!!settings.google_search_console, "Search Console verification", "Prove ownership to Google.", "/admin/settings"],
    [!!settings.default_og_image, "Default social share image", "Shown when pages are shared on social media.", "/admin/settings"],
  ];
  const done = checklist.filter(([ok]) => ok).length;

  const quick: [string, string, LucideIcon][] = [
    ["New blog post", "/admin/blog?form=add", Newspaper],
    ["Add project", "/admin/portfolio?form=add", FolderKanban],
    ["Post a job", "/admin/careers?tab=jobs&form=add", Briefcase],
    ["Edit SEO", "/admin/seo", Search],
  ];

  return (
    <AdminPage title="Dashboard">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Inbox} label="Enquiries" value={c.messages} sub={`${c.unread} unread · ${c.week} this week`} href="/admin/messages" tone="bg-blue-500/10 text-blue-400" />
        <Stat icon={UserRound} label="Job applications" value={c.apps} sub={`${c.apps_new} new · ${c.jobs} open roles`} href="/admin/careers?tab=applications" tone="bg-purple-500/10 text-purple-400" />
        <Stat icon={Newspaper} label="Published posts" value={c.posts} sub={`${c.drafts} draft${c.drafts === 1 ? "" : "s"}`} href="/admin/blog" tone="bg-emerald-500/10 text-emerald-400" />
        <Stat icon={FolderKanban} label="Live projects" value={c.projects} sub={`${c.services} services · ${c.seo_custom} URLs with custom SEO`} href="/admin/portfolio" tone="bg-amber-500/10 text-amber-400" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h2 className="font-display font-semibold text-white">Latest enquiries</h2>
            <Link href="/admin/messages" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
              View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="p-10 text-center text-sm text-zinc-500">No enquiries yet. They&apos;ll appear here as soon as someone uses the contact form.</p>
          ) : (
            <div className="divide-y divide-zinc-800/70">
              {recent.map((m) => {
                const name = decodeEntities(m.name);
                return (
                  <Link key={m.id} href={`/admin/messages?view=${m.id}`} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-zinc-800/30">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-bold text-accent">{name.charAt(0).toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-white">{name}</span>
                        {!m.is_read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                        {m.service && <span className="hidden truncate rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline">{decodeEntities(m.service).replace(/ \[Budget:.*$/, "")}</span>}
                      </div>
                      <p className="truncate text-xs text-zinc-500">{decodeEntities(m.message).slice(0, 90)}</p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-zinc-600">{timeAgo(m.created_at)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 font-display font-semibold text-white">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {quick.map(([label, href, Icon]) => (
                <Link key={label} href={href} className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 text-sm text-zinc-300 transition-colors hover:border-accent/40 hover:text-white">
                  <span className="flex items-center gap-1.5 text-accent">
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
            <a href="/" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 py-2.5 text-xs text-zinc-400 transition-colors hover:text-white">
              Open website <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-semibold text-white">Setup</h2>
              <span className="text-xs text-zinc-500">
                {done}/{checklist.length} complete
              </span>
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(done / checklist.length) * 100}%` }} />
            </div>
            <ul className="space-y-3">
              {checklist.map(([ok, label, hint, href]) => (
                <li key={label}>
                  <Link href={href} className="flex gap-2.5">
                    {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" aria-label="Done" /> : <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" aria-label="To do" />}
                    <span>
                      <span className={`block text-sm ${ok ? "text-zinc-400" : "text-white"}`}>{label}</span>
                      {!ok && <span className="block text-xs text-zinc-500">{hint}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="xl:col-span-3">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h2 className="font-display font-semibold text-white">Latest applications</h2>
            <Link href="/admin/careers?tab=applications" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
              View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          {apps.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">No applications yet.</p>
          ) : (
            <div className="grid divide-y divide-zinc-800/70 md:grid-cols-2 md:divide-y-0 xl:grid-cols-4">
              {apps.map((a) => (
                <Link key={a.id} href={`/admin/careers?view=${a.id}`} className="px-6 py-4 transition-colors hover:bg-zinc-800/30">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">{decodeEntities(a.name)}</span>
                    {!a.is_read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-accent" aria-label="New" />}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-zinc-500">{a.job_title ?? "General application"}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-600">
                    <span className="capitalize">{a.status}</span>
                    <span>{timeAgo(a.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" /> Changes go live on the website immediately.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Email designs: <Link href="/admin/emails" className="text-zinc-400 hover:text-white">Email Templates</Link>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Privacy &amp; terms: <Link href="/admin/legal" className="text-zinc-400 hover:text-white">Legal Pages</Link>
        </span>
      </p>
    </AdminPage>
  );
}
