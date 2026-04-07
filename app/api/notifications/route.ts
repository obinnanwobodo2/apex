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

  const notifications = await prisma.notification.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    notifications.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    }))
  );
}
