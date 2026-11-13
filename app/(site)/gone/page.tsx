import NotFoundContent from "@/components/layout/NotFoundContent";
import { NOT_FOUND_METADATA } from "@/lib/notFoundMetadata";

// Shown (with HTTP 410) by proxy.ts for pages that were deliberately removed. For a removed city page the
// visitor still came looking for help in that city, so it says we work there remotely instead of "not found".
export const metadata = NOT_FOUND_METADATA;

type Props = { searchParams: Promise<{ city?: string }> };

/**
 * City name from its slug ("darbhanga-br" → "Darbhanga", "navi-mumbai-mh" → "Navi Mumbai"): removed city slugs
 * end in a two-letter state code. Read from the address rather than the database, so bots crawling the old city
 * pages don't keep the free database awake. proxy.ts only sends slugs of real removed cities here.
 */
function cityName(slug: string): string | null {
  if (!/^[a-z][a-z0-9-]{0,49}$/.test(slug)) return null;
  const words = slug.replace(/-[a-z]{2}$/, "").split("-").filter(Boolean);
  return words.length ? words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") : null;
}

export default async function Gone({ searchParams }: Props) {
  const name = cityName((await searchParams).city ?? "");
  if (!name) return <NotFoundContent />;
  return (
    <NotFoundContent
      eyebrow={`Web design in ${name}`}
      title={`Yes, we work with businesses in ${name}`}
      text={`We no longer have a separate page for ${name}, but our team builds websites, online stores and apps for clients across India, fully online: calls, WhatsApp and video meetings, with no need to visit an office.`}
      cta={["Get a free quote", "/contact"]}
      secondary={["See our services", "/services"]}
    />
  );
}
