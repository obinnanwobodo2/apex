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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contactId = sanitizeText(params.id, { maxLength: 64 });
  if (!contactId) return NextResponse.json({ error: "Invalid contact id" }, { status: 400 });

  const existing = await prisma.contact.findFirst({ where: { id: contactId, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  let email: string | null | undefined;
  if ("email" in body) {
    const rawEmail = sanitizeText(body.email, { maxLength: 254 });
    if (rawEmail) {
      const parsedEmail = sanitizeEmail(rawEmail);
      if (!parsedEmail) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      email = parsedEmail;
    } else {
      email = null;
    }
  }

  let phone: string | null | undefined;
  if ("phone" in body) {
    const rawPhone = sanitizeText(body.phone, { maxLength: 32 });
    if (rawPhone) {
      const parsedPhone = sanitizePhone(rawPhone);
      if (!parsedPhone) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      phone = parsedPhone;
    } else {
      phone = null;
    }
  }

  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: {
      firstName: sanitizeText(body.firstName, { maxLength: 80 }) ?? existing.firstName,
      lastName: "lastName" in body ? sanitizeText(body.lastName, { maxLength: 80 }) : existing.lastName,
      email: email ?? existing.email,
      phone: phone ?? existing.phone,
      company: "company" in body ? sanitizeText(body.company, { maxLength: 140 }) : existing.company,
      status: "status" in body ? sanitizeEnum(body.status, CONTACT_STATUSES, existing.status as (typeof CONTACT_STATUSES)[number]) : existing.status,
      tags: "tags" in body ? sanitizeText(body.tags, { maxLength: 500 }) : existing.tags,
      notes: "notes" in body ? sanitizeText(body.notes, { maxLength: 3000, allowNewLines: true }) : existing.notes,
    },
  });

  return NextResponse.json(contact);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contactId = sanitizeText(params.id, { maxLength: 64 });
  if (!contactId) return NextResponse.json({ error: "Invalid contact id" }, { status: 400 });

  const existing = await prisma.contact.findFirst({ where: { id: contactId, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.contact.delete({ where: { id: contactId } });
  return NextResponse.json({ success: true });
}
