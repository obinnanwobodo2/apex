import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { deleteUserFile, readUserFiles, saveUserFile, type StoredClientFile } from "@/lib/file-storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".gif",
  ".pdf",
  ".txt",
  ".doc",
  ".docx",
  ".rtf",
  ".zip",
]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "application/zip",
  "application/x-zip-compressed",
  "image/svg+xml",
]);

interface RejectedFile {
  name: string;
  reason: string;
}

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function extensionOf(name: string) {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx).toLowerCase();
}

function validateFile(file: File): string | null {
  const fileName = (file.name || "").trim();
  if (!fileName) return "Missing file name";
  if (file.size <= 0) return "File is empty";
  if (file.size > MAX_FILE_SIZE) return "Exceeds 50MB size limit";

  const type = (file.type || "").toLowerCase();
  const ext = extensionOf(fileName);
  const mimeAllowed = type.startsWith("image/") || ALLOWED_MIME_TYPES.has(type);
  const extensionAllowed = ALLOWED_EXTENSIONS.has(ext);

  if (!mimeAllowed && !extensionAllowed) {
    return "Unsupported format";
  }
  return null;
}

function buildUploadTicketMessage(files: StoredClientFile[]) {
  const lines = files.map((file) => {
    return `- ${file.originalName} (${formatBytes(file.size)}, ${file.category})`;
  });
  return `Client uploaded new files in Dashboard > Files:\n${lines.join("\n")}`;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const files = await readUserFiles(userId);
  return NextResponse.json(files);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const rawFiles = formData.getAll("files");
  if (rawFiles.length === 0) {
    const single = formData.get("file");
    if (single) rawFiles.push(single);
  }

  const files = rawFiles.filter((item): item is File => item instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files attached" }, { status: 400 });
  }

  const uploaded: StoredClientFile[] = [];
  const rejected: RejectedFile[] = [];

  for (const file of files) {
    const reason = validateFile(file);
    if (reason) {
      rejected.push({ name: file.name || "unnamed", reason });
      continue;
    }
    const stored = await saveUserFile(userId, file);
    uploaded.push(stored);
  }

  if (uploaded.length > 0) {
    try {
      await prisma.profile.upsert({
        where: { id: userId },
        create: { id: userId },
        update: {},
      });

      await prisma.supportTicket.create({
        data: {
          userId,
          subject: uploaded.length === 1
            ? `New file upload: ${uploaded[0].originalName}`
            : `${uploaded.length} new files uploaded`,
          message: buildUploadTicketMessage(uploaded),
          priority: "normal",
          status: "open",
        },
      });
    } catch {
      // Uploads stay successful even if admin notification creation fails.
    }
  }

  if (uploaded.length === 0) {
    return NextResponse.json(
      { error: "No files were uploaded", uploaded, rejected },
      { status: 400 }
    );
  }

  return NextResponse.json({ uploaded, rejected });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  let id = (url.searchParams.get("id") || "").trim();

  if (!id) {
    try {
      const body = await req.json();
      id = typeof body.id === "string" ? body.id.trim() : "";
    } catch {
      // Ignore body parse errors and keep fallback to empty id.
    }
  }

  if (!id) {
    return NextResponse.json({ error: "File id is required" }, { status: 400 });
  }

  const removed = await deleteUserFile(userId, id);
  if (!removed) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
