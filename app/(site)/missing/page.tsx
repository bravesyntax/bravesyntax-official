import NotFoundContent from "@/components/layout/NotFoundContent";
import { NOT_FOUND_METADATA } from "@/lib/notFoundMetadata";

// Pre-built 404 page. proxy.ts rewrites unknown URLs here with a 404 status, so they are served from the cache
// instead of each one being rendered and stored as a new ISR entry.
export const dynamic = "force-static";
export const metadata = NOT_FOUND_METADATA;

export default NotFoundContent;
