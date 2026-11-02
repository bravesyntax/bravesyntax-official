import type { NextConfig } from "next";

// Clean-URL pages that used to live at /pages/<name>.php (see the old .htaccess).
// /pages/blog.php is handled in middleware.ts because of its ?post= parameter.
const LEGACY_PAGES = ["services", "about", "contact", "portfolio", "pdf-tools", "careers", "industries", "bg-remover"];

// Baseline security headers for every response. A strict script-src would need per-request nonces (which turns
// every static page dynamic) and would break the CDN-loaded PDF engine, so the CSP sticks to directives that
// can't break the site: no plugins, no <base> hijacking, forms post only to this site, no framing by others.
const CSP = ["object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'", "upgrade-insecure-requests"].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Blog and portfolio images uploaded through the admin live in Vercel Blob (public store).
  images: { remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }] },
  experimental: {
    // ~360 pages are pre-rendered from Neon; fewer at a time avoids bursts of connections that can time out.
    staticGenerationMaxConcurrency: 4,
    staticGenerationRetryCount: 3,
  },
  async redirects() {
    return [
      ...LEGACY_PAGES.map((p) => ({ source: `/pages/${p}.php`, destination: `/${p}`, permanent: true })),
      { source: "/index.php", destination: "/", permanent: true },
      // Old admin URLs (bookmarks, notification emails): /admin/messages.php?view=5 → /admin/messages?view=5
      { source: "/admin/index.php", destination: "/admin", permanent: true },
      { source: "/admin/:page([a-z-]+).php", destination: "/admin/:page", permanent: true },
    ];
  },
  async headers() {
    return [
      // The sitemap is for crawlers to read, not a page to rank.
      { source: "/sitemap.xml", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      // Admin and API responses are private: never cached by browsers or proxies, never indexed.
      ...["/admin/:path*", "/admin", "/api/:path*"].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
