import { getContactInfo } from "@/lib/contact";
import { getLegalPage, type LegalSlug } from "@/lib/legal";
import { sanitizeRichHtml } from "@/lib/sanitize";

export default async function LegalPage({ slug }: { slug: LegalSlug }) {
  const contact = await getContactInfo();
  const page = await getLegalPage(slug, contact);
  const updated = page.updated ? new Date(page.updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <div className="bg-white dark:bg-zinc-950">
      <section className="border-b border-zinc-200 dark:border-zinc-800 pt-36 pb-12 lg:pt-44">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Legal</p>
          <h1 className="font-display text-4xl font-bold text-zinc-900 dark:text-white lg:text-5xl">{page.title}</h1>
          {updated && <p className="mt-4 text-sm text-zinc-500">Last updated {updated}</p>}
        </div>
      </section>
      <section className="py-14 lg:py-20">
        <article className="legal-content mx-auto max-w-3xl px-6" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(page.html) }} />
      </section>
    </div>
  );
}
