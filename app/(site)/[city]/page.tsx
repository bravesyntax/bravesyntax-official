import type { Metadata } from "next";
import LocationPage, { locationMetadata } from "@/components/location/LocationPage";

type Props = { params: Promise<{ city: string }> };

// Not built at deploy time: each page is rendered and cached on its first visit. Building every page on every
// deployment cost ~9,000 Vercel ISR write units per deploy (the free plan allows 200K a month). Unknown slugs never
// get here: proxy.ts answers them with the pre-built 404 page.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return locationMetadata((await params).city);
}

export default async function CityPage({ params }: Props) {
  return <LocationPage citySlug={(await params).city} />;
}
