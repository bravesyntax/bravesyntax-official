import NotFoundContent from "@/components/layout/NotFoundContent";
import { rows, sql } from "@/lib/db";
import { NOT_FOUND_METADATA } from "@/lib/notFoundMetadata";

// Shown (with HTTP 410) by proxy.ts for pages that were deliberately removed. For a removed city page the
// visitor still came looking for help in that city, so it says we work there remotely instead of "not found".
export const metadata = NOT_FOUND_METADATA;

type Props = { searchParams: Promise<{ city?: string }> };

async function cityName(slug: string): Promise<string | null> {
  if (!/^[a-z][a-z0-9-]{0,49}$/.test(slug)) return null;
  try {
    const [r] = await rows<{ name: string }>(sql`
      SELECT name FROM location_cities WHERE slug = ${slug}
      UNION ALL SELECT name FROM location_cities_removed_backup WHERE slug = ${slug}
      LIMIT 1
    `);
    return r?.name ?? null;
  } catch {
    return null;
  }
}

export default async function Gone({ searchParams }: Props) {
  const slug = (await searchParams).city ?? "";
  const name = slug ? await cityName(slug) : null;
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
