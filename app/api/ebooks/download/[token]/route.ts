import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { rows, sql } from "@/lib/db";
import { EBOOK_MAX_DOWNLOADS, getEbook } from "@/lib/ebooks";
import { resumeBlobToken } from "@/lib/resumes";

// Credentials for the private store: its read-write token when one is set (RESUME_BLOB connection), otherwise
// the deployment's OIDC token with the store's id (EBOOK_BLOB_STORE_ID). The id is needed because the project
// is connected to two stores (the public media one and the private one).
function blobAuth(): { token: string } | { storeId: string } | Record<string, never> {
  const token = resumeBlobToken();
  if (token) return { token };
  const storeId = process.env.EBOOK_BLOB_STORE_ID;
  return storeId ? { storeId } : {};
}

// Streams a paid ebook from the private Blob store. The token is the only key: it is created when the order is
// marked paid and is used at most EBOOK_MAX_DOWNLOADS times.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return new NextResponse("This link is not valid.", { status: 404 });

  const [order] = await rows<{ ebook_slug: string }>(sql`
    UPDATE ebook_orders SET download_count = download_count + 1
    WHERE download_token = ${token} AND status = 'paid' AND download_count < ${EBOOK_MAX_DOWNLOADS}
    RETURNING ebook_slug
  `);
  if (!order) {
    return new NextResponse(
      "This link has expired or reached its download limit. Email support@bravesyntax.com with your Order ID.",
      { status: 410, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const ebook = getEbook(order.ebook_slug);
  const file = ebook ? process.env[ebook.fileEnv] : undefined;
  const blob =
    file && /^https:\/\/[a-z0-9-]+\.private\.blob\.vercel-storage\.com\//i.test(file)
      ? await get(file, { access: "private", ...blobAuth() }).catch((err) => (console.error("[ebook download] blob get", err), null))
      : null;
  if (!ebook || !blob || blob.statusCode !== 200) {
    console.error("[ebook download] file missing for", order.ebook_slug);
    await sql`UPDATE ebook_orders SET download_count = download_count - 1 WHERE download_token = ${token}`;
    return new NextResponse("The file isn't available right now. Try again shortly or email support@bravesyntax.com.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ebook.fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
