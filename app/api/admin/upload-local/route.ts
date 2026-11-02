import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { MAX_IMAGE_BYTES, saveLocalImage, sniffImage, uploadMode } from "@/lib/admin/images";
import type { MediaKind } from "@/lib/media";

// Saves a blog/portfolio image to public/uploads/<kind>/ when Vercel Blob isn't configured (admin only).
// The file type is checked from its bytes, and the server picks the filename.
export async function POST(request: Request) {
  if (uploadMode() !== "local") return NextResponse.json({ error: "Local uploads are not available here." }, { status: 503 });
  if (!(await getAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const fd = await request.formData().catch(() => null);
  const kind = String(fd?.get("kind") ?? "") as MediaKind;
  const file = fd?.get("file");
  if (kind !== "blog" && kind !== "portfolio") return NextResponse.json({ error: "Unknown image type." }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Image too large. Max 5 MB." }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffImage(buf);
  if (!ext) return NextResponse.json({ error: "Only JPG, PNG, WebP or GIF images." }, { status: 415 });

  try {
    const name = await saveLocalImage(kind, buf, ext);
    return NextResponse.json({ name, url: `/uploads/${kind}/${name}` });
  } catch (err) {
    console.error("[upload-local]", err);
    return NextResponse.json({ error: "Couldn't save the image on the server." }, { status: 500 });
  }
}
