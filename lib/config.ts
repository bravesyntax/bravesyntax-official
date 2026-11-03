// Public site constants (ported from config/config.php). Secrets live in env vars only.
/** Shown as "Building since" on the About and location pages. */
export const BUILDING_SINCE = 2025;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bravesyntax.com"
).replace(/\/$/, "");
export const SITE_NAME = "Brave Syntax";
export const SITE_TAGLINE = "Design & Development Services";
export const ADMIN_EMAIL = "bravesyntax@gmail.com";
