"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { submitApplication, type ApplyState } from "@/app/(site)/careers/actions";
import Icon from "@/components/ui/Icon";

type Props = {
  focusJob: { id: number; title: string } | null;
  jobs: { id: number; title: string }[];
  uploadsEnabled: boolean;
};

const RESUME_MAX_BYTES = 5 * 1024 * 1024;

const input =
  "w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors";
const label = "block text-xs font-mono text-zinc-400 mb-1.5";
const Optional = () => <span className="text-zinc-600">(optional)</span>;

const initial: ApplyState = { ok: false, errors: [], values: {} };

export default function ApplicationForm({ focusJob, jobs, uploadsEnabled }: Props) {
  const [state, action, pending] = useActionState(submitApplication, initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState("");
  const v = state.values;
  const errors = uploadError ? [uploadError, ...state.errors] : state.errors;

  // Upload the resume from the browser first, then submit the form with just the stored file's URL.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError("");
    const fd = new FormData(e.currentTarget);
    const file = fd.get("resume");
    fd.delete("resume");

    if (file instanceof File && file.size > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["pdf", "doc", "docx"].includes(ext)) return setUploadError("Invalid resume format. Only PDF, DOC, DOCX allowed.");
      if (file.size > RESUME_MAX_BYTES) return setUploadError("Resume file too large. Maximum 5MB allowed.");
      setUploading(true);
      try {
        // Loaded on demand so the uploader isn't in the page bundle for visitors who never attach a file.
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(`resumes/resume_${Date.now()}.${ext}`, file, {
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
    <div id="apply-form" className="scroll-mt-24">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
        <div className="mb-6">
          <h2 className="font-display font-bold text-2xl mb-2">{focusJob ? `Apply — ${focusJob.title}` : "Apply to Brave Syntax"}</h2>
          <p className="font-mono text-sm text-zinc-400">
            {focusJob
              ? "Fill in your details below. We'll get back to you within 2-3 business days."
              : "No fitting role? Send a general application — we'll reach out when there's a match."}
          </p>
        </div>

        {state.ok ? (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-5 flex items-start gap-3" role="status">
            <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="font-display font-semibold text-emerald-300 mb-1">Application received!</p>
              <p className="font-mono text-sm text-emerald-400/80">Thank you for applying. We&apos;ll review and get back to you within 2-3 business days.</p>
            </div>
          </div>
        ) : (
          <>
            {errors.length > 0 && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 mb-5 space-y-1" role="alert">
                {errors.map((err) => (
                  <p key={err} className="font-mono text-sm text-red-300 flex items-center gap-2">
                    <Icon d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                    {err}
                  </p>
                ))}
              </div>
            )}

            {/* key resets uncontrolled inputs to the values the server sent back after a failed submit */}
            <form onSubmit={handleSubmit} key={JSON.stringify(v)}>
              {focusJob ? (
                <input type="hidden" name="job_id" value={focusJob.id} />
              ) : (
                jobs.length > 0 && (
                  <div className="mb-4">
                    <label className={label} htmlFor="app-job">
                      Applying for <Optional />
                    </label>
                    <select id="app-job" name="job_id" defaultValue={v.job_id ?? ""} className={input}>
                      <option value="">— General Application —</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={label} htmlFor="app-name">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input id="app-name" type="text" name="name" required defaultValue={v.name} placeholder="Your full name" className={input} />
                </div>
                <div>
                  <label className={label} htmlFor="app-email">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input id="app-email" type="email" name="email" required defaultValue={v.email} placeholder="you@example.com" className={input} />
                </div>
                <div>
                  <label className={label} htmlFor="app-phone">
                    Phone <Optional />
                  </label>
                  <input id="app-phone" type="tel" name="phone" defaultValue={v.phone} placeholder="+91 9876543210" className={input} />
                </div>
                <div>
                  <label className={label} htmlFor="app-portfolio">
                    Portfolio URL <Optional />
                  </label>
                  <input id="app-portfolio" type="url" name="portfolio_url" defaultValue={v.portfolio_url} placeholder="https://yourportfolio.com" className={input} />
                </div>
                <div className="md:col-span-2">
                  <label className={label} htmlFor="app-linkedin">
                    LinkedIn <Optional />
                  </label>
                  <input
                    id="app-linkedin"
                    type="url"
                    name="linkedin_url"
                    defaultValue={v.linkedin_url}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className={input}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={label} htmlFor="app-cover">
                    Cover Letter / Message <Optional />
                  </label>
                  <textarea
                    id="app-cover"
                    name="cover_letter"
                    rows={5}
                    defaultValue={v.cover_letter}
                    placeholder="Tell us about yourself and why you want to join Brave Syntax..."
                    className={`${input} resize-y`}
                  />
                </div>
                {uploadsEnabled && (
                  <div className="md:col-span-2">
                    <span className={label}>
                      Resume / CV <span className="text-zinc-600">(PDF, DOC, DOCX — max 5MB, optional)</span>
                    </span>
                    <input
                      type="file"
                      name="resume"
                      accept=".pdf,.doc,.docx"
                      id="resume-upload"
                      className="hidden"
                      onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                    />
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center gap-3 w-full bg-zinc-800/50 border border-zinc-700 border-dashed hover:border-accent/50 rounded-xl px-4 py-4 cursor-pointer transition-colors group"
                    >
                      <Icon
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        className="w-5 h-5 text-zinc-500 group-hover:text-accent transition-colors"
                        strokeWidth={2}
                      />
                      <span className="font-mono text-sm text-zinc-400 group-hover:text-white transition-colors">{fileName || "Click to upload resume"}</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-8 py-3 bg-accent hover:bg-accent-dark disabled:opacity-60 text-white font-mono text-sm font-semibold rounded-xl transition-colors"
                >
                  {uploading ? "Uploading resume…" : pending ? "Submitting…" : "Submit Application →"}
                </button>
                <span className="font-mono text-xs text-zinc-500">We respect your privacy.</span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
