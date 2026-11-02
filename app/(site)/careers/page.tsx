import { ArrowLeft, BookOpen, Briefcase, CalendarDays, Clock, Code2, Globe2, IndianRupee, MapPin, Rocket, ShieldCheck, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import ApplicationForm from "@/components/careers/ApplicationForm";
import JsonLd from "@/components/JsonLd";
import { container, CtaLink, IconChip, PageHero, Section, SectionHeading } from "@/components/site/ui";
import { AnimatedGradientText } from "@/components/velora/animated-gradient-text";
import { BackgroundBeams } from "@/components/velora/background-beams";
import { BlurFade } from "@/components/velora/blur-fade";
import { ExpandableCard } from "@/components/velora/expandable-card";
import { SpotlightCard } from "@/components/velora/spotlight-card";
import { SITE_URL } from "@/lib/config";
import { formatDate, getActiveJobs, splitList, type CareerJob } from "@/lib/content";
import { resumeUploadsEnabled } from "@/lib/resumes";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { pageMetadata, pageSchema } from "@/lib/seo";

type Props = { searchParams: Promise<{ job?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { job: slug } = await searchParams;
  const base = await pageMetadata("careers");
  const job = slug ? (await getActiveJobs()).find((j) => j.slug === slug.trim()) : null;
  if (!job) return base;
  const title = `${job.title} Job | Brave Syntax Careers`;
  const description = `${job.title} at Brave Syntax: ${TYPE_LABELS[job.type] ?? job.type} role, ${job.location}. See the details and apply online.`;
  const url = `${SITE_URL}/careers?job=${encodeURIComponent(job.slug)}`;
  return { ...base, title: { absolute: title }, description, alternates: { canonical: url }, openGraph: { ...base.openGraph, title, description, url }, twitter: { ...base.twitter, title, description } };
}

const TYPE_LABELS: Record<string, string> = {
  "full-time": "Full time",
  "part-time": "Part time",
  freelance: "Freelance",
  internship: "Internship",
  remote: "Remote",
};

const PERKS = [
  ["Real projects", "Work on live websites and products for real clients.", ShieldCheck],
  ["Modern stack", "Next.js, React, Tailwind, Figma and the tools that matter.", Code2],
  ["Remote friendly", "Work from anywhere. We care about output, not hours.", Globe2],
  ["Learn and grow", "Learn alongside experienced developers and designers.", BookOpen],
  ["Flexible hours", "No rigid 9-to-5. As long as deadlines are met, you manage your time.", Clock],
  ["Fair pay", "Competitive pay for freelance, part-time and full-time roles.", IndianRupee],
] as const;

const EMPLOYMENT_TYPES: Record<string, string> = { "full-time": "FULL_TIME", "part-time": "PART_TIME", freelance: "CONTRACTOR", internship: "INTERN" };

function jobPostingSchema(job: CareerJob) {
  const remote = job.type === "remote" || /remote/i.test(job.location);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: sanitizeRichHtml(job.description),
    datePosted: new Date(job.created_at ?? Date.now()).toISOString().slice(0, 10),
    ...(job.deadline && { validThrough: new Date(job.deadline).toISOString() }),
    ...(EMPLOYMENT_TYPES[job.type] && { employmentType: EMPLOYMENT_TYPES[job.type] }),
    hiringOrganization: { "@type": "Organization", name: "Brave Syntax", sameAs: SITE_URL, logo: `${SITE_URL}/brand/logo-on-light.png` },
    ...(remote
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "India" } }
      : { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "IN" } } }),
    directApply: true,
  };
}

export default async function CareersPage({ searchParams }: Props) {
  const [{ job: jobSlug }, jobs, schema] = await Promise.all([searchParams, getActiveJobs(), pageSchema("careers")]);
  const focusJob = jobSlug ? (jobs.find((j) => j.slug === jobSlug.trim()) ?? null) : null;
  const form = <ApplicationForm focusJob={focusJob ? { id: focusJob.id, title: focusJob.title } : null} jobs={jobs.map((j) => ({ id: j.id, title: j.title }))} uploadsEnabled={resumeUploadsEnabled()} />;

  return (
    <>
      <JsonLd data={focusJob ? [...schema, jobPostingSchema(focusJob)] : schema} />

      {focusJob ? (
        <div className={`${container} py-14`}>
          <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> All openings
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <article className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{TYPE_LABELS[focusJob.type] ?? focusJob.type}</span>
                {focusJob.is_featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                    <Star className="size-3" aria-hidden="true" /> Featured
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{focusJob.title}</h1>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden="true" /> {focusJob.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="size-4" aria-hidden="true" /> {focusJob.department}
                </span>
                {focusJob.experience && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden="true" /> {focusJob.experience}
                  </span>
                )}
                {focusJob.salary_range && <span>{focusJob.salary_range}</span>}
                {focusJob.deadline && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden="true" /> Apply by {formatDate(focusJob.deadline)}
                  </span>
                )}
              </p>
              {/* Job description HTML is written by admins; sanitized before rendering. */}
              <div className="rich-text mt-8" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(focusJob.description) }} />
              {focusJob.requirements && (
                <section className="mt-8">
                  <h2 className="text-xl font-semibold tracking-tight">Requirements</h2>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
                    {splitList(focusJob.requirements, "\n").map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </section>
              )}
              {focusJob.skills && (
                <section className="mt-8">
                  <h2 className="text-xl font-semibold tracking-tight">Skills</h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {splitList(focusJob.skills).map((skill) => (
                      <span key={skill} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </article>
            <aside className="lg:sticky lg:top-24 lg:self-start">{form}</aside>
          </div>
        </div>
      ) : (
        <>
          <PageHero
            eyebrow={jobs.length ? "We're hiring" : "Careers"}
            title={
              <>
                Build the future of <AnimatedGradientText>digital experiences</AnimatedGradientText>
              </>
            }
            background={<BackgroundBeams className="-z-10" />}
          >
            Join a small, focused team building websites and web products for real clients.
          </PageHero>

          <Section label="Open positions" className="!pt-8">
            <SectionHeading eyebrow={`Open positions (${jobs.length})`} title={jobs.length ? "Roles we're hiring for" : "No openings right now"}>
              {jobs.length ? "Pick a role to see the details and apply." : "We're not actively hiring, but we always welcome great talent. Send a general application below."}
            </SectionHeading>
            {jobs.length > 0 && (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {jobs.map((job) => (
                  <ExpandableCard
                    key={job.id}
                    title={job.title}
                    subtitle={`${job.location} · ${job.department} · ${TYPE_LABELS[job.type] ?? job.type}`}
                    media={<IconChip>{job.is_featured ? <Star className="size-5" aria-label="Featured role" /> : <Briefcase className="size-5" aria-hidden="true" />}</IconChip>}
                  >
                    <div className="rich-text line-clamp-6" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(job.description) }} />
                    <CtaLink href={`/careers?job=${encodeURIComponent(job.slug)}`} className="mt-5">
                      View role and apply
                    </CtaLink>
                  </ExpandableCard>
                ))}
              </div>
            )}
          </Section>

          <Section muted label="Apply">
            <div className="mx-auto max-w-3xl">{form}</div>
          </Section>

          <Section label="Why work with us">
            <SectionHeading center eyebrow="Why Brave Syntax" title="A small team. Real work.">
              <Rocket className="mr-1 inline size-4 text-primary" aria-hidden="true" /> What you can expect.
            </SectionHeading>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PERKS.map(([title, desc, Icon], i) => (
                <BlurFade key={title} delay={(i % 3) * 0.06} className="h-full">
                  <SpotlightCard className="h-full rounded-2xl border bg-card p-5">
                    <div className="relative">
                      <IconChip>
                        <Icon className="size-5" aria-hidden="true" />
                      </IconChip>
                      <h3 className="mt-4 font-medium">{title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </SpotlightCard>
                </BlurFade>
              ))}
            </div>
          </Section>
        </>
      )}
    </>
  );
}
