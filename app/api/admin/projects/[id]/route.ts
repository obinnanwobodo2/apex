import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import {
  readJsonObject,
  sanitizeHttpUrl,
  sanitizeInt,
  sanitizeText,
} from "@/lib/validation";

const ALLOWED_PROJECT_STATUSES = new Set(["requested", "scoping", "in_progress", "review", "completed"]);

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const projectId = sanitizeText(params.id, { maxLength: 64 });
  if (!projectId) return NextResponse.json({ error: "Invalid project id" }, { status: 400 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const rawStatus = sanitizeText(body.status, { maxLength: 32 });
  const status = rawStatus && ALLOWED_PROJECT_STATUSES.has(rawStatus) ? rawStatus : undefined;
  if (rawStatus && !status) {
    return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
  }

  const progress = "progress" in body ? sanitizeInt(body.progress, { min: 0, max: 100, fallback: 0 }) : undefined;
  const notes = "notes" in body ? sanitizeText(body.notes, { maxLength: 3000, allowNewLines: true }) : undefined;
  let websiteUrl: string | null | undefined;
  if ("websiteUrl" in body) {
    const rawWebsiteUrl = sanitizeText(body.websiteUrl, { maxLength: 2048 });
    if (!rawWebsiteUrl) {
      websiteUrl = null;
    } else {
      const parsedWebsiteUrl = sanitizeHttpUrl(rawWebsiteUrl, 2048);
      if (!parsedWebsiteUrl) {
        return NextResponse.json({ error: "Invalid website URL" }, { status: 400 });
      }
      websiteUrl = parsedWebsiteUrl;
    }
  }

  const target = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      subscription: {
        select: {
          paid: true,
        },
      },
    },
  });

  if (!target) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!target.subscription?.paid) {
    return NextResponse.json(
      { error: "Cannot update project before payment is processed." },
      { status: 409 }
    );
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(status && { status }),
      ...(progress !== undefined && { progress }),
      ...(notes !== undefined && { notes }),
      ...(websiteUrl !== undefined && { websiteUrl }),
    },
    include: {
      profile: { select: { fullName: true } },
      subscription: { select: { id: true, package: true, status: true, paid: true } },
    },
  });

  return NextResponse.json({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
}
