"use client";

import ErrorScreen from "@/components/layout/ErrorScreen";

// Catches failures in the (site) layout itself (header/footer data) and anywhere without a closer boundary.
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} />;
}
