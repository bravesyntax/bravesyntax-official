import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";

// Issues upload tokens for blog/portfolio images (admin only). The browser uploads straight to Vercel Blob,
// so large images don't hit the 4.5 MB function body limit. Middleware already rejects signed-out requests.
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // same limit as the PHP admin

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image uploads are not configured (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }
  if (!(await getAdmin()))
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (
          !/^(blog|portfolio)\/[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(pathname)
        )
          throw new Error("Invalid image file name.");
        return {
          allowedContentTypes: IMAGE_TYPES,
          maximumSizeInBytes: MAX_BYTES,
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
