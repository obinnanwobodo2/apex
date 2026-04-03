import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { readJsonObject, sanitizeEnum, sanitizeText } from "@/lib/validation";

const PRIORITY_VALUES = ["low", "normal", "high", "urgent"] as const;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    tickets.map((t) => ({
      ...t,
      resolvedAt: t.resolvedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const subject = sanitizeText(body.subject, { maxLength: 140 });
  const message = sanitizeText(body.message, { maxLength: 4000, allowNewLines: true });
  const priority = sanitizeEnum(body.priority, PRIORITY_VALUES, "normal");
  const honeypotWebsite = sanitizeText(body.website, { maxLength: 120 });

  if (honeypotWebsite) {
    return NextResponse.json({ error: "Request blocked." }, { status: 400 });
  }

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject,
      message,
      priority,
    },
  });

  return NextResponse.json({
    ...ticket,
    resolvedAt: null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  });
}
