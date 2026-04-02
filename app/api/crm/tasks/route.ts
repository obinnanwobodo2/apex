import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";

  const tasks = await prisma.task.findMany({
    where: { userId, ...(status && { status }) },
    include: { contact: { select: { firstName: true, lastName: true } } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, contactId, dueDate, priority, status } = body;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const task = await prisma.task.create({
    data: {
      userId,
      title,
      description,
      contactId: contactId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority ?? "medium",
      status: status ?? "todo",
    },
    include: { contact: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json(task, { status: 201 });
}
