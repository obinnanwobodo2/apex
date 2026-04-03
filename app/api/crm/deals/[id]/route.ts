import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveOwnedContactId } from "@/lib/crm-security";
import {
  readJsonObject,
  sanitizeDate,
  sanitizeFloat,
  sanitizeInt,
  sanitizeText,
} from "@/lib/validation";

const DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"] as const;

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dealId = sanitizeText(params.id, { maxLength: 64 });
  if (!dealId) return NextResponse.json({ error: "Invalid deal id" }, { status: 400 });

  const existing = await prisma.deal.findFirst({ where: { id: dealId, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  let contactId = existing.contactId;
  if ("contactId" in body) {
    const ownedContact = await resolveOwnedContactId(userId, body.contactId);
    if (!ownedContact.ok) {
      return NextResponse.json({ error: "Invalid contactId for this user" }, { status: 400 });
    }
    contactId = ownedContact.contactId;
  }

  const stageRaw = sanitizeText(body.stage, { maxLength: 32 });
  const stage = stageRaw && DEAL_STAGES.includes(stageRaw as (typeof DEAL_STAGES)[number])
    ? stageRaw
    : existing.stage;
  let closeDate = existing.closeDate;
  if ("closeDate" in body) {
    const rawCloseDate = sanitizeText(body.closeDate, { maxLength: 80 });
    if (!rawCloseDate) {
      closeDate = null;
    } else {
      const parsedCloseDate = sanitizeDate(rawCloseDate);
      if (!parsedCloseDate) {
        return NextResponse.json({ error: "Invalid closeDate" }, { status: 400 });
      }
      closeDate = parsedCloseDate;
    }
  }

  const deal = await prisma.deal.update({
    where: { id: dealId },
    data: {
      title: sanitizeText(body.title, { maxLength: 160 }) ?? existing.title,
      contactId,
      value: "value" in body ? sanitizeFloat(body.value, { min: 0, max: 1_000_000_000, fallback: existing.value }) : existing.value,
      stage,
      probability: "probability" in body ? sanitizeInt(body.probability, { min: 0, max: 100, fallback: existing.probability }) : existing.probability,
      closeDate,
      notes: "notes" in body ? sanitizeText(body.notes, { maxLength: 3000, allowNewLines: true }) : existing.notes,
    },
    include: { contact: { select: { firstName: true, lastName: true, company: true } } },
  });

  return NextResponse.json(deal);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dealId = sanitizeText(params.id, { maxLength: 64 });
  if (!dealId) return NextResponse.json({ error: "Invalid deal id" }, { status: 400 });

  const existing = await prisma.deal.findFirst({ where: { id: dealId, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.deal.delete({ where: { id: dealId } });
  return NextResponse.json({ success: true });
}
