"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { submitApplication, type ApplyState } from "@/app/(site)/careers/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileDrop } from "@/components/velora/file-drop";
import { DotsLoader } from "@/components/velora/loaders";
import { ConsentCheckbox } from "@/components/site/ConsentCheckbox";
import { RippleButton } from "@/components/velora/ripple-button";

type Props = {
  focusJob: { id: number; title: string } | null;
  jobs: { id: number; title: string }[];
  uploadsEnabled: boolean;
};

const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const Optional = () => <span className="font-normal text-muted-foreground">(optional)</span>;
const initial: ApplyState = { ok: false, errors: [], values: {} };

export default function ApplicationForm({ focusJob, jobs, uploadsEnabled }: Props) {
  const [state, action, pending] = useActionState(submitApplication, initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [formTs, setFormTs] = useState("");
  // Set in the browser: a server-rendered value would be the build time of a cached page.
  useEffect(() => setFormTs(String(Date.now())), []);
  const v = state.values;
  const errors = uploadError ? [uploadError, ...state.errors] : state.errors;

  // Upload the resume from the browser first, then submit the form with just the stored file's URL.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError("");
    const fd = new FormData(e.currentTarget);

    if (resume) {
      const ext = resume.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["pdf", "doc", "docx"].includes(ext)) return setUploadError("Invalid resume format. Only PDF, DOC and DOCX are allowed.");
      if (resume.size > RESUME_MAX_BYTES) return setUploadError("Resume file too large. Maximum 5 MB allowed.");
      setUploading(true);
      try {
        // Loaded on demand so the uploader isn't in the page bundle for visitors who never attach a file.
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(`resumes/resume_${Date.now()}.${ext}`, resume, {
          access: "private",
          handleUploadUrl: "/api/resume-upload",
        });
        fd.set("resume_url", blob.url);
      } catch (err) {
        setUploading(false);
        return setUploadError(err instanceof Error && err.message ? err.message : "Resume upload error. Please try again.");
      }
      setUploading(false);
    }

    startTransition(() => action(fd));
  }

  const busy = pending || uploading;

  return (
    <div id="apply-form" className="scroll-mt-24 rounded-3xl border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight">{focusJob ? `Apply: ${focusJob.title}` : "Apply to Brave Syntax"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{focusJob ? "Fill in your details below. We'll get back to you within 2–3 business days." : "No fitting role? Send a general application and we'll reach out when there's a match."}</p>

      {state.ok ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-medium">Application received</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Thank you for applying. We&apos;ll review it and get back to you within 2–3 business days.</p>
          </div>
        </div>
      ) : (
        <>
          {errors.length > 0 && (
            <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4" role="alert">
              {errors.map((err) => (
                <p key={err} className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {err}
                </p>
              ))}
            </div>
          )}
          {/* key resets uncontrolled inputs to the values the server sent back after a failed submit */}
          <form onSubmit={handleSubmit} key={JSON.stringify(v)} className="mt-6 grid gap-5 sm:grid-cols-2">
            <input type="hidden" name="form_ts" value={formTs} />
            {/* Honeypot: invisible to humans */}
            <div style={{ position: "absolute", left: -9999, height: 0, overflow: "hidden" }} aria-hidden="true">
              <label>
                Leave this empty <input type="text" name="website_url" tabIndex={-1} autoComplete="off" defaultValue="" />
              </label>
            </div>
            {focusJob ? (
              <input type="hidden" name="job_id" value={focusJob.id} />
            ) : (
              jobs.length > 0 && (
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="app-job">
                    Applying for <Optional />
                  </Label>
                  <select id="app-job" name="job_id" defaultValue={v.job_id ?? ""} className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30">
                    <option value="">General application</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>
              )
            )}
            <div className="grid gap-2">
              <Label htmlFor="app-name">Full name</Label>
              <Input id="app-name" name="name" required autoComplete="name" defaultValue={v.name} placeholder="Your name" className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="app-email">Email</Label>
              <Input id="app-email" type="email" name="email" required autoComplete="email" defaultValue={v.email} placeholder="you@email.com" className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="app-phone">
                Phone <Optional />
              </Label>
              <Input id="app-phone" type="tel" name="phone" autoComplete="tel" defaultValue={v.phone} placeholder="+91 98765 43210" className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="app-portfolio">
                Portfolio URL <Optional />
              </Label>
              <Input id="app-portfolio" type="url" name="portfolio_url" defaultValue={v.portfolio_url} placeholder="https://yourportfolio.com" className="h-11" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="app-linkedin">
                LinkedIn <Optional />
              </Label>
              <Input id="app-linkedin" type="url" name="linkedin_url" defaultValue={v.linkedin_url} placeholder="https://linkedin.com/in/yourprofile" className="h-11" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="app-cover">
                Message <Optional />
              </Label>
              <Textarea id="app-cover" name="cover_letter" rows={5} defaultValue={v.cover_letter} placeholder="Tell us about yourself and why you'd like to join." />
            </div>
            {uploadsEnabled && (
              <div className="grid gap-2 sm:col-span-2">
                <span className="text-sm leading-none font-medium">
                  Resume <Optional />
                </span>
                <FileDrop accept=".pdf,.doc,.docx" multiple={false} onFiles={(files) => setResume(files[0] ?? null)} />
                <p className="text-xs text-muted-foreground">PDF, DOC or DOCX, up to 5 MB.</p>
              </div>
            )}
            <div className="sm:col-span-2">
              <ConsentCheckbox>I agree that Brave Syntax may store my application and contact me about this role.</ConsentCheckbox>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <RippleButton type="submit" disabled={busy || !formTs} className="h-11 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground disabled:opacity-60">
                {busy ? <DotsLoader size="sm" label={uploading ? "Uploading resume" : "Submitting"} /> : "Submit application"}
              </RippleButton>
              <span className="text-xs text-muted-foreground">We only use your details for this application.</span>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
