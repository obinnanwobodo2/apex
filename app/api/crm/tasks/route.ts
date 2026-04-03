import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveOwnedContactId } from "@/lib/crm-security";
import { readJsonObject, sanitizeDate, sanitizeText } from "@/lib/validation";

const TASK_PRIORITIES = ["low", "medium", "high"] as const;
const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = sanitizeText(searchParams.get("status"), { maxLength: 30 }) ?? "";
  const normalizedStatus = status && TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number]) ? status : "";

  const tasks = await prisma.task.findMany({
    where: { userId, ...(normalizedStatus && { status: normalizedStatus }) },
    include: { contact: { select: { firstName: true, lastName: true } } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const title = sanitizeText(body.title, { maxLength: 160 });
  const description = sanitizeText(body.description, { maxLength: 3000, allowNewLines: true });
  const dueDateRaw = sanitizeText(body.dueDate, { maxLength: 80 });
  const dueDate = dueDateRaw ? sanitizeDate(dueDateRaw) : null;
  if (dueDateRaw && !dueDate) {
    return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
  }
  const priorityRaw = sanitizeText(body.priority, { maxLength: 20 });
  const statusRaw = sanitizeText(body.status, { maxLength: 20 });
  const priority = priorityRaw && TASK_PRIORITIES.includes(priorityRaw as (typeof TASK_PRIORITIES)[number]) ? priorityRaw : "medium";
  const status = statusRaw && TASK_STATUSES.includes(statusRaw as (typeof TASK_STATUSES)[number]) ? statusRaw : "todo";

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const ownedContact = await resolveOwnedContactId(userId, body.contactId);
  if (!ownedContact.ok) {
    return NextResponse.json({ error: "Invalid contactId for this user" }, { status: 400 });
  }

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const task = await prisma.task.create({
    data: {
      userId,
      title,
      description,
      contactId: ownedContact.contactId,
      dueDate: dueDate ?? null,
      priority,
      status,
    },
    include: { contact: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json(task, { status: 201 });
}
