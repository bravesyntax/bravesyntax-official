import NotFoundContent from "@/components/layout/NotFoundContent";
import { NOT_FOUND_METADATA } from "@/lib/notFoundMetadata";

// Shown (with HTTP 410) by proxy.ts for location pages that were deliberately removed.
export const metadata = NOT_FOUND_METADATA;

export default NotFoundContent;
