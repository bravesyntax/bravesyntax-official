import type { Metadata } from "next";
import LocationPage, { locationMetadata } from "@/components/location/LocationPage";
import { getIndexableLocationPaths } from "@/lib/locations";

type Props = { params: Promise<{ city: string; service: string }> };

export async function generateStaticParams() {
  const { serviceCities, services } = await getIndexableLocationPaths();
  return serviceCities.flatMap((city) => services.map((service) => ({ city, service })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, service } = await params;
  return locationMetadata(city, service);
}

export default async function CityServicePage({ params }: Props) {
  const { city, service } = await params;
  return <LocationPage citySlug={city} serviceSlug={service} />;
}
