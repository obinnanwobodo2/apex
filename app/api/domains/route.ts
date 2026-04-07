import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import { sanitizeText } from "@/lib/validation";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAdminAccess();
  const { searchParams } = new URL(req.url);
  const requestedClientId = sanitizeText(searchParams.get("clientId"), { maxLength: 128 });
  const clientId = access.isAdmin && requestedClientId ? requestedClientId : userId;

  const domains = await prisma.domain.findMany({
    where: { clientId },
    orderBy: { registeredAt: "desc" },
  });

  return NextResponse.json(
    domains.map((domain) => ({
      ...domain,
      registeredAt: domain.registeredAt.toISOString(),
      expiresAt: domain.expiresAt.toISOString(),
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }))
  );
}
