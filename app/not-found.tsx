import Footer from "@/components/layout/Footer";
import SiteHeader from "@/components/layout/SiteHeader";
import NotFoundContent from "@/components/layout/NotFoundContent";
import { NOT_FOUND_METADATA } from "@/lib/notFoundMetadata";

// Unmatched URLs render outside the (site) layout, so this one brings its own header and footer.
export const metadata = NOT_FOUND_METADATA;

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main>
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
