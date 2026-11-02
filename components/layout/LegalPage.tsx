import { TracingBeam } from "@/components/velora/tracing-beam";
import { PageHero } from "@/components/site/ui";
import { getContactInfo } from "@/lib/contact";
import { getLegalPage, type LegalSlug } from "@/lib/legal";
import { sanitizeRichHtml } from "@/lib/sanitize";

export default async function LegalPage({ slug }: { slug: LegalSlug }) {
  const contact = await getContactInfo();
  const page = await getLegalPage(slug, contact);
  const updated = page.updated ? new Date(page.updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <>
      <PageHero eyebrow="Legal" title={page.title}>
        {updated && `Last updated ${updated}`}
      </PageHero>
      <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-6">
        <TracingBeam>
          <article className="rich-text" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(page.html) }} />
        </TracingBeam>
      </section>
    </>
  );
}
