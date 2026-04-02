import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deals = await prisma.deal.findMany({
    where: { userId },
    include: { contact: { select: { firstName: true, lastName: true, company: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(deals);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, contactId, value, stage, probability, closeDate, notes } = body;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const deal = await prisma.deal.create({
    data: {
      userId,
      title,
      contactId: contactId || null,
      value: value ?? 0,
      stage: stage ?? "lead",
      probability: probability ?? 0,
      closeDate: closeDate ? new Date(closeDate) : null,
      notes,
    },
    include: { contact: { select: { firstName: true, lastName: true, company: true } } },
  });

  return NextResponse.json(deal, { status: 201 });
}
