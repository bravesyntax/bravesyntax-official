import type { Metadata } from "next";
import LocationPage, { locationMetadata } from "@/components/location/LocationPage";
import { getIndexableLocationPaths } from "@/lib/locations";

type Props = { params: Promise<{ city: string }> };

// Indexable cities are pre-built; any other active city renders on first request.
export async function generateStaticParams() {
  return (await getIndexableLocationPaths()).cities.map((city) => ({ city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return locationMetadata((await params).city);
}

export default async function CityPage({ params }: Props) {
  return <LocationPage citySlug={(await params).city} />;
}
