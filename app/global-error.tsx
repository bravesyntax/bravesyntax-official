"use client";

import ErrorScreen from "@/components/layout/ErrorScreen";
import "./globals.css";

// Last resort, when the root layout itself fails: it replaces the whole document, so it brings its own <html>.
export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <ErrorScreen {...props} />
      </body>
    </html>
  );
}
