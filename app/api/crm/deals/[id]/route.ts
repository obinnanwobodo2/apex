import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.deal.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const deal = await prisma.deal.update({
    where: { id: params.id },
    data: {
      title: body.title ?? existing.title,
      contactId: body.contactId !== undefined ? body.contactId : existing.contactId,
      value: body.value ?? existing.value,
      stage: body.stage ?? existing.stage,
      probability: body.probability ?? existing.probability,
      closeDate: body.closeDate ? new Date(body.closeDate) : existing.closeDate,
      notes: body.notes ?? existing.notes,
    },
    include: { contact: { select: { firstName: true, lastName: true, company: true } } },
  });

  return NextResponse.json(deal);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.deal.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.deal.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
