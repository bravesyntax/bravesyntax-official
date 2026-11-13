import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";

// Issues upload tokens for the admin's images and videos (media library, blog and portfolio fields; admin only).
// The browser uploads straight to Vercel Blob, so large files don't hit the 4.5 MB function body limit.
// Middleware already rejects signed-out requests.
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
// Images are resized and converted to WebP in the browser first, so they arrive far smaller than this.
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image uploads are not configured (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }
  if (!(await getAdmin()))
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const m = /^(blog|portfolio|media)\/[\w.-]+\.(jpe?g|png|webp|gif|mp4|webm)$/i.exec(pathname);
        if (!m) throw new Error("Invalid file name.");
        const video = /^(mp4|webm)$/i.test(m[2]);
        return {
          allowedContentTypes: video ? VIDEO_TYPES : IMAGE_TYPES,
          maximumSizeInBytes: video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 400 },
    );
  }
}
