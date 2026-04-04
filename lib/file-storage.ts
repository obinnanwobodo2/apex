import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export interface StoredClientFile {
  id: string;
  userId: string;
  originalName: string;
  storedName: string;
  size: number;
  type: string;
  category: "image" | "document" | "brand" | "other";
  uploadedAt: string;
}

const ROOT = path.join(process.cwd(), "storage", "client-files");

function normalizeUserIdSegment(userId: string) {
  const normalized = userId.trim().replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  if (!normalized) throw new Error("Invalid user id");
  return normalized;
}

function userRoot(userId: string) {
  return path.join(ROOT, normalizeUserIdSegment(userId));
}

function userFilesDir(userId: string) {
  return path.join(userRoot(userId), "files");
}

function userIndexPath(userId: string) {
  return path.join(userRoot(userId), "index.json");
}

async function ensureUserDirs(userId: string) {
  await fs.mkdir(userFilesDir(userId), { recursive: true });
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

export async function readUserFiles(userId: string): Promise<StoredClientFile[]> {
  try {
    const raw = await fs.readFile(userIndexPath(userId), "utf8");
    const parsed = JSON.parse(raw) as StoredClientFile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeUserFiles(userId: string, files: StoredClientFile[]) {
  await ensureUserDirs(userId);
  await fs.writeFile(userIndexPath(userId), JSON.stringify(files, null, 2), "utf8");
}

export async function saveUserFile(userId: string, file: File): Promise<StoredClientFile> {
  await ensureUserDirs(userId);
  const ext = path.extname(file.name || "") || "";
  const storedName = `${Date.now()}-${randomUUID()}${ext}`;
  const filePath = path.join(userFilesDir(userId), storedName);

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  const record: StoredClientFile = {
    id: randomUUID(),
    userId,
    originalName: (file.name || "upload").trim() || "upload",
    storedName,
    size: file.size,
    type: file.type || "application/octet-stream",
    category: detectCategory(file.name || "", file.type || ""),
    uploadedAt: new Date().toISOString(),
  };

  const current = await readUserFiles(userId);
  await writeUserFiles(userId, [record, ...current]);
  return record;
}

export async function deleteUserFile(userId: string, id: string): Promise<boolean> {
  const current = await readUserFiles(userId);
  const target = current.find((f) => f.id === id);
  if (!target) return false;

  const filePath = path.join(userFilesDir(userId), target.storedName);
  try {
    await fs.unlink(filePath);
  } catch {
    // If missing on disk, still remove from index.
  }

  await writeUserFiles(
    userId,
    current.filter((f) => f.id !== id)
  );
  return true;
}

export async function findUserFile(userId: string, id: string): Promise<StoredClientFile | null> {
  const files = await readUserFiles(userId);
  return files.find((f) => f.id === id) ?? null;
}

export async function listAllStoredFiles(): Promise<StoredClientFile[]> {
  try {
    await fs.mkdir(ROOT, { recursive: true });
    const dirs = await fs.readdir(ROOT, { withFileTypes: true });
    const all = await Promise.all(
      dirs
        .filter((d) => d.isDirectory())
        .map((d) => readUserFiles(d.name))
    );
    return all.flat().sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
  } catch {
    return [];
  }
}

export function absoluteStoredPath(file: StoredClientFile) {
  return path.join(userFilesDir(file.userId), file.storedName);
}
