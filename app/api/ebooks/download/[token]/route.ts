import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { rows, sql } from "@/lib/db";
import { EBOOK_MAX_DOWNLOADS, getEbook } from "@/lib/ebooks";
import { resumeBlobToken } from "@/lib/resumes";

// Streams a paid ebook from the private Blob store. The token is the only key: it is created when the order is
// marked paid and is used at most EBOOK_MAX_DOWNLOADS times.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return new NextResponse("Link sahi nahi hai.", { status: 404 });

  const [order] = await rows<{ ebook_slug: string }>(sql`
    UPDATE ebook_orders SET download_count = download_count + 1
    WHERE download_token = ${token} AND status = 'paid' AND download_count < ${EBOOK_MAX_DOWNLOADS}
    RETURNING ebook_slug
  `);
  if (!order) {
    return new NextResponse(
      "Ye link kaam nahi kar raha ya iski download limit poori ho gayi hai. support@bravesyntax.com par Order ID ke saath email karein.",
      { status: 410, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const ebook = getEbook(order.ebook_slug);
  const file = ebook ? process.env[ebook.fileEnv] : undefined;
  const blob =
    file && /^https:\/\/[a-z0-9-]+\.private\.blob\.vercel-storage\.com\//i.test(file)
      ? await get(file, { access: "private", token: resumeBlobToken() }).catch(() => null)
      : null;
  if (!ebook || !blob || blob.statusCode !== 200) {
    console.error("[ebook download] file missing for", order.ebook_slug);
    await sql`UPDATE ebook_orders SET download_count = download_count - 1 WHERE download_token = ${token}`;
    return new NextResponse("File abhi available nahi hai. Thodi der baad try karein ya support@bravesyntax.com par email karein.", {
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
