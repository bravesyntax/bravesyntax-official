import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { rows, sql } from "@/lib/db";
import { resumeBlobToken } from "@/lib/resumes";

// Streams an applicant's resume from private Blob storage to a signed-in admin. Looked up by application id,
// so only files attached to an application can be fetched.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdmin()))
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const id = Number.parseInt((await params).id, 10) || 0;
  const [app] = await rows<{ name: string; resume_file: string | null }>(
    sql`SELECT name, resume_file FROM career_applications WHERE id = ${id}`,
  );
  const file = app?.resume_file;
  if (
    !file ||
    !/^https:\/\/[a-z0-9-]+\.private\.blob\.vercel-storage\.com\//i.test(file)
  ) {
    return new NextResponse("Resume not found.", { status: 404 });
  }

  const blob = await get(file, { access: "private", token: resumeBlobToken() }).catch(() => null);
  if (!blob || blob.statusCode !== 200)
    return new NextResponse("Resume not found.", { status: 404 });

  const ext = blob.blob.pathname.split(".").pop() ?? "pdf";
  const filename = `${app.name.replace(/[^\w-]+/g, "_").slice(0, 60) || "resume"}_resume.${ext}`;
  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
