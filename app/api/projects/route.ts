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

  const projects = await prisma.project.findMany({
    where: { userId: clientId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    projects.map((project) => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      deadline: project.deadline?.toISOString() ?? null,
    }))
  );
}
