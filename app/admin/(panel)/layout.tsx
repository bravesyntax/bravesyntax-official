import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin/auth";
import { sql } from "@/lib/db";
import { SITE_NAME } from "@/lib/config";
import "../admin.css";

export const metadata: Metadata = {
  title: { template: `%s | Admin - ${SITE_NAME}`, default: `Admin - ${SITE_NAME}` },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [{ n: unread }] = (await sql`SELECT COUNT(*)::int AS n FROM contact_messages WHERE is_read = 0`) as { n: number }[];

  return (
    <div className="admin-shell bg-zinc-950 text-white antialiased">
      <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
        <AdminSidebar unread={unread} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
