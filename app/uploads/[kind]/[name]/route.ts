import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/admin/images";

// Files in public/uploads that existed at build/start are served by Next as static files and never reach
// this route. Images uploaded in the admin afterwards (local mode) are served from disk here.
const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string; name: string }> }) {
  const { kind, name } = await params;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if ((kind !== "blog" && kind !== "portfolio") || !/^[\w-]+\.[a-z]{3,4}$/i.test(name) || !TYPES[ext]) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const file = await readFile(path.join(UPLOAD_DIR, kind, name));
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": TYPES[ext], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
