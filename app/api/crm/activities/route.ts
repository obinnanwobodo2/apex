import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveOwnedContactId } from "@/lib/crm-security";
import { readJsonObject, sanitizeText } from "@/lib/validation";

const ACTIVITY_TYPES = ["note", "email", "call", "meeting", "task", "system"] as const;

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactId = sanitizeText(searchParams.get("contactId"), { maxLength: 64 }) ?? "";

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

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const typeRaw = sanitizeText(body.type, { maxLength: 30 });
  const title = sanitizeText(body.title, { maxLength: 160 });
  const activityBody = sanitizeText(body.body, { maxLength: 3000, allowNewLines: true });
  const type = typeRaw && ACTIVITY_TYPES.includes(typeRaw as (typeof ACTIVITY_TYPES)[number]) ? typeRaw : null;

  if (!type || !title) return NextResponse.json({ error: "type and title required" }, { status: 400 });

  const ownedContact = await resolveOwnedContactId(userId, body.contactId);
  if (!ownedContact.ok) {
    return NextResponse.json({ error: "Invalid contactId for this user" }, { status: 400 });
  }

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const activity = await prisma.activity.create({
    data: { userId, type, title, body: activityBody, contactId: ownedContact.contactId },
    include: { contact: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json(activity, { status: 201 });
}
