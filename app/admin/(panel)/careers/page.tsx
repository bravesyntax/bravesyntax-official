import { Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import {
  AdminPage,
  BackLink,
  Card,
  EmptyState,
  inputCls,
  labelCls,
  primaryBtn,
  smallPrimaryBtn,
  StatGrid,
  Th,
  timeAgo,
} from "@/components/admin/ui";
import { capitalize, formatDate } from "@/lib/content";
import { rows, sql } from "@/lib/db";
import { decodeRow } from "@/lib/html";
import { isValidHttpUrl } from "@/lib/validation";
import {
  deleteApplication,
  deleteJob,
  saveJob,
  updateApplication,
} from "./actions";

export const metadata = { title: "Careers" };

type Job = {
  id: number;
  title: string;
  slug: string;
  type: string;
  department: string;
  location: string;
  description: string;
  requirements: string | null;
  skills: string | null;
  experience: string | null;
  salary_range: string | null;
  is_active: number;
  is_featured: number;
  sort_order: number;
  deadline: Date | null;
  apps?: number;
};
type Application = {
  id: number;
  job_title: string | null;
  name: string;
  email: string;
  phone: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  cover_letter: string | null;
  resume_file: string | null;
  status: string;
  admin_notes: string | null;
  ip_address: string | null;
  is_read: number;
  created_at: Date;
};
type Props = {
  searchParams: Promise<{
    tab?: string;
    form?: string;
    id?: string;
    view?: string;
  }>;
};

const JOB_TYPES: [string, string][] = [
  ["full-time", "Full Time"],
  ["part-time", "Part Time"],
  ["freelance", "Freelance"],
  ["internship", "Internship"],
  ["remote", "Remote"],
];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  reviewing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  shortlisted: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  hired: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};
const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-emerald-500/15 text-emerald-400",
  "part-time": "bg-blue-500/15 text-blue-400",
  freelance: "bg-purple-500/15 text-purple-400",
  internship: "bg-orange-500/15 text-orange-400",
  remote: "bg-cyan-500/15 text-cyan-400",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${STATUS_COLORS[status] ?? STATUS_COLORS.new}`}
  >
    {capitalize(status)}
  </span>
);
const isoDate = (d: Date | null) =>
  d
    ? new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)
    : "";

function Field({
  name,
  label,
  hint,
  defaultValue,
  placeholder,
  type = "text",
  wide,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  type?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={name} className={labelCls}>
        {label} {hint && <span className="text-zinc-600">({hint})</span>}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        className={inputCls}
      />
    </div>
  );
}

function JobForm({ job }: { job: Job | null }) {
  return (
    <Card>
      <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-white">
          {job ? "Edit Job" : "Add New Job"}
        </h2>
        <Link
          href="/admin/careers?tab=jobs"
          className="text-sm font-mono text-zinc-400 hover:text-white"
        >
          ← Cancel
        </Link>
      </div>
      <form action={saveJob} className="p-6 lg:p-8 space-y-6">
        {job && <input type="hidden" name="id" value={job.id} />}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="title" className={labelCls}>
              Job Title <span className="text-emerald-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              required
              defaultValue={job?.title}
              placeholder="e.g. Frontend Developer"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="type" className={labelCls}>
              Job Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={job?.type ?? "full-time"}
              className={inputCls}
            >
              {JOB_TYPES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <Field
            name="department"
            label="Department"
            defaultValue={job?.department ?? "Engineering"}
            placeholder="e.g. Engineering, Design"
          />
          <Field
            name="location"
            label="Location"
            defaultValue={job?.location ?? "Ghaziabad, UP (Remote OK)"}
          />
          <Field
            name="experience"
            label="Experience"
            defaultValue={job?.experience}
            placeholder="e.g. 1-3 years"
          />
          <Field
            name="salary_range"
            label="Salary Range"
            hint="optional"
            defaultValue={job?.salary_range}
            placeholder="e.g. ₹3-5 LPA"
          />
          <Field
            name="deadline"
            label="Application Deadline"
            hint="optional"
            type="date"
            defaultValue={isoDate(job?.deadline ?? null)}
          />
          <Field
            name="sort_order"
            label="Sort Order"
            type="number"
            defaultValue={job?.sort_order ?? 0}
          />
          <Field
            name="skills"
            label="Skills"
            hint="comma-separated"
            defaultValue={job?.skills}
            placeholder="e.g. React, PHP, Tailwind CSS, Figma"
            wide
          />
          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelCls}>
              Job Description <span className="text-emerald-400">*</span>{" "}
              <span className="text-zinc-600">(HTML allowed)</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={8}
              defaultValue={job?.description}
              placeholder="Full job description. You can use HTML tags like <p>, <ul>, <li>..."
              className={`${inputCls} resize-y`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="requirements" className={labelCls}>
              Requirements <span className="text-zinc-600">(one per line)</span>
            </label>
            <textarea
              id="requirements"
              name="requirements"
              rows={5}
              defaultValue={job?.requirements ?? ""}
              placeholder={
                "Proficiency in HTML, CSS, JavaScript\nExperience with Tailwind CSS\nStrong attention to detail"
              }
              className={`${inputCls} resize-y`}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              value="1"
              defaultChecked={job ? !!job.is_active : true}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className="text-sm font-mono text-zinc-300">
              Active (visible on site)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_featured"
              value="1"
              defaultChecked={!!job?.is_featured}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="text-sm font-mono text-zinc-300">
              Featured (highlight this role)
            </span>
          </label>
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
          <SubmitButton className={primaryBtn}>
            {job ? "Update Job" : "Add Job"}
          </SubmitButton>
          <Link
            href="/admin/careers?tab=jobs"
            className="px-4 py-3 text-sm font-mono text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}

function JobList({ jobs }: { jobs: Job[] }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold">All Job Listings</h2>
        <Link
          href="/admin/careers?tab=jobs&form=add"
          className={smallPrimaryBtn}
        >
          + Add Job
        </Link>
      </div>
      <Card>
        {jobs.length === 0 ? (
          <EmptyState>
            No job listings yet.{" "}
            <Link
              href="/admin/careers?tab=jobs&form=add"
              className="text-accent hover:underline"
            >
              + Add your first job
            </Link>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th hide="hidden md:table-cell">Department</Th>
                  <Th className="text-center">Apps</Th>
                  <Th className="text-center">Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {jobs.map((j) => (
                  <tr
                    key={j.id}
                    className={`transition-colors hover:bg-zinc-800/30 ${!j.is_active ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-white font-semibold">
                        {j.title}
                        {j.is_featured ? (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500/15 text-amber-400 rounded">
                            <Star className="mr-0.5 inline h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />Featured
                          </span>
                        ) : null}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-600">
                        {j.location}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded ${TYPE_COLORS[j.type] ?? TYPE_COLORS["full-time"]}`}
                      >
                        {capitalize(j.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-zinc-400">
                        {j.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href="/admin/careers?tab=applications"
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        {j.apps}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${
                          j.is_active
                            ? "bg-accent/10 text-accent border-accent/20"
                            : "bg-zinc-700/50 text-zinc-500 border-zinc-700"
                        }`}
                      >
                        {j.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/careers?tab=jobs&form=edit&id=${j.id}`}
                          className="text-xs text-accent hover:text-accent-light"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <form action={deleteJob} className="inline">
                          <input type="hidden" name="id" value={j.id} />
                          <ConfirmButton
                            message="Delete this job? Applications will also be affected."
                            className="text-xs text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </ConfirmButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function ExternalLink({ url }: { url: string }) {
  return isValidHttpUrl(url) ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-mono text-accent hover:underline break-all"
    >
      {url}
    </a>
  ) : (
    <span className="text-sm font-mono text-zinc-300 break-all">{url}</span>
  );
}

async function ApplicationView({ id }: { id: number }) {
  const [raw] = await rows<Application>(sql`
    SELECT a.*, j.title AS job_title FROM career_applications a LEFT JOIN career_jobs j ON a.job_id = j.id WHERE a.id = ${id}
  `);
  if (!raw) redirect("/admin/careers?tab=applications");
  if (!raw.is_read)
    await sql`UPDATE career_applications SET is_read = 1 WHERE id = ${id}`;
  const a = decodeRow(raw);
  const at = new Date(a.created_at);
  const resumeInBlob = !!a.resume_file?.startsWith("https://");

  const details: [string, React.ReactNode][] = [
    [
      "Email",
      <a
        key="e"
        href={`mailto:${a.email}`}
        className="text-sm font-mono text-accent hover:underline break-all"
      >
        {a.email}
      </a>,
    ],
  ];
  if (a.phone)
    details.push([
      "Phone",
      <a
        key="p"
        href={`tel:${a.phone}`}
        className="text-sm font-mono text-zinc-300 hover:text-white"
      >
        {a.phone}
      </a>,
    ]);
  if (a.portfolio_url)
    details.push([
      "Portfolio",
      <ExternalLink key="pf" url={a.portfolio_url} />,
    ]);
  if (a.linkedin_url)
    details.push(["LinkedIn", <ExternalLink key="li" url={a.linkedin_url} />]);
  if (a.resume_file)
    details.push([
      "Resume",
      resumeInBlob ? (
        <a
          key="r"
          href={`/api/admin/resume/${a.id}`}
          className="inline-flex items-center gap-2 text-sm font-mono text-accent hover:underline"
        >
          ⬇ Download Resume
        </a>
      ) : (
        <span key="r" className="text-xs font-mono text-zinc-500">
          {a.resume_file}{" "}
          <span className="text-amber-400">
            (stored on the old server — not migrated)
          </span>
        </span>
      ),
    ]);

  return (
    <>
      <div className="mb-6">
        <BackLink href="/admin/careers?tab=applications">
          Back to Applications
        </BackLink>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="px-6 py-5 border-b border-zinc-800 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-display font-bold text-accent">
                {a.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-display font-bold text-white">
                {a.name}
              </h2>
              <p className="text-sm font-mono text-zinc-400">
                Applied for:{" "}
                <span className="text-white">
                  {a.job_title ?? <em>General Application</em>}
                </span>
              </p>
              <p className="text-xs font-mono text-zinc-600">
                {at.toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST · {timeAgo(a.created_at)}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-800/40">
            {details.map(([k, v]) => (
              <div key={k} className="bg-zinc-900/60 px-5 py-4">
                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
                  {k}
                </div>
                {v}
              </div>
            ))}
          </div>
          {a.cover_letter && (
            <div className="px-6 py-5">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
                Cover Letter
              </div>
              <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5 text-sm font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {a.cover_letter}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-display font-bold text-white mb-4">
              Update Status
            </h3>
            <form action={updateApplication} className="space-y-4">
              <input type="hidden" name="id" value={a.id} />
              <div>
                <label htmlFor="status" className={labelCls}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={a.status}
                  className={inputCls}
                >
                  {Object.keys(STATUS_COLORS).map((s) => (
                    <option key={s} value={s}>
                      {capitalize(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="admin_notes" className={labelCls}>
                  Admin Notes
                </label>
                <textarea
                  id="admin_notes"
                  name="admin_notes"
                  rows={4}
                  defaultValue={a.admin_notes ?? ""}
                  placeholder="Internal notes about this applicant..."
                  className={`${inputCls} resize-y`}
                />
              </div>
              <SubmitButton className={`${primaryBtn} w-full justify-center`}>
                Save Changes
              </SubmitButton>
            </form>
          </Card>
          <form action={deleteApplication}>
            <input type="hidden" name="id" value={a.id} />
            <ConfirmButton
              message="Permanently delete this application?"
              className="w-full px-4 py-3 text-sm font-mono text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors"
            >
              Delete Application
            </ConfirmButton>
          </form>
        </div>
      </div>
    </>
  );
}

async function ApplicationList({ unread }: { unread: number }) {
  const apps = (
    await rows<Application>(sql`
      SELECT a.id, a.name, a.email, a.status, a.is_read, a.created_at, j.title AS job_title
      FROM career_applications a LEFT JOIN career_jobs j ON a.job_id = j.id ORDER BY a.created_at DESC
    `)
  ).map(decodeRow);
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-display font-bold">All Applications</h2>
        {unread > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/15 text-amber-400 rounded border border-amber-500/25">
            {unread} unread
          </span>
        )}
      </div>
      <Card>
        {apps.length === 0 ? (
          <EmptyState>No applications received yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  <Th>Applicant</Th>
                  <Th hide="hidden md:table-cell">Role</Th>
                  <Th hide="hidden sm:table-cell">Date</Th>
                  <Th className="text-center">Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {apps.map((a) => (
                  <tr
                    key={a.id}
                    className={`transition-colors hover:bg-zinc-800/30 ${!a.is_read ? "bg-accent/[0.03]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-zinc-300">
                            {a.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-sm text-white font-semibold flex items-center gap-2">
                            {a.name}
                            {!a.is_read && (
                              <span
                                className="w-2 h-2 rounded-full bg-accent"
                                aria-label="Unread"
                              />
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-zinc-600 truncate">
                            {a.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-zinc-400">
                        {a.job_title ?? (
                          <em className="text-zinc-600">General</em>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-xs text-zinc-500">
                        {formatDate(a.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/careers?tab=applications&view=${a.id}`}
                        className="text-xs font-mono text-accent hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

export default async function CareersAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const viewId = Number(sp.view) || 0;
  const tab = viewId || sp.tab === "applications" ? "applications" : "jobs";

  const [jobs, [counts]] = await Promise.all([
    rows<Job>(sql`
      SELECT j.*, (SELECT COUNT(*)::int FROM career_applications a WHERE a.job_id = j.id) AS apps
      FROM career_jobs j ORDER BY sort_order ASC, created_at DESC
    `),
    rows<{ total: number; unread: number }>(
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_read = 0)::int AS unread FROM career_applications`,
    ),
  ]);

  let editJob: Job | null = null;
  if (tab === "jobs" && sp.form === "edit") {
    editJob = jobs.find((j) => j.id === Number(sp.id)) ?? null;
    if (!editJob) redirect("/admin/careers?tab=jobs");
  }
  const showForm = tab === "jobs" && (sp.form === "add" || !!editJob);

  const tabCls = (active: boolean) =>
    `px-4 py-2 text-xs font-mono rounded-lg transition-all ${active ? "bg-accent text-black font-bold" : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white"}`;

  return (
    <AdminPage title="Careers">
      <StatGrid
        cols="grid-cols-2 sm:grid-cols-4"
        stats={[
          [
            jobs.filter((j) => j.is_active).length,
            "Open Positions",
            "text-accent",
          ],
          [jobs.length, "Total Jobs", "text-blue-400"],
          [counts.total, "Applications", "text-purple-400"],
          [counts.unread, "Unread Apps", "text-amber-400"],
        ]}
      />
      <div className="flex gap-2 mb-6">
        <Link href="/admin/careers?tab=jobs" className={tabCls(tab === "jobs")}>
          Job Listings <span className="opacity-70">({jobs.length})</span>
        </Link>
        <Link
          href="/admin/careers?tab=applications"
          className={tabCls(tab === "applications")}
        >
          Applications <span className="opacity-70">({counts.total})</span>
        </Link>
      </div>
      {tab === "jobs" ? (
        showForm ? (
          <JobForm job={editJob} />
        ) : (
          <JobList jobs={jobs} />
        )
      ) : viewId ? (
        <ApplicationView id={viewId} />
      ) : (
        <ApplicationList unread={counts.unread} />
      )}
    </AdminPage>
  );
}
