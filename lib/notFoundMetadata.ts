import type { Metadata } from "next";
import { SITE_NAME } from "./config";

export const NOT_FOUND_METADATA: Metadata = {
  title: { absolute: `Page Not Found — ${SITE_NAME}` },
  description: "The page you're looking for doesn't exist or may have moved.",
  robots: { index: false, follow: true },
};
