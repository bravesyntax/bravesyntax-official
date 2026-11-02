import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";
import { OTP_COOKIE, verifyOtpTicket } from "@/lib/admin/session";
import { SITE_NAME } from "@/lib/config";
import { rows, sql } from "@/lib/db";
import Logo from "@/components/Logo";
import "../admin.css";
import { LoginForm, OtpForm } from "./LoginForm";

export const metadata: Metadata = {
  title: { absolute: `Admin Sign-in | ${SITE_NAME}` },
  robots: { index: false, follow: false },
};

/** s•••••t@example.com */
function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "your email";
  return `${user.charAt(0)}${"•".repeat(Math.max(2, user.length - 2))}${user.length > 1 ? user.at(-1) : ""}@${domain}`;
}

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");

  // Password already checked? Then show the code step.
  const ticket = await verifyOtpTicket((await cookies()).get(OTP_COOKIE)?.value);
  const [pending] = ticket ? await rows<{ email: string }>(sql`SELECT email FROM admin_users WHERE id = ${ticket.uid} AND is_active = 1`) : [];

  return (
    <div className="admin-shell min-h-screen bg-zinc-950 text-white antialiased grid lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-12">
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" aria-hidden="true" />
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <Link href="/" className="relative inline-block" aria-label="Brave Syntax — website">
          <Logo className="h-8" />
        </Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Manage your website, <span className="text-accent">content and SEO</span> in one place.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">Pages, blog, portfolio, careers, enquiries and search settings — every change goes live on the site instantly.</p>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
          Protected by two-step verification
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 flex justify-center lg:hidden" aria-label="Brave Syntax — website">
            <Logo className="h-8" priority />
          </Link>
          {pending ? <OtpForm email={maskEmail(pending.email)} /> : <LoginForm />}
          <p className="mt-10 text-center">
            <Link href="/" className="text-xs text-zinc-500 transition-colors hover:text-accent">
              &larr; Back to website
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
