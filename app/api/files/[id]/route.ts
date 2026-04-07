import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin";
import { findAnyFileWithContent, findUserFileWithContent } from "@/lib/file-storage";
import { sanitizeText } from "@/lib/validation";

export const runtime = "nodejs";

async function findFileForRequest(userId: string, isAdmin: boolean, id: string) {
  if (isAdmin) return findAnyFileWithContent(id);
  return findUserFileWithContent(userId, id);
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fileId = sanitizeText(params.id, { maxLength: 100 });
  if (!fileId) return NextResponse.json({ error: "File id is required" }, { status: 400 });

  const file = await findFileForRequest(access.userId, access.isAdmin, fileId);
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const body = Uint8Array.from(file.content);
  const encodedName = encodeURIComponent(file.originalName);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=60",
    },
  });
}
