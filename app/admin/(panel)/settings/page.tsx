import { BarChart3, Building2, Images, KeyRound, Mail, Share2, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SubmitButton } from "@/components/admin/client";
import { AdminPage, inputCls, labelCls, primaryBtn } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { rows, sql } from "@/lib/db";
import { mailConfigured } from "@/lib/mailer";
import { canAutoRenew, getInstagramAccount } from "@/lib/instagram";
import { getSiteSettings } from "@/lib/settings";
import { changePassword, removeInstagram, saveInstagram, saveSettings, updateAdminEmail } from "./actions";

export const metadata = { title: "Settings" };

function Field({ name, title, value, type = "text", placeholder, hint, span }: { name: string; title: string; value?: string; type?: string; placeholder?: string; hint?: string; span?: boolean }) {
  return (
    <div className={span ? "md:col-span-2" : undefined}>
      <label htmlFor={name} className={labelCls}>
        {title}
      </label>
      <input id={name} type={type} name={name} defaultValue={value} placeholder={placeholder} className={inputCls} />
      {hint && <p className="mt-1.5 text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
}

function Section({ icon: Icon, title, description, children, cols = "md:grid-cols-2" }: { icon: LucideIcon; title: string; description: string; children: ReactNode; cols?: string }) {
  return (
    <section className="grid gap-6 border-b border-zinc-800 py-8 first:pt-0 last:border-0 lg:grid-cols-[260px_1fr]">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon className="h-4 w-4 text-brand" aria-hidden="true" />
          {title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{description}</p>
      </div>
      <div className={`grid gap-5 ${cols}`}>{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const [s, [account], ig] = await Promise.all([
    getSiteSettings(),
    rows<{ email: string; full_name: string | null; last_login: Date | null }>(sql`SELECT email, full_name, last_login FROM admin_users WHERE id = ${admin.id}`),
    getInstagramAccount(),
  ]);
  const istDate = (d: Date) => d.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
  const v = (k: string, fallback = "") => s[k] || fallback;

  return (
    <AdminPage title="Settings">
      <div className="mx-auto max-w-5xl space-y-6">
        <form action={saveSettings} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 lg:p-8">
          <Section icon={Building2} title="Business details" description="Shown in the header, footer, contact page, structured data and every email.">
            <Field name="site_name" title="Business name" value={v("site_name", "Brave Syntax")} />
            <Field name="site_tagline" title="Tagline" value={v("site_tagline")} placeholder="Design & Development Services" />
            <Field name="contact_address" title="Address" value={v("contact_address")} placeholder="City, State, Country" span />
          </Section>

          <Section icon={Mail} title="Contact & enquiries" description="How clients reach you, and where new enquiries and job applications are delivered.">
            <Field name="contact_email" title="Public email" type="email" value={v("contact_email")} />
            <Field name="notification_email" title="Notification inbox" type="email" value={v("notification_email")} placeholder="Same as public email" hint="Receives enquiry and application alerts." />
            <Field name="contact_phone" title="Phone" value={v("contact_phone")} placeholder="+91 98XXXXXXXX" />
            <Field name="contact_whatsapp" title="WhatsApp number" value={v("contact_whatsapp")} placeholder="Same as phone" hint="With country code. Powers every WhatsApp button." />
            <Field name="business_hours" title="Business hours" value={v("business_hours")} placeholder="Mon–Sat, 9am–8pm IST" />
            <Field name="response_time" title="Promised response time" value={v("response_time")} placeholder="within 2 hours" hint='Used in sentences like "We reply within 2 hours".' />
            <Field name="booking_url" title="Book-a-call link" type="url" value={v("booking_url")} placeholder="https://calendly.com/…" hint="Shows a “Book a call” option when set." />
            <Field name="upwork_url" title="Upwork profile" type="url" value={v("upwork_url")} placeholder="https://www.upwork.com/…" hint="Shows an Upwork option when set." />
          </Section>

          <Section icon={Share2} title="Social profiles" description="Leave blank to hide an icon. Also listed as sameAs in the organisation schema.">
            {[
              ["social_linkedin", "LinkedIn"],
              ["social_instagram", "Instagram"],
              ["social_github", "GitHub"],
              ["social_facebook", "Facebook"],
              ["social_twitter", "X (Twitter)"],
            ].map(([n, t]) => (
              <Field key={n} name={n} title={t} type="url" value={v(n)} placeholder="https://" />
            ))}
          </Section>

          <Section icon={BarChart3} title="Analytics" description="Visitor tracking. Search engine verification, share images and per-page SEO live in the SEO section.">
            <Field name="google_analytics_id" title="Google Analytics 4 ID" value={v("google_analytics_id")} placeholder="G-XXXXXXXXXX" />
            <div className="flex items-end">
              <Link href="/admin/seo/settings" className="inline-flex items-center gap-1.5 pb-3 text-xs text-brand hover:underline">
                SEO settings: verification, share image, organisation schema →
              </Link>
            </div>
          </Section>

          <div className="flex justify-end border-t border-zinc-800 pt-6">
            <SubmitButton className={primaryBtn}>Save settings</SubmitButton>
          </div>
        </form>


        <form action={saveInstagram} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 lg:p-8">
          <Section
            icon={Images}
            title="Instagram feed"
            description="Shows your latest Instagram posts on the home page, updated every hour. Hidden until an account is connected."
            cols="md:grid-cols-2"
          >
            {ig ? (
              <div className="space-y-2 md:col-span-2">
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  Connected{ig.username ? <> as <strong>@{ig.username}</strong></> : null}
                  {ig.refreshedAt && <>, token saved or renewed on {istDate(ig.refreshedAt)}</>}.
                  {canAutoRenew(ig.token) ? " It renews itself every week." : null}
                </p>
                {!canAutoRenew(ig.token) && ig.refreshedAt && (
                  <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-300">
                    This token doesn&apos;t renew itself. Generate a new one in Meta&apos;s dashboard and paste it here before about{" "}
                    {istDate(new Date(ig.refreshedAt.getTime() + 55 * 24 * 3600 * 1000))}. To make it automatic, add META_APP_ID and META_APP_SECRET (App settings → Basic) to the
                    Vercel environment variables.
                  </p>
                )}
                {ig.lastError && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs break-words text-red-300">Last error: {ig.lastError}</p>}
              </div>
            ) : (
              <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-zinc-400 md:col-span-2">
                <li>Make the Instagram account a Business or Creator account, and connect it to a Meta business portfolio.</li>
                <li>
                  At{" "}
                  <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                    developers.facebook.com/apps
                  </a>
                  , create a Business app with the “Manage messaging &amp; content on Instagram” use case.
                </li>
                <li>Add the account as an Instagram Tester (App roles), and accept the invite at instagram.com/accounts/manage_access.</li>
                <li>In “API setup with Unified login” → Generate access tokens, add the account and generate a token.</li>
                <li>Paste the token and the account ID (the long number shown next to the account) below.</li>
              </ol>
            )}
            <div>
              <label htmlFor="instagram_token" className={labelCls}>
                {ig ? "Replace access token" : "Access token"}
              </label>
              <input id="instagram_token" name="instagram_token" type="password" autoComplete="off" required placeholder="EAA… or IG…" className={inputCls} />
              <p className="mt-1.5 text-[11px] text-zinc-500">Checked with Meta before it&apos;s saved. Never shown on the website.</p>
            </div>
            <div>
              <label htmlFor="instagram_user_id" className={labelCls}>
                Instagram account ID
              </label>
              <input id="instagram_user_id" name="instagram_user_id" inputMode="numeric" defaultValue={ig?.userId ?? ""} placeholder="17841…" className={inputCls} />
              <p className="mt-1.5 text-[11px] text-zinc-500">Needed for tokens that start with EAA. Not needed for IG… tokens.</p>
            </div>
            <div className="flex justify-end gap-3 md:col-span-2">
              {ig && (
                <button type="submit" formAction={removeInstagram} formNoValidate className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">
                  Disconnect
                </button>
              )}
              <SubmitButton className={primaryBtn}>{ig ? "Update token" : "Connect Instagram"}</SubmitButton>
            </div>
          </Section>
        </form>

        <div className="grid gap-6 lg:grid-cols-2">
          <form action={updateAdminEmail} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 lg:p-8 space-y-5">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-brand" aria-hidden="true" />
                Account & two-step sign-in
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                Sign-in codes are emailed here.{" "}
                {mailConfigured() ? (
                  <span className="text-emerald-400">Email delivery is configured.</span>
                ) : (
                  <span className="text-amber-400">SMTP_PASS is not set — production sign-in will be refused until it is.</span>
                )}
              </p>
            </div>
            <Field name="full_name" title="Your name" value={account?.full_name ?? ""} />
            <Field name="admin_email" title="Sign-in email" type="email" value={account?.email ?? ""} />
            <Field name="confirm_password_email" title="Current password (to confirm)" type="password" />
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] text-zinc-500">Last sign-in: {account?.last_login ? new Date(account.last_login).toLocaleString("en-GB", { timeZone: "Asia/Kolkata" }) : "—"}</p>
              <SubmitButton className={primaryBtn}>Update account</SubmitButton>
            </div>
          </form>

          <form action={changePassword} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 lg:p-8 space-y-5">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <KeyRound className="h-4 w-4 text-brand" aria-hidden="true" />
                Change password
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">At least 10 characters with letters and numbers. Other devices are signed out and you get an email alert.</p>
            </div>
            {[
              ["current_password", "Current password", "current-password"],
              ["new_password", "New password", "new-password"],
              ["confirm_password", "Confirm new password", "new-password"],
            ].map(([name, title, ac]) => (
              <div key={name}>
                <label htmlFor={name} className={labelCls}>
                  {title}
                </label>
                <input id={name} type="password" name={name} required minLength={name === "current_password" ? undefined : 10} autoComplete={ac} className={inputCls} />
              </div>
            ))}
            <div className="flex justify-end">
              <SubmitButton className={primaryBtn}>Update password</SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </AdminPage>
  );
}
