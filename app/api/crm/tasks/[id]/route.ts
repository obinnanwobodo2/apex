import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveOwnedContactId } from "@/lib/crm-security";
import { readJsonObject, sanitizeDate, sanitizeText } from "@/lib/validation";

const TASK_PRIORITIES = ["low", "medium", "high"] as const;
const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taskId = sanitizeText(params.id, { maxLength: 64 });
  if (!taskId) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });

  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
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

  const priorityRaw = sanitizeText(body.priority, { maxLength: 20 });
  const statusRaw = sanitizeText(body.status, { maxLength: 20 });
  const priority = priorityRaw && TASK_PRIORITIES.includes(priorityRaw as (typeof TASK_PRIORITIES)[number])
    ? priorityRaw
    : existing.priority;
  const status = statusRaw && TASK_STATUSES.includes(statusRaw as (typeof TASK_STATUSES)[number])
    ? statusRaw
    : existing.status;
  let dueDate = existing.dueDate;
  if ("dueDate" in body) {
    const rawDueDate = sanitizeText(body.dueDate, { maxLength: 80 });
    if (!rawDueDate) {
      dueDate = null;
    } else {
      const parsedDueDate = sanitizeDate(rawDueDate);
      if (!parsedDueDate) {
        return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
      }
      dueDate = parsedDueDate;
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: sanitizeText(body.title, { maxLength: 160 }) ?? existing.title,
      description: "description" in body ? sanitizeText(body.description, { maxLength: 3000, allowNewLines: true }) : existing.description,
      contactId,
      dueDate,
      priority,
      status,
    },
    include: { contact: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taskId = sanitizeText(params.id, { maxLength: 64 });
  if (!taskId) return NextResponse.json({ error: "Invalid task id" }, { status: 400 });

  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.task.delete({ where: { id: taskId } });
  return NextResponse.json({ success: true });
}
