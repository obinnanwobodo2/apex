import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin";
import { absoluteStoredPath, findUserFile, listAllStoredFiles } from "@/lib/file-storage";

export const runtime = "nodejs";

async function findFileForRequest(userId: string, isAdmin: boolean, id: string) {
  if (isAdmin) {
    const allFiles = await listAllStoredFiles();
    return allFiles.find((file) => file.id === id) ?? null;
  }
  return findUserFile(userId, id);
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fileId = (params.id || "").trim();
  if (!fileId) return NextResponse.json({ error: "File id is required" }, { status: 400 });

  const file = await findFileForRequest(access.userId, access.isAdmin, fileId);
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  try {
    const body = await fs.readFile(absoluteStoredPath(file));
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
  } catch {
    return NextResponse.json({ error: "Stored file is unavailable" }, { status: 404 });
  }
}
