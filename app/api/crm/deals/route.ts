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

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const title = sanitizeText(body.title, { maxLength: 160 });
  const value = sanitizeFloat(body.value, { min: 0, max: 1_000_000_000, fallback: 0 });
  const stageRaw = sanitizeText(body.stage, { maxLength: 32 });
  const stage = stageRaw && DEAL_STAGES.includes(stageRaw as (typeof DEAL_STAGES)[number]) ? stageRaw : "lead";
  const probability = sanitizeInt(body.probability, { min: 0, max: 100, fallback: 0 });
  const closeDateRaw = sanitizeText(body.closeDate, { maxLength: 80 });
  const closeDate = closeDateRaw ? sanitizeDate(closeDateRaw) : null;
  if (closeDateRaw && !closeDate) {
    return NextResponse.json({ error: "Invalid closeDate" }, { status: 400 });
  }
  const notes = sanitizeText(body.notes, { maxLength: 3000, allowNewLines: true });

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const ownedContact = await resolveOwnedContactId(userId, body.contactId);
  if (!ownedContact.ok) {
    return NextResponse.json({ error: "Invalid contactId for this user" }, { status: 400 });
  }

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const deal = await prisma.deal.create({
    data: {
      userId,
      title,
      contactId: ownedContact.contactId,
      value,
      stage,
      probability,
      closeDate: closeDate ?? null,
      notes,
    },
    include: { contact: { select: { firstName: true, lastName: true, company: true } } },
  });

  return NextResponse.json(deal, { status: 201 });
}
