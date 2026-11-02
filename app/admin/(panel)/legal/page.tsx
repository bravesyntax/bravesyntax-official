import { ExternalLink, FileText, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ContentEditor } from "@/components/admin/BlogFields";
import { ConfirmButton, SubmitButton } from "@/components/admin/client";
import { AdminPage, Card, primaryBtn } from "@/components/admin/ui";
import { getContactInfo } from "@/lib/contact";
import { getLegalPage, LEGAL_PAGES, type LegalSlug } from "@/lib/legal";
import { saveLegalPage } from "./actions";

export const metadata = { title: "Legal Pages" };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function LegalAdminPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const slug: LegalSlug = page === "terms" ? "terms" : "privacy-policy";
  const current = await getLegalPage(slug, await getContactInfo());

  return (
    <AdminPage title="Legal Pages">
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(LEGAL_PAGES) as LegalSlug[]).map((s) => (
          <Link key={s} href={`/admin/legal?page=${s}`} className={`tab-btn ${s === slug ? "active" : ""}`}>
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            {LEGAL_PAGES[s].title}
          </Link>
        ))}
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">{current.title}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {current.isDefault ? "Showing the default text, written from your business details. Edit and publish to customise it." : `Last published ${new Date(current.updated).toLocaleString("en-GB", { timeZone: "Asia/Kolkata" })}`}
            </p>
          </div>
          <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline">
            View page <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
        <form key={slug} action={saveLegalPage} className="space-y-5 p-6">
          <input type="hidden" name="slug" value={slug} />
          <ContentEditor content={current.html} />
          <p className="text-xs text-zinc-500">Title and description for search engines are set in the SEO Manager. Scripts and embeds are stripped when the page is shown.</p>
          <div className="flex justify-end border-t border-zinc-800 pt-5">
            <SubmitButton className={primaryBtn}>Publish</SubmitButton>
          </div>
        </form>
        {!current.isDefault && (
          <form action={saveLegalPage} className="px-6 pb-6 -mt-14">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="reset" value="1" />
            <ConfirmButton message="Replace your text with the default version?" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white" title="Reset">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset to default
            </ConfirmButton>
          </form>
        )}
      </Card>
    </AdminPage>
  );
}
