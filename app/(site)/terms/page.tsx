import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("terms");
}

export default function Page() {
  return <LegalPage slug="terms" />;
}
