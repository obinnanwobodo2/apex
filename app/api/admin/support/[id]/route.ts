import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const status = typeof body.status === "string" ? body.status : undefined;
  const response = typeof body.response === "string" ? body.response.trim() : undefined;

  const resolvedStatuses = new Set(["resolved", "closed"]);
  const ticket = await prisma.supportTicket.update({
    where: { id: params.id },
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

