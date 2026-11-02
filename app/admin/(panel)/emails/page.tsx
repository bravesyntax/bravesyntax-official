import { ExternalLink, Mail } from "lucide-react";
import Link from "next/link";
import { AdminPage, Card } from "@/components/admin/ui";
import { mailConfigured } from "@/lib/mailer";

export const metadata = { title: "Email Templates" };

const TEMPLATES: [slug: string, name: string, when: string][] = [
  ["enquiry-admin", "New enquiry (to you)", "A visitor submits the contact form."],
  ["enquiry-auto-reply", "Enquiry confirmation", "Sent to the visitor right after they contact you."],
  ["enquiry-reply", "Reply to enquiry", "You reply from Admin → Messages."],
  ["application-admin", "New job application (to you)", "Someone applies on the careers page."],
  ["application-auto-reply", "Application confirmation", "Sent to the applicant."],
  ["login-code", "Sign-in code", "Second step of admin sign-in."],
  ["password-changed", "Password changed alert", "The admin password is changed."],
];

type Props = { searchParams: Promise<{ t?: string }> };

export default async function EmailTemplatesPage({ searchParams }: Props) {
  const { t } = await searchParams;
  const active = TEMPLATES.find(([slug]) => slug === t) ?? TEMPLATES[0];
  return (
    <AdminPage title="Email Templates">
      <p className="mb-6 max-w-3xl text-sm text-zinc-400">
        Every email the website sends, previewed with sample data. Business name, contact details and social links come from{" "}
        <Link href="/admin/settings" className="text-brand hover:underline">
          Settings
        </Link>
        .{" "}
        {mailConfigured() ? <span className="text-emerald-400">SMTP is configured — emails are being delivered.</span> : <span className="text-amber-400">SMTP_PASS is not set, so emails are currently skipped.</span>}
      </p>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="self-start">
          <nav className="divide-y divide-zinc-800">
            {TEMPLATES.map(([slug, name, when]) => (
              <Link key={slug} href={`/admin/emails?t=${slug}`} className={`flex gap-3 px-4 py-3.5 transition-colors ${slug === active[0] ? "bg-brand/10" : "hover:bg-zinc-800/40"}`}>
                <Mail className={`mt-0.5 h-4 w-4 flex-shrink-0 ${slug === active[0] ? "text-brand" : "text-zinc-500"}`} aria-hidden="true" />
                <span>
                  <span className={`block text-sm font-medium ${slug === active[0] ? "text-white" : "text-zinc-300"}`}>{name}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{when}</span>
                </span>
              </Link>
            ))}
          </nav>
        </Card>
        <Card>
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <span className="text-sm font-medium text-white">{active[1]}</span>
            <a href={`/api/admin/email-preview/${active[0]}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">
              Open full size <ExternalLink className="inline h-3 w-3" aria-hidden="true" />
            </a>
          </div>
          <iframe title={`${active[1]} preview`} src={`/api/admin/email-preview/${active[0]}`} sandbox="" className="h-[780px] w-full bg-[#f1f5f9]" />
        </Card>
      </div>
    </AdminPage>
  );
}
