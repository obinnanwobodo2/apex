import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  readJsonObject,
  sanitizeEmail,
  sanitizeEnum,
  sanitizePhone,
  sanitizeText,
} from "@/lib/validation";

const CONTACT_STATUSES = ["lead", "prospect", "customer", "churned"] as const;

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = sanitizeText(searchParams.get("q"), { maxLength: 120 }) ?? "";
  const status = sanitizeText(searchParams.get("status"), { maxLength: 20 }) ?? "";
  const normalizedStatus = status && CONTACT_STATUSES.includes(status as (typeof CONTACT_STATUSES)[number])
    ? status
    : "";

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
      ...(normalizedStatus && { status: normalizedStatus }),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const firstName = sanitizeText(body.firstName, { maxLength: 80 });
  if (!firstName) return NextResponse.json({ error: "First name required" }, { status: 400 });

  const lastName = sanitizeText(body.lastName, { maxLength: 80 });
  const email = sanitizeEmail(body.email);
  const phone = sanitizePhone(body.phone);
  const company = sanitizeText(body.company, { maxLength: 140 });
  const status = sanitizeEnum(body.status, CONTACT_STATUSES, "lead");
  const tags = sanitizeText(body.tags, { maxLength: 500 });
  const notes = sanitizeText(body.notes, { maxLength: 3000, allowNewLines: true });

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const contact = await prisma.contact.create({
    data: { userId, firstName, lastName, email, phone, company, status: status ?? "lead", tags, notes },
  });

  return NextResponse.json(contact, { status: 201 });
}
