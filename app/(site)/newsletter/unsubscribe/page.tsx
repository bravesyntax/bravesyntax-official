import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/site/ui";
import { sql } from "@/lib/db";

export const metadata: Metadata = { title: "Newsletter", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ token?: string; done?: string }> };
const TOKEN_RE = /^[a-f0-9]{48}$/;

async function unsubscribe(fd: FormData) {
  "use server";
  const token = String(fd.get("token") ?? "");
  if (TOKEN_RE.test(token)) await sql`UPDATE newsletter_subscribers SET unsubscribed_at = COALESCE(unsubscribed_at, LOCALTIMESTAMP) WHERE unsubscribe_token = ${token}`;
  redirect("/newsletter/unsubscribe?done=1");
}

/**
 * Unsubscribe from the link in every newsletter email. It takes one button press rather than happening on page load,
 * because email security scanners open links automatically.
 */
export default async function UnsubscribePage({ searchParams }: Props) {
  const { token = "", done } = await searchParams;
  if (done) return <PageHero eyebrow="Newsletter" title="You've been unsubscribed">You won&apos;t receive any more newsletter emails from us. Sorry to see you go!</PageHero>;
  const valid = TOKEN_RE.test(token) && ((await sql`SELECT 1 FROM newsletter_subscribers WHERE unsubscribe_token = ${token}`) as unknown[]).length > 0;
  if (!valid) return <PageHero eyebrow="Newsletter" title="This link isn't valid">The unsubscribe link may be incomplete. Copy the whole link from the email, or write to us and we&apos;ll remove you.</PageHero>;
  return (
    <PageHero
      eyebrow="Newsletter"
      title="Unsubscribe from our newsletter?"
      actions={
        <form action={unsubscribe}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
            Yes, unsubscribe me
          </button>
        </form>
      }
    >
      You&apos;ll stop receiving our monthly tips straight away.
    </PageHero>
  );
}
