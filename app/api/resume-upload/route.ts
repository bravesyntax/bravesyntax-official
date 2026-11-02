import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { RESUME_CONTENT_TYPES, RESUME_MAX_BYTES, RESUME_PREFIX, resumeBlobToken, resumeUploadsEnabled } from "@/lib/resumes";
import { getClientIp } from "@/lib/validation";

// Issues short-lived client tokens so the careers form can upload a resume directly to private Blob storage.
export async function POST(request: Request) {
  if (!resumeUploadsEnabled()) {
    return NextResponse.json({ error: "Resume uploads are not configured." }, { status: 503 });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      token: resumeBlobToken(),
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(RESUME_PREFIX) || !/\.(pdf|docx?)$/i.test(pathname)) {
          throw new Error("Invalid resume file name.");
        }
        // Same limit as applications: an IP that can't apply right now can't upload either.
        const ip = await getClientIp();
        if (ip) {
          const [{ n }] = (await sql`
            SELECT COUNT(*)::int AS n FROM career_applications
            WHERE ip_address = ${ip} AND created_at > LOCALTIMESTAMP - INTERVAL '1 hour'
          `) as { n: number }[];
          if (n >= 3) throw new Error("Too many applications from this IP. Please try again later.");
        }
        return {
          allowedContentTypes: RESUME_CONTENT_TYPES,
          maximumSizeInBytes: RESUME_MAX_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
      // The application row is written by the form's server action, so nothing to do here.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 400 });
  }
}
