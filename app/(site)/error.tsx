"use client";

import ErrorScreen from "@/components/layout/ErrorScreen";

// A public page failed: the header and footer stay, so visitors can still navigate away.
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} />;
}
