"use client";

import ErrorScreen from "@/components/layout/ErrorScreen";

// An admin screen failed: the sidebar stays, so the rest of the panel is still reachable.
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen {...props} area="admin" />;
}
