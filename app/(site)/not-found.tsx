import NotFoundContent from "@/components/layout/NotFoundContent";
import { NOT_FOUND_METADATA } from "@/lib/notFoundMetadata";

// notFound() from a public page (unknown blog post, city, …) — rendered inside the site layout.
export const metadata = NOT_FOUND_METADATA;

export default NotFoundContent;
