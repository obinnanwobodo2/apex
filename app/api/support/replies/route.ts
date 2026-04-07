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
  if (!access.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const ticketId = sanitizeText(body.ticketId, { maxLength: 128 });
  const message = sanitizeText(body.message, { maxLength: 4000, allowNewLines: true });
  if (!ticketId || !message) {
    return NextResponse.json({ error: "ticketId and message are required." }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true, subject: true },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

  const admin = await currentUser();
  const senderName = admin?.firstName || admin?.fullName || "Apex Visual";

  const reply = await prisma.supportReply.create({
    data: {
      ticketId: ticket.id,
      senderRole: "admin",
      senderName,
      message,
    },
  });

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status: "in_progress",
      response: message,
    },
  });

  const notification = await prisma.notification.create({
    data: {
      clientId: ticket.userId,
      type: "support_reply",
      message: `New support reply: ${ticket.subject}`,
      read: false,
    },
  });

  const serializedReply = {
    ...reply,
    createdAt: reply.createdAt.toISOString(),
  };

  await triggerClientEvent(ticket.userId, "new-reply", {
    ticketId: ticket.id,
    reply: serializedReply,
  });
  await triggerClientEvent(ticket.userId, "new-notification", {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  });

  return NextResponse.json(serializedReply);
}
