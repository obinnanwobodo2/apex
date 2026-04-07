import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import { readJsonObject, sanitizeText } from "@/lib/validation";
import { triggerClientEvent } from "@/lib/realtime";

type DomainAction = "register_and_issue" | "suggest_alternatives" | "mark_unavailable" | "checked";

const ACTIONS = new Set<DomainAction>([
  "register_and_issue",
  "suggest_alternatives",
  "mark_unavailable",
  "checked",
]);

function toIso(date: Date) {
  return date.toISOString();
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = sanitizeText(params.id, { maxLength: 128 });
  if (!id) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const action = sanitizeText(body.action, { maxLength: 60 }) as DomainAction | null;
  const checkedNote = sanitizeText(body.checkedNote, { maxLength: 2000, allowNewLines: true });
  if (!action || !ACTIONS.has(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const request = await prisma.domainRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  let status = request.status;
  let paymentStatus = request.paymentStatus;
  let notificationMessage = "";

  if (action === "checked") {
    status = "checked";
    notificationMessage = `Domain request ${request.domainName}${request.extension} was reviewed.`;
  } else if (action === "register_and_issue") {
    status = "issued";
    paymentStatus = request.paymentStatus === "unpaid" ? "paid" : request.paymentStatus;
    notificationMessage = `Your domain ${request.domainName}${request.extension} has been issued and added to your active domains.`;
  } else if (action === "suggest_alternatives") {
    status = "unavailable";
    notificationMessage = `Requested domain ${request.domainName}${request.extension} is unavailable. Please submit an alternative.`;
  } else if (action === "mark_unavailable") {
    status = "unavailable";
    notificationMessage = `Requested domain ${request.domainName}${request.extension} was marked unavailable.`;
  }

  const updated = await prisma.domainRequest.update({
    where: { id },
    data: {
      status,
      paymentStatus,
      checkedNote: checkedNote ?? request.checkedNote,
    },
  });

  if (action === "register_and_issue") {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const fqdn = `${request.domainName}${request.extension}`.toLowerCase();
    await prisma.domain.upsert({
      where: { id: `${request.clientId}:${fqdn}` },
      update: {
        domainName: fqdn,
        registeredAt: now,
        expiresAt,
        status: "active",
      },
      create: {
        id: `${request.clientId}:${fqdn}`,
        clientId: request.clientId,
        domainName: fqdn,
        registeredAt: now,
        expiresAt,
        status: "active",
      },
    });
  }

  const notification = await prisma.notification.create({
    data: {
      clientId: request.clientId,
      type: action === "register_and_issue" ? "domain_issued" : "domain_update",
      message: checkedNote ? `${notificationMessage} ${checkedNote}` : notificationMessage,
      read: false,
    },
  });

  await triggerClientEvent(request.clientId, "new-notification", {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    read: notification.read,
    createdAt: toIso(notification.createdAt),
  });

  return NextResponse.json({
    ...updated,
    createdAt: toIso(updated.createdAt),
    updatedAt: toIso(updated.updatedAt),
  });
}
