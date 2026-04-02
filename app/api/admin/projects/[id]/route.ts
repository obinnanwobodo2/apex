import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { status, progress, notes, websiteUrl } = body;

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(status && { status }),
      ...(progress !== undefined && { progress }),
      ...(notes !== undefined && { notes }),
      ...(websiteUrl !== undefined && { websiteUrl }),
    },
    include: {
      profile: { select: { fullName: true } },
      subscription: { select: { id: true, package: true, status: true, paid: true } },
    },
  });

  return NextResponse.json({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
}
