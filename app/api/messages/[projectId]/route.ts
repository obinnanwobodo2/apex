import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/validation";
import { getAdminAccess } from "@/lib/admin";
import { triggerClientEvent } from "@/lib/realtime";

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAdminAccess();

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: { id: true, userId: true },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!access.isAdmin && project.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.projectMessage.findMany({
    where: { projectId: params.projectId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    messages.map((m) => ({
      ...m,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAdminAccess();

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: { id: true, userId: true },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!access.isAdmin && project.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const text = sanitizeText(body?.body, { maxLength: 5000, allowNewLines: true });
  if (!text) return NextResponse.json({ error: "Message body required" }, { status: 400 });

  const message = await prisma.projectMessage.create({
    data: {
      projectId: params.projectId,
      userId,
      senderRole: access.isAdmin ? "admin" : "client",
      body: text,
    },
  });

  const clerkUser = await currentUser();
  const senderName = access.isAdmin
    ? "Apex Visual"
    : clerkUser?.firstName || clerkUser?.fullName || "Client";

  await prisma.message.create({
    data: {
      clientId: project.userId,
      senderRole: access.isAdmin ? "admin" : "client",
      senderName,
      content: text,
    },
  });

  if (access.isAdmin) {
    const notification = await prisma.notification.create({
      data: {
        clientId: project.userId,
        type: "message",
        message: `New message from Apex Visual: ${text.slice(0, 100)}${text.length > 100 ? "..." : ""}`,
        read: false,
      },
    });

    await triggerClientEvent(project.userId, "new-notification", {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    });
  }

  const serializedMessage = {
    ...message,
    readAt: null,
    createdAt: message.createdAt.toISOString(),
  };

  await triggerClientEvent(project.userId, "new-message", {
    projectId: params.projectId,
    message: serializedMessage,
  });

  return NextResponse.json(serializedMessage);
}
