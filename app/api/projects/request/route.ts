import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await prisma.project.findMany({
    where: { userId, type: "request" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    requests.map((r) => ({
      ...r,
      deadline: r.deadline?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, services, budget, deadline, notes, packageId } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const request = await prisma.project.create({
    data: {
      userId,
      title: title.trim(),
      type: "request",
      status: "requested",
      description: description?.trim() ?? null,
      services: services ? JSON.stringify(services) : null,
      budget: budget ?? null,
      deadline: deadline ? new Date(deadline) : null,
      notes: [notes?.trim(), packageId ? `Requested package: ${packageId}` : ""].filter(Boolean).join(" | ") || null,
    },
  });

  return NextResponse.json({
    ...request,
    deadline: request.deadline?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  });
}
