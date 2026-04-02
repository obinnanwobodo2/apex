import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";

  const contacts = await prisma.contact.findMany({
    where: {
      userId,
      ...(q && {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { email: { contains: q } },
          { company: { contains: q } },
        ],
      }),
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, email, phone, company, status, tags, notes } = body;

  if (!firstName) return NextResponse.json({ error: "First name required" }, { status: 400 });

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const contact = await prisma.contact.create({
    data: { userId, firstName, lastName, email, phone, company, status: status ?? "lead", tags, notes },
  });

  return NextResponse.json(contact, { status: 201 });
}
