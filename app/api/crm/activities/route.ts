import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId") ?? "";

  const activities = await prisma.activity.findMany({
    where: { userId, ...(contactId && { contactId }) },
    include: { contact: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(activities);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, title, body: activityBody, contactId } = body;

  if (!type || !title) return NextResponse.json({ error: "type and title required" }, { status: 400 });

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const activity = await prisma.activity.create({
    data: { userId, type, title, body: activityBody, contactId: contactId || null },
    include: { contact: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json(activity, { status: 201 });
}
