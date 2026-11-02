import { Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import ApplicationForm from "@/components/careers/ApplicationForm";
import JsonLd from "@/components/JsonLd";
import Icon, { ICONS } from "@/components/ui/Icon";
import { formatDate, getActiveJobs, splitList } from "@/lib/content";
import { resumeUploadsEnabled } from "@/lib/resumes";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { pageMetadata, pageSchema } from "@/lib/seo";

type Props = { searchParams: Promise<{ job?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("careers");
}

const TYPE_LABELS: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  freelance: "Freelance",
  internship: "Internship",
  remote: "Remote",
};
const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "part-time": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  freelance: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  internship: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  remote: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};

const GLOBE = "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064";
const SHIELD =
  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z";
const BRIEFCASE =
  "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z";
const CLOCK = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
const PIN = "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z";

const PERKS = [
  ["Real Projects", "Work on live products used by real clients across India and globally.", SHIELD],
  ["Modern Stack", "Next.js, React, PHP, Tailwind, Figma — we use tools that matter.", "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"],
  ["Remote Friendly", "Work from anywhere. We care about output, not hours.", GLOBE],
  [
    "Learn & Grow",
    "Access to mentorship from experienced developers and designers.",
    "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  ],
  ["Flexible Hours", "No rigid 9-to-5. As long as deadlines are met, you manage your time.", CLOCK],
  [
    "Good Pay",
    "Competitive compensation for freelance, part-time, and full-time roles.",
    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  ],
];

const TypeBadge = ({ type, className = "" }: { type: string; className?: string }) => (
  <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${TYPE_COLORS[type] ?? ""} ${className}`}>{TYPE_LABELS[type] ?? type}</span>
);

export default async function CareersPage({ searchParams }: Props) {
  const [{ job: jobSlug }, jobs, schema] = await Promise.all([searchParams, getActiveJobs(), pageSchema("careers")]);
  const focusJob = jobSlug ? (jobs.find((j) => j.slug === jobSlug.trim()) ?? null) : null;

  return (
    <>
      <JsonLd data={schema} />

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <span className="inline-block font-mono text-xs text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full mb-5">{jobs.length ? "We're Hiring" : "Careers"}</span>
          <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-5 leading-tight">
            Build the future of
            <br />
            <span className="text-gradient">digital experiences</span>
          </h1>
          <p className="font-mono text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Join the Brave Syntax team. We&apos;re a small, focused team building exceptional web products for clients across India and beyond.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-sm text-zinc-400">
            <span className="flex items-center gap-2">
              <Icon d={ICONS.pin} className="w-4 h-4 text-accent" strokeWidth={2} />
              Ghaziabad, UP
            </span>
            <span className="flex items-center gap-2">
              <Icon d={GLOBE} className="w-4 h-4 text-accent" strokeWidth={2} />
              Remote Friendly
            </span>
            <span className="flex items-center gap-2">
              <Icon d={SHIELD} className="w-4 h-4 text-accent" strokeWidth={2} />
              Real Projects
            </span>
          </div>
        </div>
      </section>

      {/* ═══ MAIN ═══ */}
      <section className="pb-16">
        <div className="max-w-5xl mx-auto px-6">
          {focusJob ? (
            <>
              <div className="mb-5">
                <Link href="/careers" className="inline-flex items-center gap-1.5 font-mono text-sm text-zinc-500 hover:text-white transition-colors">
                  <Icon d="M15 19l-7-7 7-7" className="w-4 h-4" strokeWidth={2} />
                  All Openings
                </Link>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 mb-12">
                <div className="lg:col-span-2">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
                    <div className="flex flex-wrap items-start gap-3 mb-6">
                      <TypeBadge type={focusJob.type} />
                      {focusJob.is_featured ? (
                        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 inline-flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400" aria-hidden="true" />Featured</span>
                      ) : null}
                    </div>

                    <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">{focusJob.title}</h2>

                    <div className="flex flex-wrap gap-4 font-mono text-sm text-zinc-400 mb-6">
                      <span className="flex items-center gap-1.5">
                        <Icon d={PIN} className="w-4 h-4" strokeWidth={2} />
                        {focusJob.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" className="w-4 h-4" strokeWidth={2} />
                        {focusJob.department}
                      </span>
                      {focusJob.experience && (
                        <span className="flex items-center gap-1.5">
                          <Icon d={CLOCK} className="w-4 h-4" strokeWidth={2} />
                          {focusJob.experience}
                        </span>
                      )}
                      {focusJob.salary_range && <span className="text-emerald-400">{focusJob.salary_range}</span>}
                    </div>

                    {/* Job description HTML is written by admins; sanitized before rendering. */}
                    <div className="font-mono text-sm leading-relaxed text-zinc-300 mb-6" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(focusJob.description) }} />

                    {focusJob.requirements && (
                      <div className="mb-6">
                        <h3 className="font-display font-semibold mb-3">Requirements</h3>
                        <ul className="space-y-2">
                          {splitList(focusJob.requirements, "\n").map((req, i) => (
                            <li key={i} className="flex items-start gap-2 font-mono text-sm text-zinc-300">
                              <span className="text-accent mt-0.5 flex-shrink-0">▸</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {focusJob.skills && (
                      <div>
                        <h3 className="font-display font-semibold mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {splitList(focusJob.skills).map((skill) => (
                            <span key={skill} className="font-mono text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1 rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 sticky top-24">
                    <h3 className="font-display font-semibold mb-4">Apply for this role</h3>
                    {focusJob.deadline && (
                      <div className="flex items-center gap-2 font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
                        <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                        Deadline: {formatDate(focusJob.deadline)}
                      </div>
                    )}
                    <a
                      href="#apply-form"
                      className="block w-full text-center py-3 bg-accent hover:bg-accent-dark text-white font-mono text-sm font-semibold rounded-xl transition-colors"
                    >
                      Apply Now →
                    </a>
                    <p className="text-xs font-mono text-zinc-500 text-center mt-3">Takes less than 5 minutes</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl">
                  Open Positions <span className="text-accent">({jobs.length})</span>
                </h2>
              </div>

              {jobs.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center mb-12">
                  <Icon d={BRIEFCASE} className="w-12 h-12 text-zinc-700 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="font-display font-semibold text-lg mb-2">No openings right now</p>
                  <p className="font-mono text-sm text-zinc-500 mb-5">We&apos;re not actively hiring, but we always welcome great talent.</p>
                  <a href="#apply-form" className="inline-block font-mono text-sm text-accent hover:text-accent-light transition-colors">
                    Send a general application →
                  </a>
                </div>
              ) : (
                <div className="space-y-3 mb-12">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/careers?job=${encodeURIComponent(job.slug)}`}
                      className="group flex items-center justify-between bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800 hover:border-accent/30 rounded-2xl p-5 md:p-6 transition-all card-hover"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 ${job.is_featured ? "bg-yellow-500/10" : "bg-accent/10"} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}
                        >
                          {job.is_featured ? (
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-label="Featured role" />
                          ) : (
                            <Icon d={BRIEFCASE} className="w-5 h-5 text-accent" strokeWidth={2} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-lg group-hover:text-accent transition-colors">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="font-mono text-xs text-zinc-400 flex items-center gap-1">
                              <Icon d={PIN} className="w-3.5 h-3.5" strokeWidth={2} />
                              {job.location}
                            </span>
                            {job.experience && <span className="font-mono text-xs text-zinc-400">{job.experience}</span>}
                            {job.salary_range && <span className="font-mono text-xs text-emerald-400">{job.salary_range}</span>}
                            {job.deadline && <span className="font-mono text-xs text-amber-400">Deadline: {formatDate(job.deadline, false)}</span>}
                          </div>
                          {job.skills && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {splitList(job.skills)
                                .slice(0, 4)
                                .map((skill) => (
                                  <span key={skill} className="font-mono text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">
                                    {skill}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <TypeBadge type={job.type} className="hidden sm:inline" />
                        <Icon d="M9 5l7 7-7 7" className="w-5 h-5 text-zinc-600 group-hover:text-accent transition-colors" strokeWidth={2} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          <ApplicationForm
            focusJob={focusJob && { id: focusJob.id, title: focusJob.title }}
            jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}
            uploadsEnabled={resumeUploadsEnabled()}
          />

          {/* ═══ PERKS ═══ */}
          <div className="mt-16">
            <h2 className="font-display font-bold text-2xl text-center mb-2">Why Brave Syntax?</h2>
            <p className="font-mono text-sm text-zinc-400 text-center mb-8">A small team. Real impact. Real work.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERKS.map(([title, desc, icon]) => (
                <div key={title} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                  <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                    <Icon d={icon} className="w-5 h-5 text-accent" strokeWidth={2} />
                  </div>
                  <h3 className="font-display font-semibold mb-1.5">{title}</h3>
                  <p className="font-mono text-xs text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
