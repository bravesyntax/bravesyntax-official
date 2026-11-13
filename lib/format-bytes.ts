/** "12 KB", "1.7 MB", "48 MB" (shared by the admin's server pages and its upload components). */
export const formatBytes = (n: number | null | undefined) =>
  n == null ? "" : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(n < 10 * 1048576 ? 1 : 0)} MB`;
