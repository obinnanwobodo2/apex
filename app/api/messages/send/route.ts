import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import { readJsonObject, sanitizeText } from "@/lib/validation";
import { triggerClientEvent } from "@/lib/realtime";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAdminAccess();
  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const requestedClientId = sanitizeText(body.clientId, { maxLength: 128 });
  const content = sanitizeText(body.content, { maxLength: 5000, allowNewLines: true });
  const senderRole = sanitizeText(body.senderRole, { maxLength: 32 }) ?? (access.isAdmin ? "admin" : "client");
  const senderNameInput = sanitizeText(body.senderName, { maxLength: 120 });

  if (!content) return NextResponse.json({ error: "Message content is required." }, { status: 400 });
  if (!requestedClientId) return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  if (!access.isAdmin && requestedClientId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await currentUser();
  const senderName = senderNameInput
    || (access.isAdmin ? "Apex Visual" : user?.firstName || user?.fullName || "Client");

  const message = await prisma.message.create({
    data: {
      clientId: requestedClientId,
      senderRole,
      senderName,
      content,
    },
  });

  if (access.isAdmin) {
    const notification = await prisma.notification.create({
      data: {
        clientId: requestedClientId,
        type: "message",
        message: `New message from Apex Visual: ${content.slice(0, 100)}${content.length > 100 ? "..." : ""}`,
        read: false,
      },
    });

    await triggerClientEvent(requestedClientId, "new-notification", {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    });
  }

  await triggerClientEvent(requestedClientId, "new-message", {
    message: {
      id: message.id,
      senderRole: message.senderRole,
      senderName: message.senderName,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    },
  });

  return NextResponse.json({
    id: message.id,
    clientId: message.clientId,
    senderRole: message.senderRole,
    senderName: message.senderName,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  });
}
