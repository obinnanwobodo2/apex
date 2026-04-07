import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import { readJsonObject, sanitizeInt, sanitizeText } from "@/lib/validation";
import { triggerClientEvent } from "@/lib/realtime";

const STAGE_LABELS: Record<number, string> = {
  1: "Request submitted",
  2: "Scope approved",
  3: "Development",
  4: "Testing",
  5: "Deployment",
};

const STATUS_BY_STAGE: Record<number, string> = {
  1: "requested",
  2: "scoping",
  3: "in_progress",
  4: "review",
  5: "completed",
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = sanitizeText(params.id, { maxLength: 128 });
  if (!id) return NextResponse.json({ error: "Invalid project id" }, { status: 400 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const stage = sanitizeInt(body.stage, { min: 1, max: 5, fallback: 1 });
  const label = STAGE_LABELS[stage] ?? "Updated";

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      stage: true,
      progress: true,
      status: true,
    },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      stage,
      status: STATUS_BY_STAGE[stage] ?? project.status,
      progress: Math.min(100, stage * 20),
    },
  });

  const systemContent = `Your project has moved to ${label}. We'll keep you updated.`;
  const systemMessage = await prisma.message.create({
    data: {
      clientId: project.userId,
      senderRole: "system",
      senderName: "Apex Visual",
      content: systemContent,
    },
  });

  await prisma.projectMessage.create({
    data: {
      projectId: project.id,
      userId: access.userId,
      senderRole: "admin",
      body: systemContent,
    },
  });

  const notification = await prisma.notification.create({
    data: {
      clientId: project.userId,
      type: "project_update",
      message: `Your website project has moved to ${label}.`,
      read: false,
    },
  });

  await triggerClientEvent(project.userId, "new-message", {
    projectId: project.id,
    message: {
      id: systemMessage.id,
      senderRole: systemMessage.senderRole,
      senderName: systemMessage.senderName,
      content: systemMessage.content,
      createdAt: systemMessage.createdAt.toISOString(),
    },
  });

  await triggerClientEvent(project.userId, "new-notification", {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  });

  return NextResponse.json({
    id: updatedProject.id,
    stage: updatedProject.stage,
    status: updatedProject.status,
    progress: updatedProject.progress,
    updatedAt: updatedProject.updatedAt.toISOString(),
  });
}
