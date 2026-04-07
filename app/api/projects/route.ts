import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import { sanitizeText } from "@/lib/validation";

const ALLOWED_TYPES = new Set(["website", "crm", "ecommerce", "custom", "request"]);

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAdminAccess();
  const { searchParams } = new URL(req.url);
  const requestedClientId = sanitizeText(searchParams.get("clientId"), { maxLength: 128 });
  const clientId = access.isAdmin && requestedClientId ? requestedClientId : userId;

  const projects = await prisma.project.findMany({
    where: { userId: clientId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    projects.map((project) => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      deadline: project.deadline?.toISOString() ?? null,
    }))
  );
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const title = sanitizeText(body.title, { maxLength: 200 }) || "Website Project";
  const rawType = (body.type as string) || "website";
  const type = ALLOWED_TYPES.has(rawType) ? rawType : "website";
  const description = sanitizeText(body.description, { maxLength: 2000 }) ?? "";
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 5000) : "";
  const subscriptionId = sanitizeText(body.subscriptionId, { maxLength: 128 });

  // Prevent duplicate projects per user (one active project)
  const existing = await prisma.project.findFirst({ where: { userId }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "A project already exists for this account" }, { status: 409 });
  }

  const project = await prisma.project.create({
    data: {
      userId,
      clientId: userId,
      title,
      type: type as "website" | "crm" | "ecommerce" | "custom" | "request",
      status: "requested",
      description,
      notes,
      ...(subscriptionId ? { subscriptionId } : {}),
    },
  });

  // Notify admin via support ticket
  try {
    await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });
    await prisma.supportTicket.create({
      data: {
        userId,
        subject: `New project brief submitted: ${title}`,
        message: `A client has completed onboarding and submitted their project brief.\n\nProject: ${title}\n\n${description}\n\nFull details stored in project notes.`,
        priority: "normal",
        status: "open",
      },
    });
  } catch {
    // non-blocking — project already created
  }

  return NextResponse.json({
    id: project.id,
    title: project.title,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
  });
}
