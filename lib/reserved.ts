// First path segments that are real routes or reserved, never cities. Shared by proxy.ts and the
// location admin (which refuses these as city slugs). Kept dependency-free so the proxy can import it.
export const NOT_CITIES = new Set([
  "about", "blog", "careers", "contact", "industries", "portfolio", "services", "pdf-tools", "bg-remover", "gone",
  "api", "admin", "gsc", "quotation", "assets", "cache", "config", "includes", "uploads", "vendor", "pages",
  "sitemap", "robots", "js", "privacy-policy", "terms",
]);
