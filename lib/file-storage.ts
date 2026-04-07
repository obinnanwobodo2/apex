import { prisma } from "@/lib/prisma";

export interface StoredClientFile {
  id: string;
  userId: string;
  originalName: string;
  size: number;
  type: string;
  category: "image" | "document" | "brand" | "other";
  uploadedAt: string;
}

export interface StoredClientFileWithContent extends StoredClientFile {
  content: Buffer;
}

function detectCategory(fileName: string, fileType: string): StoredClientFile["category"] {
  const n = fileName.toLowerCase();
  if (n.includes("logo") || n.includes("brand")) return "brand";
  if (fileType.startsWith("image/")) return "image";
  if (
    fileType.includes("pdf") ||
    fileType.includes("word") ||
    fileType.includes("text") ||
    n.endsWith(".pdf") ||
    n.endsWith(".doc") ||
    n.endsWith(".docx") ||
    n.endsWith(".txt")
  ) {
    return "document";
  }
  return "other";
}

function toStoredFile(record: {
  id: string;
  userId: string;
  originalName: string;
  type: string;
  size: number;
  category: string;
  uploadedAt: Date;
}): StoredClientFile {
  return {
    id: record.id,
    userId: record.userId,
    originalName: record.originalName,
    type: record.type,
    size: record.size,
    category: (record.category as StoredClientFile["category"]) || "other",
    uploadedAt: record.uploadedAt.toISOString(),
  };
}

export async function readUserFiles(userId: string): Promise<StoredClientFile[]> {
  const rows = await prisma.clientFile.findMany({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      userId: true,
      originalName: true,
      type: true,
      size: true,
      category: true,
      uploadedAt: true,
    },
  });

  if (rows.length > 0) return rows.map(toStoredFile);

  const fileRecords = await prisma.fileRecord.findMany({
    where: { clientId: userId },
    orderBy: { uploadedAt: "desc" },
  });

  return fileRecords.map((record) => ({
    id: record.id,
    userId,
    originalName: record.fileName,
    type: "application/octet-stream",
    size: 0,
    category: (record.category as StoredClientFile["category"]) || "other",
    uploadedAt: record.uploadedAt.toISOString(),
  }));
}

export async function saveUserFile(userId: string, file: File): Promise<StoredClientFile> {
  await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });

  const arrayBuffer = await file.arrayBuffer();
  const record = await prisma.clientFile.create({
    data: {
      userId,
      originalName: (file.name || "upload").trim() || "upload",
      type: file.type || "application/octet-stream",
      size: file.size,
      category: detectCategory(file.name || "", file.type || ""),
      content: Buffer.from(arrayBuffer),
    },
    select: {
      id: true,
      userId: true,
      originalName: true,
      type: true,
      size: true,
      category: true,
      uploadedAt: true,
    },
  });

  await prisma.fileRecord.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      clientId: userId,
      fileName: record.originalName,
      fileUrl: `/api/files/${record.id}`,
      category: record.category,
      uploadedAt: record.uploadedAt,
    },
    update: {
      fileName: record.originalName,
      fileUrl: `/api/files/${record.id}`,
      category: record.category,
      uploadedAt: record.uploadedAt,
    },
  });

  return toStoredFile(record);
}

export async function deleteUserFile(userId: string, id: string): Promise<boolean> {
  const [fileResult, metaResult] = await Promise.all([
    prisma.clientFile.deleteMany({
      where: { id, userId },
    }),
    prisma.fileRecord.deleteMany({
      where: { id, clientId: userId },
    }),
  ]);
  return fileResult.count > 0 || metaResult.count > 0;
}

export async function findUserFile(userId: string, id: string): Promise<StoredClientFile | null> {
  const row = await prisma.clientFile.findFirst({
    where: { id, userId },
    select: {
      id: true,
      userId: true,
      originalName: true,
      type: true,
      size: true,
      category: true,
      uploadedAt: true,
    },
  });
  return row ? toStoredFile(row) : null;
}

export async function findUserFileWithContent(userId: string, id: string): Promise<StoredClientFileWithContent | null> {
  const row = await prisma.clientFile.findFirst({
    where: { id, userId },
    select: {
      id: true,
      userId: true,
      originalName: true,
      type: true,
      size: true,
      category: true,
      content: true,
      uploadedAt: true,
    },
  });
  if (!row) return null;

  return {
    ...toStoredFile(row),
    content: Buffer.from(row.content),
  };
}

export async function findAnyFileWithContent(id: string): Promise<StoredClientFileWithContent | null> {
  const row = await prisma.clientFile.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      originalName: true,
      type: true,
      size: true,
      category: true,
      content: true,
      uploadedAt: true,
    },
  });
  if (!row) return null;

  return {
    ...toStoredFile(row),
    content: Buffer.from(row.content),
  };
}

export async function listAllStoredFiles(): Promise<StoredClientFile[]> {
  const rows = await prisma.clientFile.findMany({
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      userId: true,
      originalName: true,
      type: true,
      size: true,
      category: true,
      uploadedAt: true,
    },
  });
  return rows.map(toStoredFile);
}
