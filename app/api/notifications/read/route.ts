import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import { readJsonObject, sanitizeText } from "@/lib/validation";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAdminAccess();
  const body = await readJsonObject(req);
  const requestedClientId = sanitizeText(body?.clientId, { maxLength: 128 });
  const clientId = access.isAdmin && requestedClientId ? requestedClientId : userId;

  const result = await prisma.notification.updateMany({
    where: { clientId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ success: true, count: result.count });
}
