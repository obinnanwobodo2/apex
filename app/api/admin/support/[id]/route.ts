import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import { readJsonObject, sanitizeText } from "@/lib/validation";

const ALLOWED_TICKET_STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ticketId = sanitizeText(params.id, { maxLength: 64 });
  if (!ticketId) return NextResponse.json({ error: "Invalid ticket id" }, { status: 400 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const rawStatus = sanitizeText(body.status, { maxLength: 32 });
  const status = rawStatus && ALLOWED_TICKET_STATUSES.has(rawStatus) ? rawStatus : undefined;
  if (rawStatus && !status) {
    return NextResponse.json({ error: "Invalid ticket status" }, { status: 400 });
  }
  const response = "response" in body
    ? sanitizeText(body.response, { maxLength: 4000, allowNewLines: true })
    : undefined;

  const existing = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const resolvedStatuses = new Set(["resolved", "closed"]);
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      ...(status && { status }),
      ...(response !== undefined && { response: response || null }),
      ...(status && { resolvedAt: resolvedStatuses.has(status) ? new Date() : null }),
    },
    include: {
      profile: {
        select: {
          fullName: true,
          companyName: true,
          phone: true,
        },
      },
    },
  });

  return NextResponse.json({
    ...ticket,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  });
}
