import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";

export async function GET() {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.domainRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const uniqueClientIds = Array.from(new Set(items.map((item) => item.clientId)));
  const profiles = uniqueClientIds.length > 0
    ? await prisma.profile.findMany({
        where: { id: { in: uniqueClientIds } },
        select: { id: true, fullName: true, companyName: true },
      })
    : [];

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      clientName: profileById.get(item.clientId)?.fullName
        ?? profileById.get(item.clientId)?.companyName
        ?? item.clientId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))
  );
}
